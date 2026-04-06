import { ReactNode, useState } from "react";
import TeacherGuard from "./TeacherGuard";
import DateTimeFooter from "./DateTimeFooter";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.jpg";
import {
  ClipboardCheck, BarChart3, LogOut, Moon, Sun, Menu, X, LayoutDashboard, FileBarChart
} from "lucide-react";

const navItems = [
  { to: "/teacher-portal", icon: LayoutDashboard, label: "Overview" },
  { to: "/teacher-portal/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/teacher-portal/results", icon: BarChart3, label: "Results" },
  { to: "/teacher-portal/attendance-report", icon: FileBarChart, label: "Attendance Report" },
];

const TeacherLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    navigate("/teacher-login");
  };

  return (
    <TeacherGuard>
      <div className="flex min-h-screen flex-col bg-background">
        {isMobile && (
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4">
            <button onClick={() => setSidebarOpen(true)} className="text-foreground">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-display text-sm font-bold text-foreground">Teacher Portal</span>
            <div className="w-6" />
          </header>
        )}

        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        {(!isMobile || sidebarOpen) && (
          <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar ${isMobile ? "shadow-elevated" : ""}`}>
            <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="font-display text-sm font-bold text-sidebar-foreground">The Country School</p>
                  <p className="text-[10px] text-sidebar-foreground/50">Fahad Campus — Teacher</p>
                </div>
              </div>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-3 space-y-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <Link
                to="/"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-4 w-4" />Back to Website
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />Logout
              </button>
            </div>
          </aside>
        )}

        <main className={`flex-1 p-4 ${isMobile ? "" : "ml-64 lg:p-8"}`}>
          {children}
        </main>
        <div className={isMobile ? "" : "ml-64"}>
          <DateTimeFooter />
        </div>
      </div>
    </TeacherGuard>
  );
};

export default TeacherLayout;
