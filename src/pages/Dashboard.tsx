import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";

interface FeeVoucher { student_id: string; amount: number; status: string; }
interface Student { id: string; name: string; class: string; section: string | null; }

const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, feeCollected: 0, feePending: 0, feeOverdue: 0 });
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: sc }, { count: tc }, { count: cc }, { data: feeData }, { data: studentData }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("fee_vouchers").select("student_id, amount, status"),
        supabase.from("students").select("id, name, class, section"),
      ]);
      const vouchersData = feeData || [];
      const feeCollected = vouchersData.filter(v => v.status === "Paid").reduce((s, v) => s + Number(v.amount), 0);
      const feePending = vouchersData.filter(v => v.status === "Pending").reduce((s, v) => s + Number(v.amount), 0);
      const feeOverdue = vouchersData.filter(v => v.status === "Overdue").reduce((s, v) => s + Number(v.amount), 0);
      setVouchers(vouchersData);
      setStudents(studentData || []);
      setStats({ students: sc || 0, teachers: tc || 0, classes: cc || 0, feeCollected, feePending, feeOverdue });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.students.toString(), icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Teachers", value: stats.teachers.toString(), icon: GraduationCap, color: "bg-secondary/10 text-secondary" },
    { label: "Active Classes", value: stats.classes.toString(), icon: BookOpen, color: "bg-accent/10 text-accent-foreground" },
    { label: "Fee Collected", value: `₨ ${stats.feeCollected.toLocaleString("en-PK")}`, icon: CheckCircle, color: "bg-success/10 text-success" },
    { label: "Fee Pending", value: `₨ ${stats.feePending.toLocaleString("en-PK")}`, icon: DollarSign, color: "bg-warning/10 text-warning" },
    { label: "Fee Overdue", value: `₨ ${stats.feeOverdue.toLocaleString("en-PK")}`, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back — here's what's happening at The Country School</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="shadow-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-success" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">
                {loading ? "..." : stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && <ClasswiseFeeMetrics vouchers={vouchers} students={students} />}
    </DashboardLayout>
  );
};

export default Dashboard;
