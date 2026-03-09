import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Filter, TrendingDown, Wallet, ClipboardCheck, UserPlus, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface FeeVoucher { student_id: string; amount: number; status: string; month: string; year: number; }
interface Student { id: string; name: string; class: string; section: string | null; gender?: string; }
interface Expense { id: string; expense_head: string; amount: number; month: string; year: number; }
interface AttendanceRecord { id: string; student_id: string; date: string; status: string; }
interface ParentProfile { id: string; full_name: string; phone: string | null; created_at: string; }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Dashboard = () => {
  const [allVouchers, setAllVouchers] = useState<FeeVoucher[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recentParents, setRecentParents] = useState<ParentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, classes: 0, admissions: 0 });
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: sc }, { count: tc }, { count: cc }, { count: ac }, { data: feeData }, { data: studentData }, { data: expenseData }, { data: attData }, { data: parentData }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("admissions").select("*", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("fee_vouchers").select("student_id, amount, status, month, year"),
        supabase.from("students").select("id, name, class, section, monthly_fee, gender"),
        supabase.from("expenses").select("id, expense_head, amount, month, year"),
        supabase.from("attendance_records").select("id, student_id, date, status").gte("date", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]),
        supabase.from("profiles").select("id, full_name, phone, created_at").eq("role", "parent").order("created_at", { ascending: false }).limit(10),
      ]);
      setAllVouchers(feeData || []);
      setAllExpenses(expenseData || []);
      setStudents(studentData || []);
      setAttendanceRecords(attData || []);
      setRecentParents(parentData || []);
      setCounts({ students: sc || 0, teachers: tc || 0, classes: cc || 0, admissions: ac || 0 });
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

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      if (selectedMonth !== "all" && e.month !== selectedMonth) return false;
      if (selectedYear !== "all" && e.year !== Number(selectedYear)) return false;
      return true;
    });
  }, [allExpenses, selectedMonth, selectedYear]);

  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netBalance = feeCollected - totalExpenses;

  const expenseByHead = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.expense_head] = (map[e.expense_head] || 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    const monthMap: Record<string, { paid: number; pending: number; overdue: number }> = {};
    allVouchers.forEach(v => {
      const key = `${v.month.slice(0, 3)} ${v.year}`;
      if (!monthMap[key]) monthMap[key] = { paid: 0, pending: 0, overdue: 0 };
      const amt = Number(v.amount);
      if (v.status === "Paid") monthMap[key].paid += amt;
      else if (v.status === "Pending") monthMap[key].pending += amt;
      else if (v.status === "Overdue") monthMap[key].overdue += amt;
    });
    // Sort by year and month order
    return Object.entries(monthMap)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => {
        const parse = (n: string) => {
          const [m, y] = n.split(" ");
          return Number(y) * 100 + MONTHS.findIndex(mo => mo.startsWith(m));
        };
        return parse(a.name) - parse(b.name);
      });
  }, [allVouchers]);

  // Enrollment by class
  const enrollmentByClass = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach(s => { map[s.class] = (map[s.class] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  // Attendance summary (last 30 days)
  const attendanceSummary = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === "present").length;
    const absent = attendanceRecords.filter(a => a.status === "absent").length;
    const late = attendanceRecords.filter(a => a.status === "late").length;
    return { total, present, absent, late, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [attendanceRecords]);

  const COLORS = ["hsl(142,71%,45%)", "hsl(0,84%,60%)", "hsl(38,92%,50%)"];

  const statCards = [
    { label: "Total Students", value: counts.students.toString(), icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Teachers", value: counts.teachers.toString(), icon: GraduationCap, color: "bg-secondary/10 text-secondary" },
    { label: "Active Classes", value: counts.classes.toString(), icon: BookOpen, color: "bg-accent/10 text-accent-foreground" },
    { label: "Pending Admissions", value: counts.admissions.toString(), icon: UserPlus, color: "bg-secondary/10 text-secondary" },
    { label: "Fee Collected", value: `₨ ${feeCollected.toLocaleString("en-PK")}`, icon: CheckCircle, color: "bg-success/10 text-success" },
    { label: "Fee Pending", value: `₨ ${feePending.toLocaleString("en-PK")}`, icon: DollarSign, color: "bg-warning/10 text-warning" },
    { label: "Fee Overdue", value: `₨ ${feeOverdue.toLocaleString("en-PK")}`, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
    { label: "Attendance (30d)", value: `${attendanceSummary.rate}%`, icon: ClipboardCheck, color: "bg-primary/10 text-primary" },
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

          {chartData.length > 0 && (
            <Card className="mb-4 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Monthly Fee Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: number) => `₨ ${value.toLocaleString("en-PK")}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                    <Legend />
                    <Bar dataKey="paid" name="Paid" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Enrollment by Class & Attendance Summary */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {enrollmentByClass.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg">Students by Class</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={enrollmentByClass} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Bar dataKey="count" name="Students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" /> Attendance Summary (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceSummary.total === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No attendance data available.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={[
                          { name: "Present", value: attendanceSummary.present },
                          { name: "Absent", value: attendanceSummary.absent },
                          { name: "Late", value: attendanceSummary.late },
                        ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent, x, y, textAnchor }) => (
                          <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" className="fill-foreground text-xs font-medium">
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        )}>
                          {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ background: COLORS[0] }} /><span className="text-sm">Present: {attendanceSummary.present}</span></div>
                      <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ background: COLORS[1] }} /><span className="text-sm">Absent: {attendanceSummary.absent}</span></div>
                      <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ background: COLORS[2] }} /><span className="text-sm">Late: {attendanceSummary.late}</span></div>
                      <p className="text-xs text-muted-foreground mt-2">Total Records: {attendanceSummary.total}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <ClasswiseFeeMetrics vouchers={filteredVouchers} students={students} />

          {/* Balance Sheet */}
          <Card className="mt-4 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Balance Sheet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Income (Paid)</p>
                  <p className="font-display text-lg font-bold text-success">₨ {feeCollected.toLocaleString("en-PK")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="font-display text-lg font-bold text-destructive">₨ {totalExpenses.toLocaleString("en-PK")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Net Balance</p>
                  <p className={`font-display text-lg font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
                    ₨ {netBalance.toLocaleString("en-PK")}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Pending Receivables</p>
                  <p className="font-display text-lg font-bold text-warning">₨ {(feePending + feeOverdue).toLocaleString("en-PK")}</p>
                </div>
              </div>
              {expenseByHead.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Top Expense Heads</p>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {expenseByHead.slice(0, 8).map(([head, total]) => (
                      <div key={head} className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-2">
                        <span className="text-xs text-muted-foreground truncate mr-2">{head}</span>
                        <span className="text-xs font-semibold text-foreground whitespace-nowrap">₨ {total.toLocaleString("en-PK")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Parent Signups */}
          <Card className="mt-4 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" /> Recent Parent Signups
                {recentParents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{recentParents.length} recent</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentParents.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground text-sm">No parent signups yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentParents.map(parent => {
                    const joinedAgo = getTimeAgo(parent.created_at);
                    return (
                      <div key={parent.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {parent.full_name?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{parent.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{parent.phone || "No phone"}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{joinedAgo}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
