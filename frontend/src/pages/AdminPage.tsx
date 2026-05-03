import { useEffect, useState } from "react";
import { FileText, AlertTriangle, Activity, Database, Save, RefreshCw, CheckCircle, XCircle, Cpu, BarChart3, Clock, Upload } from "lucide-react";
import { toast } from "sonner";

const DARK   = "#1A1143";
const PURPLE = "#6B21A8";

interface BackendStatus {
  status: string;
  llm: string;
  model: string;
}

interface HistoryItem {
  id: number;
  name: string;
  result: "successful" | "failed";
  probability: number;
  date: string;
  via_llm: boolean;
}

/* ── helpers ───────────────────────────────────────────────── */
const Pill = ({ label, color, bg, border }: { label:string; color:string; bg:string; border:string }) => (
  <span style={{ fontSize:"11px", fontWeight:600, padding:"2px 10px", borderRadius:"20px", color, background:bg, border:`1px solid ${border}`, whiteSpace:"nowrap" }}>
    {label}
  </span>
);

const Card = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", ...style }}>
    {children}
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title:string; icon:any }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"16px", paddingBottom:"14px", borderBottom:"1px solid #F3F4F6" }}>
    <div style={{ width:"28px", height:"28px", borderRadius:"6px", background:"rgba(107,33,168,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={14} color={PURPLE}/>
    </div>
    <span style={{ fontSize:"13px", fontWeight:700, color:DARK }}>{title}</span>
  </div>
);

/* ── main ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [checking,      setChecking]      = useState(false);
  const [history,       setHistory]       = useState<HistoryItem[]>([]);
  const [maxSize,       setMaxSize]       = useState("50");
  const [ocrLang,       setOcrLang]       = useState("mon+eng");

  /* Load history from localStorage */
  useEffect(() => {
    const raw = localStorage.getItem("pitchai_history");
    if (raw) {
      try { setHistory(JSON.parse(raw)); } catch {}
    }

    /* Save current result to history if exists */
    const result = localStorage.getItem("pitchai_result");
    if (result) {
      try {
        const r = JSON.parse(result);
        const item: HistoryItem = {
          id: Date.now(),
          name: r.extracted?.campaign_name || "Untitled",
          result: r.prediction,
          probability: r.probability,
          date: new Date().toLocaleDateString("mn-MN"),
          via_llm: r.via_llm,
        };
        setHistory(prev => {
          const exists = prev.some(p => p.name === item.name && p.probability === item.probability);
          if (exists) return prev;
          const updated = [item, ...prev].slice(0, 20);
          localStorage.setItem("pitchai_history", JSON.stringify(updated));
          return updated;
        });
      } catch {}
    }
  }, []);

  const checkBackend = async () => {
    setChecking(true);
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/`);
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
        toast.success("Backend холбогдлоо");
      } else {
        setBackendStatus(null);
        toast.error("Backend хүрэхгүй байна");
      }
    } catch {
      setBackendStatus(null);
      toast.error("Backend ажиллахгүй байна");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { checkBackend(); }, []);

  const clearHistory = () => {
    localStorage.removeItem("pitchai_history");
    setHistory([]);
    toast.success("Түүх арилгагдлаа");
  };

  /* Stats */
  const totalAnalyzed  = history.length;
  const successCount   = history.filter(h => h.result === "successful").length;
  const failCount      = history.filter(h => h.result === "failed").length;
  const llmCount       = history.filter(h => h.via_llm).length;
  const avgProb        = history.length ? (history.reduce((s, h) => s + h.probability, 0) / history.length).toFixed(1) : "—";

  const stats = [
    { label:"Нийт шинжилсэн",    value: totalAnalyzed || "—", Icon: Upload,    color: PURPLE,     bg:"rgba(107,33,168,0.08)" },
    { label:"Амжилттай дүн",      value: successCount  || "—", Icon: CheckCircle, color:"#16a34a", bg:"#f0fdf4" },
    { label:"Амжилтгүй дүн",      value: failCount     || "—", Icon: XCircle,  color:"#dc2626",   bg:"#fef2f2" },
    { label:"Дундаж магадлал",    value: avgProb !== "—" ? `${avgProb}%` : "—", Icon: BarChart3, color:"#d97706", bg:"#fffbeb" },
  ];

  const inputStyle: React.CSSProperties = {
    width:"100%", height:"38px", border:"1.5px solid #E5E7EB", borderRadius:"7px",
    padding:"0 12px", fontSize:"13.5px", color:DARK, outline:"none",
    boxShadow:"0 1px 2px rgba(0,0,0,0.04)",
  };

  return (
    <div style={{ padding:"36px 48px 60px", display:"flex", flexDirection:"column", gap:"20px" }} className="animate-fade-in-up">

      {/* Page header */}
      <div style={{ paddingBottom:"20px", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <p style={{ color:PURPLE, fontSize:"12px", fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"4px" }}>PitchAI Iris</p>
          <h1 style={{ fontSize:"26px", fontWeight:800, color:DARK, letterSpacing:"-0.5px", margin:0 }}>Админ хяналтын самбар</h1>
          <p style={{ fontSize:"14px", color:"#6B7280", marginTop:"4px" }}>Системийн байдал, шинжилгээний түүх</p>
        </div>
        <button onClick={checkBackend} disabled={checking}
          style={{
            display:"flex", alignItems:"center", gap:"6px",
            background:DARK, color:"#fff", border:"none", borderRadius:"8px",
            padding:"9px 18px", fontSize:"13px", fontWeight:600, cursor:"pointer",
            opacity: checking ? 0.7 : 1,
          }}>
          <RefreshCw size={13} className={checking ? "animate-spin" : ""}/>
          Шалгах
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px" }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <Card key={label} style={{ padding:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:"12px", color:"#6B7280", margin:"0 0 6px" }}>{label}</p>
                <p style={{ fontSize:"26px", fontWeight:800, color:DARK, margin:0, lineHeight:1 }}>{value}</p>
              </div>
              <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={18} color={color}/>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Backend status + LLM */}
      <Card style={{ padding:"20px" }}>
        <SectionHeader title="Backend & LLM байдал" icon={Cpu}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>

          {/* Backend */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", borderRadius:"8px", background: backendStatus ? "#f0fdf4" : "#fef2f2", border:`1px solid ${backendStatus ? "#bbf7d0" : "#fecaca"}` }}>
            {backendStatus
              ? <CheckCircle size={18} color="#16a34a"/>
              : <XCircle size={18} color="#dc2626"/>}
            <div>
              <p style={{ fontSize:"13px", fontWeight:600, color: backendStatus ? "#15803d" : "#dc2626", margin:0 }}>
                {backendStatus ? "Backend ажиллаж байна" : "Backend холбогдохгүй байна"}
              </p>
              <p style={{ fontSize:"11.5px", color:"#6B7280", margin:"2px 0 0" }}>localhost:8000</p>
            </div>
          </div>

          {/* LLM */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", borderRadius:"8px", background: backendStatus?.llm?.includes("✅") ? "#f0fdf4" : "#fffbeb", border:`1px solid ${backendStatus?.llm?.includes("✅") ? "#bbf7d0" : "#fde68a"}` }}>
            {backendStatus?.llm?.includes("✅")
              ? <CheckCircle size={18} color="#16a34a"/>
              : <AlertTriangle size={18} color="#d97706"/>}
            <div>
              <p style={{ fontSize:"13px", fontWeight:600, color: backendStatus?.llm?.includes("✅") ? "#15803d" : "#92400e", margin:0 }}>
                {backendStatus?.llm?.includes("✅") ? "Groq LLM идэвхтэй" : "LLM холбогдоогүй (Regex горим)"}
              </p>
              <p style={{ fontSize:"11.5px", color:"#6B7280", margin:"2px 0 0" }}>Llama 3.1 8B Instant</p>
            </div>
          </div>

          {/* ML Model */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", borderRadius:"8px", background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
            <CheckCircle size={18} color="#16a34a"/>
            <div>
              <p style={{ fontSize:"13px", fontWeight:600, color:"#15803d", margin:0 }}>Random Forest загвар ачаалагдсан</p>
              <p style={{ fontSize:"11.5px", color:"#6B7280", margin:"2px 0 0" }}>model_tfidf.pkl · 331,675 датасет</p>
            </div>
          </div>

          {/* LLM usage */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", borderRadius:"8px", background:"rgba(107,33,168,0.06)", border:"1px solid rgba(107,33,168,0.15)" }}>
            <Activity size={18} color={PURPLE}/>
            <div>
              <p style={{ fontSize:"13px", fontWeight:600, color:DARK, margin:0 }}>LLM ашиглалт</p>
              <p style={{ fontSize:"11.5px", color:"#6B7280", margin:"2px 0 0" }}>
                {llmCount} / {totalAnalyzed} шинжилгээнд LLM хэрэглэсэн
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis history */}
      <Card style={{ padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", paddingBottom:"14px", borderBottom:"1px solid #F3F4F6" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"6px", background:"rgba(107,33,168,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Clock size={14} color={PURPLE}/>
            </div>
            <span style={{ fontSize:"13px", fontWeight:700, color:DARK }}>Шинжилгээний түүх</span>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory}
              style={{ fontSize:"12px", color:"#dc2626", background:"none", border:"1px solid #fecaca", borderRadius:"6px", padding:"4px 12px", cursor:"pointer" }}>
              Бүгдийг арилгах
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"#F9FAFB", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
              <FileText size={22} color="#9CA3AF"/>
            </div>
            <p style={{ fontSize:"14px", color:"#6B7280", margin:0 }}>Одоохондоо шинжилгээний түүх байхгүй байна</p>
            <p style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"4px" }}>PDF оруулж шинжилгээ хийвэл энд харагдана</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                  {["Кампанит ажил","Огноо","Магадлал","Дүн","Шинжилгээ"].map(h => (
                    <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:"11.5px", fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < history.length-1 ? "1px solid #F9FAFB" : "none" }}>
                    <td style={{ padding:"10px 12px", fontSize:"13px", fontWeight:500, color:DARK, maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {item.name}
                    </td>
                    <td style={{ padding:"10px 12px", fontSize:"12.5px", color:"#6B7280", whiteSpace:"nowrap" }}>{item.date}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ fontSize:"14px", fontWeight:700, color: item.result === "successful" ? "#16a34a" : "#dc2626" }}>
                        {item.probability}%
                      </span>
                    </td>
                    <td style={{ padding:"10px 12px" }}>
                      {item.result === "successful"
                        ? <Pill label="Амжилттай" color="#16a34a" bg="#f0fdf4" border="#bbf7d0"/>
                        : <Pill label="Эрсдэлтэй" color="#dc2626" bg="#fef2f2" border="#fecaca"/>}
                    </td>
                    <td style={{ padding:"10px 12px" }}>
                      {item.via_llm
                        ? <Pill label="🤖 LLM" color={PURPLE} bg="rgba(107,33,168,0.08)" border="rgba(107,33,168,0.2)"/>
                        : <Pill label="📐 Regex" color="#6B7280" bg="#F3F4F6" border="#E5E7EB"/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Settings */}
      <Card style={{ padding:"20px" }}>
        <SectionHeader title="Системийн тохиргоо" icon={Database}/>
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            <div>
              <label style={{ fontSize:"12.5px", fontWeight:600, color:DARK, display:"block", marginBottom:"6px" }}>
                Хамгийн их файлын хэмжээ (MB)
              </label>
              <input type="number" value={maxSize} onChange={e => setMaxSize(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={{ fontSize:"12.5px", fontWeight:600, color:DARK, display:"block", marginBottom:"6px" }}>OCR хэл</label>
              <input value={ocrLang} onChange={e => setOcrLang(e.target.value)} style={inputStyle}/>
            </div>
          </div>

          {/* Toggle rows */}
          <div style={{ borderRadius:"8px", border:"1px solid #E5E7EB", overflow:"hidden" }}>
            {[
              { title:"Автомат OCR горим",       desc:"Текст олдохгүй бол OCR ашиглана",         on:true  },
              { title:"LLM шинжилгээ",            desc:"Groq Llama 3.1 ашиглан дата гаргах",      on:true  },
              { title:"Алдааны мэдэгдэл",         desc:"Имэйлээр алдааны мэдэгдэл авна",          on:true  },
              { title:"Автомат архивлал",          desc:"30 хоногийн дараа автоматаар архивлана",  on:false },
            ].map((row, i, arr) => (
              <div key={row.title} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom: i < arr.length-1 ? "1px solid #F3F4F6" : "none" }}>
                <div>
                  <p style={{ fontSize:"13px", fontWeight:600, color:DARK, margin:0 }}>{row.title}</p>
                  <p style={{ fontSize:"11.5px", color:"#6B7280", marginTop:"2px" }}>{row.desc}</p>
                </div>
                <div
                  style={{
                    width:"40px", height:"22px", borderRadius:"11px", position:"relative", cursor:"pointer",
                    background: row.on ? PURPLE : "#D1D5DB", transition:"background 0.2s",
                  }}>
                  <div style={{ position:"absolute", top:"2px", left: row.on ? "20px" : "2px", width:"18px", height:"18px", borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => toast.success("Тохиргоо хадгалагдлаа")}
              style={{
                display:"flex", alignItems:"center", gap:"7px",
                background:DARK, color:"#fff", border:"none", borderRadius:"8px",
                padding:"10px 20px", fontSize:"13px", fontWeight:600, cursor:"pointer",
                boxShadow:"0 2px 8px rgba(26,17,67,0.3)",
              }}>
              <Save size={14}/> Хадгалах
            </button>
          </div>
        </div>
      </Card>

    </div>
  );
}
