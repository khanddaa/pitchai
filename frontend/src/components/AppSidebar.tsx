import { NavLink, useLocation } from "react-router-dom";
import { Upload, BarChart3, Shield, FileText, LogOut, User } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const navItems = [
  { path: "/",       label: "Файл оруулах", icon: Upload },
  { path: "/result", label: "Үр дүн",       icon: BarChart3 },
  { path: "/admin",  label: "Админ",         icon: Shield },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed  = state === "collapsed";
  const location   = useLocation();
  const { user, logout } = useAuth();
  const handleLogout = () => { logout(); toast.success("Гарлаа"); };

  return (
    <Sidebar collapsible="icon" className="border-r-0"
      style={{ boxShadow: "2px 0 16px rgb(38 19 107 / 0.22)" }}>
      <SidebarContent className="flex flex-col h-full"
        style={{ background: "hsl(263,70%,23%)" }}>

        {/* Brand */}
        <div className={`flex items-center gap-3 py-[18px] ${collapsed ? "justify-center px-3" : "px-5"}`}
          style={{ borderBottom: "1px solid hsl(263,55%,18%)" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <FileText className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-white leading-tight tracking-tight">PitchAI</p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                Краудфандинг таамаглал
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <SidebarGroup className="flex-1 py-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0 px-2">
              {navItems.map((item) => {
                const active = item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        className="flex items-center gap-3 rounded-md py-2.5 text-[13px] transition-all duration-150"
                        style={active ? {
                          background: "rgba(255,255,255,0.13)",
                          color: "#fff",
                          fontWeight: 600,
                          borderLeft: "3px solid rgba(255,255,255,0.85)",
                          paddingLeft: "9px",
                          paddingRight: "12px",
                        } : {
                          color: "rgba(255,255,255,0.55)",
                          borderLeft: "3px solid transparent",
                          paddingLeft: "9px",
                          paddingRight: "12px",
                        }}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User footer */}
        <div className={`${collapsed ? "p-2" : "p-3"}`}
          style={{ borderTop: "1px solid hsl(263,55%,18%)" }}>
          {user && (
            <div className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
              <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{user.email}</p>
                  </div>
                  <button onClick={handleLogout} title="Гарах"
                    className="h-6 w-6 rounded flex items-center justify-center transition-all hover:bg-white/10"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
