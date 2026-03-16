import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import AdminGuard from "./AdminGuard";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4">
            <button onClick={() => setSidebarOpen(true)} className="text-foreground">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-display text-sm font-bold text-foreground">Admin Panel</span>
            <div className="w-6" />
          </header>
        )}

        {/* Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        <DashboardSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`min-h-screen p-4 ${isMobile ? "" : "ml-64 lg:p-8"}`}>
          {children}
        </main>
      </div>
    </AdminGuard>
  );
};

export default DashboardLayout;
