import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface FeeVoucher { student_id: string; amount: number; status: string; month: string; year: number; }
interface Student { id: string; name: string; class: string; section: string | null; }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Dashboard = () => {
  const [allVouchers, setAllVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, classes: 0 });
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: sc }, { count: tc }, { count: cc }, { data: feeData }, { data: studentData }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("fee_vouchers").select("student_id, amount, status, month, year"),
        supabase.from("students").select("id, name, class, section"),
      ]);
      setAllVouchers(feeData || []);
      setStudents(studentData || []);
      setCounts({ students: sc || 0, teachers: tc || 0, classes: cc || 0 });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const availableYears = useMemo(() => [...new Set(allVouchers.map(v => v.year))].sort((a, b) => b - a), [allVouchers]);
  const availableMonths = useMemo(() => {
    const months = [...new Set(allVouchers.map(v => v.month))];
    return MONTHS.filter(m => months.includes(m));
  }, [allVouchers]);

  const filteredVouchers = useMemo(() => {
    return allVouchers.filter(v => {
      if (selectedMonth !== "all" && v.month !== selectedMonth) return false;
      if (selectedYear !== "all" && v.year !== Number(selectedYear)) return false;
      return true;
    });
  }, [allVouchers, selectedMonth, selectedYear]);

  const feeCollected = filteredVouchers.filter(v => v.status === "Paid").reduce((s, v) => s + Number(v.amount), 0);
  const feePending = filteredVouchers.filter(v => v.status === "Pending").reduce((s, v) => s + Number(v.amount), 0);
  const feeOverdue = filteredVouchers.filter(v => v.status === "Overdue").reduce((s, v) => s + Number(v.amount), 0);

  const statCards = [
    { label: "Total Students", value: counts.students.toString(), icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Teachers", value: counts.teachers.toString(), icon: GraduationCap, color: "bg-secondary/10 text-secondary" },
    { label: "Active Classes", value: counts.classes.toString(), icon: BookOpen, color: "bg-accent/10 text-accent-foreground" },
    { label: "Fee Collected", value: `₨ ${feeCollected.toLocaleString("en-PK")}`, icon: CheckCircle, color: "bg-success/10 text-success" },
    { label: "Fee Pending", value: `₨ ${feePending.toLocaleString("en-PK")}`, icon: DollarSign, color: "bg-warning/10 text-warning" },
    { label: "Fee Overdue", value: `₨ ${feeOverdue.toLocaleString("en-PK")}`, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  ];

  const filterLabel = selectedMonth === "all" && selectedYear === "all"
    ? "All Time"
    : `${selectedMonth !== "all" ? selectedMonth : "All Months"} ${selectedYear !== "all" ? selectedYear : ""}`.trim();

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

      {!loading && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Fee Metrics: {filterLabel}</span>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Fees", amount: feeCollected + feePending + feeOverdue, cls: "text-foreground" },
              { label: "Total Paid", amount: feeCollected, cls: "text-success" },
              { label: "Total Pending", amount: feePending, cls: "text-warning" },
              { label: "Total Overdue", amount: feeOverdue, cls: "text-destructive" },
            ].map((s, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4 text-center">
                  <p className={`font-display text-xl font-bold ${s.cls}`}>₨ {s.amount.toLocaleString("en-PK")}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <ClasswiseFeeMetrics vouchers={filteredVouchers} students={students} />
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
