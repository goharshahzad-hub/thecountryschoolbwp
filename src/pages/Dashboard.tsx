import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, feeCollected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: sc }, { count: tc }, { count: cc }, { data: feeData }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("fee_vouchers").select("amount").eq("status", "Paid"),
      ]);
      const feeCollected = feeData?.reduce((s, v) => s + Number(v.amount), 0) || 0;
      setStats({ students: sc || 0, teachers: tc || 0, classes: cc || 0, feeCollected });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.students.toString(), icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Teachers", value: stats.teachers.toString(), icon: GraduationCap, color: "bg-secondary/10 text-secondary" },
    { label: "Active Classes", value: stats.classes.toString(), icon: BookOpen, color: "bg-accent/10 text-accent-foreground" },
    { label: "Fee Collected", value: `₨ ${stats.feeCollected.toLocaleString("en-PK")}`, icon: DollarSign, color: "bg-success/10 text-success" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back — here's what's happening at The Country School</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading dashboard data..." : 
              stats.students === 0 && stats.teachers === 0 
                ? "No data yet. Start by adding students, teachers, and classes from the sidebar." 
                : `You have ${stats.students} active students, ${stats.teachers} teachers, and ${stats.classes} classes configured.`
            }
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;
