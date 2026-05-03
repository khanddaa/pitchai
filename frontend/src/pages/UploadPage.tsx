import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Loader2, FileText, X, CheckCircle,
  Zap, BarChart3, ShieldCheck, TrendingUp,
  Clock, Globe, Users, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const DARK   = "#1B1240";
const PURPLE = "#5C2D91";
const FONT   = "'Plus Jakarta Sans', sans-serif";
const fmtMB  = (b: number) => (b / 1024 / 1024).toFixed(1);

const Sk = ({ w, h = 8, opacity = 0.12 }: { w: string; h?: number; opacity?: number }) => (
  <div className="shimmer" style={{ height: `${h}px`, borderRadius: "4px", width: w, background: `rgba(255,255,255,${opacity})` }} />
);

/* ── Category success rates ─────────────────────────────── */
const CATEGORIES = [
  { name: "Dance",        rate: 62, color: "#16a34a" },
  { name: "Theater",      rate: 64, color: "#16a34a" },
  { name: "Comics",       rate: 54, color: "#16a34a" },
  { name: "Music",        rate: 48, color: "#2563eb" },
  { name: "Art",          rate: 41, color: "#2563eb" },
  { name: "Photography",  rate: 39, color: "#2563eb" },
  { name: "Film & Video", rate: 37, color: "#d97706" },
  { name: "Games",        rate: 35, color: "#d97706" },
  { name: "Design",       rate: 35, color: "#d97706" },
  { name: "Publishing",   rate: 32, color: "#dc2626" },
  { name: "Food",         rate: 25, color: "#dc2626" },
  { name: "Technology",   rate: 20, color: "#dc2626" },
];

export default function UploadPage() {
  const navigate  = useNavigate();
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [drag,    setDrag]    = useState(false);
  const [done,    setDone]    = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);

  const setValidFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) { toast.error("Зөвхөн PDF файл"); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("50MB-аас их байна"); return; }
    if (f.size === 0) { toast.error("Файл хоосон байна"); return; }
    setFile(f); toast.success(`${f.name} сонгогдлоо`);
  };

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(e.type === "dragenter" || e.type === "dragover");
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    setValidFile(e.dataTransfer.files[0]);
  }, []);

  const handlePredict = async () => {
    if (!file) { inputRef.current?.click(); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/predict`, { method: "POST", body: form });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "API алдаа"); }
      const data = await res.json();
      localStorage.setItem("pitchai_result", JSON.stringify(data));
      try {
        const histItem = { id: Date.now(), name: data.extracted?.campaign_name || file.name, result: data.prediction, probability: data.probability, date: new Date().toLocaleDateString("mn-MN"), via_llm: data.via_llm };
        const prev = JSON.parse(localStorage.getItem("pitchai_history") || "[]");
        localStorage.setItem("pitchai_history", JSON.stringify([histItem, ...prev].slice(0, 20)));
      } catch {}
      setDone(true);
      setTimeout(() => navigate("/result"), 800);
    } catch (e: any) {
      toast.error(e.message || "Backend-тэй холбогдож чадсангүй");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: FONT }}
      onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={onDrag} onDrop={onDrop}>

      {/* ════════════════════════════════════════════════════
          SECTION 1 — HERO (full viewport height)
      ════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 144px)" }}>

        {/* LEFT */}
        <div style={{ width: "55%", padding: "72px 56px 72px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}
          className="animate-fade-in-up">

          <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500, marginBottom: "20px" }}>
            PitchAI IAM | Iris
          </p>

          <h1 style={{ fontSize: "clamp(38px, 4.2vw, 56px)", fontWeight: 800, lineHeight: 1.08, color: DARK, marginBottom: "28px", letterSpacing: "-1.8px", maxWidth: "520px" }}>
            Краудфандинг AI<br />таны итгэж болох
          </h1>

          <p style={{ fontSize: "18px", color: "#374151", lineHeight: 1.7, marginBottom: "16px", maxWidth: "460px", fontWeight: 400 }}>
            PitchAI Iris бол краудфандинг pitch deck-ийн PDF-г шинжлэж,
            амжилтын магадлалыг секундын дотор тооцоолдог AI систем юм.
          </p>
          <p style={{ fontSize: "18px", color: "#374151", lineHeight: 1.7, maxWidth: "460px", fontWeight: 400 }}>
            Iris нь ML платформын нэг хэсэг бөгөөд Монгол хэлний LLM
            дэмжлэгтэйгээр ажилладаг.
          </p>

          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "13px" }}>
            {[
              "Random Forest · Kickstarter n=331,675",
              "Монгол LLM шинжилгээ (Groq Llama 3.1)",
              "₮ → $ автомат хөрвүүлэлт · 25 feature",
            ].map(text => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: PURPLE, flexShrink: 0 }}/>
                <span style={{ fontSize: "15px", color: "#6B7280", fontWeight: 400 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — purple gradient */}
        <div style={{ width: "45%", background: "linear-gradient(155deg,#1e0757 0%,#3b0f8a 30%,#5b21b6 65%,#7c3aed 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position:"absolute", top:"-80px", right:"-80px", width:"320px", height:"320px", borderRadius:"50%", background:"rgba(124,58,237,0.20)", filter:"blur(80px)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:"160px", left:"-60px", width:"240px", height:"240px", borderRadius:"50%", background:"rgba(91,33,182,0.22)", filter:"blur(60px)", pointerEvents:"none" }}/>

          {/* Browser toolbar */}
          <div style={{ background:"rgba(0,0,0,0.32)", padding:"11px 18px", display:"flex", alignItems:"center", gap:"10px", position:"relative", zIndex:1, backdropFilter:"blur(4px)" }}>
            <div style={{ display:"flex", gap:"6px" }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <div key={c} style={{ width:"10px", height:"10px", borderRadius:"50%", background:c, opacity:0.7 }}/>
              ))}
            </div>
            <div style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:"5px", padding:"4px 12px", marginLeft:"8px" }}>
              <span style={{ color:"rgba(255,255,255,0.55)", fontSize:"11.5px", fontFamily: FONT }}>
                {file ? `pitchai.mn/analyze — "${file.name}"` : "pitchai.mn/analyze — Краудфандинг шинжилгээ"}
              </span>
            </div>
          </div>

          {/* Document preview */}
          <div style={{ padding:"22px 22px 170px 22px", position:"relative", zIndex:1 }}>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.10)", overflow:"hidden" }}>
              <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"6px", background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <FileText size={14} color="rgba(255,255,255,0.6)"/>
                  </div>
                  {file ? <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"12px", fontWeight:600, fontFamily: FONT }}>{file.name}</span>
                        : <Sk w="100px" h={8} opacity={0.2}/>}
                </div>
                {file && <button onClick={() => setFile(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:"2px" }}><X size={14}/></button>}
                {!file && <Sk w="50px" h={8} opacity={0.12}/>}
              </div>
              <div style={{ padding:"18px", display:"flex", flexDirection:"column", gap:"8px" }}>
                {file ? (
                  <>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <CheckCircle size={14} color="#4ade80"/>
                      <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"11.5px", fontFamily: FONT }}>PDF уншигдлаа · {fmtMB(file.size)} MB</span>
                    </div>
                    <div style={{ height:"1px", background:"rgba(255,255,255,0.08)", margin:"4px 0" }}/>
                    {[90,75,85,60].map((w,i) => <div key={i} style={{ height:"7px", borderRadius:"4px", background:"rgba(255,255,255,0.18)", width:`${w}%` }}/>)}
                  </>
                ) : (
                  <>
                    <Sk w="55%" h={10} opacity={0.18}/>
                    <div style={{ height:"1px", background:"rgba(255,255,255,0.07)", margin:"4px 0" }}/>
                    {[100,85,92,68,80,55].map((w,i) => <Sk key={i} w={`${w}%`} h={7} opacity={0.10}/>)}
                    <div style={{ height:"1px", background:"rgba(255,255,255,0.07)", margin:"4px 0" }}/>
                    {[70,88,50].map((w,i) => <Sk key={i} w={`${w}%`} h={7} opacity={0.08}/>)}
                    <div style={{ marginTop:"8px", display:"flex", gap:"16px" }}>
                      <div style={{ flex:1, height:"28px", borderRadius:"4px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}/>
                      <div style={{ flex:1, height:"28px", borderRadius:"4px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}/>
                    </div>
                  </>
                )}
              </div>
            </div>
            {drag && (
              <div style={{ position:"absolute", inset:"22px 22px 170px 22px", background:"rgba(124,58,237,0.35)", border:"2px dashed rgba(255,255,255,0.7)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", zIndex:5 }}>
                <p style={{ color:"#fff", fontWeight:700, fontSize:"15px", fontFamily: FONT }}>PDF файлыг энд тавина уу</p>
              </div>
            )}
          </div>

          {/* Floating AI card */}
          <div className="animate-slide-up" style={{ position:"absolute", bottom:"22px", left:"20px", right:"20px", background:"#fff", borderRadius:"14px", padding:"18px 20px 20px", boxShadow:"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)", zIndex:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 4H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-4.5L1 5h4.5z" fill={PURPLE}/></svg>
              <span style={{ color:"#374151", fontSize:"12.5px", fontWeight:600, fontFamily: FONT }}>AI-Assisted</span>
            </div>
            <h3 style={{ fontSize:"18px", fontWeight:700, color:DARK, marginBottom:"14px", lineHeight:1.2, fontFamily: FONT, letterSpacing:"-0.3px" }}>Campaign overview</h3>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <div onClick={() => inputRef.current?.click()}
                style={{ flex:1, border:`1.5px solid ${drag ? PURPLE : "#E5E7EB"}`, borderRadius:"8px", padding:"10px 14px", fontSize:"13.5px", color: file ? DARK : "#9CA3AF", display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", overflow:"hidden", transition:"border-color 0.15s", fontFamily: FONT }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = PURPLE}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"}>
                <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display:"none" }} onChange={e => setValidFile(e.target.files?.[0])}/>
                {file
                  ? <><FileText size={14} color={PURPLE} style={{ flexShrink:0 }}/><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span></>
                  : <span>PDF файл оруулах эсвэл чирч тавих...</span>}
              </div>
              <button onClick={handlePredict} disabled={loading || done}
                style={{ width:"44px", height:"44px", borderRadius:"8px", flexShrink:0, background: done ? "#16a34a" : file ? DARK : "#F3F4F6", border:"none", cursor:(loading||done)?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s, transform 0.1s", boxShadow: file && !loading ? "0 2px 8px rgba(27,18,64,0.35)" : "none" }}
                onMouseEnter={e => { if(file && !loading) (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}>
                {done ? <CheckCircle size={18} color="#fff"/> : loading ? <Loader2 size={17} color={file?"#fff":"#9CA3AF"} className="animate-spin"/> : <ArrowRight size={17} color={file?"#fff":"#9CA3AF"}/>}
              </button>
            </div>
            <div style={{ marginTop:"10px", minHeight:"16px" }}>
              {loading && <div style={{ display:"flex", alignItems:"center", gap:"6px" }}><div className="animate-pulse-dot" style={{ width:"6px", height:"6px", borderRadius:"50%", background:PURPLE }}/><span style={{ fontSize:"11.5px", color:"#9CA3AF", fontFamily: FONT }}>Монгол PDF шинжилж байна...</span></div>}
              {done && <span style={{ fontSize:"11.5px", color:"#16a34a", fontFamily: FONT }}>✓ Шинжилгээ дууслаа — үр дүн ачаалж байна</span>}
              {!loading && !done && file && <span style={{ fontSize:"11.5px", color:"#9CA3AF", fontFamily: FONT }}>→ товчийг дарж шинжилгээ эхлүүлнэ</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 2 — STATS BAR
      ════════════════════════════════════════════════════ */}
      <div style={{ background: "#F8F7FF", borderTop: "1px solid #EDE9FE", borderBottom: "1px solid #EDE9FE", padding: "36px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0" }}>
          {[
            { value: "331,675", label: "Kickstarter кампанит ажил", icon: Globe },
            { value: "73.8%",   label: "AUC нарийвчлал",            icon: BarChart3 },
            { value: "~3 сек",  label: "Шинжилгээний хурд",         icon: Clock },
            { value: "25",      label: "ML feature тоо",             icon: Zap },
          ].map(({ value, label, icon: Icon }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "0 40px", borderRight: i < arr.length - 1 ? "1px solid #DDD6FE" : "none" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(92,45,145,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={PURPLE}/>
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: 800, color: DARK, margin: 0, letterSpacing: "-0.8px", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0", fontWeight: 400 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 3 — FEATURES (DocuSign "Preconfigured applications" style)
      ════════════════════════════════════════════════════ */}
      <div style={{ padding: "88px 80px", background: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Яагаад PitchAI?</p>
          <h2 style={{ fontSize: "clamp(30px, 3vw, 42px)", fontWeight: 800, color: DARK, letterSpacing: "-1.2px", lineHeight: 1.1, marginBottom: "16px" }}>
            Бэлэн тохируулсан шинжилгээний<br/>платформ
          </h2>
          <p style={{ fontSize: "18px", color: "#6B7280", lineHeight: 1.65, maxWidth: "560px", margin: "0 auto", fontWeight: 400 }}>
            Танай краудфандинг кампанит ажлын хэрэгцээнд зориулан бүтээсэн
            AI шийдэл ба чадварыг илрүүлэхэд тусална.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
            {
              icon: Zap, title: "Монгол PDF шинжилгээ",
              desc: "Groq Llama 3.1 загвар ашиглан Монгол хэл дээрх pitch deck-ийн мэдээллийг автоматаар гаргаж авна. Кирилл, латин бичгийн дэмжлэгтэй.",
              tag: "LLM дэмжлэгтэй",
            },
            {
              icon: BarChart3, title: "Random Forest ML загвар",
              desc: "Kickstarter-ийн 2009–2018 оны 331,675 кампанит ажлын датасет дээр сургасан. 25 feature ашигладаг бөгөөд AUC 73.8% нарийвчлалтай.",
              tag: "331K датасет",
            },
            {
              icon: ShieldCheck, title: "Нарийвчилсан мэдээлэл",
              desc: "Шинжилгээний дараа категориоор амжилтын хувь, зорилтот дүн, хугацааны оновчлол зэрэг дэлгэрэнгүй зөвлөмж авна.",
              tag: "AI зөвлөмж",
            },
            {
              icon: Globe, title: "₮ → $ Автомат хөрвүүлэлт",
              desc: "Монгол төгрөгөөр бичигдсэн зорилтот дүнг автоматаар АНУ долларт хөрвүүлнэ. 1$ = 3,450₮ ханшаар тооцоолно.",
              tag: "Монгол контекст",
            },
            {
              icon: TrendingUp, title: "Категориоор таамаглал",
              desc: "Dance, Theater, Comics зэрэг амжилтын хувь өндөр категориас Technology, Fashion зэрэг эрсдэлтэй категори хүртэл дэлгэрэнгүй харьцуулна.",
              tag: "15 категори",
            },
            {
              icon: Users, title: "Тодорхой зөвлөмж",
              desc: "Зорилтот дүн хэт өндөр бол бууруул, хугацаа хэт урт бол богиносгол гэх мэт тодорхой, хэрэгжих боломжтой зөвлөмжийг авна.",
              tag: "Хувийн зөвлөгөө",
            },
          ].map(({ icon: Icon, title, desc, tag }) => (
            <div key={title}
              style={{ padding: "28px", borderRadius: "14px", border: "1px solid #E5E7EB", background: "#fff", transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 8px 32px rgba(92,45,145,0.12)"; el.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(92,45,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Icon size={20} color={PURPLE}/>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: PURPLE, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(92,45,145,0.08)", padding: "2px 8px", borderRadius: "4px" }}>{tag}</span>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: DARK, margin: "10px 0 8px", letterSpacing: "-0.3px" }}>{title}</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <div style={{ background: "#F8F7FF", padding: "88px 80px", borderTop: "1px solid #EDE9FE" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Хэрхэн ажилладаг вэ</p>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, color: DARK, letterSpacing: "-1px", lineHeight: 1.1 }}>
            Гурван алхмаар шинжилгээ хийнэ
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", position: "relative" }}>
          {/* Connector lines */}
          <div style={{ position: "absolute", top: "36px", left: "calc(16.67% + 20px)", right: "calc(16.67% + 20px)", height: "2px", background: "linear-gradient(90deg, #DDD6FE, #DDD6FE)", zIndex: 0 }}/>

          {[
            { step: "01", title: "PDF оруулна", desc: "Таны краудфандинг pitch deck PDF файлыг drag & drop эсвэл товшиж оруулна уу. 50MB хүртэл дэмждэг.", color: "#EDE9FE" },
            { step: "02", title: "AI шинжилнэ",  desc: "Groq Llama 3.1 LLM PDF-ийн текстийг уншиж, зорилтот дүн, хугацаа, ангилал зэрэг мэдээллийг гаргаж авна.", color: "#DDD6FE" },
            { step: "03", title: "Үр дүн авна",  desc: "Random Forest загвар амжилтын магадлал, категориоор харьцуулалт, хувийн зөвлөмжийг хэдхэн секундэд гаргана.", color: "#C4B5FD" },
          ].map(({ step, title, desc, color }) => (
            <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 40px", position: "relative", zIndex: 1 }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: color, border: "4px solid #fff", boxShadow: "0 4px 16px rgba(92,45,145,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: PURPLE }}>{step}</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: DARK, marginBottom: "10px", letterSpacing: "-0.3px" }}>{title}</h3>
              <p style={{ fontSize: "14.5px", color: "#6B7280", lineHeight: 1.7, fontWeight: 400 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 5 — CATEGORY SUCCESS RATES
      ════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", padding: "88px 80px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          {/* Left text */}
          <div>
            <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Kickstarter өгөгдөл</p>
            <h2 style={{ fontSize: "clamp(26px, 2.8vw, 38px)", fontWeight: 800, color: DARK, letterSpacing: "-1px", lineHeight: 1.15, marginBottom: "20px" }}>
              Категориоор<br/>амжилтын хувь
            </h2>
            <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.7, marginBottom: "24px", fontWeight: 400 }}>
              331,675 Kickstarter кампанит ажлын датасетаас гаргасан
              бодит статистик. Dance, Theater хамгийн өндөр,
              Technology, Fashion хамгийн бага амжилтын хуви харуулж байна.
            </p>
            <button onClick={() => inputRef.current?.click()}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: DARK, color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(27,18,64,0.3)", letterSpacing: "0.02em" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
              Өөрийн PDF шинжлэх <ChevronRight size={16}/>
            </button>
          </div>

          {/* Right chart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {CATEGORIES.map(({ name, rate, color }) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500, width: "100px", flexShrink: 0, textAlign: "right" }}>{name}</span>
                <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "4px", background: color, width: `${rate}%`, transition: "width 1s ease" }}/>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color, width: "36px", flexShrink: 0 }}>{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 6 — CTA (bottom)
      ════════════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(135deg,#1e0757 0%,#3b0f8a 40%,#5b21b6 100%)", padding: "88px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position:"absolute", top:"-60px", left:"50%", transform:"translateX(-50%)", width:"500px", height:"500px", borderRadius:"50%", background:"rgba(124,58,237,0.15)", filter:"blur(80px)", pointerEvents:"none" }}/>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Одоо эхлүүлэх</p>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 800, color: "#fff", letterSpacing: "-1.2px", lineHeight: 1.1, marginBottom: "20px" }}>
            Таны краудфандинг төслийг<br/>шинжлэх цаг болжээ
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, maxWidth: "480px", margin: "0 auto 40px", fontWeight: 400 }}>
            PDF pitch deck оруулж, секундын дотор амжилтын
            магадлал болон хувийн зөвлөмжийг аваарай.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
            <button onClick={() => inputRef.current?.click()}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", color: DARK, border: "none", borderRadius: "8px", padding: "14px 28px", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", letterSpacing: "0.01em" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
              <FileText size={17} color={PURPLE}/> PDF оруулах
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "14px 28px", fontSize: "15px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"}>
              Дэлгэрэнгүй мэдэх <ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <div style={{ background: DARK, padding: "32px 80px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="5" fill="rgba(255,255,255,0.12)"/>
            <path d="M8 20V8h7a5 5 0 0 1 0 10H8z" fill="white" opacity="0.9"/>
            <circle cx="20" cy="18" r="3" fill="#a78bfa"/>
          </svg>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.4px" }}>pitchai</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginLeft: "8px" }}>© 2026</span>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Kickstarter dataset · n = 331,675 · Random Forest + XGBoost + LightGBM
        </p>
      </div>

    </div>
  );
}
