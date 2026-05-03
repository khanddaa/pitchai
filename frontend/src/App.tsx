import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Moon, Sun } from "lucide-react";
import TopNav from "@/components/TopNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* Dark-mode toggle — small floating button */
const ThemeToggle = () => {
  const [dark, setDark] = useState(() => localStorage.getItem("pitchai_theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("pitchai_theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button onClick={() => setDark(d => !d)}
      title={dark ? "Цайруулах" : "Харлуулах"}
      style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 99,
        width: "38px", height: "38px", borderRadius: "50%",
        background: "#1A1143", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(26,17,67,0.4)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
      {dark ? <Sun size={16} color="#fff" /> : <Moon size={16} color="#fff" />}
    </button>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="top-right"/>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div style={{ minHeight: "100vh", background: "#fff" }}>
                  <TopNav />
                  <Routes>
                    {/* Scrollable landing page */}
                    <Route path="/"       element={
                      <div style={{ height: "calc(100vh - 144px)", overflowY: "auto" }}>
                        <UploadPage />
                      </div>
                    } />
                    <Route path="/result" element={<ResultPage />} />

                    {/* Scrollable page */}
                    <Route path="/admin"  element={
                      <div style={{ height: "calc(100vh - 144px)", overflowY: "auto" }}>
                        <AdminPage />
                      </div>
                    } />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <ThemeToggle />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
