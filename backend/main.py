import os, json, re, pickle, io
from dotenv import load_dotenv
load_dotenv()

import shap
import numpy as np
import fitz
import pytesseract
from PIL import Image
import requests as http_req
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy.sparse import hstack, csr_matrix
from datetime import datetime
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="PitchAI API v4")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Загвар paths ──────────────────────────────────────────────
base_dir   = os.path.dirname(__file__)
MODELS_DIR = os.path.join(base_dir, "models")

# v4 → v3 fallback
if os.path.exists(os.path.join(MODELS_DIR, "model_v4.pkl")):
    MODEL_VERSION = "v4"
elif os.path.exists(os.path.join(MODELS_DIR, "model_v3.pkl")):
    MODEL_VERSION = "v3"
else:
    raise RuntimeError("Загвар олдсонгүй! ml/train.py ажиллуулна уу.")

# ── Загвар ачаалах ────────────────────────────────────────────
if MODEL_VERSION == "v4":
    model      = pickle.load(open(os.path.join(MODELS_DIR, "model_v4.pkl"),       "rb"))
    tfidf_word = pickle.load(open(os.path.join(MODELS_DIR, "tfidf_v4_word.pkl"),  "rb"))
    tfidf_char = pickle.load(open(os.path.join(MODELS_DIR, "tfidf_v4_char.pkl"),  "rb"))
    tfidf      = tfidf_word  # feature importance-д
    encoders   = pickle.load(open(os.path.join(MODELS_DIR, "encoders_v4.pkl"),    "rb"))
    with open(os.path.join(MODELS_DIR, "model_config_v4.json"), encoding="utf-8") as f:
        MODEL_CONFIG = json.load(f)
    FEATURES_NUM = MODEL_CONFIG["features_num"]
    print(f"✅ Model v4 loaded — AUC:{MODEL_CONFIG.get('cv_auc',0):.4f} "
          f"F1:{MODEL_CONFIG.get('cv_f1',0):.4f}")
else:
    model      = pickle.load(open(os.path.join(MODELS_DIR, "model_v3.pkl"),    "rb"))
    tfidf_word = pickle.load(open(os.path.join(MODELS_DIR, "tfidf_v3.pkl"),    "rb"))
    tfidf_char = None
    tfidf      = tfidf_word
    encoders   = pickle.load(open(os.path.join(MODELS_DIR, "encoders_v3.pkl"), "rb"))
    with open(os.path.join(MODELS_DIR, "model_config_v3.json"), encoding="utf-8") as f:
        MODEL_CONFIG = json.load(f)
    FEATURES_NUM = MODEL_CONFIG["features_num"]
    print(f"✅ Model v3 loaded — AUC:{MODEL_CONFIG.get('cv_auc',0):.4f} "
          f"F1:{MODEL_CONFIG.get('cv_f1',0):.4f}")

CAT_SUCCESS = MODEL_CONFIG.get("cat_success_rate", {})

# ── SHAP explainer (lazy init, XGBoost component) ────────────
_shap_explainer = None

def _get_shap_explainer():
    global _shap_explainer
    if _shap_explainer is not None:
        return _shap_explainer
    try:
        xgb_clf = model.named_estimators_["xgb"]
        _shap_explainer = shap.TreeExplainer(xgb_clf.get_booster())
        print("✅ SHAP explainer бэлэн (XGBoost)")
    except Exception as e:
        print(f"⚠️  SHAP init алдаа: {e}")
    return _shap_explainer

def compute_shap(x_num_only, feat_dict: dict) -> list:
    """Зөвхөн numerical features дээр SHAP тооцоолно."""
    explainer = _get_shap_explainer()
    if explainer is None:
        return []
    try:
        raw = explainer.shap_values(x_num_only)
        if isinstance(raw, list):
            sv = np.asarray(raw[1]).ravel()
        else:
            sv = np.asarray(raw).ravel()
        out = []
        for i, fname in enumerate(FEATURES_NUM):
            if i >= len(sv):
                break
            out.append({
                "feature":       fname,
                "shap_value":    round(float(sv[i]), 4),
                "direction":     "positive" if sv[i] > 0 else "negative",
                "feature_value": round(float(feat_dict.get(fname, 0)), 4),
            })
        out.sort(key=lambda d: abs(d["shap_value"]), reverse=True)
        return out[:8]
    except Exception as e:
        print(f"[SHAP] {e}")
        return []

# ── Groq ─────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"

VALID_CATEGORIES = [
    "Technology","Music","Film & Video","Games","Art","Design","Food",
    "Publishing","Photography","Theater","Comics","Crafts","Fashion",
    "Journalism","Dance",
]

# ─────────────────────────────────────────────────────────────
# FEATURE BUILDER
# ─────────────────────────────────────────────────────────────
def safe_encode(encoder, value: str, default: int = 0) -> int:
    try: return int(encoder.transform([value])[0])
    except: return default

def build_features(name: str, goal: float, duration: int,
                   main_cat: str, cat: str, country: str, currency: str = "USD"):
    now = datetime.now()

    log_goal         = np.log1p(goal)
    log_goal_per_day = np.log1p(goal / max(duration, 1))
    is_us            = 1 if country == "US" else 0
    is_weekend       = 1 if now.weekday() >= 5 else 0
    log_duration     = np.log1p(duration)
    name_length      = len(name)
    name_word_count  = len(name.split())
    goal_x_duration  = log_goal * log_duration

    # v4 нэмэлт features
    log_goal_sq       = log_goal ** 2
    is_goal_round     = int((goal % 1000) == 0)
    log_goal_min      = np.log1p(100)
    log_goal_max      = np.log1p(10_000_000)
    goal_bucket       = int(min((log_goal - log_goal_min) / (log_goal_max - log_goal_min) * 8, 7))
    goal_bucket       = max(0, goal_bucket)
    name_capital_ratio = sum(1 for c in name if c.isupper()) / max(len(name), 1)
    name_digit_count  = sum(1 for c in name if c.isdigit())
    name_has_excl     = int("!" in name)
    name_has_colon    = int(":" in name)

    feat_dict = {
        "log_goal":            log_goal,
        "duration_days":       float(duration),
        "launch_month":        float(now.month),
        "launch_weekday":      float(now.weekday()),
        "launch_year":         float(now.year),
        "name_length":         float(name_length),
        "main_category_enc":   float(safe_encode(encoders["main_category"], main_cat)),
        "category_enc":        float(safe_encode(encoders["category"],      cat)),
        "country_enc":         float(safe_encode(encoders["country"],       country)),
        "currency_enc":        float(safe_encode(encoders["currency"],      currency)),
        "log_goal_per_day":    log_goal_per_day,
        "is_us":               float(is_us),
        "is_weekend":          float(is_weekend),
        "log_duration":        log_duration,
        "name_word_count":     float(name_word_count),
        "goal_x_duration":     goal_x_duration,
        "log_goal_sq":         log_goal_sq,
        "is_goal_round":       float(is_goal_round),
        "goal_bucket":         float(goal_bucket),
        "name_capital_ratio":  name_capital_ratio,
        "name_digit_count":    float(name_digit_count),
        "name_has_excl":       float(name_has_excl),
        "name_has_colon":      float(name_has_colon),
    }

    x_num  = np.array([[feat_dict[f] for f in FEATURES_NUM]], dtype=np.float32)
    x_word = tfidf_word.transform([name])
    parts  = [csr_matrix(x_num), x_word]
    if tfidf_char is not None:
        parts.append(tfidf_char.transform([name]))
    x_combined = hstack(parts)

    return x_combined, x_num, feat_dict

# ─────────────────────────────────────────────────────────────
# MONGOLIAN DETECTION & TRANSLATION
# ─────────────────────────────────────────────────────────────
def is_mongolian(text: str) -> bool:
    if not text:
        return False
    mon = sum(1 for c in text if "Ѐ" <= c <= "ӿ")
    return (mon / len(text)) > 0.30

def translate_to_english(name: str, api_key: str) -> str:
    if not api_key:
        return name
    try:
        resp = http_req.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content":
                    f"Translate this Mongolian crowdfunding campaign name to English. "
                    f"Return only the translated name, nothing else.\n\nName: {name}"
                }],
                "temperature": 0.1, "max_tokens": 60,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            t = resp.json()["choices"][0]["message"]["content"].strip()
            if t: return t
    except Exception as e:
        print(f"[translate] {e}")
    return name

# ─────────────────────────────────────────────────────────────
# LLM EXTRACTION
# ─────────────────────────────────────────────────────────────
def llm_extract(text: str) -> dict | None:
    if not GROQ_API_KEY:
        return None
    sample = text[:4000]
    mn_ratio = sum(1 for c in sample if "Ѐ" <= c <= "ӿ") / max(len(sample), 1)
    default_country = "MN" if mn_ratio > 0.05 else "US"
    prompt = f"""You are analyzing a crowdfunding pitch deck PDF. The text may be in Mongolian or English.

Extract the following fields and return ONLY a JSON object:

{{
  "campaign_name": "campaign title",
  "goal_usd": 10000,
  "duration_days": 30,
  "main_category": "Technology",
  "category": "Apps",
  "country": "{default_country}",
  "currency": "USD"
}}

Rules:
- campaign_name: first heading or title (string)
- goal_usd: funding goal in USD (₮ → divide by 3450; not found → null)
- duration_days: campaign length in days 1-90 (not found → null)
- main_category: Technology|Music|Film & Video|Games|Art|Design|Food|Publishing|Photography|Theater|Comics|Crafts|Fashion|Journalism|Dance
- category: subcategory (Apps, Album, Short Film, etc.)
- country: ISO-2 code (Mongolia→MN, USA→US, UK→GB; not found→{default_country})
- currency: USD|MNT|EUR|GBP|CAD|AUD (not found→USD)

Return ONLY the JSON object, no explanation.

Text:
{sample}"""

    try:
        resp = http_req.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL,
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0, "max_tokens": 300},
            timeout=20,
        )
        if resp.status_code != 200:
            return None

        content = resp.json()["choices"][0]["message"]["content"].strip()
        content = re.sub(r'```(?:json)?\s*', '', content).replace('```', '')
        m = re.search(r'\{[\s\S]*?\}', content, re.DOTALL)
        if not m:
            return None

        data = json.loads(re.sub(r',\s*([}\]])', r'\1', m.group()))

        main_cat = data.get("main_category", "Technology")
        if main_cat not in VALID_CATEGORIES:
            main_cat = "Technology"

        goal = float(data.get("goal_usd", 10000))
        if not (100 <= goal <= 10_000_000): goal = 10000.0

        dur = int(data.get("duration_days", 30))
        if not (1 <= dur <= 92): dur = 30

        currency = str(data.get("currency", "USD"))
        if currency == "MNT":
            goal, currency = round(goal / 3450, 2), "USD"

        return {
            "campaign_name": str(data.get("campaign_name", "Untitled"))[:120],
            "goal_usd":      goal,
            "duration_days": dur,
            "main_category": main_cat,
            "category":      str(data.get("category", main_cat)),
            "country":       str(data.get("country", "MN"))[:2].upper(),
            "currency":      currency,
            "via_llm":       True,
        }
    except Exception as e:
        print(f"[LLM] {e}")
        return None

# ─────────────────────────────────────────────────────────────
# REGEX FALLBACK
# ─────────────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Technology":   ["app","software","tech","hardware","device","robot","ai","platform","digital","iot",
                     "технологи","програм","апп","хиймэл оюун","платформ"],
    "Music":        ["album","music","song","band","concert","record","ep","musician",
                     "хөгжим","дуу","концерт","цомог"],
    "Film & Video": ["film","movie","documentary","video","cinema","animation","series",
                     "кино","видео","баримтат","анимаци"],
    "Games":        ["game","board game","card game","rpg","tabletop","puzzle",
                     "тоглоом"],
    "Art":          ["art","painting","sculpture","gallery","exhibition","artist","illustration",
                     "урлаг","зураг","баримал","үзэсгэлэн"],
    "Design":       ["design","product","prototype","industrial","furniture",
                     "дизайн","загвар","бүтээгдэхүүн"],
    "Food":         ["food","restaurant","cafe","recipe","cooking","beverage","organic",
                     "хоол","хүнс","ресторан","кафе","ундаа"],
    "Publishing":   ["book","novel","magazine","poetry","writer","author",
                     "ном","зохиол","хэвлэл","шүлэг"],
    "Photography":  ["photo","photography","camera","portrait","landscape",
                     "фото","зургийн"],
    "Theater":      ["theater","play","performance","stage","musical",
                     "театр","жүжиг","тайз"],
    "Comics":       ["comic","manga","illustration","graphic novel","комик","зурагт ном"],
    "Crafts":       ["craft","handmade","knit","sew","pottery","ceramic","jewelry",
                     "гар урлал","нэхмэл","шаазан"],
    "Fashion":      ["fashion","clothing","apparel","style","collection",
                     "хувцас","загварын"],
    "Journalism":   ["journalism","news","media","podcast","newsletter",
                     "мэдээ","сэтгүүлзүй","медиа","подкаст"],
    "Dance":        ["dance","choreography","ballet","hip hop","contemporary",
                     "бүжиг","хореографи"],
}

def _regex_goal(text: str) -> float | None:
    patterns = [
        (r"([\d,]+(?:\.\d+)?)\s*(?:төгрөг|₮)", 1/3450),
        (r"(?:зорилт|санхүүжилт|дүн)[^\d₮$]*([₮$]?\s*[\d,]+)", 1.0),
        (r"(?:goal|target|raise|seeking)\s*[:\-]?\s*\$\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|m|million)?", 1.0),
        (r"\$\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|m|million)?", 1.0),
        (r"([\d,]+(?:\.\d+)?)\s*(?:USD|usd|dollars?)", 1.0),
    ]
    for pat, mul in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if not m: continue
        raw = re.sub(r"[₮$,\s]", "", m.group(1))
        try:
            val = float(raw) * mul
            if len(m.groups()) >= 2 and m.group(2):
                sfx = m.group(2).lower()
                if sfx in ("m","million"): val *= 1_000_000
                elif sfx in ("k","thousand"): val *= 1_000
            if 100 <= val <= 10_000_000: return round(val, 2)
        except: continue
    return None

def _regex_duration(text: str) -> int | None:
    for pat, mul in [
        (r"(\d+)\s*(?:хоног|өдөр)", 1),
        (r"(\d+)\s*долоо\s*хоног", 7),
        (r"(\d+)\s*-?\s*(?:day|days)", 1),
        (r"(\d+)\s*(?:week|weeks)", 7),
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = int(m.group(1)) * mul
            if 1 <= val <= 92: return val
    return None

def _regex_category(text: str) -> tuple[str, str]:
    tl = text.lower()
    scores = {cat: sum(1 for kw in kws if kw in tl)
              for cat, kws in CATEGORY_KEYWORDS.items()}
    scores = {k: v for k, v in scores.items() if v > 0}
    if not scores: return "Technology", "Apps"
    best = max(scores, key=scores.get)
    sub  = max(CATEGORY_KEYWORDS[best], key=lambda k: tl.count(k))
    return best, sub.title()

COUNTRY_MAP = {
    "монгол улс":"MN","монгол":"MN","улаанбаатар":"MN","mongolia":"MN",
    "united states":"US","usa":"US","united kingdom":"GB","canada":"CA",
    "australia":"AU","germany":"DE","france":"FR","japan":"JP",
}

def regex_extract(text: str) -> dict:
    main_cat, cat = _regex_category(text)
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 3]
    tl = text.lower()
    mn_ratio = sum(1 for c in text if "Ѐ" <= c <= "ӿ") / max(len(text), 1)
    default_country = "MN" if mn_ratio > 0.05 else "US"
    return {
        "campaign_name": lines[0][:120] if lines else "Untitled Campaign",
        "goal_usd":      _regex_goal(text),
        "duration_days": _regex_duration(text),
        "main_category": main_cat,
        "category":      cat,
        "country":       next((code for phrase, code in COUNTRY_MAP.items() if phrase in tl), default_country),
        "currency":      "USD",
        "via_llm":       False,
    }

# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "PitchAI API ажиллаж байна",
        "model": MODEL_VERSION,
        "llm": "✅ Groq LLM идэвхтэй" if GROQ_API_KEY else "⚠️  Regex горим",
        "model_info": {
            "version":    MODEL_VERSION,
            "cv_auc":     MODEL_CONFIG.get("cv_auc"),
            "cv_f1":      MODEL_CONFIG.get("cv_f1"),
            "ensemble":   MODEL_CONFIG.get("ensemble"),
            "n_features": len(FEATURES_NUM),
        }
    }

@app.get("/model-info")
def model_info():
    return {
        "version":    MODEL_VERSION,
        "features":   FEATURES_NUM,
        "n_features": len(FEATURES_NUM),
        "cv_auc":     MODEL_CONFIG.get("cv_auc"),
        "cv_f1":      MODEL_CONFIG.get("cv_f1"),
        "n_train":    MODEL_CONFIG.get("n_train"),
        "train_date": MODEL_CONFIG.get("train_date"),
        "ensemble":   MODEL_CONFIG.get("ensemble"),
        "cat_success_rates": CAT_SUCCESS,
    }

@app.post("/predict")
@limiter.limit("5/minute")
async def predict(request: Request, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Зөвхөн PDF файл оруулна уу")

    raw  = await file.read()
    doc  = fitz.open(stream=raw, filetype="pdf")
    pages = len(doc)
    text = "\n".join(page.get_text() for page in doc)

    # OCR fallback
    if len(text.strip()) < 30:
        mat = fitz.Matrix(300/72, 300/72)
        ocr_parts = []
        for page in doc:
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            try:
                ocr_parts.append(pytesseract.image_to_string(img, lang="mon+eng"))
            except Exception:
                ocr_parts.append(pytesseract.image_to_string(img, lang="eng"))
        text = "\n".join(ocr_parts)

    if len(text.strip()) < 30:
        raise HTTPException(422, "PDF-ээс текст гаргаж чадсангүй")

    # Extraction: LLM → regex fallback
    regex_raw = regex_extract(text)
    extracted = llm_extract(text) or regex_raw
    via_llm   = extracted is not regex_raw

    goal_found = via_llm or (regex_raw["goal_usd"] is not None)
    dur_found  = via_llm or (regex_raw["duration_days"] is not None)

    name     = extracted["campaign_name"]
    goal     = float(extracted["goal_usd"]     or 10_000.0)
    duration = int(extracted["duration_days"]   or 30)
    main_cat = extracted["main_category"]
    cat      = extracted["category"]
    country  = extracted["country"]
    currency = extracted.get("currency", "USD")

    country_found = country != "MN" or any(
        kw in text.lower() for kw in ["монгол","mongolia","улаанбаатар","ulaanbaatar"]
    )

    # Монгол нэрийг TF-IDF-д зориулж орчуулах
    if is_mongolian(name):
        name = translate_to_english(name, GROQ_API_KEY)

    # Predict
    x_combined, x_num, feat_dict = build_features(
        name, goal, duration, main_cat, cat, country, currency
    )
    prob      = float(model.predict_proba(x_combined)[0][1])
    pred      = "successful" if prob >= 0.5 else "failed"
    conf      = "өндөр" if abs(prob - 0.5) > 0.2 else "дунд"
    shap_vals = compute_shap(x_num, feat_dict)

    # Feature importance (XGBoost component)
    try:
        xgb_clf = model.named_estimators_["xgb"]
        fi = xgb_clf.feature_importances_
        word_names = list(tfidf_word.get_feature_names_out())
        char_names = list(tfidf_char.get_feature_names_out()) if tfidf_char else []
        feat_names_all = FEATURES_NUM + word_names + char_names
        n = min(len(fi), len(feat_names_all))
        top5 = sorted(zip(feat_names_all[:n], fi[:n]), key=lambda x: -x[1])[:5]
    except Exception:
        top5 = []

    # Зөвлөмж
    recs = []
    daily = goal / max(duration, 1)

    # 1. Зорилтот дүн
    if goal > 50_000:
        recs.append(f"Зорилтот дүн өндөр (${goal:,.0f}) — $10,000–$50,000 хүрээнд тавихад амжилтын магадлал мэдэгдэхүйц нэмэгддэг")
    elif goal <= 5_000:
        recs.append(f"Зорилтот дүн бага (${goal:,.0f}) — энэ нь сайн, бага зорилт нь амжилттай болох магадлалыг нэмэгдүүлдэг")
    else:
        recs.append(f"Зорилтот дүн (${goal:,.0f}) нь оновчтой хүрээнд байна — Kickstarter-ийн дундаж амжилттай кампани $10,000 орчим байдаг")

    # 2. Хугацаа
    if duration < 15:
        recs.append(f"Хугацаа хэт богино ({duration} өдөр) — 25–35 хоног нь дэмжигч цуглуулахад хамгийн тохиромжтой")
    elif duration > 45:
        recs.append(f"Хугацаа хэт урт ({duration} өдөр) — 30–35 хоног нь хамгийн оновчтой, урт хугацаа сонирхлыг бууруулдаг")
    else:
        recs.append(f"Хугацаа ({duration} өдөр) нь тохиромжтой — 25–35 хоногийн хугацаатай кампани хамгийн өндөр амжилтын хувьтай байдаг")

    # 3. Өдрийн зорилт
    if daily > 2_000:
        recs.append(f"Өдөрт ${daily:,.0f} шаардлагатай — энэ нь маш өндөр. Зорилтот дүнг бууруулах эсвэл хугацааг уртасгахыг зөвлөж байна")

    # 4. Ангилал
    cat_success = {
        "Technology": 0.20, "Music": 0.48, "Film & Video": 0.37, "Games": 0.35,
        "Art": 0.41, "Design": 0.35, "Food": 0.25, "Publishing": 0.32,
        "Photography": 0.39, "Theater": 0.64, "Comics": 0.54, "Crafts": 0.25,
        "Fashion": 0.24, "Journalism": 0.22, "Dance": 0.62,
    }
    cat_rate = cat_success.get(main_cat, 0.35)
    if cat_rate >= 0.5:
        recs.append(f"{main_cat} ангилал нь Kickstarter дээр өндөр амжилтын түүхтэй ({cat_rate:.0%}) — энэ нь таны кампанид давуу тал")
    elif cat_rate < 0.3:
        recs.append(f"{main_cat} ангиллын Kickstarter дээрх амжилтын дундаж хувь бага ({cat_rate:.0%}) — өрсөлдөгчдөөсөө ялгарах онцлогоо тодотгоорой")

    # 5. Магадлалд суурилсан ерөнхий зөвлөмж
    if prob < 0.4:
        recs.append("Амжилтын магадлал бага байна — нийгмийн сүлжээ, PR кампанит ажил болон урьдчилсан дэмжигчийн баазыг бэхжүүлэхийг зөвлөж байна")
    elif prob >= 0.7:
        recs.append("Амжилтын магадлал өндөр байна — шагналын системийн давхаргыг (reward tiers) сайтар тохируулж, эхний 48 цагийн идэвхжилтэд анхаарлаа хандуулаарай")

    return {
        "probability":   round(prob*100, 1),
        "prediction":    pred,
        "confidence":    conf,
        "pages":         pages,
        "via_llm":       via_llm,
        "model_version": MODEL_VERSION,
        "ocr_text":      text[:2000],
        "top_features":  [{"name": n, "importance": round(v*100,1)} for n,v in top5],
        "recommendations": recs,
        "extracted": {
            "campaign_name": name, "goal_usd": goal, "duration_days": duration,
            "main_category": main_cat, "category": cat, "country": country,
            "currency": currency,
        },
        "extraction_notes": {
            "goal_found": goal_found, "duration_found": dur_found,
            "country_found": country_found, "via_llm": via_llm,
        },
        "category_success_rate": cat_rate,
        "shap_explanation": shap_vals,
    }

# ─────────────────────────────────────────────────────────────
# WHAT-IF
# ─────────────────────────────────────────────────────────────
class WhatIfRequest(BaseModel):
    campaign_name: str
    goal_usd:      float = Field(gt=0)
    duration_days: int   = Field(ge=1, le=92)
    main_category: str
    category:      str
    country:       str  = "MN"
    currency:      str  = "USD"

@app.post("/whatif")
async def whatif(req: WhatIfRequest):
    if req.main_category not in VALID_CATEGORIES:
        raise HTTPException(400, f"main_category must be one of {VALID_CATEGORIES}")

    def _prob(goal: float, dur: int) -> float:
        x, _, _ = build_features(
            req.campaign_name, goal, dur,
            req.main_category, req.category, req.country, req.currency,
        )
        return round(float(model.predict_proba(x)[0][1]) * 100, 1)

    base_prob = _prob(req.goal_usd, req.duration_days)

    goal_sweep = [
        {"goal_usd": round(req.goal_usd*f,2), "probability": _prob(req.goal_usd*f, req.duration_days)}
        for f in [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0]
    ]
    dur_sweep = [
        {"duration_days": d, "probability": _prob(req.goal_usd, d)}
        for d in [7, 14, 21, 30, 45, 60, 90]
    ]

    return {
        "probability":    base_prob,
        "prediction":     "successful" if base_prob >= 50 else "failed",
        "goal_sweep":     goal_sweep,
        "duration_sweep": dur_sweep,
    }
