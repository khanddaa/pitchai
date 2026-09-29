# backend/test_extraction.py
import requests
import os
import time

BACKEND_URL = "http://localhost:8000"
PDF_FOLDER  = "/Users/batkhuyagbadamkhand/Desktop/Diploma/Projects"

results = []

for filename in os.listdir(PDF_FOLDER):
    if not filename.endswith(".pdf"):
        continue

    print(f"⏳ {filename} илгээж байна...")

    with open(f"{PDF_FOLDER}/{filename}", "rb") as f:
        resp = requests.post(
            f"{BACKEND_URL}/predict",
            files={"file": (filename, f, "application/pdf")}
        )

    if resp.status_code == 200:
        data = resp.json()
        results.append({
            "file":           filename,
            "via_llm":        data.get("via_llm"),
            "goal_found":     data["extraction_notes"]["goal_found"],
            "duration_found": data["extraction_notes"]["duration_found"],
            "probability":    data.get("probability"),
            "prediction":     data.get("prediction"),
            "category":       data["extracted"]["main_category"],
        })
        print(f"✅ {filename}: {data.get('probability')}% — {data.get('prediction')}")
    else:
        print(f"❌ {filename}: алдаа {resp.status_code}")

    time.sleep(15)  # rate limit: 5 хүсэлт/минут

# ── Дүгнэлт ──────────────────────────────
total      = len(results)
if total == 0:
    print("❌ Үр дүн байхгүй")
else:
    llm_count  = sum(1 for r in results if r["via_llm"])
    goal_found = sum(1 for r in results if r["goal_found"])
    dur_found  = sum(1 for r in results if r["duration_found"])
    success    = sum(1 for r in results if r["prediction"] == "successful")

    print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ҮР ДҮН
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Нийт PDF:          {total}
LLM амжилттай:     {llm_count}/{total} ({llm_count/total*100:.0f}%)
Regex fallback:    {total-llm_count}/{total} ({(total-llm_count)/total*100:.0f}%)
Goal олдсон:       {goal_found}/{total} ({goal_found/total*100:.0f}%)
Duration олдсон:   {dur_found}/{total} ({dur_found/total*100:.0f}%)
Successful:        {success}/{total} ({success/total*100:.0f}%)
Failed:            {total-success}/{total} ({(total-success)/total*100:.0f}%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")