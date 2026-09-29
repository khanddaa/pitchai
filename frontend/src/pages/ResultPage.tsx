import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, ArrowLeft, BarChart3,
  CheckCircle, AlertCircle, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { DARK, PURPLE, FONT, LABELS } from "@/constants";

interface ShapItem {
  feature: string;
  shap_value: number;
  direction: "positive" | "negative";
  feature_value: number;
}

interface PredictResult {
  probability: number;
  prediction: "successful" | "failed";
  confidence: string;
  pages: number;
  via_llm: boolean;
  model_version?: string;
  ocr_text?: string;
  top_features: { name: string; importance: number }[];
  recommendations?: string[];
  category_success_rate?: number;
  shap_explanation?: ShapItem[];
  extracted: {
    campaign_name: string;
    goal_usd: number;
    duration_days: number;
    main_category: string;
    category: string;
    country: string;
    currency?: string;
  };
  extraction_notes: {
    goal_found: boolean;
    duration_found: boolean;
    country_found: boolean;
    via_llm: boolean;
  };
}

function CampaignName({ name }: { name: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const truncated = name.length > 32 ? name.slice(0, 32) + "…" : name;
  const needsTooltip = name.length > 32;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <h1
        style={{ fontSize: "clamp(22px,3vw,40px)", fontWeight: 800, lineHeight: 1.1, color: DARK, marginBottom: "8px", letterSpacing: "-1px", fontFamily: FONT, cursor: needsTooltip ? "help" : "default" }}
        onMouseEnter={() => needsTooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}>
        {truncated}
      </h1>
      {showTooltip && (
        <div style={{ position: "absolute", top: "110%", left: 0, background: DARK, color: "#fff", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontFamily: FONT, whiteSpace: "normal", maxWidth: "320px", zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.3)", lineHeight: 1.5 }}>
          {name}
          <div style={{ position: "absolute", top: "-5px", left: "16px", width: "10px", height: "10px", background: DARK, transform: "rotate(45deg)" }} />
        </div>
      )}
    </div>
  );
}

const TABS = ["Тойм", "SHAP", "Зөвлөмж"];

const SHAP_LABELS: Record<string, string> = {
  log_goal:          "Зорилтот дүн",
  duration_days:     "Хугацаа",
  log_goal_per_day:  "Өдрийн дүн",
  goal_x_duration:   "Дүн × Хугацаа",
  log_duration:      "Хугацаа (log)",
  name_length:       "Нэрийн урт",
  name_word_count:   "Нэрийн үгийн тоо",
  main_category_enc: "Үндсэн ангилал",
  category_enc:      "Дэд ангилал",
  country_enc:       "Улс",
  is_us:             "АНУ-д байрлах эсэх",
  launch_month:      "Эхлэх сар",
  launch_weekday:    "Эхлэх гараг",
  is_weekend:        "Амралтын өдөр",
  log_goal_sq:       "Зорилтот дүн²",
  is_goal_round:     "Дүн тэгш тоо эсэх",
  goal_bucket:       "Дүнгийн зэрэглэл",
  name_capital_ratio:"Том үсгийн хувь",
  name_digit_count:  "Тооны тэмдэгт",
  name_has_excl:     "! тэмдэгт байгаа эсэх",
  name_has_colon:    ": тэмдэгт байгаа эсэх",
};

export default function ResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictResult | null>(null);
  const [tab, setTab] = useState(0);
  const [ocrOpen, setOcrOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pitchai_result");
    if (!raw) { navigate("/"); return; }
    try { setResult(JSON.parse(raw)); } catch { navigate("/"); }
  }, [navigate]);

  if (!result) return null;

  const isSuccess  = result.prediction === "successful";
  const prob       = result.probability;
  const circ       = 2 * Math.PI * 46;
  const offset     = circ - (prob / 100) * circ;
  const gaugeColor = isSuccess ? (prob > 70 ? "#16a34a" : PURPLE) : (prob < 30 ? "#dc2626" : "#d97706");

  const rows = [
    { label: "Зорилтот дүн",  value: `$${result.extracted.goal_usd.toLocaleString()}`, found: result.extraction_notes.goal_found },
    { label: "Хугацаа",        value: `${result.extracted.duration_days} өдөр`,         found: result.extraction_notes.duration_found },
    { label: "Үндсэн ангилал", value: result.extracted.main_category,                   found: true },
    { label: "Дэд ангилал",    value: result.extracted.category,                        found: true },
    { label: "Улс",            value: result.extracted.country,                         found: result.extraction_notes.country_found },
    { label: "Валют",          value: result.extracted.currency || "USD",               found: true },
    { label: "Хуудас",         value: `${result.pages} хуудас`,                         found: true },
    { label: "Олборлолт",      value: result.via_llm ? "AI (LLM)" : "Regex",            found: true },
  ];

  // SHAP data
  const shapItems = result.shap_explanation ?? [];
  const maxAbs = shapItems.length > 0 ? Math.max(...shapItems.map(s => Math.abs(s.shap_value))) : 1;

  return (
    <div style={{ fontFamily: FONT, minHeight: "calc(100vh - 144px)" }} className="result-layout">
      <style>{`
        .result-layout { display: flex; overflow: hidden; }
        .result-left { width: 55%; padding: 60px 56px 60px 80px; display: flex; flex-direction: column; justify-content: flex-start; overflow-y: auto; }
        .result-right { width: 45%; background: linear-gradient(155deg,#1e0757 0%,#3b0f8a 30%,#5b21b6 65%,#7c3aed 100%); position: relative; overflow: hidden; }
        @media (max-width: 768px) {
          .result-layout { flex-direction: column; overflow: auto; }
          .result-left { width: 100%; padding: 32px 20px; }
          .result-right { width: 100%; min-height: 420px; }
        }
      `}</style>

      {/* ── LEFT ─────────────────────────────────────────── */}
      <div className="result-left animate-fade-in-up">

        <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          PitchAI IAM | Iris
        </p>
        <CampaignName name={result.extracted.campaign_name} />

        {/* Tab bar */}
        <div style={{ display: "flex", background: "#F3F4F6", padding: "3px", borderRadius: "8px", width: "fit-content", margin: "20px 0 28px" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{
                padding: "6px 20px", borderRadius: "6px",
                background: i === tab ? "#fff" : "transparent",
                color: i === tab ? DARK : "#6B7280",
                border: "none", fontSize: "13px",
                fontWeight: i === tab ? 600 : 400,
                cursor: "pointer", fontFamily: FONT,
                boxShadow: i === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB 0: Тойм ──────────────────────────────── */}
        {tab === 0 && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px" }}>
              <span style={{ fontSize: "clamp(48px,7vw,72px)", fontWeight: 800, color: gaugeColor, letterSpacing: "-3px", lineHeight: 1 }}>
                {prob}%
              </span>
              <span style={{ fontSize: "16px", color: "#6B7280", fontWeight: 500, lineHeight: 1.5 }}>
                амжилтын<br />магадлал
              </span>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 20px", borderRadius: "10px", marginBottom: "28px", width: "fit-content", background: isSuccess ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isSuccess ? "#86efac" : "#fca5a5"}` }}>
              {isSuccess ? <TrendingUp size={20} color="#16a34a" /> : <TrendingDown size={20} color="#dc2626" />}
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: isSuccess ? "#15803d" : "#dc2626", margin: 0 }}>
                  {isSuccess ? "Амжилттай болох магадлал өндөр" : "Амжилтгүй болох эрсдэлтэй"}
                </p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0" }}>
                  {result.confidence} итгэл
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>
                Шинжилгээ · {result.pages} хуудас
              </p>
              {result.category_success_rate !== undefined && (
                <span style={{ fontSize: "11px", color: "#6B7280", padding: "2px 8px", borderRadius: "4px", background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
                  {result.extracted.main_category} дундаж: {Math.round(result.category_success_rate * 100)}%
                </span>
              )}
              <span style={{ fontSize: "11px", color: result.via_llm ? "#6d28d9" : "#6B7280", padding: "2px 8px", borderRadius: "4px", background: result.via_llm ? "#f5f3ff" : "#F3F4F6", border: `1px solid ${result.via_llm ? "#ddd6fe" : "#E5E7EB"}` }}>
                {result.via_llm ? "AI олборлолт" : "Regex олборлолт"}
              </span>
            </div>

            {/* OCR текст */}
            {result.ocr_text && (
              <div style={{ marginBottom: "8px", border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                <button
                  onClick={() => setOcrOpen(o => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F9FAFB", border: "none", cursor: "pointer", fontFamily: FONT }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={13} color="#6B7280" />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>OCR текст харах</span>
                  </div>
                  {ocrOpen ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                </button>
                {ocrOpen && (
                  <div style={{ padding: "12px 14px", background: "#fff", maxHeight: "180px", overflowY: "auto" }}>
                    <p style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                      {result.ocr_text}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── TAB 1: SHAP ───────────────────────────────── */}
        {tab === 1 && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              Feature importance (SHAP) · загварын шийдвэрт нөлөөлсөн хүчин зүйлс
            </p>
            {shapItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "440px" }}>
                {shapItems.map((s) => {
                  const pct = Math.abs(s.shap_value) / maxAbs * 100;
                  const pos = s.shap_value > 0;
                  return (
                    <div key={s.feature}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "12px", color: "#374151" }}>
                          {SHAP_LABELS[s.feature] || s.feature}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: pos ? "#16a34a" : "#dc2626" }}>
                          {pos ? "+" : ""}{s.shap_value.toFixed(3)}
                        </span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "3px", background: "#F3F4F6", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "3px",
                          width: `${pct}%`,
                          background: pos ? "#16a34a" : "#dc2626",
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
                  🟢 Амжилтыг нэмэгдүүлэх нөлөөлөл · 🔴 Амжилтыг бууруулах нөлөөлөл
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: "12px" }}>
                <BarChart3 size={32} color="#D1D5DB" />
                <p style={{ fontSize: "15px", color: "#9CA3AF", margin: 0 }}>SHAP мэдээлэл байхгүй байна</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: Зөвлөмж ───────────────────────────── */}
        {tab === 2 && (
          <>
            {result.recommendations && result.recommendations.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "440px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                  AI зөвлөмж · {result.recommendations.length} зүйл
                </p>
                {result.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px" }}>
                    <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "13.5px", color: "#92400e", margin: 0, lineHeight: 1.6 }}>{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "#9CA3AF", gap: "12px" }}>
                <AlertCircle size={32} color="#D1D5DB" />
                <p style={{ fontSize: "15px", margin: 0 }}>Зөвлөмж байхгүй байна</p>
              </div>
            )}
          </>
        )}

        <button onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "32px", background: DARK, color: "#fff", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer", width: "fit-content", boxShadow: "0 2px 8px rgba(26,17,67,0.35)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
          <ArrowLeft size={15} /> Буцах
        </button>
      </div>

      {/* ── RIGHT ────────────────────────────────────────── */}
      <div className="result-right">
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(124,58,237,0.2)", filter: "blur(80px)", pointerEvents: "none" }} />

        <div style={{ background: "rgba(0,0,0,0.32)", padding: "11px 18px", display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map(c => (
              <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "5px", padding: "4px 12px", marginLeft: "8px" }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "11.5px" }}>
              "{result.extracted.campaign_name.slice(0, 28)}" — үр дүн
            </span>
          </div>
        </div>

        <div style={{ padding: "20px 20px 180px", position: "relative", zIndex: 1 }}>
          <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "10px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
              <circle cx="55" cy="55" r="46" fill="none"
                stroke={gaugeColor} strokeWidth="9"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" transform="rotate(-90 55 55)"
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
              <text x="55" y="50" textAnchor="middle" style={{ fontSize: "20px", fontWeight: 900, fill: "#fff" }}>{prob}%</text>
              <text x="55" y="66" textAnchor="middle" style={{ fontSize: "8.5px", fill: "rgba(255,255,255,0.45)" }}>{result.confidence} итгэл</text>
            </svg>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>
              {isSuccess ? "Амжилтын магадлал өндөр" : "Эрсдэлтэй"}
            </p>
          </div>
        </div>

        <div className="animate-slide-up" style={{ position: "absolute", bottom: "18px", left: "18px", right: "18px", background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)", zIndex: 10, maxHeight: "calc(100% - 220px)", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 4H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-4.5L1 5h4.5z" fill={PURPLE} />
            </svg>
            <span style={{ color: "#374151", fontSize: "12.5px", fontWeight: 600, fontFamily: FONT }}>AI дэмжлэгтэй</span>
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: DARK, marginBottom: "12px", fontFamily: FONT, letterSpacing: "-0.3px" }}>Төслийн шинжилгээ</h3>

          {rows.map((r, i) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>{r.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: DARK }}>{r.value}</span>
                {r.found
                  ? <CheckCircle size={11} color="#16a34a" />
                  : <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>өгөгдмөл</span>}
              </div>
            </div>
          ))}

          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <BarChart3 size={12} color={PURPLE} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>Нөлөөлсөн хүчин зүйлс</span>
            </div>
            {result.top_features.slice(0, 3).map((f, i) => {
              const pct = (f.importance / result.top_features[0].importance) * 100;
              return (
                <div key={f.name} style={{ marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", color: "#374151" }}>{LABELS[f.name] || f.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: PURPLE }}>{f.importance}%</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "#F3F4F6" }}>
                    <div style={{ height: "100%", borderRadius: "2px", background: PURPLE, width: `${pct}%`, opacity: 1 - i * 0.22, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
