import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Employees from "./pages/Employees";
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
import AdminRequests from "./pages/AdminRequests";
import ExpensesPage from "./pages/Expenses";
import Diary from "./pages/Diary";
import AnnouncementsPage from "./pages/Announcements";
import WhatsAppBroadcast from "./pages/WhatsAppBroadcast";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AboutUs from "./pages/AboutUs";
import Curriculum from "./pages/Curriculum";
import FAQ from "./pages/FAQ";
import SignedupParents from "./pages/SignedupParents";
import AttendanceReport from "./pages/AttendanceReport";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherPortal from "./pages/TeacherPortal";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherResults from "./pages/TeacherResults";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherDiary from "./pages/TeacherDiary";
import TeacherAccounts from "./pages/TeacherAccounts";
import TimetableGenerator from "./pages/TimetableGenerator";
import ReceiptGenerator from "./pages/ReceiptGenerator";
import TeacherPermissions from "./pages/TeacherPermissions";
import PaymentHistory from "./pages/PaymentHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admission-query" element={<AdmissionQuery />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/students" element={<Students />} />
            <Route path="/dashboard/employees" element={<Employees />} />
            <Route path="/dashboard/teachers" element={<Employees />} />
            <Route path="/dashboard/classes" element={<Classes />} />
            <Route path="/dashboard/attendance" element={<Attendance />} />
            <Route path="/dashboard/fees" element={<Fees />} />
            <Route path="/dashboard/admissions" element={<Admissions />} />
            <Route path="/dashboard/admission-queries" element={<AdmissionQueries />} />
            <Route path="/dashboard/fee-vouchers" element={<FeeVouchers />} />
            <Route path="/dashboard/results" element={<Results />} />
            <Route path="/dashboard/timetable" element={<Timetable />} />
            <Route path="/dashboard/timetable-generator" element={<TimetableGenerator />} />
            <Route path="/dashboard/teacher-accounts" element={<TeacherAccounts />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/expenses" element={<ExpensesPage />} />
            <Route path="/dashboard/diary" element={<Diary />} />
            <Route path="/dashboard/announcements" element={<AnnouncementsPage />} />
            <Route path="/dashboard/whatsapp-broadcast" element={<WhatsAppBroadcast />} />
            <Route path="/dashboard/admin-requests" element={<AdminRequests />} />
            <Route path="/dashboard/signedup-parents" element={<SignedupParents />} />
            <Route path="/dashboard/receipt" element={<ReceiptGenerator />} />
            <Route path="/dashboard/teacher-permissions" element={<TeacherPermissions />} />
            <Route path="/dashboard/payment-history" element={<PaymentHistory />} />
            <Route path="/parent-login" element={<ParentLogin />} />
            <Route path="/parent-portal" element={<ParentPortal />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard/attendance-report" element={<AttendanceReport />} />
            <Route path="/teacher-login" element={<TeacherLogin />} />
            <Route path="/teacher-portal" element={<TeacherPortal />} />
            <Route path="/teacher-portal/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher-portal/results" element={<TeacherResults />} />
            <Route path="/teacher-portal/profile" element={<TeacherProfile />} />
            <Route path="/teacher-portal/diary" element={<TeacherDiary />} />
            <Route path="/teacher-portal/attendance-report" element={<AttendanceReport />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
