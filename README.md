# PitchAI — Crowdfunding Campaign Success Predictor

**PitchAI** is a machine learning system that predicts the success probability of Kickstarter crowdfunding campaigns. Upload a PDF pitch deck and get a prediction with SHAP explanations and actionable recommendations in seconds.

> MUST (Mongolian University of Science and Technology) — Information Systems Bachelor's Thesis | Badamkhand B. 

---

## Features

- **PDF → Prediction** — Upload a pitch deck PDF: OCR + LLM extraction → ML prediction
- **XGBoost + LightGBM Ensemble** — Optuna-tuned soft-voting classifier, AUC **0.7787**
- **SHAP Explanations** — Shows which features influenced the prediction and how
- **Groq LLM Extraction** — Uses `llama-3.3-70b-versatile` to extract campaign features from PDF text
- **Mongolian Language Support** — Handles Mongolian PDF, Cyrillic text, and MNT currency
- **What-If Analysis** — See how changing goal or duration affects success probability
- **Full-Stack App** — React frontend + FastAPI backend

---

## Model Performance

| Metric | Score |
|--------|-------|
| Ensemble | XGBoost + LightGBM soft-voting |
| Training Data | 331,675 Kickstarter campaigns (2018) |
| AUC-ROC | **0.7787** |
| F1 Score | **0.6572** |
| Accuracy | **70.6%** |
| Validation | 5-fold Stratified CV |

---

## Run Locally

### Backend

```bash
cd backend
pip install -r requirements.txt

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

uvicorn main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Retrain the Model (optional)

```bash
# Place ks-projects-201801.csv in ml/data/
python ml/train.py
# ~30–60 min — auto-copies to backend/models/
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API status and model info |
| GET | `/model-info` | Feature list, AUC, CV results |
| POST | `/predict` | Upload PDF → prediction + SHAP + recommendations |
| POST | `/whatif` | Sweep goal/duration to find optimal values |

---

## Project Structure

```
pitchai/
├── frontend/          ← React + Vite + TypeScript + shadcn/ui
├── backend/           ← FastAPI + XGBoost + LightGBM + SHAP
│   ├── main.py
│   ├── models/        (model_v4.pkl, tfidf, encoders)
│   └── requirements.txt
└── ml/
    └── train.py       ← Optuna hyperparameter tuning
```

---

## Tech Stack

**Backend:** Python · FastAPI · XGBoost · LightGBM · scikit-learn · SHAP · PyMuPDF · Tesseract OCR · Groq API

**Frontend:** React · TypeScript · Vite · Tailwind CSS · shadcn/ui

**ML:** Kickstarter 2018 dataset · Optuna · TF-IDF (word + char n-gram) · 5-fold CV
