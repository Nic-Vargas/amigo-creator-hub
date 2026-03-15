import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import isotipoNiyaraky from "@/assets/isotipo-niyaraky.png";
import logoComfaboy from "@/assets/logo-comfaboy.png";
import isotipoComfaboy from "@/assets/isotipo-comfaboy.png";


const navItems = [
  //{ path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/beneficiarios", label: "Beneficiarios", icon: Users },
  { path: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { path: "/recobros", label: "Casos Recobro", icon: FileText },
  //{ path: "/reportes", label: "Reportes", icon: BarChart3 },
  //{ path: "/configuracion", label: "Configuración", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out border-r border-sidebar-border overflow-hidden",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="flex items-center justify-center shrink-0">
            <img
              src={isotipoNiyaraky}
              alt="Niyaraky"
              className={cn(
                "object-contain transition-all duration-300",
                collapsed ? "w-9 h-9" : "w-10 h-10"
              )}
            />
          </div>

          {!collapsed && (
            <div className="animate-fade-in min-w-0">
              <h1 className="font-semibold text-sm text-sidebar-accent-foreground tracking-tight">
                SISREC
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 leading-none">
                Por Niyaraky
              </p>
            </div>
          )}
        </div>


        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto p-2 border-t border-sidebar-border space-y-3 overflow-hidden">
          <div className="flex items-center justify-center min-h-[56px] px-2">
            <img
              src={collapsed ? isotipoComfaboy : logoComfaboy}
              alt="Comfaboy"
              className={cn(
                "object-contain transition-all duration-300 shrink-0",
                collapsed ? "w-10 h-10" : "w-[170px] max-w-full h-auto"
              )}
            />
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">Administrador</span>
            <Badge variant="outline" className="text-[10px] ml-1 border-accent/30 text-accent">
              Caja FOSFEC
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                JP
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">Juan Pérez</p>
                <p className="text-[11px] text-muted-foreground">admin.cartera</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
