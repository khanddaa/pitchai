# PitchAI — Kickstarter Campaign Success Predictor

Kickstarter кампанит ажлын амжилтыг ML-ээр таамаглах бүрэн систем.
XGBoost + LightGBM + Random Forest ensemble, Groq LLM PDF extraction, DocuSign загвартай UI.

---

## 📁 Хавтасны бүтэц

```
mongol-crowd-predict-main/
│
├── frontend/                  ← React + Vite + TypeScript UI
│   ├── src/
│   │   ├── pages/             (UploadPage, ResultPage, LoginPage, AdminPage)
│   │   ├── components/        (TopNav, ProtectedRoute, shadcn/ui)
│   │   ├── context/           (AuthContext)
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   ← FastAPI REST API
│   ├── main.py                (v1/v2 auto-detect, Groq LLM, regex fallback)
│   ├── models/                ← сурсан загварууд
│   │   ├── model_tfidf.pkl    (v1 — одоо ашиглагдаж байна)
│   │   ├── tfidf_vectorizer.pkl
│   │   ├── encoders.pkl
│   │   └── [v2 файлууд train.py ажиллуулсны дараа үүснэ]
│   ├── .env                   (GROQ_API_KEY=...)
│   └── requirements.txt
│
└── ml/                        ← Модел сургалт
    ├── train.py               (XGBoost+LGB+RF, Optuna 160 trial, бүрэн pipeline)
    ├── data/
    │   └── ks-projects-201801.csv   (Kickstarter 331K dataset)
    ├── models/                (train.py гаралт → auto-copy backend/models/ руу)
    └── notebooks/             (EDA, туршилт)
```

---

## 🚀 Ажиллуулах

### 1. Backend

```bash
cd backend/

# Dependencies суулгах
pip install fastapi uvicorn python-multipart pymupdf python-dotenv \
            numpy scipy scikit-learn xgboost lightgbm

# .env файлд Groq API key оруулах (LLM PDF extraction-д шаардлагатай)
echo "GROQ_API_KEY=your_key_here" > .env

# API server эхлүүлэх
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 2. Frontend

```bash
cd frontend/

npm install     # эхний удаа
npm run dev     # → http://localhost:5173
```

### 3. v2 модел сургах (сайжруулсан)

```bash
# Dependencies суулгах
pip install scikit-learn xgboost lightgbm optuna pandas numpy joblib scipy

# Сургах (~20-40 мин, автоматаар backend/models/ руу copy хийнэ)
python ml/train.py

# v2 ачаалагдсаны дараа API автоматаар v2 горимд шилжинэ
```

---

## 🔌 API Endpoints

| Method | Path           | Тайлбар                             |
|--------|----------------|-------------------------------------|
| GET    | `/`            | API мэдээлэл + загварын төлөв       |
| GET    | `/model-info`  | Feature list, AUC, ensemble weights |
| POST   | `/predict`     | PDF файл оруулж таамаглах           |

---

## 🧠 Загварын мэдээлэл

**v1 (одоо):**
- RandomForest + TF-IDF (300 vocab)
- 16 numerical features

**v2 (train.py ажиллуулсны дараа):**
- XGBoost + LightGBM + RandomForest soft-voting ensemble
- Optuna 160 trial hyperparameter tuning
- CalibratedClassifierCV (isotonic)
- 25 numerical features + 1000-word + 500-char TF-IDF
- Target AUC: ~0.74–0.76
