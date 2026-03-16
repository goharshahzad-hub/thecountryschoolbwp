import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  ClipboardCheck, DollarSign, Calendar, Settings, LogOut,
  FileText, Receipt, BarChart3, UserPlus, ShieldCheck, Wallet,
  BookMarked, Megaphone, MessageCircle, Moon, Sun, UserCheck, X
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/students", icon: Users, label: "Students" },
  { to: "/dashboard/employees", icon: GraduationCap, label: "Employees" },
  { to: "/dashboard/classes", icon: BookOpen, label: "Classes" },
  { to: "/dashboard/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/dashboard/diary", icon: BookMarked, label: "Diary / Homework" },
  { to: "/dashboard/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/dashboard/fees", icon: DollarSign, label: "Fees" },
  { to: "/dashboard/admissions", icon: UserPlus, label: "Admissions" },
  { to: "/dashboard/admission-queries", icon: FileText, label: "Admission Queries" },
  { to: "/dashboard/fee-vouchers", icon: Receipt, label: "Fee Vouchers" },
  { to: "/dashboard/whatsapp-broadcast", icon: MessageCircle, label: "WhatsApp Broadcast" },
  { to: "/dashboard/results", icon: BarChart3, label: "Results" },
  { to: "/dashboard/timetable", icon: Calendar, label: "Timetable" },
  { to: "/dashboard/expenses", icon: Wallet, label: "Expenses" },
  { to: "/dashboard/signedup-parents", icon: UserCheck, label: "Signedup Parents" },
  { to: "/dashboard/admin-requests", icon: ShieldCheck, label: "Admin Requests" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const DashboardSidebar = ({ mobileOpen, onClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingQueries, setPendingQueries] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [reqRes, queryRes] = await Promise.all([
        supabase.from("admin_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("admission_queries").select("*", { count: "exact", head: true }).eq("status", "New"),
      ]);
      setPendingRequests(reqRes.count || 0);
      setPendingQueries(queryRes.count || 0);
    };
    fetchCounts();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin-login");
  };

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  // On mobile, hide unless open
  if (isMobile && !mobileOpen) return null;

  return (
    <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar ${isMobile ? "shadow-elevated" : ""}`}>
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="font-display text-sm font-bold text-sidebar-foreground">The Country School</p>
            <p className="text-[10px] text-sidebar-foreground/50">Fahad Campus — Admin</p>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const showBadge =
            (item.to === "/dashboard/admin-requests" && pendingRequests > 0) ||
            (item.to === "/dashboard/admission-queries" && pendingQueries > 0);
          const badgeCount = item.to === "/dashboard/admin-requests" ? pendingRequests 
            : pendingQueries;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {badgeCount}
                </span>
              )}
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
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Back to Website
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
