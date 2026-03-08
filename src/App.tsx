import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Admissions from "./pages/Admissions";
import FeeVouchers from "./pages/FeeVouchers";
import Results from "./pages/Results";
import Timetable from "./pages/Timetable";
import SettingsPage from "./pages/Settings";
import AdminLogin from "./pages/AdminLogin";
import ParentLogin from "./pages/ParentLogin";
import ParentPortal from "./pages/ParentPortal";
import ResetPassword from "./pages/ResetPassword";
import AdmissionQuery from "./pages/AdmissionQuery";
import AdmissionQueries from "./pages/AdmissionQueries";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/students" element={<Students />} />
            <Route path="/dashboard/teachers" element={<Teachers />} />
            <Route path="/dashboard/classes" element={<Classes />} />
            <Route path="/dashboard/attendance" element={<Attendance />} />
            <Route path="/dashboard/fees" element={<Fees />} />
            <Route path="/dashboard/admissions" element={<Admissions />} />
            <Route path="/dashboard/fee-vouchers" element={<FeeVouchers />} />
            <Route path="/dashboard/results" element={<Results />} />
            <Route path="/dashboard/timetable" element={<Timetable />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/parent-login" element={<ParentLogin />} />
            <Route path="/parent-portal" element={<ParentPortal />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
