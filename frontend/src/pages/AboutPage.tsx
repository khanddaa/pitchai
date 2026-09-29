import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Upload, ScanText, BrainCircuit, BarChart3, Lightbulb, X } from "lucide-react";

const DARK   = "#1B1240";
const PURPLE = "#5C2D91";
const FONT   = "'Plus Jakarta Sans', sans-serif";

const STEPS = [
  {
    icon: Upload,
    num: "01",
    title: "PDF оруулах",
    desc: "Монгол эсвэл Англи хэлний краудфандинг танилцуулгын PDF файлаа оруулна.",
  },
  {
    icon: ScanText,
    num: "02",
    title: "Текст олборлох",
    desc: "Систем PDF-ийн бичвэрийг автоматаар уншиж, Монгол болон Англи хэлийг хоёуланг нь дэмждэг.",
  },
  {
    icon: BrainCircuit,
    num: "03",
    title: "AI шинжилгээ",
    desc: "Хиймэл оюун ухаан танилцуулгаас зорилтот дүн, хугацаа, ангилал зэрэг гол мэдээллийг автоматаар гаргаж авна.",
  },
  {
    icon: BarChart3,
    num: "04",
    title: "ML магадлал тооцоолох",
    desc: "331,675 Kickstarter кампанит ажлын өгөгдөлд сургасан машин сургалтын загвар амжилтын магадлалыг тооцоолно.",
  },
  {
    icon: Lightbulb,
    num: "05",
    title: "Үр дүн ба зөвлөмж",
    desc: "Амжилтын магадлал болон кампанит ажлаа сайжруулах тодорхой зөвлөмжийг нэн даруй харуулна.",
  },
];

const STATS = [
  { value: "331,675", label: "Сургалтын кампани" },
  { value: "76.4%",   label: "Загварын нарийвчлал (AUC)" },
  { value: "16",      label: "Шинжилгээний хүчин зүйл" },
  { value: "2 хэл",   label: "Монгол + Англи дэмжлэг" },
];

const MODALS: Record<string, { title: string; content: string }> = {
  "Нууцлалын бодлого": {
    title: "Нууцлалын бодлого",
    content: `PitchAI Iris нь таны оруулсан PDF файлыг зөвхөн шинжилгээний зорилгоор ашиглана. Файл серверт хадгалагдахгүй бөгөөд шинжилгээ дууссаны дараа автоматаар устгагдана.\n\nБид таны хувийн мэдээллийг гуравдагч талд дамжуулдаггүй. Систем нь зөвхөн PDF-ийн текстийн агуулгыг боловсруулна.\n\nАсуулт байвал холбоо барина уу.`,
  },
  "Үйлчилгээний нөхцөл": {
    title: "Үйлчилгээний нөхцөл",
    content: `PitchAI Iris нь дипломын судалгааны зорилгоор бүтээгдсэн систем бөгөөд зөвхөн лавлагаа болгон ашиглах зориулалттай.\n\nСистемийн гаргасан амжилтын магадлал нь мэргэжлийн санхүүгийн зөвлөгөө биш бөгөөд үүнийг хөрөнгө оруулалтын шийдвэр гаргахад ашиглах нь зохимжгүй.\n\nСистемийг ашиглан гарсан аливаа үр дагаварт PitchAI хариуцлага хүлээхгүй.`,
  },
  "Холбоо барих": {
    title: "Холбоо барих",
    content: `Судалгааны ажил болон системтэй холбоотой асуулт, санал хүсэлтийг доорх хаягаар илгээнэ үү.\n\nИмэйл: badamkhandda@gmail.com\n\nБид ажлын өдрүүдэд 24 цагийн дотор хариу өгөхийг хичээнэ.`,
  },
};

export default function AboutPage() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<string | null>(null);
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
            Краудфандингийн амжилтыг<br />урьдчилан таамаглах AI
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, maxWidth: "540px", marginBottom: "36px", fontWeight: 400 }}>
            PitchAI Iris нь Монгол болон Англи хэлний PDF танилцуулгыг
            шинжлэн, машин сургалтын загварын тусламжтайгаар
            краудфандинг кампанит ажлын амжилтын магадлалыг тооцоолдог систем.
          </p>
          <button onClick={() => navigate("/")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", color: DARK, border: "none", borderRadius: "8px", padding: "13px 28px", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
            Шинжилгээ эхлүүлэх <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid #E5E7EB" }}>
        {STATS.map(({ value, label }) => (
          <div key={label} style={{ padding: "40px 32px", textAlign: "center", borderRight: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 900, color: DARK, letterSpacing: "-1px", margin: "0 0 6px" }}>{value}</p>
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <div style={{ padding: "88px 80px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ color: PURPLE, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Ажиллах зарчим</p>
          <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: DARK, letterSpacing: "-1px" }}>
            Хэрхэн ажилладаг вэ?
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0", maxWidth: "760px", margin: "0 auto", position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: "27px", top: "40px", bottom: "40px", width: "2px", background: "linear-gradient(180deg, #DDD6FE, #EDE9FE)", zIndex: 0 }} />
          {STEPS.map(({ icon: Icon, num, title, desc }) => (
            <div key={num} style={{ display: "flex", gap: "28px", alignItems: "flex-start", marginBottom: "36px", position: "relative", zIndex: 1 }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fff", border: `2px solid #DDD6FE`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(92,45,145,0.1)" }}>
                <Icon size={22} color={PURPLE} />
              </div>
              <div style={{ paddingTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: PURPLE, letterSpacing: "0.08em" }}>{num}</span>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: DARK, margin: 0 }}>{title}</h3>
                </div>
                <p style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.7, margin: 0, maxWidth: "560px" }}>{desc}</p>
              </div>
            </div>
          ))}
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
              <button onClick={() => setModal(label)}
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", fontFamily: FONT, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                {label}
              </button>
              {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── MODAL ────────────────────────────────────────── */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px", padding: "40px", maxWidth: "480px", width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", position: "relative" }}>
            <button onClick={() => setModal(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
              onMouseEnter={e => (e.currentTarget.style.color = DARK)}
              onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: DARK, marginBottom: "20px", letterSpacing: "-0.5px" }}>
              {MODALS[modal].title}
            </h3>
            {MODALS[modal].content.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.75, marginBottom: "12px" }}>{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
