import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ArrowRight, Search, Zap, BarChart3, X } from "lucide-react";

const DARK   = "#1B1240";
const PURPLE = "#5C2D91";
const BANNER = "#0f0535";
const FONT   = "'Plus Jakarta Sans', sans-serif";

/* ── Dropdown items ───────────────────────────────────────── */
interface DropItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  href?: string;
  disabled?: boolean;
}

const PRODUCT_ITEMS: DropItem[] = [
  { icon: Zap,       title: "PitchAI Iris", desc: "Краудфандинг шинжилгээ", href: "/",   disabled: false },
  { icon: BarChart3, title: "PitchAI Pro",  desc: "Тун удахгүй",            href: undefined, disabled: true },
];

/* ── Dropdown panel ───────────────────────────────────────── */
function ProductDropdown({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 1px)", left: "50%", transform: "translateX(-50%)",
      background: "#fff", borderRadius: "12px", padding: "12px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
      zIndex: 200, minWidth: "260px", fontFamily: FONT,
    }}>
      {PRODUCT_ITEMS.map(({ icon: Icon, title, desc, href, disabled }) => (
        <div key={title}
          onClick={() => !disabled && href && onNavigate(href)}
          style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            padding: "10px 12px", borderRadius: "8px",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.45 : 1,
            transition: "background 0.12s",
          }}
          onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "#F5F3FF"; }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(92,45,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
            <Icon size={15} color={PURPLE} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: DARK, margin: 0, lineHeight: 1.3 }}>{title}</p>
              {disabled && (
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#9CA3AF", background: "#F3F4F6", padding: "1px 6px", borderRadius: "3px", letterSpacing: "0.05em" }}>
                  УДАХГҮЙ
                </span>
              )}
            </div>
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0", lineHeight: 1.4 }}>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── NavItem ──────────────────────────────────────────────── */
function NavItem({ label, hasDropdown, href, onNavigate }: { label: string; hasDropdown: boolean; href?: string; onNavigate: (href: string) => void }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div style={{ position: "relative" }} onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => !hasDropdown && href && onNavigate(href)}
        style={{
          display: "flex", alignItems: "center", gap: "3px",
          color: open ? DARK : "#374151", fontSize: "14.5px", fontWeight: 500,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 10px", fontFamily: FONT, transition: "color 0.12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = DARK)}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = "#374151"; }}>
        {label}
        {hasDropdown && (
          <ChevronDown size={14} color={open ? DARK : "#9CA3AF"}
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}/>
        )}
      </button>

      {hasDropdown && open && (
        <ProductDropdown onNavigate={(href) => { onNavigate(href); setOpen(false); }} />
      )}
    </div>
  );
}

/* ── Main TopNav ──────────────────────────────────────────── */
export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(false);

  const navLinks: [string, boolean, string?][] = [
    ["Бүтээгдэхүүн", true,  undefined],
    ["Тухай",        false, "/about"],
    ["Үнэ",          false, "/pricing"],
  ];

  const subTabs = ["Тойм", "Зөвлөмж", "Түүх"];
  const activeTab = location.pathname === "/result" ? 1 : 0;

  return (
    <>
      {/* ── 1. Announcement banner ──────────────────────────── */}
      <div style={{
        background: BANNER, height: "36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", position: "sticky", top: 0, zIndex: 200, fontFamily: FONT,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <span style={{ background: PURPLE, color: "#fff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: "3px" }}>ШИНЭ</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12.5px" }}>
            PitchAI Pro удахгүй гарна
          </span>
          <ArrowRight size={12} color="rgba(255,255,255,0.6)" />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <button onClick={() => setSearch(s => !s)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "12px", cursor: "pointer", fontFamily: FONT }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>
            <Search size={11}/> Хайх
          </button>
          <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.18)" }}/>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "12px", cursor: "pointer", fontFamily: FONT }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>Дэмжлэг</button>
        </div>
      </div>

      {/* ── 2. Main nav ─────────────────────────────────────── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #E8E8E8",
        position: "sticky", top: "36px", zIndex: 150, fontFamily: FONT,
      }}>
        {search && (
          <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", alignItems: "center", padding: "0 40px", gap: "16px" }}>
            <Search size={18} color="#9CA3AF"/>
            <input autoFocus placeholder="Хайх..." style={{ flex: 1, border: "none", outline: "none", fontSize: "16px", fontFamily: FONT, color: DARK }}/>
            <button onClick={() => setSearch(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={18}/></button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", height: "60px", padding: "0 40px" }}>
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
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {navLinks.map(([label, hasDropdown, href]) => (
              <NavItem key={label} label={label} hasDropdown={hasDropdown as boolean} href={href as string | undefined} onNavigate={navigate} />
            ))}
          </div>

          {/* Right CTA */}
          <button onClick={() => navigate("/")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: PURPLE, color: "#fff", border: "none",
              borderRadius: "6px", padding: "8px 18px",
              fontSize: "14px", fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.02em", fontFamily: FONT, flexShrink: 0,
              boxShadow: "0 2px 8px rgba(92,45,145,0.35)",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Эхлэх <ArrowRight size={14}/>
          </button>
        </div>
      </nav>

      {/* ── 3. Sub-nav ──────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E8E8", position: "sticky", top: "96px", zIndex: 100, fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px", padding: "0 40px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: DARK, letterSpacing: "-0.2px" }}>PitchAI Iris</span>
          <div style={{ display: "flex", height: "100%" }}>
            {subTabs.map((tab, i) => {
              const isActive = i === activeTab;
              return (
                <button key={tab}
                  onClick={() => { if (i === 0) navigate("/"); else navigate("/result"); }}
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
