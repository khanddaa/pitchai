import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSearch } from "lucide-react";

const DARK   = "#1A1143";
const PURPLE = "#6B21A8";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100vh - 144px)", background: "#fff", padding: "40px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }} className="animate-fade-in-up">

      {/* Icon */}
      <div style={{
        width: "72px", height: "72px", borderRadius: "20px",
        background: "linear-gradient(135deg, rgba(107,33,168,0.08), rgba(107,33,168,0.15))",
        border: "1px solid rgba(107,33,168,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "24px",
      }}>
        <FileSearch size={32} color={PURPLE}/>
      </div>

      {/* 404 */}
      <p style={{ fontSize: "72px", fontWeight: 900, color: DARK, letterSpacing: "-4px", lineHeight: 1, marginBottom: "8px" }}>
        404
      </p>
      <h1 style={{ fontSize: "20px", fontWeight: 700, color: DARK, marginBottom: "10px" }}>
        Хуудас олдсонгүй
      </h1>
      <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "32px", maxWidth: "360px", textAlign: "center", lineHeight: 1.65 }}>
        Таны хайж буй хуудас байхгүй байна. URL-г шалгаад дахин оролдоно уу.
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: "#fff", color: DARK, border: `1.5px solid #E5E7EB`,
            borderRadius: "8px", padding: "10px 20px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = DARK}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"}>
          <ArrowLeft size={15}/> Буцах
        </button>
        <button onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: DARK, color: "#fff", border: "none",
            borderRadius: "8px", padding: "10px 20px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(26,17,67,0.3)",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          Нүүр хуудас руу
        </button>
      </div>
    </div>
  );
}
