import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, Zap, BarChart3, ShieldCheck, Globe, FileText, Clock } from "lucide-react";

const DARK   = "#1B1240";
const PURPLE = "#5C2D91";
const FONT   = "'Plus Jakarta Sans', sans-serif";

const FREE_FEATURES = [
  "PDF танилцуулга оруулах (50MB хүртэл)",
  "Монгол болон англи хэл дэмжинэ",
  "Амжилтын магадлал тооцоолох",
  "AI зөвлөмж авах",
  "Ангиллын харьцуулалт",
  "Шинжилгээний түүх хадгалах",
];

const PRO_FEATURES = [
  "Бүх үнэгүй боломжууд",
  "What-if дүн шинжилгээ",
  "SHAP тайлбарлалт (хүчин зүйл бүрийн нөлөө)",
  "Batch боловсруулалт (олон PDF)",
  "API хандалт",
  "Тэргүүлэх дэмжлэг",
];

const FAQS = [
  { q: "Яагаад үнэгүй байдаг вэ?", a: "PitchAI Iris нь дипломын ажлын хүрээнд боловсруулагдсан тул одоогоор бүх функц үнэгүй байна." },
  { q: "Миний PDF-г хадгалдаг уу?", a: "Үгүй. Таны оруулсан файлыг зөвхөн шинжилгээний хугацаанд ашиглаж, дараа нь устгадаг." },
  { q: "Монгол PDF дэмждэг үү?", a: "Тийм. Groq Llama 3.1 LLM ашиглан Монгол хэлний контентийг автоматаар боловсруулна." },
  { q: "Хэдэн PDF оруулж болох вэ?", a: "Одоогоор хязгааргүй. Гэвч минутад 5 хүсэлтийн хязгаарлалт байна." },
];

export default function PricingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: FONT, background: "#fff" }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{ padding: "88px 80px 72px", textAlign: "center", borderBottom: "1px solid #E5E7EB" }}>
        <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Үнэ</p>
        <h1 style={{ fontSize: "clamp(32px,4vw,50px)", fontWeight: 900, color: DARK, letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "18px" }}>
          Энгийн, ил тод үнийн бодлого
        </h1>
        <p style={{ fontSize: "18px", color: "#6B7280", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto", fontWeight: 400 }}>
          Дипломын ажлын хүрээнд PitchAI Iris-ийн бүх боломж
          одоогоор үнэгүй байна.
        </p>
      </div>

      {/* ── PLANS ────────────────────────────────────────── */}
      <div style={{ padding: "72px 80px", display: "flex", gap: "28px", justifyContent: "center", alignItems: "flex-start" }}>

        {/* FREE */}
        <div style={{ width: "360px", border: "2px solid #DDD6FE", borderRadius: "16px", padding: "36px 32px", background: "#fff", position: "relative" }}>
          <div style={{ display: "inline-block", background: "rgba(92,45,145,0.08)", color: PURPLE, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: "4px", marginBottom: "20px" }}>
            ОДОО БОЛОМЖТОЙ
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: DARK, letterSpacing: "-0.5px", marginBottom: "4px" }}>Үнэгүй</h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "48px", fontWeight: 900, color: DARK, letterSpacing: "-2px" }}>₮0</span>
            <span style={{ fontSize: "15px", color: "#9CA3AF" }}>/сар</span>
          </div>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px", lineHeight: 1.6 }}>
            Бүх үндсэн боломжуудад хандах
          </p>

          <button onClick={() => navigate("/")}
            style={{ width: "100%", background: PURPLE, color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "28px", boxShadow: "0 4px 14px rgba(92,45,145,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Одоо эхлэх <ArrowRight size={16} />
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: "14px", color: "#374151" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRO */}
        <div style={{ width: "360px", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "36px 32px", background: "#FAFAFA", position: "relative", opacity: 0.75 }}>
          <div style={{ display: "inline-block", background: "#F3F4F6", color: "#9CA3AF", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: "4px", marginBottom: "20px" }}>
            ТУН УДАХГҮЙ
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: DARK, letterSpacing: "-0.5px", marginBottom: "4px" }}>Pro</h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "48px", fontWeight: 900, color: "#9CA3AF", letterSpacing: "-2px" }}>—</span>
          </div>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "28px", lineHeight: 1.6 }}>
            Дэвшилтэт шинжилгээ ба API хандалт
          </p>

          <button disabled
            style={{ width: "100%", background: "#E5E7EB", color: "#9CA3AF", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: 700, cursor: "not-allowed", marginBottom: "28px" }}>
            Удахгүй нээлттэй болно
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <CheckCircle size={16} color="#D1D5DB" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: "14px", color: "#9CA3AF" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INCLUDED ─────────────────────────────────────── */}
      <div style={{ padding: "72px 80px", background: "#F8F7FF", borderTop: "1px solid #EDE9FE", borderBottom: "1px solid #EDE9FE" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Бүгд орно</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: DARK, letterSpacing: "-1px" }}>
            Үнэгүй тарифт юу багтдаг вэ
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", maxWidth: "900px", margin: "0 auto" }}>
          {[
            { icon: FileText, title: "PDF шинжилгээ",      desc: "Монгол болон англи хэл дэмжсэн PDF боловсруулалт" },
            { icon: Zap,      title: "Хурдан үр дүн",      desc: "Секундын дотор амжилтын магадлал гарна" },
            { icon: BarChart3,title: "Нарийвчилсан тайлан", desc: "Хүчин зүйл бүрийн нөлөөг графикаар харуулна" },
            { icon: Globe,    title: "Монгол LLM",          desc: "Groq Llama 3.1 ашиглан контент олборлоно" },
            { icon: ShieldCheck, title: "Аюулгүй байдал",  desc: "Файлыг шинжилгээний дараа устгана" },
            { icon: Clock,    title: "Шинжилгээний түүх",  desc: "Өмнөх үр дүнгүүдийг хадгалж харна" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ padding: "24px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(92,45,145,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(92,45,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <Icon size={18} color={PURPLE} />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: DARK, marginBottom: "6px" }}>{title}</h3>
              <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <div style={{ padding: "72px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Түгээмэл асуулт</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: DARK, letterSpacing: "-1px" }}>Хариулт</h2>
        </div>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {FAQS.map(({ q, a }) => (
            <div key={q} style={{ padding: "24px", border: "1px solid #E5E7EB", borderRadius: "12px", background: "#FAFAFA" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: DARK, marginBottom: "8px" }}>{q}</p>
              <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1e0757 0%,#3b0f8a 40%,#5b21b6 100%)", padding: "72px 80px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: "16px" }}>
          Одоо туршиж үзэх үү?
        </h2>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.65)", marginBottom: "32px" }}>
          Бүртгэл шаардлагагүй. PDF оруулаад л болно.
        </p>
        <button onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", color: DARK, border: "none", borderRadius: "8px", padding: "14px 32px", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
          Үнэгүй эхлэх <ArrowRight size={16} />
        </button>
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
