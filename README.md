# PitchAI — Краудфандинг Төслийн Амжилтыг Таамаглах Систем

**PitchAI** нь Kickstarter краудфандинг кампанит ажлын амжилтыг машин сургалтаар таамаглах дипломын ажлын систем юм. PDF pitch deck оруулахад хэдхэн секундын дотор амжилтын магадлал, SHAP тайлбар, зөвлөмж гаргаж өгнө.

> 🎓 МУИС — Мэдээллийн системийн дипломын ажил | Бадамханд Б. (B221930052)

---

## ✨ Онцлог

- **PDF → Таамаглал** — pitch deck PDF оруулахад OCR + LLM extraction → ML prediction
- **XGBoost + LightGBM Ensemble** — Optuna-р тохируулсан soft-voting, AUC **0.7787**
- **SHAP тайлбар** — ямар feature таамаглалд нөлөөлснийг харуулна
- **Groq LLM** — `llama-3.3-70b-versatile` ашиглан PDF-ээс feature автоматаар гарган авна
- **Монгол хэлний дэмжлэг** — Монгол PDF, Кирилл текст боловсруулна
- **What-If шинжилгээ** — зорилт, хугацааг өөрчлөхөд магадлал хэрхэн өөрчлөгдөхийг харна
- **React + FastAPI** — бүрэн ажилладаг full-stack веб апп

---

## 🧠 Загварын гүйцэтгэл

| Үзүүлэлт | Утга |
|-----------|------|
| Ensemble | XGBoost + LightGBM soft-voting |
| Сургалтын өгөгдөл | 331,675 Kickstarter кампани (2018) |
| AUC-ROC | **0.7787** |
| F1 Score | **0.6572** |
| Accuracy | **70.6%** |
| Validation | 5-fold Stratified CV |

**Features (23 numerical + TF-IDF):**
`log_goal`, `duration_days`, `launch_month`, `category`, `country`, `name_length`, `goal_bucket`, `name_capital_ratio` гэх мэт

---

## 📁 Хавтасны бүтэц

```
pitchai_main2/
├── frontend/              ← React + Vite + TypeScript + shadcn/ui
│   └── src/
│       ├── pages/         (UploadPage, ResultPage, AboutPage, AdminPage)
│       ├── components/    (TopNav, ProtectedRoute)
│       └── lib/api.ts
│
├── backend/               ← FastAPI REST API
│   ├── main.py            (v4 pipeline: OCR → LLM → ML → SHAP)
│   ├── models/            (model_v4.pkl, tfidf, encoders, config)
│   ├── .env               (GROQ_API_KEY=...)
│   └── requirements.txt
│
└── ml/                    ← Загвар сургалт
    ├── train.py           (XGBoost + LightGBM + Optuna)
    └── data/
        └── ks-projects-201801.csv
```

---

## 🚀 Ажиллуулах

### Backend

```bash
cd backend
pip install -r requirements.txt

# .env файлд Groq API key оруулах
echo "GROQ_API_KEY=your_groq_key" > .env

uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Загвар дахин сургах (сонголтоор)

```bash
# ks-projects-201801.csv файлыг ml/data/ дотор байрлуул
cd ml
python train.py
# ~30-60 мин, автоматаар backend/models/ руу copy хийнэ
```

---

## 🔌 API Endpoints

| Method | Path | Тайлбар |
|--------|------|---------|
| GET | `/` | API төлөв, загварын мэдээлэл |
| GET | `/model-info` | Feature жагсаалт, AUC, CV үр дүн |
| POST | `/predict` | PDF оруулж таамаглах (SHAP + зөвлөмж) |
| POST | `/whatif` | Goal/duration өөрчлөхөд магадлал хэрхэн өөрчлөгдөх |

---

## ⚙️ Технологийн стек

**Backend:** Python · FastAPI · XGBoost · LightGBM · scikit-learn · SHAP · PyMuPDF · Tesseract OCR · Groq API

**Frontend:** React · TypeScript · Vite · Tailwind CSS · shadcn/ui

**ML:** Kickstarter 2018 dataset · Optuna hyperparameter tuning · TF-IDF (word + char n-gram)
