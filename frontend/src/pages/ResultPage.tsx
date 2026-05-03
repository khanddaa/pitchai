import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowLeft, BarChart3, CheckCircle, AlertCircle } from "lucide-react";

const DARK   = "#1B1240";
const PURPLE = "#5C2D91";
const FONT   = "'Plus Jakarta Sans', sans-serif";

interface PredictResult {
  probability: number; prediction: "successful"|"failed"; confidence: string;
  pages: number; via_llm: boolean; model_version?: string;
  top_features: { name: string; importance: number }[];
  recommendations?: string[];
  category_success_rate?: number;
  extracted: { campaign_name:string; goal_usd:number; duration_days:number; main_category:string; category:string; country:string };
  extraction_notes: { goal_found:boolean; duration_found:boolean; country_found:boolean; via_llm:boolean };
}

const LABELS: Record<string,string> = {
  goal_x_duration:"Зорилтот дүн × Хугацаа", log_goal:"Зорилтот дүн",
  category_enc:"Ангилал", log_goal_per_day:"Өдөрт шаардлагатай дүн",
  main_category_enc:"Үндсэн ангилал", log_duration:"Хугацааны урт",
  duration_days:"Хугацаа (өдөр)", launch_year:"Эхлүүлсэн жил",
  name_word_count:"Нэр дэх үгийн тоо", name_length:"Нэрийн урт",
};

const Sk = ({ w, h=8 }:{w:string;h?:number}) => (
  <div className="shimmer" style={{ height:`${h}px`, borderRadius:"4px", width:w, background:"rgba(255,255,255,0.1)" }} />
);

export default function ResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictResult|null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("pitchai_result");
    if (!raw) { navigate("/"); return; }
    try { setResult(JSON.parse(raw)); } catch { navigate("/"); }
  }, [navigate]);

  if (!result) return null;

  const isSuccess  = result.prediction === "successful";
  const prob       = result.probability;
  const circ       = 2 * Math.PI * 46;
  const offset     = circ - (prob/100) * circ;
  const gaugeColor = isSuccess ? (prob>70?"#16a34a":PURPLE) : (prob<30?"#dc2626":"#d97706");

  const rows = [
    { label:"Зорилтот дүн",  value:`$${result.extracted.goal_usd.toLocaleString()}`, found:result.extraction_notes.goal_found },
    { label:"Хугацаа",        value:`${result.extracted.duration_days} өдөр`,         found:result.extraction_notes.duration_found },
    { label:"Үндсэн ангилал", value:result.extracted.main_category,                   found:true },
    { label:"Дэд ангилал",    value:result.extracted.category,                        found:true },
    { label:"Улс",            value:result.extracted.country,                         found:result.extraction_notes.country_found },
    { label:"Хуудас",         value:`${result.pages} хуудас`,                         found:true },
  ];

  return (
    <div style={{ display:"flex", minHeight:"calc(100vh - 144px)", overflow:"hidden" }}>

      {/* ── LEFT ──────────────────────────────────────────── */}
      <div style={{ width:"55%", padding:"60px 56px 60px 80px", display:"flex", flexDirection:"column", justifyContent:"center", overflowY:"auto", fontFamily:FONT }}
        className="animate-fade-in-up">

        <p style={{ color:"#6B7280", fontSize:"14px", fontWeight:500, marginBottom:"18px", letterSpacing:"0.01em" }}>
          PitchAI IAM | Iris
        </p>

        <h1 style={{ fontSize:"clamp(28px,3vw,40px)", fontWeight:800, lineHeight:1.1, color:DARK, marginBottom:"8px", letterSpacing:"-1px", fontFamily:FONT }}>
          {result.extracted.campaign_name.length > 32
            ? result.extracted.campaign_name.slice(0,32)+"…"
            : result.extracted.campaign_name}
        </h1>

        {/* Big probability number */}
        <div style={{ display:"flex", alignItems:"baseline", gap:"12px", margin:"20px 0" }}>
          <span style={{ fontSize:"72px", fontWeight:800, color:gaugeColor, letterSpacing:"-3px", lineHeight:1, fontFamily:FONT }}>
            {prob}%
          </span>
          <span style={{ fontSize:"16px", color:"#6B7280", fontWeight:500, lineHeight:1.5, fontFamily:FONT }}>
            амжилтын<br/>магадлал
          </span>
        </div>

        {/* Verdict */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"10px", padding:"12px 20px",
          borderRadius:"10px", marginBottom:"28px", width:"fit-content",
          background: isSuccess?"#f0fdf4":"#fef2f2",
          border:`1px solid ${isSuccess?"#86efac":"#fca5a5"}`,
        }}>
          {isSuccess
            ? <TrendingUp size={20} color="#16a34a"/>
            : <TrendingDown size={20} color="#dc2626"/>}
          <div>
            <p style={{ fontSize:"14px", fontWeight:700, color:isSuccess?"#15803d":"#dc2626", margin:0 }}>
              {isSuccess ? "Амжилттай болох магадлал өндөр" : "Амжилтгүй болох эрсдэлтэй"}
            </p>
            <p style={{ fontSize:"12px", color:"#9CA3AF", margin:"2px 0 0" }}>
              {result.confidence} итгэл · Random Forest ML
            </p>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize:"17px", color:"#374151", lineHeight:1.7, maxWidth:"430px", marginBottom:"12px", fontFamily:FONT, fontWeight:400 }}>
          Kickstarter-ийн 331,675 кампанит ажлын датасет дээр сургасан
          Random Forest загвар таны pitch deck-г шинжилж дуусгалаа.
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
          <p style={{ fontSize:"14px", color:"#9CA3AF", lineHeight:1.6 }}>
            {result.via_llm ? "🤖 Groq Llama 3.1 LLM шинжилгээ" : "📐 Regex шинжилгээ"} ·{" "}
            {result.pages} хуудастай PDF
          </p>
          {result.model_version && (
            <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"rgba(107,33,168,0.1)", color:PURPLE, border:"1px solid rgba(107,33,168,0.2)" }}>
              Model v{result.model_version}
            </span>
          )}
          {result.category_success_rate !== undefined && (
            <span style={{ fontSize:"11px", color:"#6B7280", padding:"2px 8px", borderRadius:"4px", background:"#F3F4F6", border:"1px solid #E5E7EB" }}>
              {result.extracted.main_category} ангиллын дундаж: {Math.round(result.category_success_rate * 100)}%
            </span>
          )}
        </div>

        {/* Recommendations from API */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div style={{ marginTop:"20px", display:"flex", flexDirection:"column", gap:"8px", maxWidth:"430px" }}>
            <p style={{ fontSize:"11px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"2px" }}>AI Зөвлөмж</p>
            {result.recommendations.map((rec, i) => (
              <div key={i} style={{ display:"flex", gap:"8px", padding:"10px 14px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"8px" }}>
                <AlertCircle size={15} color="#d97706" style={{ flexShrink:0, marginTop:"1px" }} />
                <p style={{ fontSize:"13px", color:"#92400e", margin:0, lineHeight:1.5 }}>{rec}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => navigate("/")}
          style={{
            display:"inline-flex", alignItems:"center", gap:"8px",
            marginTop:"32px", background:DARK, color:"#fff",
            border:"none", borderRadius:"8px", padding:"11px 24px",
            fontSize:"14px", fontWeight:600, cursor:"pointer", width:"fit-content",
            boxShadow:"0 2px 8px rgba(26,17,67,0.35)",
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="0.9";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity="1";}}>
          <ArrowLeft size={15}/> Буцах
        </button>
      </div>

      {/* ── RIGHT — purple gradient ──────────────────────── */}
      <div style={{
        width:"45%",
        background:"linear-gradient(155deg,#1e0757 0%,#3b0f8a 30%,#5b21b6 65%,#7c3aed 100%)",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:"-80px", right:"-80px", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(124,58,237,0.2)", filter:"blur(80px)", pointerEvents:"none" }} />

        {/* Toolbar */}
        <div style={{ background:"rgba(0,0,0,0.32)", padding:"11px 18px", display:"flex", alignItems:"center", gap:"10px", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", gap:"6px" }}>
            {["#ff5f57","#febc2e","#28c840"].map(c=>(
              <div key={c} style={{ width:"10px", height:"10px", borderRadius:"50%", background:c, opacity:0.7 }} />
            ))}
          </div>
          <div style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:"5px", padding:"4px 12px", marginLeft:"8px" }}>
            <span style={{ color:"rgba(255,255,255,0.55)", fontSize:"11.5px" }}>
              "{result.extracted.campaign_name.slice(0,28)}" — үр дүн
            </span>
          </div>
        </div>

        {/* Gauge area */}
        <div style={{ padding:"20px 20px 180px", position:"relative", zIndex:1 }}>
          <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:"10px", padding:"20px", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"8px" }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9"/>
              <circle cx="55" cy="55" r="46" fill="none"
                stroke={gaugeColor} strokeWidth="9"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" transform="rotate(-90 55 55)"
                style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}/>
              <text x="55" y="50" textAnchor="middle" style={{ fontSize:"20px", fontWeight:900, fill:"#fff" }}>{prob}%</text>
              <text x="55" y="66" textAnchor="middle" style={{ fontSize:"8.5px", fill:"rgba(255,255,255,0.45)" }}>{result.confidence} итгэл</text>
            </svg>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"11px", margin:0 }}>
              {isSuccess ? "✓ Амжилтын магадлал өндөр" : "⚠ Эрсдэлтэй"}
            </p>
          </div>
        </div>

        {/* ── Floating AI card ─────────────────────────── */}
        <div className="animate-slide-up" style={{
          position:"absolute", bottom:"18px", left:"18px", right:"18px",
          background:"#fff", borderRadius:"14px", padding:"18px 20px",
          boxShadow:"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          zIndex:10, maxHeight:"calc(100% - 220px)", overflowY:"auto",
        }}>

          {/* AI-Assisted */}
          <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 4H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-4.5L1 5h4.5z" fill={PURPLE}/>
            </svg>
            <span style={{ color:"#374151", fontSize:"12.5px", fontWeight:600, fontFamily:FONT }}>AI-Assisted</span>
          </div>
          <h3 style={{ fontSize:"18px", fontWeight:700, color:DARK, marginBottom:"12px", fontFamily:FONT, letterSpacing:"-0.3px" }}>Campaign overview</h3>

          {/* Extracted data */}
          {rows.map((r,i)=>(
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<rows.length-1?"1px solid #F3F4F6":"none" }}>
              <span style={{ fontSize:"12px", color:"#6B7280" }}>{r.label}</span>
              <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <span style={{ fontSize:"12.5px", fontWeight:600, color:DARK }}>{r.value}</span>
                {r.found
                  ? <CheckCircle size={11} color="#16a34a"/>
                  : <span style={{ fontSize:"9px", padding:"1px 5px", borderRadius:"4px", background:"#fffbeb", color:"#d97706", border:"1px solid #fde68a" }}>default</span>}
              </div>
            </div>
          ))}

          {/* Feature importance mini */}
          <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"8px" }}>
              <BarChart3 size={12} color={PURPLE}/>
              <span style={{ fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.1em" }}>Нөлөөлсөн хүчин зүйлс</span>
            </div>
            {result.top_features.slice(0,3).map((f,i)=>{
              const pct=(f.importance/result.top_features[0].importance)*100;
              return (
                <div key={f.name} style={{ marginBottom:"6px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontSize:"11px", color:"#374151" }}>{LABELS[f.name]||f.name}</span>
                    <span style={{ fontSize:"11px", fontWeight:700, color:PURPLE }}>{f.importance}%</span>
                  </div>
                  <div style={{ height:"4px", borderRadius:"2px", background:"#F3F4F6" }}>
                    <div style={{ height:"100%", borderRadius:"2px", background:PURPLE, width:`${pct}%`, opacity:1-i*0.22, transition:"width 1s ease" }}/>
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
