import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChevronDown, ArrowRight, Search, Phone, LayoutDashboard,
         Zap, BarChart3, FileText, Globe, HelpCircle, BookOpen,
         Building2, Users, Briefcase, X } from "lucide-react";

const DARK   = "#1B1240";   /* DocuSign-ийн text color — маш бараан ягаан хар */
const PURPLE = "#5C2D91";   /* DocuSign exact purple */
const BANNER = "#0f0535";
const FONT   = "'Plus Jakarta Sans', sans-serif";

/* ── Dropdown data ────────────────────────────────────────── */
const DROPDOWNS: Record<string, { icon: any; title: string; desc: string }[][]> = {
  "Бүтээгдэхүүн": [
    [
      { icon: Zap,       title: "PitchAI Iris",    desc: "AI шинжилгээний платформ" },
      { icon: BarChart3, title: "ML Загвар",        desc: "Random Forest · XGBoost" },
      { icon: FileText,  title: "PDF Анализ",       desc: "Монгол LLM дэмжлэг" },
    ],
    [
      { icon: Globe,     title: "API Холболт",      desc: "REST API · JSON хариу" },
      { icon: Zap,       title: "Автоматжуулалт",   desc: "Batch боловсруулалт" },
    ],
  ],
  "Шийдэл": [
    [
      { icon: Briefcase, title: "Жижиг бизнес",    desc: "Хурдан шинжилгээ" },
      { icon: Building2, title: "Их байгууллага",  desc: "Batch · API · SSO" },
    ],
    [
      { icon: Users,     title: "Стартап",          desc: "Хөрөнгө оруулалтын бэлтгэл" },
      { icon: Globe,     title: "Краудфандинг",     desc: "Kickstarter · Indiegogo" },
    ],
  ],
  "Нөөц": [
    [
      { icon: BookOpen,  title: "Баримт бичиг",    desc: "API гарын авлага" },
      { icon: HelpCircle,title: "Тусламж",          desc: "Асуулт хариулт" },
    ],
    [
      { icon: FileText,  title: "Блог",             desc: "AI · ML судалгаа" },
      { icon: BarChart3, title: "Кейс судалгаа",   desc: "Амжилттай жишээнүүд" },
    ],
  ],
};

/* ── Dropdown panel ───────────────────────────────────────── */
function DropdownPanel({ label, items }: { label: string; items: { icon: any; title: string; desc: string }[][] }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 1px)", left: "50%", transform: "translateX(-50%)",
      background: "#fff", borderRadius: "12px", padding: "20px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
      display: "flex", gap: "32px", zIndex: 200, minWidth: "380px",
      fontFamily: FONT,
    }}>
      {items.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {col.map(({ icon: Icon, title, desc }) => (
            <div key={title}
              style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F5F3FF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(92,45,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                <Icon size={15} color={PURPLE} />
              </div>
              <div>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: DARK, margin: 0, lineHeight: 1.3 }}>{title}</p>
                <p style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0", lineHeight: 1.4 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── NavItem with optional dropdown ──────────────────────── */
function NavItem({ label, hasDropdown }: { label: string; hasDropdown: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div ref={ref} style={{ position: "relative" }} onMouseEnter={show} onMouseLeave={hide}>
      <button style={{
        display: "flex", alignItems: "center", gap: "3px",
        color: open ? DARK : "#374151",
        fontSize: "14.5px", fontWeight: 500,
        background: "none", border: "none", cursor: "pointer",
        padding: "4px 2px", fontFamily: FONT,
        transition: "color 0.12s",
      }}
      onMouseEnter={e => (e.currentTarget.style.color = DARK)}
      onMouseLeave={e => { if (!open) e.currentTarget.style.color = "#374151"; }}>
        {label}
        {hasDropdown && (
          <ChevronDown size={14} color={open ? DARK : "#9CA3AF"}
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}/>
        )}
      </button>

      {hasDropdown && open && DROPDOWNS[label] && (
        <DropdownPanel label={label} items={DROPDOWNS[label]} />
      )}
    </div>
  );
}

/* ── Main TopNav ──────────────────────────────────────────── */
export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [search, setSearch] = useState(false);

  const handleLogout = () => { logout(); toast.success("Гарлаа"); navigate("/login"); };

  const navLinks: [string, boolean][] = [
    ["Бүтээгдэхүүн", true],
    ["Шийдэл", true],
    ["Нөөц", true],
    ["Тухай", false],
    ["Үнэ", false],
  ];

  const subTabs = ["Тойм", "ML загвар", "AI нарийвчлал"];
  const activeTab = location.pathname === "/result" ? 1 : 0;

  return (
    <>
      {/* ── 1. Announcement banner (36px) ───────────────────── */}
      <div style={{
        background: BANNER, height: "36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", position: "sticky", top: 0, zIndex: 200,
        fontFamily: FONT,
      }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <span style={{ background: PURPLE, color: "#fff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: "3px" }}>ШИНЭ</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12.5px", fontWeight: 400 }}>
            PitchAI — Монгол краудфандингийн амжилтын хүчин зүйлсийн шинжилгээ
          </span>
          <ArrowRight size={12} color="rgba(255,255,255,0.6)" />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <a href="tel:+97699887766" style={{ display:"flex", alignItems:"center", gap:"4px", textDecoration:"none", color:"rgba(255,255,255,0.7)", fontSize:"12px", fontFamily: FONT }}>
            <Phone size={11}/> +976 9988-7766
          </a>
          <div style={{ width:"1px", height:"14px", background:"rgba(255,255,255,0.18)" }}/>
          <button onClick={() => setSearch(s => !s)} style={{ display:"flex", alignItems:"center", gap:"4px", background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:"12px", cursor:"pointer", fontFamily: FONT }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>
            <Search size={11}/> Хайх
          </button>
          <div style={{ width:"1px", height:"14px", background:"rgba(255,255,255,0.18)" }}/>
          <button style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:"12px", cursor:"pointer", fontFamily: FONT }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>Дэмжлэг</button>
          <div style={{ width:"1px", height:"14px", background:"rgba(255,255,255,0.18)" }}/>
          <button onClick={() => navigate(user ? "/" : "/login")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:"12px", cursor:"pointer", fontFamily: FONT }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>
            {user ? "Хяналтын самбар" : "Нэвтрэх"}
          </button>
        </div>
      </div>

      {/* ── 2. Main nav (60px) ──────────────────────────────── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #E8E8E8",
        position: "sticky", top: "36px", zIndex: 150, fontFamily: FONT,
      }}>
        {/* Search overlay */}
        {search && (
          <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", alignItems: "center", padding: "0 40px", gap: "16px" }}>
            <Search size={18} color="#9CA3AF"/>
            <input autoFocus placeholder="Хайх..." style={{ flex: 1, border: "none", outline: "none", fontSize: "16px", fontFamily: FONT, color: DARK }}/>
            <button onClick={() => setSearch(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={18}/></button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", height: "60px", padding: "0 40px", gap: "0" }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", flexShrink: 0, marginRight: "36px" }}>
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="5" fill={DARK}/>
              <path d="M8 20V8h7a5 5 0 0 1 0 10H8z" fill="white" opacity="0.95"/>
              <circle cx="20" cy="18" r="3" fill={PURPLE}/>
            </svg>
            <span style={{ color: DARK, fontWeight: 700, fontSize: "18px", letterSpacing: "-0.4px", fontFamily: FONT }}>pitchai</span>
          </a>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
            {navLinks.map(([label, arrow]) => (
              <NavItem key={label as string} label={label as string} hasDropdown={arrow as boolean}/>
            ))}
          </div>

          {/* Right CTAs — exactly DocuSign layout */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {user ? (
              <>
                <button onClick={() => navigate("/admin")}
                  style={{ display:"flex", alignItems:"center", gap:"5px", color: location.pathname === "/admin" ? PURPLE : "#374151", fontSize:"13.5px", fontWeight: location.pathname === "/admin" ? 600 : 500, background:"none", border:"none", cursor:"pointer", padding:"4px 8px", fontFamily: FONT }}
                  onMouseEnter={e => (e.currentTarget.style.color = PURPLE)}
                  onMouseLeave={e => (e.currentTarget.style.color = location.pathname === "/admin" ? PURPLE : "#374151")}>
                  <LayoutDashboard size={14}/> Админ
                </button>
                <div style={{ width:"1px", height:"16px", background:"#E5E7EB" }}/>
                <span style={{ color:"#374151", fontSize:"13.5px", fontWeight:500, padding:"4px 8px", fontFamily: FONT }}>{user.name}</span>
                <button onClick={handleLogout} style={{ color: PURPLE, fontSize:"13.5px", fontWeight:700, letterSpacing:"0.06em", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", fontFamily: FONT }}>
                  ГАРАХ
                </button>
              </>
            ) : (
              <>
                {/* CONTACT SALES */}
                <button onClick={() => navigate("/login")} style={{ color: PURPLE, fontSize:"13.5px", fontWeight:700, letterSpacing:"0.04em", background:"none", border:"none", cursor:"pointer", padding:"6px 14px", fontFamily: FONT, whiteSpace:"nowrap" }}>
                  БОРЛУУЛАЛТ
                </button>
                {/* BUY NOW */}
                <button onClick={() => navigate("/login")} style={{ border:`1.5px solid ${DARK}`, borderRadius:"6px", padding:"7px 16px", fontSize:"13.5px", fontWeight:700, color: DARK, background:"none", cursor:"pointer", letterSpacing:"0.04em", fontFamily: FONT, whiteSpace:"nowrap" }}>
                  ХУДАЛДАХ
                </button>
                {/* TRY FOR FREE */}
                <button onClick={() => navigate("/login")} style={{ background: PURPLE, color:"#fff", borderRadius:"6px", padding:"8px 18px", fontSize:"13.5px", fontWeight:700, border:"none", cursor:"pointer", letterSpacing:"0.03em", fontFamily: FONT, whiteSpace:"nowrap" }}>
                  ҮНЭГҮЙ ТУРШИX
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── 3. Sub-nav — "Docusign Iris" style (48px) ──────── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8E8E8", position:"sticky", top:"96px", zIndex:100, fontFamily: FONT }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:"48px", padding:"0 40px" }}>
          <span style={{ fontSize:"14px", fontWeight:700, color: DARK, letterSpacing:"-0.2px" }}>PitchAI Iris</span>
          <div style={{ display:"flex", height:"100%" }}>
            {subTabs.map((tab, i) => {
              const isActive = i === activeTab;
              return (
                <button key={tab}
                  onClick={() => { if (i === 0) navigate("/"); if (i === 1) navigate("/result"); }}
                  style={{
                    fontSize: "14px", fontWeight: isActive ? 600 : 400,
                    color: isActive ? PURPLE : "#6B7280",
                    padding: "0 24px", height: "100%",
                    background: "none", border: "none",
                    borderBottom: isActive ? `2px solid ${PURPLE}` : "2px solid transparent",
                    cursor: "pointer", fontFamily: FONT,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = DARK; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}>
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
