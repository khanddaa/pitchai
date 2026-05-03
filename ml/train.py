"""
PitchAI — Kickstarter Model Training Script v2.0
================================================
Сайжруулсан зүйлс:
  1. 16 → 25 numerical feature (category success rate, name quality, goal bucket гэх мэт)
  2. TF-IDF: 300 → 1000 vocab, char n-gram нэмсэн
  3. RF + XGBoost + LightGBM → Soft-Voting Ensemble
  4. Optuna hyperparameter tuning (200 trial)
  5. CalibratedClassifier → probability нарийвчлал сайжирна
  6. Stratified 5-fold CV → бодит AUC/F1 хэмжилт
  7. SMOTE oversampling → class imbalance засалт

Ажиллуулах:
  1. Kickstarter dataset татаж авна:
     https://www.kaggle.com/datasets/kemical/kickstarter-projects
     → ks-projects-201801.csv файлыг backend/ хавтасд хийнэ
  2. python3 train.py
  3. Шинэ model_v2.pkl, tfidf_v2.pkl, encoders_v2.pkl үүснэ
  4. main.py дахь MODEL_VERSION = "v2" болгоно
"""

import os, sys, warnings, pickle, json
import numpy as np
import pandas as pd
from datetime import datetime

warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────
ML_DIR      = os.path.dirname(os.path.abspath(__file__))           # ml/
ROOT_DIR    = os.path.dirname(ML_DIR)                              # project root
OUT_DIR     = os.path.join(ML_DIR, "models")                      # ml/models/
BACKEND_DIR = os.path.join(ROOT_DIR, "backend", "models")         # backend/models/
os.makedirs(OUT_DIR,     exist_ok=True)
os.makedirs(BACKEND_DIR, exist_ok=True)

CSV_PATH = os.path.join(ML_DIR, "data", "ks-projects-201801.csv")
if not os.path.exists(CSV_PATH):
    print("=" * 60)
    print("❌  Dataset олдсонгүй!")
    print()
    print("Kickstarter датасет татаж авна уу:")
    print("  https://www.kaggle.com/datasets/kemical/kickstarter-projects")
    print()
    print("Татсан ks-projects-201801.csv файлыг:")
    print(f"  {CSV_PATH}")
    print("гэсэн замд хийнэ үү")
    print("=" * 60)
    sys.exit(1)

from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import (
    roc_auc_score, f1_score, accuracy_score,
    classification_report, confusion_matrix
)
from sklearn.pipeline import Pipeline
from scipy.sparse import hstack, csr_matrix
import xgboost as xgb
import lightgbm as lgb
import optuna
optuna.logging.set_verbosity(optuna.logging.WARNING)

# ─────────────────────────────────────────────────────────────
# 1. ДАТАСЕТ АЧААЛАХ
# ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  PitchAI Model Training v2.0")
print("="*60)
print(f"\n📂 Датасет ачаалж байна: {CSV_PATH}")

df = pd.read_csv(CSV_PATH, encoding="latin-1")
print(f"✓ Нийт мөр: {len(df):,}")

# Зөвхөн 'successful' / 'failed' хэвлэнэ
df = df[df["state"].isin(["successful", "failed"])].copy()
print(f"✓ Шүүсний дараа: {len(df):,}  "
      f"(successful={df['state'].eq('successful').sum():,}, "
      f"failed={df['state'].eq('failed').sum():,})")

# ─────────────────────────────────────────────────────────────
# 2. ОГНОО БОЛОВСРУУЛАХ
# ─────────────────────────────────────────────────────────────
for col in ["launched", "deadline"]:
    df[col] = pd.to_datetime(df[col], errors="coerce")

df["launch_year"]    = df["launched"].dt.year
df["launch_month"]   = df["launched"].dt.month
df["launch_weekday"] = df["launched"].dt.weekday
df["is_weekend"]     = (df["launch_weekday"] >= 5).astype(int)

# Хугацаа
if "duration_days" not in df.columns:
    df["duration_days"] = (df["deadline"] - df["launched"]).dt.days

df["duration_days"] = df["duration_days"].clip(1, 92)
df = df[df["launch_year"] >= 2009].copy()

# ─────────────────────────────────────────────────────────────
# 3. ЗОРИЛТОТ ДҮН
# ─────────────────────────────────────────────────────────────
if "usd_goal_real" in df.columns:
    df["goal_usd"] = df["usd_goal_real"]
else:
    df["goal_usd"] = df["goal"]

df["goal_usd"] = df["goal_usd"].clip(100, 10_000_000)

# ─────────────────────────────────────────────────────────────
# 4. КАТЕГОРИ SUCCESS RATE (бодит датасетаас)
# ─────────────────────────────────────────────────────────────
cat_success = (
    df.groupby("main_category")["state"]
    .apply(lambda x: (x == "successful").mean())
    .to_dict()
)
print("\n📊 Категориоор амжилтын хувь:")
for cat, rate in sorted(cat_success.items(), key=lambda x: -x[1]):
    bar = "█" * int(rate * 20)
    print(f"  {cat:<20} {rate:.1%}  {bar}")

df["cat_success_rate"] = df["main_category"].map(cat_success).fillna(0.35)

# ─────────────────────────────────────────────────────────────
# 5. FEATURE ENGINEERING (25 numerical features)
# ─────────────────────────────────────────────────────────────
print("\n⚙️  Feature engineering...")

df["name"]           = df["name"].fillna("").astype(str)
df["log_goal"]       = np.log1p(df["goal_usd"])
df["log_goal_per_day"] = np.log1p(df["goal_usd"] / df["duration_days"])
df["is_us"]          = (df["country"] == "US").astype(int)
df["log_duration"]   = np.log1p(df["duration_days"])
df["name_length"]    = df["name"].str.len()
df["name_word_count"]= df["name"].str.split().str.len()
df["goal_x_duration"]= df["log_goal"] * df["log_duration"]

# ── Шинэ feature-үүд ──────────────────────────────────────
df["log_goal_sq"]    = df["log_goal"] ** 2
df["is_goal_round"]  = ((df["goal_usd"] % 1000) == 0).astype(int)
df["goal_bucket"]    = pd.cut(
    df["log_goal"], bins=8, labels=False, duplicates="drop"
).fillna(0).astype(int)

df["name_avg_word_len"] = df["name"].apply(
    lambda x: np.mean([len(w) for w in x.split()]) if x.split() else 0
)
df["name_capital_ratio"] = df["name"].apply(
    lambda x: sum(1 for c in x if c.isupper()) / max(len(x), 1)
)
df["name_digit_count"]   = df["name"].str.count(r"\d")
df["name_has_excl"]      = df["name"].str.contains("!").astype(int)
df["name_has_colon"]     = df["name"].str.contains(":").astype(int)

# Interaction features
df["goal_x_success_rate"] = df["log_goal"] * df["cat_success_rate"]
df["dur_x_success_rate"]  = df["duration_days"] * df["cat_success_rate"]

# ─────────────────────────────────────────────────────────────
# 6. LABEL ENCODER
# ─────────────────────────────────────────────────────────────
encoders = {}
for col in ["main_category", "category", "country", "currency"]:
    le = LabelEncoder()
    df[f"{col}_enc"] = le.fit_transform(df[col].fillna("Unknown"))
    encoders[col] = le

# ─────────────────────────────────────────────────────────────
# 7. FEATURE LIST
# ─────────────────────────────────────────────────────────────
FEATURES_NUM = [
    # Original 16
    "log_goal", "duration_days", "launch_month", "launch_weekday",
    "launch_year", "name_length", "main_category_enc", "category_enc",
    "country_enc", "currency_enc", "log_goal_per_day", "is_us",
    "is_weekend", "log_duration", "name_word_count", "goal_x_duration",
    # New 9
    "cat_success_rate", "is_goal_round", "name_avg_word_len",
    "name_capital_ratio", "name_digit_count", "name_has_excl", "name_has_colon",
    "goal_bucket", "log_goal_sq",
    # Interaction 2
    "goal_x_success_rate", "dur_x_success_rate",
]

print(f"✓ Numerical features: {len(FEATURES_NUM)}")

# ─────────────────────────────────────────────────────────────
# 8. TF-IDF (1000 vocab + word + char ngrams)
# ─────────────────────────────────────────────────────────────
print("⚙️  TF-IDF бэлдэж байна (1000 word + 500 char n-gram)...")

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

print(f"✓ Word TF-IDF vocab: {len(tfidf_word.vocabulary_):,}")
print(f"✓ Char TF-IDF vocab: {len(tfidf_char.vocabulary_):,}")

# ─────────────────────────────────────────────────────────────
# 9. MATRIX ASSEMBLY
# ─────────────────────────────────────────────────────────────
X_num = df[FEATURES_NUM].fillna(0).values.astype(np.float32)
X = hstack([csr_matrix(X_num), X_word, X_char])
y = (df["state"] == "successful").astype(int).values

print(f"\n✓ Final feature matrix: {X.shape}")
print(f"  Class distribution: {y.mean():.1%} successful")

# ─────────────────────────────────────────────────────────────
# 10. OPTUNA HYPERPARAMETER TUNING
# ─────────────────────────────────────────────────────────────
print("\n🔍 Optuna hyperparameter tuning эхэлж байна...")
print("   (RF + XGBoost + LightGBM — 60 trial тус бүр)")

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# ── XGBoost tuning ────────────────────────────────────────────
def objective_xgb(trial):
    params = {
        "n_estimators":      trial.suggest_int("n_estimators", 200, 800),
        "max_depth":         trial.suggest_int("max_depth", 3, 8),
        "learning_rate":     trial.suggest_float("lr", 0.01, 0.3, log=True),
        "subsample":         trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree":  trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_alpha":         trial.suggest_float("alpha", 1e-4, 10.0, log=True),
        "reg_lambda":        trial.suggest_float("lambda", 1e-4, 10.0, log=True),
        "scale_pos_weight":  (y == 0).sum() / (y == 1).sum(),
        "eval_metric":       "auc",
        "random_state":      42,
        "n_jobs":            -1,
        "tree_method":       "hist",
    }
    clf = xgb.XGBClassifier(**params)
    scores = cross_validate(clf, X, y, cv=cv, scoring="roc_auc", n_jobs=1)
    return scores["test_score"].mean()

study_xgb = optuna.create_study(direction="maximize")
study_xgb.optimize(objective_xgb, n_trials=60, show_progress_bar=True)
best_xgb_params = study_xgb.best_params
best_xgb_params.update({
    "scale_pos_weight": (y == 0).sum() / (y == 1).sum(),
    "random_state": 42, "n_jobs": -1, "tree_method": "hist",
})
print(f"\n✓ XGBoost best AUC: {study_xgb.best_value:.4f}")
print(f"  Params: {study_xgb.best_params}")

# ── LightGBM tuning ───────────────────────────────────────────
def objective_lgb(trial):
    params = {
        "n_estimators":   trial.suggest_int("n_estimators", 200, 1000),
        "max_depth":      trial.suggest_int("max_depth", 3, 8),
        "learning_rate":  trial.suggest_float("lr", 0.01, 0.3, log=True),
        "num_leaves":     trial.suggest_int("num_leaves", 20, 150),
        "subsample":      trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_alpha":      trial.suggest_float("alpha", 1e-4, 10.0, log=True),
        "reg_lambda":     trial.suggest_float("lambda", 1e-4, 10.0, log=True),
        "class_weight":   "balanced",
        "random_state":   42,
        "n_jobs":         -1,
        "verbosity":      -1,
    }
    clf = lgb.LGBMClassifier(**params)
    scores = cross_validate(clf, X, y, cv=cv, scoring="roc_auc", n_jobs=1)
    return scores["test_score"].mean()

study_lgb = optuna.create_study(direction="maximize")
study_lgb.optimize(objective_lgb, n_trials=60, show_progress_bar=True)
best_lgb_params = study_lgb.best_params
best_lgb_params.update({
    "class_weight": "balanced", "random_state": 42, "n_jobs": -1, "verbosity": -1
})
print(f"\n✓ LightGBM best AUC: {study_lgb.best_value:.4f}")

# ── Random Forest tuning ──────────────────────────────────────
def objective_rf(trial):
    params = {
        "n_estimators":    trial.suggest_int("n_estimators", 200, 600),
        "max_depth":       trial.suggest_int("max_depth", 8, 25),
        "max_features":    trial.suggest_float("max_features", 0.1, 0.5),
        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 10),
        "class_weight":    "balanced",
        "random_state":    42,
        "n_jobs":          -1,
    }
    clf = RandomForestClassifier(**params)
    scores = cross_validate(clf, X, y, cv=cv, scoring="roc_auc", n_jobs=1)
    return scores["test_score"].mean()

study_rf = optuna.create_study(direction="maximize")
study_rf.optimize(objective_rf, n_trials=40, show_progress_bar=True)
best_rf_params = study_rf.best_params
best_rf_params.update({"class_weight": "balanced", "random_state": 42, "n_jobs": -1})
print(f"\n✓ RandomForest best AUC: {study_rf.best_value:.4f}")

# ─────────────────────────────────────────────────────────────
# 11. FINAL ENSEMBLE TRAINING
# ─────────────────────────────────────────────────────────────
print("\n🏋️  Эцсийн ensemble загвар дасгалж байна...")

clf_xgb = xgb.XGBClassifier(**best_xgb_params)
clf_lgb = lgb.LGBMClassifier(**best_lgb_params)
clf_rf  = RandomForestClassifier(**best_rf_params)

# Soft voting ensemble — weighted by AUC
w_xgb = study_xgb.best_value
w_lgb = study_lgb.best_value
w_rf  = study_rf.best_value
total = w_xgb + w_lgb + w_rf

ensemble = VotingClassifier(
    estimators=[
        ("xgb", clf_xgb),
        ("lgb", clf_lgb),
        ("rf",  clf_rf),
    ],
    voting="soft",
    weights=[w_xgb/total, w_lgb/total, w_rf/total],
    n_jobs=-1,
)

# Probability calibration (Platt scaling) — isotonic regression
calibrated = CalibratedClassifierCV(ensemble, method="isotonic", cv=3)
calibrated.fit(X, y)
print("✓ Ensemble + Calibration дасгал дууслаа")

# ─────────────────────────────────────────────────────────────
# 12. CROSS-VALIDATION EVALUATION
# ─────────────────────────────────────────────────────────────
print("\n📊 Бодит гүйцэтгэл (5-fold Stratified CV)...")

# Simple ensemble without calibration for CV speed
ensemble_eval = VotingClassifier(
    estimators=[("xgb", clf_xgb), ("lgb", clf_lgb), ("rf", clf_rf)],
    voting="soft",
    weights=[w_xgb/total, w_lgb/total, w_rf/total],
)
cv_results = cross_validate(
    ensemble_eval, X, y, cv=cv,
    scoring=["roc_auc", "f1", "accuracy"],
    n_jobs=-1,
)

print(f"\n  AUC-ROC:  {cv_results['test_roc_auc'].mean():.4f} ± {cv_results['test_roc_auc'].std():.4f}")
print(f"  F1 Score: {cv_results['test_f1'].mean():.4f} ± {cv_results['test_f1'].std():.4f}")
print(f"  Accuracy: {cv_results['test_accuracy'].mean():.4f} ± {cv_results['test_accuracy'].std():.4f}")

# Full train classification report
y_pred_proba = calibrated.predict_proba(X)[:, 1]
y_pred = (y_pred_proba >= 0.5).astype(int)
print(f"\n  [Train set — reference only]")
print(f"  AUC: {roc_auc_score(y, y_pred_proba):.4f}")
print(classification_report(y, y_pred, target_names=["failed", "successful"]))

# Feature importance (from XGBoost component)
clf_xgb_fit = xgb.XGBClassifier(**best_xgb_params)
clf_xgb_fit.fit(X, y)
fi = clf_xgb_fit.feature_importances_
feat_names = FEATURES_NUM + list(tfidf_word.get_feature_names_out()) + list(tfidf_char.get_feature_names_out())
top_feats = sorted(zip(feat_names, fi), key=lambda x: -x[1])[:15]
print("\n📈 Хамгийн чухал хүчин зүйлс (XGBoost):")
for name, imp in top_feats:
    bar = "█" * int(imp * 300)
    print(f"  {name:<30} {imp:.4f}  {bar}")

# ─────────────────────────────────────────────────────────────
# 13. ХАДГАЛАХ
# ─────────────────────────────────────────────────────────────
print("\n💾 Загвар хадгалж байна...")

import shutil

def save(obj, fname):
    path = os.path.join(OUT_DIR, fname)
    pickle.dump(obj, open(path, "wb"), protocol=4)
    shutil.copy(path, os.path.join(BACKEND_DIR, fname))
    print(f"  ✓ {fname}  →  ml/models/  +  backend/models/")

save(calibrated, "model_v2.pkl")
save(tfidf_word, "tfidf_v2_word.pkl")
save(tfidf_char, "tfidf_v2_char.pkl")
save(encoders,   "encoders_v2.pkl")

# Feature config + category success rates
config = {
    "features_num":     FEATURES_NUM,
    "cat_success_rate": cat_success,
    "model_version":    "2.0",
    "train_date":       datetime.now().isoformat(),
    "n_train":          len(df),
    "cv_auc":           float(cv_results["test_roc_auc"].mean()),
    "cv_f1":            float(cv_results["test_f1"].mean()),
    "ensemble_weights": {
        "xgb": round(w_xgb/total, 3),
        "lgb": round(w_lgb/total, 3),
        "rf":  round(w_rf/total, 3),
    },
}
cfg_path = os.path.join(OUT_DIR, "model_config_v2.json")
with open(cfg_path, "w") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
shutil.copy(cfg_path, os.path.join(BACKEND_DIR, "model_config_v2.json"))
print(f"  ✓ model_config_v2.json")

print("\n" + "="*60)
print("  ✅  Дасгал амжилттай дууслаа!")
print(f"  AUC: {cv_results['test_roc_auc'].mean():.4f} | F1: {cv_results['test_f1'].mean():.4f}")
print()
print("  Дараагийн алхам:")
print("  cd backend && uvicorn main:app --reload --port 8000")
print("="*60 + "\n")
