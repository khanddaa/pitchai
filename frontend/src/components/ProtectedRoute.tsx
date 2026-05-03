import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const DARK   = "#1A1143";
const PURPLE = "#6B21A8";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#fff", gap: "16px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="5" fill={DARK}/>
            <path d="M8 20V8h7a5 5 0 0 1 0 10H8z" fill="white" opacity="0.9"/>
            <circle cx="20" cy="18" r="3" fill={PURPLE}/>
          </svg>
          <span style={{ color: DARK, fontWeight: 700, fontSize: "20px", letterSpacing: "-0.5px" }}>pitchai</span>
        </div>
        <Loader2 size={22} color={PURPLE} className="animate-spin"/>
        <p style={{ fontSize: "13px", color: "#9CA3AF" }}>Ачаалж байна...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
