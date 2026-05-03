import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, BarChart3, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const DARK   = "#1A1143";
const PURPLE = "#6B21A8";

export default function LoginPage() {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<{ email?: string; password?: string }>({});
  const [focused,      setFocused]      = useState<string | null>(null);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const validate = () => {
    const e: typeof errors = {};
    if (!email)    e.email    = "Имэйл хаягаа оруулна уу";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Имэйл хаяг буруу байна";
    if (!password) e.password = "Нууц үгээ оруулна уу";
    else if (password.length < 6) e.password = "Нууц үг хамгийн багадаа 6 тэмдэгт";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) { toast.success("Амжилттай нэвтэрлээ"); navigate("/"); }
    else toast.error(result.error ?? "Нэвтрэх үед алдаа гарлаа");
  };

  const inputStyle = (field: string, hasError: boolean) => ({
    width: "100%", height: "44px",
    border: `1.5px solid ${hasError ? "#dc2626" : focused === field ? PURPLE : "#E5E7EB"}`,
    borderRadius: "8px", padding: "0 14px 0 40px",
    fontSize: "14px", color: DARK, outline: "none",
    background: "#fff",
    boxShadow: focused === field ? `0 0 0 3px ${hasError ? "rgba(220,38,38,0.1)" : "rgba(107,33,168,0.08)"}` : "0 1px 2px rgba(0,0,0,0.04)",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── LEFT — purple gradient panel ─────────────────────── */}
      <div style={{
        width: "440px", flexShrink: 0,
        background: "linear-gradient(155deg,#1e0757 0%,#3b0f8a 30%,#5b21b6 65%,#7c3aed 100%)",
        display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
      }}>
        {/* decorative blobs */}
        <div style={{ position:"absolute", top:"-100px", right:"-80px", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(124,58,237,0.2)", filter:"blur(80px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"100px", left:"-60px", width:"240px", height:"240px", borderRadius:"50%", background:"rgba(91,33,182,0.22)", filter:"blur(60px)", pointerEvents:"none" }} />

        {/* Logo */}
        <div style={{ padding: "36px 40px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="5" fill="rgba(255,255,255,0.15)"/>
              <path d="M8 20V8h7a5 5 0 0 1 0 10H8z" fill="white" opacity="0.9"/>
              <circle cx="20" cy="18" r="3" fill="#a78bfa"/>
            </svg>
            <div>
              <span style={{ color:"#fff", fontWeight:700, fontSize:"18px", letterSpacing:"-0.5px" }}>pitchai</span>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", margin:0 }}>Краудфандинг таамаглалын систем</p>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ flex:1, padding:"48px 40px", display:"flex", flexDirection:"column", justifyContent:"center", position:"relative", zIndex:1 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:"20px", padding:"4px 12px", marginBottom:"24px", width:"fit-content",
          }}>
            <Zap size={11} color="#c4b5fd"/>
            <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>AI-Powered</span>
          </div>

          <h2 style={{ fontSize:"26px", fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:"16px", letterSpacing:"-0.5px" }}>
            Краудфандинг төслийн<br/>амжилтыг урьдчилан мэд
          </h2>
          <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.5)", lineHeight:1.75, marginBottom:"40px", maxWidth:"320px" }}>
            PDF pitch deck-ийг оруулахад AI автоматаар шинжилж,
            амжилтын магадлалыг секундын дотор тооцоолно.
          </p>

          {/* Features */}
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
            {[
              { Icon: Zap,        title:"Монгол PDF шинжилгээ",  desc:"Groq Llama 3.1 · Кирилл дэмжлэг" },
              { Icon: BarChart3,  title:"ML таамаглал",           desc:"Random Forest · 331,675 датасет" },
              { Icon: ShieldCheck,title:"Нарийвчлалтай",          desc:"F1: 62.8% · AUC: 73.8%" },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display:"flex", alignItems:"flex-start", gap:"14px" }}>
                <div style={{ width:"34px", height:"34px", borderRadius:"8px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={16} color="#c4b5fd"/>
                </div>
                <div>
                  <p style={{ fontSize:"13px", fontWeight:600, color:"#fff", margin:0 }}>{title}</p>
                  <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", margin:"2px 0 0" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ padding:"20px 40px", borderTop:"1px solid rgba(255,255,255,0.07)", position:"relative", zIndex:1 }}>
          <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)", margin:0 }}>
            Kickstarter dataset · n = 331,675 · 2009–2018
          </p>
        </div>
      </div>

      {/* ── RIGHT — login form ────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px", background:"#fff" }}>
        <div style={{ width:"100%", maxWidth:"360px" }} className="animate-fade-in-up">

          {/* Heading */}
          <h1 style={{ fontSize:"28px", fontWeight:800, color:DARK, marginBottom:"6px", letterSpacing:"-0.5px" }}>Нэвтрэх</h1>
          <p style={{ fontSize:"14px", color:"#6B7280", marginBottom:"32px", lineHeight:1.5 }}>
            Бүртгэлдээ нэвтэрч үйлчилгээг ашиглана уу
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display:"flex", flexDirection:"column", gap:"18px" }}>

            {/* Email */}
            <div>
              <label style={{ fontSize:"13px", fontWeight:600, color:DARK, display:"block", marginBottom:"6px" }}>
                Имэйл хаяг
              </label>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused==="email" ? PURPLE : "#9CA3AF"} strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  type="email" placeholder="name@company.com" value={email}
                  style={inputStyle("email", !!errors.email)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: undefined })); }}
                  autoComplete="email" disabled={loading}
                />
              </div>
              {errors.email && <p style={{ fontSize:"12px", color:"#dc2626", marginTop:"4px" }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize:"13px", fontWeight:600, color:DARK, display:"block", marginBottom:"6px" }}>
                Нууц үг
              </label>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused==="password" ? PURPLE : "#9CA3AF"} strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  style={{ ...inputStyle("password", !!errors.password), paddingRight:"40px" }}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: undefined })); }}
                  autoComplete="current-password" disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                  style={{ position:"absolute", right:"13px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:0, display:"flex" }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p style={{ fontSize:"12px", color:"#dc2626", marginTop:"4px" }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width:"100%", height:"46px", background: loading ? "#6B7280" : DARK,
                color:"#fff", border:"none", borderRadius:"8px",
                fontSize:"14px", fontWeight:700, cursor: loading ? "default" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                boxShadow: loading ? "none" : "0 4px 12px rgba(26,17,67,0.35)",
                transition:"background 0.2s, transform 0.1s, box-shadow 0.2s",
                letterSpacing:"0.02em", marginTop:"4px",
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(26,17,67,0.4)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : "0 4px 12px rgba(26,17,67,0.35)"; }}>
              {loading
                ? <><Loader2 size={16} className="animate-spin"/> Нэвтэрч байна...</>
                : <><span>Нэвтрэх</span><ArrowRight size={15}/></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"24px 0" }}>
            <div style={{ flex:1, height:"1px", background:"#E5E7EB" }}/>
            <span style={{ fontSize:"12px", color:"#9CA3AF" }}>эсвэл</span>
            <div style={{ flex:1, height:"1px", background:"#E5E7EB" }}/>
          </div>

          {/* Quick access hint */}
          <div style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:"8px", padding:"12px 16px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#16a34a", flexShrink:0 }}/>
            <div>
              <p style={{ fontSize:"12px", fontWeight:600, color:DARK, margin:0 }}>Туршилтын нэвтрэлт</p>
              <p style={{ fontSize:"11.5px", color:"#6B7280", margin:"2px 0 0" }}>
                Дурын имэйл + 6+ тэмдэгтийн нууц үг
              </p>
            </div>
          </div>

          <p style={{ fontSize:"11.5px", color:"#9CA3AF", textAlign:"center", marginTop:"24px", lineHeight:1.6 }}>
            PitchAI-д нэвтрэснээр та манай{" "}
            <span style={{ color:PURPLE, cursor:"pointer" }}>Үйлчилгээний нөхцөл</span>
            {" "}болон{" "}
            <span style={{ color:PURPLE, cursor:"pointer" }}>Нууцлалын бодлого</span>-г зөвшөөрч байна.
          </p>
        </div>
      </div>
    </div>
  );
}
