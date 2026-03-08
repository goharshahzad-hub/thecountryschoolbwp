import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.jpg";
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  ClipboardCheck, DollarSign, Calendar, Settings, LogOut,
  FileText, Receipt, BarChart3, UserPlus, ShieldCheck
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/students", icon: Users, label: "Students" },
  { to: "/dashboard/teachers", icon: GraduationCap, label: "Teachers" },
  { to: "/dashboard/classes", icon: BookOpen, label: "Classes" },
  { to: "/dashboard/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/dashboard/fees", icon: DollarSign, label: "Fees" },
  { to: "/dashboard/admissions", icon: UserPlus, label: "Admissions" },
  { to: "/dashboard/admission-queries", icon: FileText, label: "Admission Queries" },
  { to: "/dashboard/fee-vouchers", icon: Receipt, label: "Fee Vouchers" },
  { to: "/dashboard/results", icon: BarChart3, label: "Results" },
  { to: "/dashboard/timetable", icon: Calendar, label: "Timetable" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin-login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <img src={logo} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="font-display text-sm font-bold text-sidebar-foreground">The Country School</p>
          <p className="text-[10px] text-sidebar-foreground/50">Fahad Campus — Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
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

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          to="/"
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
