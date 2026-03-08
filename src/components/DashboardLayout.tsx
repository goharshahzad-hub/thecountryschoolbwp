import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import AdminGuard from "./AdminGuard";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 min-h-screen p-6 lg:p-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
};

export default DashboardLayout;
