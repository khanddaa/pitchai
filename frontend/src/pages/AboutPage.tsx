import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Zap, ShieldCheck, Globe, FileText } from "lucide-react";

const DARK   = "#1B1240";
const PURPLE = "#5C2D91";
const FONT   = "'Plus Jakarta Sans', sans-serif";

const STACK = [
  { icon: BarChart3, label: "Random Forest",  desc: "Үндсэн загвар" },
  { icon: Zap,       label: "XGBoost",        desc: "Нэгдсэн загвар" },
  { icon: Zap,       label: "LightGBM",       desc: "Нэгдсэн загвар" },
  { icon: Globe,     label: "Groq Llama 3.1", desc: "Текст олборлол" },
  { icon: FileText,  label: "PyMuPDF",        desc: "PDF уншилт" },
  { icon: ShieldCheck, label: "FastAPI",      desc: "Backend API" },
];

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: FONT, background: "#fff" }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1e0757 0%,#3b0f8a 50%,#5b21b6 100%)", padding: "100px 80px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(124,58,237,0.18)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "680px" }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            Тухай
          </p>
          <h1 style={{ fontSize: "clamp(34px,4vw,52px)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "24px" }}>
            Монголын краудфандингийн<br />шинжилгээний AI систем
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, maxWidth: "540px", marginBottom: "36px", fontWeight: 400 }}>
            PitchAI Iris нь Монгол хэлний дэмжлэгтэй краудфандинг
            танилцуулгын PDF шинжилж, амжилтын магадлалыг ML загварын
            тусламжтайгаар тооцоолдог дипломын ажлын систем юм.
          </p>
          <button onClick={() => navigate("/")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", color: DARK, border: "none", borderRadius: "8px", padding: "13px 28px", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
            Шинжилгээ эхлүүлэх <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── MISSION ──────────────────────────────────────── */}
      <div style={{ padding: "88px 80px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center", maxWidth: "1100px", margin: "0 auto" }}>
          <div>
            <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Зорилго</p>
            <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: DARK, letterSpacing: "-1px", lineHeight: 1.15, marginBottom: "20px" }}>
              Краудфандингийн<br />амжилтыг урьдчилан мэдэх
            </h2>
            <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.75, marginBottom: "16px" }}>
              Монголд краудфандинг платформ дөнгөж хөгжиж байгаа тул
              бизнесийн санаачилагчид амжилтынхаа боломжийг мэдэхэд хэцүү байдаг.
            </p>
            <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.75 }}>
              PitchAI Iris нь Kickstarter-ийн 331,675 кампанит ажлын
              бодит өгөгдөлд тулгуурлан Монгол хэлний танилцуулгыг
              шинжилж, тодорхой зөвлөмж өгдөг.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.75 }}>
              Монгол хэлний дэмжлэгтэй PDF танилцуулгыг хүлээн авч,
              зорилтот дүн, хугацаа, ангилал зэрэг 25 гаруй хүчин зүйлийг
              автоматаар гаргаж шинжилдэг.
            </p>
            <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.75 }}>
              Шинжилгээний дүнд амжилтын магадлал, ангиллын харьцуулалт,
              хэрэгжүүлэх боломжтой зөвлөмжийг нэн даруй өгдөг.
            </p>
          </div>
        </div>
      </div>

      {/* ── TECH STACK ───────────────────────────────────── */}
      <div style={{ padding: "88px 80px", background: "#F8F7FF", borderBottom: "1px solid #EDE9FE" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Технологи</p>
          <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: DARK, letterSpacing: "-1px" }}>
            Ашигласан хэрэгслүүд
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", maxWidth: "900px", margin: "0 auto" }}>
          {STACK.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px 24px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(92,45,145,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "#DDD6FE"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(92,45,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color={PURPLE} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: DARK, margin: 0 }}>{label}</p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DATASET ──────────────────────────────────────── */}
      <div style={{ padding: "88px 80px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Датасет</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: DARK, letterSpacing: "-1px", marginBottom: "20px" }}>
            Kickstarter 2009–2018
          </h2>
          <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.75, marginBottom: "16px" }}>
            Загварыг Kickstarter платформын 2009–2018 оны хооронд явагдсан
            331,675 кампанит ажлын нийтийн датасет дээр сургасан.
          </p>
          <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.75 }}>
            Зорилтот дүн, хугацаа, ангилал, улс, нэрийн шинж чанар зэрэг
            25 гаруй хүчин зүйлийг ашиглан амжилт/амжилтгүйг таамаглана.
          </p>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
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
        <div style={{ display: "flex", gap: "20px" }}>
          {["Нууцлалын бодлого", "Үйлчилгээний нөхцөл", "Холбоо барих"].map((label, i, arr) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <a href="#" style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                {label}
              </a>
              {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>·</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
