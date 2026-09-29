"""
PitchAI — Model Training v4.0
XGBoost + LightGBM Soft-Voting Ensemble + Optuna tuning
Kickstarter 2018 датасет (ks-projects-201801.csv)
"""
import os, sys, pickle, json, warnings
import numpy as np
import pandas as pd
from datetime import datetime

warnings.filterwarnings("ignore")

# ── Замууд ────────────────────────────────────────────────────
ML_DIR      = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.dirname(ML_DIR)
OUT_DIR     = os.path.join(ML_DIR,      "models")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend", "models")
CSV_PATH    = os.path.join(ML_DIR, "data", "ks-projects-201801.csv")

os.makedirs(OUT_DIR,     exist_ok=True)
os.makedirs(BACKEND_DIR, exist_ok=True)

if not os.path.exists(CSV_PATH):
    print(f"❌  Dataset олдсонгүй: {CSV_PATH}")
    sys.exit(1)

from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import VotingClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import roc_auc_score, classification_report
from scipy.sparse import hstack, csr_matrix
import xgboost as xgb
import lightgbm as lgb
import optuna
optuna.logging.set_verbosity(optuna.logging.WARNING)

print("\n" + "="*60)
print("  PitchAI Model Training v4.0")
print("  XGBoost + LightGBM + Optuna")
print("="*60)

# ─────────────────────────────────────────────────────────────
# 1. ДАТАСЕТ
# ─────────────────────────────────────────────────────────────
print(f"\n📂 Датасет ачаалж байна...")
df = pd.read_csv(CSV_PATH, encoding="latin-1")
print(f"✓ Нийт мөр: {len(df):,}")

df = df[df["state"].isin(["successful", "failed"])].copy()
print(f"✓ Шүүсний дараа: {len(df):,}  "
      f"(successful={df['state'].eq('successful').sum():,}, "
      f"failed={df['state'].eq('failed').sum():,})")

# ─────────────────────────────────────────────────────────────
# 2. ОГНОО
# ─────────────────────────────────────────────────────────────
df["launched"] = pd.to_datetime(df["launched"], errors="coerce")
df["deadline"] = pd.to_datetime(df["deadline"],  errors="coerce")

df["launch_year"]    = df["launched"].dt.year.fillna(2015).astype(int)
df["launch_month"]   = df["launched"].dt.month.fillna(6).astype(int)
df["launch_weekday"] = df["launched"].dt.weekday.fillna(2).astype(int)
df["is_weekend"]     = (df["launch_weekday"] >= 5).astype(int)
df["duration_days"]  = (df["deadline"] - df["launched"]).dt.days.clip(1, 92).fillna(30)

df = df[df["launch_year"] >= 2009].copy()

# ─────────────────────────────────────────────────────────────
# 3. ЗОРИЛТОТ ДҮН
# ─────────────────────────────────────────────────────────────
goal_col = "usd_goal_real" if "usd_goal_real" in df.columns else "goal"
df["goal_usd"] = df[goal_col].clip(100, 10_000_000)

# ─────────────────────────────────────────────────────────────
# 4. FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────
print("\n⚙️  Feature engineering...")

df["name"] = df["name"].fillna("").astype(str)

df["log_goal"]           = np.log1p(df["goal_usd"])
df["log_goal_per_day"]   = np.log1p(df["goal_usd"] / df["duration_days"].clip(1))
df["is_us"]              = (df["country"] == "US").astype(int)
df["log_duration"]       = np.log1p(df["duration_days"])
df["name_length"]        = df["name"].str.len()
df["name_word_count"]    = df["name"].str.split().str.len().fillna(0)
df["goal_x_duration"]    = df["log_goal"] * df["log_duration"]

# Нэмэлт features
df["log_goal_sq"]        = df["log_goal"] ** 2
df["is_goal_round"]      = ((df["goal_usd"] % 1000) == 0).astype(int)
df["goal_bucket"]        = pd.cut(df["log_goal"], bins=8, labels=False, duplicates="drop").fillna(0).astype(int)
df["name_capital_ratio"] = df["name"].apply(lambda x: sum(1 for c in x if c.isupper()) / max(len(x), 1))
df["name_digit_count"]   = df["name"].str.count(r"\d")
df["name_has_excl"]      = df["name"].str.contains("!").astype(int)
df["name_has_colon"]     = df["name"].str.contains(":").astype(int)

# Label encoders
encoders = {}
for col in ("main_category", "category", "country", "currency"):
    le = LabelEncoder()
    df[f"{col}_enc"] = le.fit_transform(df[col].fillna("Unknown"))
    encoders[col] = le

FEATURES_NUM = [
    "log_goal", "duration_days", "launch_month", "launch_weekday",
    "launch_year", "name_length", "main_category_enc", "category_enc",
    "country_enc", "currency_enc", "log_goal_per_day", "is_us",
    "is_weekend", "log_duration", "name_word_count", "goal_x_duration",
    "log_goal_sq", "is_goal_round", "goal_bucket",
    "name_capital_ratio", "name_digit_count", "name_has_excl", "name_has_colon",
]

print(f"✓ Numerical features: {len(FEATURES_NUM)}")

# ─────────────────────────────────────────────────────────────
# 5. TF-IDF (word + char n-gram)
# ─────────────────────────────────────────────────────────────
print("⚙️  TF-IDF бэлдэж байна (word + char n-gram)...")
tfidf_word = TfidfVectorizer(
    max_features=1000, ngram_range=(1, 3),
    min_df=3, sublinear_tf=True, strip_accents="unicode",
)
tfidf_char = TfidfVectorizer(
    max_features=500, analyzer="char_wb", ngram_range=(3, 5),
    min_df=5, sublinear_tf=True,
)
X_word = tfidf_word.fit_transform(df["name"])
X_char = tfidf_char.fit_transform(df["name"])
print(f"✓ Word TF-IDF: {len(tfidf_word.vocabulary_):,}  |  Char TF-IDF: {len(tfidf_char.vocabulary_):,}")

# ─────────────────────────────────────────────────────────────
# 6. МАТРИКС
# ─────────────────────────────────────────────────────────────
X_num = df[FEATURES_NUM].fillna(0).values.astype(np.float32)
X = hstack([csr_matrix(X_num), X_word, X_char])
y = (df["state"] == "successful").astype(int).values

print(f"\n✓ Feature matrix: {X.shape}")
print(f"  Ангиллын харьцаа: {y.mean():.1%} successful")

# ─────────────────────────────────────────────────────────────
# 7. OPTUNA TUNING (20 trial тус бүр)
# ─────────────────────────────────────────────────────────────
print("\n🔍 Optuna tuning эхэлж байна... (XGBoost + LightGBM, 20 trial тус бүр)")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
spw = (y == 0).sum() / (y == 1).sum()

def objective_xgb(trial):
    params = {
        "n_estimators":     trial.suggest_int("n_estimators", 200, 800),
        "max_depth":        trial.suggest_int("max_depth", 3, 8),
        "learning_rate":    trial.suggest_float("lr", 0.01, 0.3, log=True),
        "subsample":        trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_alpha":        trial.suggest_float("alpha", 1e-4, 10.0, log=True),
        "reg_lambda":       trial.suggest_float("lambda", 1e-4, 10.0, log=True),
        "scale_pos_weight": spw,
        "tree_method": "hist", "eval_metric": "auc",
        "random_state": 42, "n_jobs": -1,
    }
    scores = cross_validate(xgb.XGBClassifier(**params), X, y, cv=cv, scoring="roc_auc", n_jobs=1)
    return scores["test_score"].mean()

def objective_lgb(trial):
    params = {
        "n_estimators":     trial.suggest_int("n_estimators", 200, 1000),
        "max_depth":        trial.suggest_int("max_depth", 3, 8),
        "learning_rate":    trial.suggest_float("lr", 0.01, 0.3, log=True),
        "num_leaves":       trial.suggest_int("num_leaves", 20, 150),
        "subsample":        trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_alpha":        trial.suggest_float("alpha", 1e-4, 10.0, log=True),
        "reg_lambda":       trial.suggest_float("lambda", 1e-4, 10.0, log=True),
        "class_weight": "balanced", "random_state": 42, "n_jobs": -1, "verbosity": -1,
    }
    scores = cross_validate(lgb.LGBMClassifier(**params), X, y, cv=cv, scoring="roc_auc", n_jobs=1)
    return scores["test_score"].mean()

study_xgb = optuna.create_study(direction="maximize")
study_xgb.optimize(objective_xgb, n_trials=20, show_progress_bar=True)
best_xgb = study_xgb.best_params
best_xgb.update({"scale_pos_weight": spw, "tree_method": "hist", "eval_metric": "auc", "random_state": 42, "n_jobs": -1})
print(f"\n✓ XGBoost best AUC: {study_xgb.best_value:.4f}")

study_lgb = optuna.create_study(direction="maximize")
study_lgb.optimize(objective_lgb, n_trials=20, show_progress_bar=True)
best_lgb = study_lgb.best_params
best_lgb.update({"class_weight": "balanced", "random_state": 42, "n_jobs": -1, "verbosity": -1})
print(f"✓ LightGBM best AUC: {study_lgb.best_value:.4f}")

# ─────────────────────────────────────────────────────────────
# 8. ENSEMBLE TRAINING
# ─────────────────────────────────────────────────────────────
print("\n🏋️  Эцсийн ensemble дасгалж байна...")

clf_xgb = xgb.XGBClassifier(**best_xgb)
clf_lgb = lgb.LGBMClassifier(**best_lgb)

w_xgb = study_xgb.best_value
w_lgb = study_lgb.best_value
total = w_xgb + w_lgb

ensemble = VotingClassifier(
    estimators=[("xgb", clf_xgb), ("lgb", clf_lgb)],
    voting="soft",
    weights=[w_xgb / total, w_lgb / total],
    n_jobs=-1,
)

# CV үнэлгээ
cv_results = cross_validate(
    ensemble, X, y, cv=cv,
    scoring=["roc_auc", "f1", "accuracy"],
    n_jobs=-1,
)
cv_auc = float(cv_results["test_roc_auc"].mean())
cv_f1  = float(cv_results["test_f1"].mean())
cv_acc = float(cv_results["test_accuracy"].mean())

print(f"\n  AUC-ROC:  {cv_auc:.4f} ± {cv_results['test_roc_auc'].std():.4f}")
print(f"  F1 Score: {cv_f1:.4f} ± {cv_results['test_f1'].std():.4f}")
print(f"  Accuracy: {cv_acc:.4f} ± {cv_results['test_accuracy'].std():.4f}")

# Бүтэн датасет дээр дасгал
ensemble.fit(X, y)

y_prob = ensemble.predict_proba(X)[:, 1]
y_pred = (y_prob >= 0.5).astype(int)
print(f"\n  [Train set — reference]")
print(f"  AUC: {roc_auc_score(y, y_prob):.4f}")
print(classification_report(y, y_pred, target_names=["failed", "successful"]))

# Feature importance
fi = ensemble.named_estimators_["xgb"].feature_importances_
feat_names = FEATURES_NUM + list(tfidf_word.get_feature_names_out()) + list(tfidf_char.get_feature_names_out())
n = min(len(fi), len(feat_names))
top10 = sorted(zip(feat_names[:n], fi[:n]), key=lambda x: -x[1])[:10]
print("📈 Хамгийн чухал 10 feature (XGBoost):")
for fname, imp in top10:
    bar = "█" * int(imp * 300)
    print(f"  {fname:<28} {imp:.4f}  {bar}")

# ─────────────────────────────────────────────────────────────
# 9. ХАДГАЛАХ
# ─────────────────────────────────────────────────────────────
print("\n💾 Загвар хадгалж байна...")

import shutil

def save(obj, fname):
    path = os.path.join(OUT_DIR, fname)
    pickle.dump(obj, open(path, "wb"), protocol=4)
    shutil.copy(path, os.path.join(BACKEND_DIR, fname))
    print(f"  ✓ {fname}")

save(ensemble,   "model_v4.pkl")
save(tfidf_word, "tfidf_v4_word.pkl")
save(tfidf_char, "tfidf_v4_char.pkl")
save(encoders,   "encoders_v4.pkl")

config = {
    "features_num": FEATURES_NUM,
    "cv_auc":       cv_auc,
    "cv_f1":        cv_f1,
    "cv_acc":       cv_acc,
    "n_train":      len(df),
    "train_date":   datetime.now().isoformat(),
    "ensemble":     "XGBoost + LightGBM soft-voting (Optuna 20 trial)",
    "ensemble_weights": {
        "xgb": round(w_xgb / total, 3),
        "lgb": round(w_lgb / total, 3),
    },
}

for d in (OUT_DIR, BACKEND_DIR):
    with open(os.path.join(d, "model_config_v4.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
print("  ✓ model_config_v4.json")

print("\n" + "="*60)
print(f"  ✅  Дасгал амжилттай дууслаа!")
print(f"  AUC: {cv_auc:.4f}  |  F1: {cv_f1:.4f}  |  Acc: {cv_acc:.4f}")
print(f"  Загвар: ml/models/ + backend/models/")
print("="*60 + "\n")
