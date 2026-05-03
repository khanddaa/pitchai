import os, json, re, pickle
from dotenv import load_dotenv
load_dotenv()

import numpy as np
import fitz
import requests as http_req
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from scipy.sparse import hstack, csr_matrix
from datetime import datetime

app = FastAPI(title="PitchAI API v2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MODEL paths — models/ дэд хавтсаас унших ─────────────────
base_dir   = os.path.dirname(__file__)
MODELS_DIR = os.path.join(base_dir, "models")

MODEL_VERSION = "v2" if os.path.exists(os.path.join(MODELS_DIR, "model_v2.pkl")) else "v1"

# ── Загвар ачаалах ────────────────────────────────────────────
if MODEL_VERSION == "v2":
    model    = pickle.load(open(os.path.join(MODELS_DIR, "model_v2.pkl"),       "rb"))
    tfidf_w  = pickle.load(open(os.path.join(MODELS_DIR, "tfidf_v2_word.pkl"),  "rb"))
    tfidf_c  = pickle.load(open(os.path.join(MODELS_DIR, "tfidf_v2_char.pkl"),  "rb"))
    encoders = pickle.load(open(os.path.join(MODELS_DIR, "encoders_v2.pkl"),    "rb"))
    with open(os.path.join(MODELS_DIR, "model_config_v2.json")) as f:
        MODEL_CONFIG = json.load(f)
    FEATURES_NUM = MODEL_CONFIG["features_num"]
    CAT_SUCCESS  = MODEL_CONFIG["cat_success_rate"]
    print(f"✅ Model v2 loaded — AUC: {MODEL_CONFIG.get('cv_auc', '?'):.4f}, "
          f"F1: {MODEL_CONFIG.get('cv_f1', '?'):.4f}")
else:
    model    = pickle.load(open(os.path.join(MODELS_DIR, "model_tfidf.pkl"),       "rb"))
    tfidf_w  = pickle.load(open(os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl"),  "rb"))
    tfidf_c  = None
    encoders = pickle.load(open(os.path.join(MODELS_DIR, "encoders.pkl"),          "rb"))
    FEATURES_NUM = [
        'log_goal','duration_days','launch_month','launch_weekday',
        'launch_year','name_length','main_category_enc','category_enc',
        'country_enc','currency_enc','log_goal_per_day','is_us',
        'is_weekend','log_duration','name_word_count','goal_x_duration'
    ]
    CAT_SUCCESS = {
        "Technology":0.199,"Music":0.478,"Film & Video":0.371,"Games":0.349,
        "Art":0.407,"Design":0.353,"Food":0.253,"Publishing":0.315,
        "Photography":0.394,"Theater":0.639,"Comics":0.540,"Crafts":0.249,
        "Fashion":0.242,"Journalism":0.218,"Dance":0.619,
    }
    MODEL_CONFIG = {}
    print("✅ Model v1 loaded")

# ── Groq LLM ─────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-8b-instant"

VALID_CATEGORIES = [
    "Technology","Music","Film & Video","Games","Art",
    "Design","Food","Publishing","Photography","Theater",
    "Comics","Crafts","Fashion","Journalism","Dance",
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

    # Base engineered values
    log_goal         = np.log1p(goal)
    log_goal_per_day = np.log1p(goal / max(duration, 1))
    is_us            = 1 if country == "US" else 0
    is_weekend       = 1 if now.weekday() >= 5 else 0
    log_duration     = np.log1p(duration)
    name_length      = len(name)
    name_words       = name.split()
    name_word_count  = len(name_words)
    goal_x_duration  = log_goal * log_duration

    feat_dict = {
        "log_goal":           log_goal,
        "duration_days":      float(duration),
        "launch_month":       float(now.month),
        "launch_weekday":     float(now.weekday()),
        "launch_year":        float(now.year),
        "name_length":        float(name_length),
        "main_category_enc":  float(safe_encode(encoders["main_category"], main_cat)),
        "category_enc":       float(safe_encode(encoders["category"],      cat)),
        "country_enc":        float(safe_encode(encoders["country"],       country)),
        "currency_enc":       float(safe_encode(encoders["currency"],      currency)),
        "log_goal_per_day":   log_goal_per_day,
        "is_us":              float(is_us),
        "is_weekend":         float(is_weekend),
        "log_duration":       log_duration,
        "name_word_count":    float(name_word_count),
        "goal_x_duration":    goal_x_duration,
        # v2 new features
        "cat_success_rate":   CAT_SUCCESS.get(main_cat, 0.35),
        "is_goal_round":      float((goal % 1000) == 0),
        "name_avg_word_len":  float(np.mean([len(w) for w in name_words]) if name_words else 0),
        "name_capital_ratio": float(sum(1 for c in name if c.isupper()) / max(len(name), 1)),
        "name_digit_count":   float(sum(c.isdigit() for c in name)),
        "name_has_excl":      float("!" in name),
        "name_has_colon":     float(":" in name),
        "goal_bucket":        float(min(int(log_goal / (np.log1p(10_000_000) / 8)), 7)),
        "log_goal_sq":        log_goal ** 2,
        "goal_x_success_rate": log_goal * CAT_SUCCESS.get(main_cat, 0.35),
        "dur_x_success_rate":  duration   * CAT_SUCCESS.get(main_cat, 0.35),
    }

    # Build numerical vector in correct feature order
    x_num = np.array([[feat_dict.get(f, 0.0) for f in FEATURES_NUM]], dtype=np.float32)

    # Text features
    x_word = tfidf_w.transform([name])
    x_combined = hstack([csr_matrix(x_num), x_word])
    if tfidf_c is not None:
        x_char = tfidf_c.transform([name])
        x_combined = hstack([x_combined, x_char])

    return x_combined, feat_dict


# ─────────────────────────────────────────────────────────────
# LLM EXTRACTION
# ─────────────────────────────────────────────────────────────
def llm_extract(text: str) -> dict | None:
    if not GROQ_API_KEY:
        return None
    sample = text[:4000]
    prompt = f"""Та краудфандинг pitch deck PDF-ийн текстийг шинжлэх үүрэгтэй.

Доорх текстээс дараах мэдээллийг олж, яг JSON форматаар буцаана уу:

{{
  "campaign_name": "кампанит ажлын нэр",
  "goal_usd": 10000,
  "duration_days": 30,
  "main_category": "Technology",
  "category": "Apps",
  "country": "MN",
  "currency": "USD"
}}

Дүрмүүд:
- campaign_name: текстийн эхний гарчиг эсвэл нэр (string)
- goal_usd: зорилтот дүн АНУ доллараар (₮ байвал 1$=3450₮; олдоогүй → 10000)
- duration_days: хугацаа өдрөөр 1-90 (олдоогүй → 30)
- main_category: Technology|Music|Film & Video|Games|Art|Design|Food|Publishing|Photography|Theater|Comics|Crafts|Fashion|Journalism|Dance
- category: дэд ангилал (Apps, Album, Short Film г.м.)
- country: ISO-2 (Монгол→MN, АНУ→US; олдоогүй→MN)
- currency: USD|MNT|EUR|GBP|CAD|AUD (олдоогүй→USD)

Зөвхөн JSON объект буцаана уу. Тайлбар бичихгүй.

Текст:
{sample}"""

    try:
        resp = http_req.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0.1, "max_tokens": 300},
            timeout=20,
        )
        if resp.status_code != 200:
            return None

        content = resp.json()["choices"][0]["message"]["content"].strip()
        content = re.sub(r'```(?:json)?\s*', '', content).replace('```', '')
        m = re.search(r'\{[\s\S]*?\}', content, re.DOTALL)
        if not m: return None

        raw_json = re.sub(r',\s*([}\]])', r'\1', m.group())
        data = json.loads(raw_json)

        main_cat = data.get("main_category", "Technology")
        if main_cat not in VALID_CATEGORIES: main_cat = "Technology"

        goal = float(data.get("goal_usd", 10000))
        if not (100 <= goal <= 10_000_000): goal = 10000.0

        dur = int(data.get("duration_days", 30))
        if not (1 <= dur <= 92): dur = 30

        currency = str(data.get("currency", "USD"))
        if currency == "MNT":
            goal = round(goal / 3450, 2)
            currency = "USD"

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
        print(f"[LLM] Error: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# REGEX FALLBACK
# ─────────────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Technology":  ["app","software","tech","hardware","device","robot","ai","platform","digital","iot",
                    "технологи","програм","апп","хиймэл","оюун","платформ","дижитал"],
    "Music":       ["album","music","song","band","concert","record","ep","musician",
                    "хөгжим","дуу","дуурь","уртын дуу","концерт"],
    "Film & Video":["film","movie","documentary","video","cinema","animation","series",
                    "кино","видео","баримтат","анимаци"],
    "Games":       ["game","board game","card game","rpg","tabletop","puzzle","arcade",
                    "тоглоом"],
    "Art":         ["art","painting","sculpture","gallery","exhibition","artist","illustration",
                    "урлаг","зураг","баримал","үзэсгэлэн"],
    "Design":      ["design","product","prototype","industrial","furniture",
                    "дизайн","загвар","бүтээгдэхүүн"],
    "Food":        ["food","restaurant","cafe","recipe","cooking","beverage","organic",
                    "хоол","хүнс","ресторан","кафе","ундаа"],
    "Publishing":  ["book","novel","comic","magazine","poetry","writer","author",
                    "ном","зохиол","хэвлэл","шүлэг"],
    "Photography": ["photo","photography","camera","portrait","landscape",
                    "фото","зургийн"],
    "Theater":     ["theater","play","performance","stage","musical",
                    "театр","жүжиг","тайз"],
    "Crafts":      ["craft","handmade","knit","sew","pottery","ceramic","jewelry",
                    "гар урлал","нэхмэл","шаазан"],
    "Fashion":     ["fashion","clothing","apparel","style","collection","accessory",
                    "хувцас","загварын"],
    "Journalism":  ["journalism","news","media","podcast","newsletter",
                    "мэдээ","сэтгүүлзүй","медиа","подкаст"],
    "Dance":       ["dance","choreography","ballet","hip hop","contemporary",
                    "бүжиг","хореографи"],
}

def _regex_goal(text: str) -> float | None:
    patterns = [
        r'([\d,]+(?:\.\d+)?)\s*(?:төгрөг|₮)',
        r'(?:зорилт|санхүүжилт|дүн|хэмжээ)[^\d₮$]*([₮$]?\s*[\d,]+(?:\.\d+)?)',
        r'(?:goal|target|raise|seeking|funding)[^\d$]*\$\s*([\d,]+(?:\.\d+)?)\s*(?:thousand|k|million|m)?',
        r'\$\s*([\d,]+(?:\.\d+)?)\s*(?:thousand|k|million|m)?',
        r'([\d,]+(?:\.\d+)?)\s*(?:USD|usd|dollars?)',
    ]
    for i, pat in enumerate(patterns):
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            raw = re.sub(r'[₮$,\s]','', m.group(1))
            try:
                val = float(raw)
                suffix = m.group(0).lower()
                if 'million' in suffix or ' m' in suffix: val *= 1_000_000
                elif 'thousand' in suffix or ' k' in suffix: val *= 1_000
                if i == 0: val = val / 3450
                if 100 <= val <= 10_000_000: return round(val, 2)
            except: continue
    return None

def _regex_duration(text: str) -> int | None:
    for i, pat in enumerate([
        r'(\d+)\s*(?:хоног|өдөр)', r'(\d+)\s*долоо хоног',
        r'(\d+)\s*-?\s*day', r'(\d+)\s*week',
    ]):
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if i in (1, 3): val *= 7
            if 1 <= val <= 92: return val
    return None

def _regex_category(text: str) -> tuple[str, str]:
    tl = text.lower()
    scores = {cat: sum(1 for kw in kws if kw in tl)
              for cat, kws in CATEGORY_KEYWORDS.items()}
    scores = {k: v for k, v in scores.items() if v > 0}
    if scores:
        best = max(scores, key=scores.get)
        sub  = max(CATEGORY_KEYWORDS[best], key=lambda k: tl.count(k))
        return best, sub.title()
    return "Technology", "Apps"

def regex_extract(text: str) -> dict:
    main_cat, cat = _regex_category(text)
    lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 3]
    name  = lines[0][:120] if lines else "Untitled Campaign"
    countries = {
        "монгол улс":"MN","монгол":"MN","улаанбаатар":"MN","mongolia":"MN",
        "united states":"US","usa":"US","united kingdom":"GB","canada":"CA",
        "australia":"AU","germany":"DE","france":"FR","japan":"JP",
    }
    country = next((code for phrase, code in countries.items() if phrase in text.lower()), "MN")
    return {
        "campaign_name": name, "goal_usd": _regex_goal(text),
        "duration_days": _regex_duration(text), "main_category": main_cat,
        "category": cat, "country": country, "currency": "USD", "via_llm": False,
    }


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    llm_status = "✅ Groq LLM идэвхтэй" if GROQ_API_KEY else "⚠️  Regex горим"
    return {
        "status":  "ok",
        "message": "PitchAI API ажиллаж байна",
        "llm":     llm_status,
        "model":   MODEL_VERSION,
        "model_info": {
            "version":  MODEL_VERSION,
            "cv_auc":   MODEL_CONFIG.get("cv_auc"),
            "cv_f1":    MODEL_CONFIG.get("cv_f1"),
            "ensemble": MODEL_CONFIG.get("ensemble_weights"),
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
        "ensemble":   MODEL_CONFIG.get("ensemble_weights"),
        "cat_success_rates": CAT_SUCCESS,
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Зөвхөн PDF файл оруулна уу")

    raw  = await file.read()
    doc  = fitz.open(stream=raw, filetype="pdf")
    pages = len(doc)
    text = "\n".join(page.get_text() for page in doc)

    if len(text.strip()) < 30:
        raise HTTPException(422, "PDF-ээс текст гаргаж чадсангүй (зургаар хийгдсэн PDF байж болзошгүй)")

    # Extraction: LLM → regex fallback
    regex_raw = regex_extract(text)
    llm_raw   = llm_extract(text)

    if llm_raw:
        extracted  = llm_raw
        goal_found = dur_found = via_llm = True
    else:
        extracted  = regex_raw
        via_llm    = False
        goal_found = regex_raw["goal_usd"] is not None
        dur_found  = regex_raw["duration_days"] is not None

    name     = extracted["campaign_name"]
    goal     = float(extracted["goal_usd"]      or 10000.0)
    duration = int(  extracted["duration_days"] or 30)
    main_cat = extracted["main_category"]
    cat      = extracted["category"]
    country  = extracted["country"]
    currency = extracted.get("currency", "USD")

    country_found = country != "MN" or any(
        kw in text.lower() for kw in ["монгол","mongolia","улаанбаатар","ulaanbaatar"]
    )

    # Predict
    x, feat_dict = build_features(name, goal, duration, main_cat, cat, country, currency)
    prob = float(model.predict_proba(x)[0][1])
    pred = "successful" if prob >= 0.5 else "failed"
    conf = "өндөр" if abs(prob - 0.5) > 0.2 else "дунд"

    # Feature importance — show numerical features
    if MODEL_VERSION == "v2" and hasattr(model, "calibrated_classifiers_"):
        # Calibrated model — get from base estimator
        base_est = model.calibrated_classifiers_[0].estimator
        # VotingClassifier — use XGBoost component
        try:
            fi = base_est.estimators_[0].feature_importances_
        except Exception:
            fi = np.ones(len(FEATURES_NUM)) / len(FEATURES_NUM)
    else:
        fi = model.feature_importances_

    feat_names_all = FEATURES_NUM + list(tfidf_w.get_feature_names_out())
    if tfidf_c is not None:
        feat_names_all += list(tfidf_c.get_feature_names_out())

    n = min(len(fi), len(feat_names_all))
    top5 = sorted(zip(feat_names_all[:n], fi[:n]), key=lambda x: -x[1])[:5]

    # Recommendations
    recs = []
    cat_rate = CAT_SUCCESS.get(main_cat, 0.35)
    if goal > 50000:
        recs.append(f"Зорилтот дүн өндөр (${goal:,.0f}) — $50,000-с доош болгоход амжилтын магадлал нэмэгдэнэ")
    if duration > 45:
        recs.append("Хугацаа хэт урт — 30–35 хоног хамгийн оновчтой")
    if cat_rate < 0.3:
        recs.append(f"{main_cat} ангиллын амжилтын түүхэн хувь бага ({cat_rate:.0%}) — ангилал сонголтоо нягтлаарай")
    if goal > 0 and duration > 0:
        daily = goal / duration
        if daily > 3000:
            recs.append(f"Өдөрт ${daily:,.0f} шаардлагатай — маш өндөр. Зорилтот дүн эсвэл хугацааг тохируулна уу")

    return {
        "probability":  round(prob * 100, 1),
        "prediction":   pred,
        "confidence":   conf,
        "pages":        pages,
        "via_llm":      via_llm,
        "model_version": MODEL_VERSION,
        "top_features": [{"name": n, "importance": round(v * 100, 1)} for n, v in top5],
        "recommendations": recs,
        "extracted": {
            "campaign_name": name, "goal_usd": goal, "duration_days": duration,
            "main_category": main_cat, "category": cat, "country": country,
        },
        "extraction_notes": {
            "goal_found": goal_found, "duration_found": dur_found,
            "country_found": country_found, "via_llm": via_llm,
        },
        "category_success_rate": cat_rate,
    }
