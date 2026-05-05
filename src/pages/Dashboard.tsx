import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Filter, TrendingDown, Wallet, ClipboardCheck, UserPlus, UserCheck, Cake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface FeeVoucher { student_id: string; amount: number; status: string; month: string; year: number; amount_paid?: number; registration_fee?: number; admission_fee?: number; security_deposit?: number; tuition_fee?: number; annual_charges?: number; trip_charges?: number; books_charges?: number; arrears?: number; late_fee?: number; discount?: number; }
interface Student { id: string; name: string; class: string; section: string | null; gender?: string; parent_user_id?: string | null; date_of_birth?: string | null; }
interface Expense { id: string; expense_head: string; amount: number; month: string; year: number; }
interface AttendanceRecord { id: string; student_id: string; date: string; status: string; }
interface ParentProfile { id: string; user_id: string; full_name: string; phone: string | null; created_at: string; }
interface LinkedStudent { name: string; class: string; section: string | null; }
interface BirthdayPerson { name: string; type: "student" | "teacher" | "staff"; detail: string; date_of_birth: string; }

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];


const Dashboard = () => {
  const [allVouchers, setAllVouchers] = useState<FeeVoucher[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recentParents, setRecentParents] = useState<ParentProfile[]>([]);
  const [birthdayPeople, setBirthdayPeople] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, classes: 0, admissions: 0 });
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: sc }, { count: tc }, { count: cc }, { count: ac }, { data: feeData }, { data: studentData }, { data: expenseData }, { data: attData }, { data: parentData }, { data: teacherData }, { data: staffData }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("admissions").select("*", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("fee_vouchers").select("student_id, amount, status, month, year, amount_paid, registration_fee, admission_fee, security_deposit, tuition_fee, annual_charges, trip_charges, books_charges, arrears, late_fee, discount").limit(20000),
        supabase.from("students").select("id, name, class, section, monthly_fee, gender, parent_user_id, date_of_birth").limit(5000),
        supabase.from("expenses").select("id, expense_head, amount, month, year"),
        supabase.from("attendance_records").select("id, student_id, date, status").gte("date", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]),
        supabase.from("profiles").select("id, user_id, full_name, phone, created_at").eq("role", "parent").order("created_at", { ascending: false }),
        supabase.from("teachers").select("name, subject, date_of_birth").eq("status", "Active"),
        supabase.from("non_teaching_staff" as any).select("name, designation, date_of_birth").eq("status", "Active"),
      ]);
      setAllVouchers(feeData || []);
      setAllExpenses(expenseData || []);
      setStudents(studentData || []);
      setAttendanceRecords(attData || []);
      setRecentParents(parentData || []);
      setCounts({ students: sc || 0, teachers: tc || 0, classes: cc || 0, admissions: ac || 0 });

      // Build birthday list for today & upcoming 7 days
      const today = new Date();
      const birthdays: BirthdayPerson[] = [];
      const checkBirthday = (dob: string | null | undefined, name: string, type: BirthdayPerson["type"], detail: string) => {
        if (!dob) return;
        const d = new Date(dob);
        const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        const diff = Math.floor((thisYear.getTime() - today.getTime()) / 86400000);
        if (diff >= 0 && diff <= 7) {
          birthdays.push({ name, type, detail, date_of_birth: dob });
        }
        // Also check if birthday was yesterday (still show)
        if (diff === -1) {
          birthdays.push({ name, type, detail, date_of_birth: dob });
        }
      };
      (studentData || []).forEach((s: any) => checkBirthday(s.date_of_birth, s.name, "student", `Class ${s.class}-${s.section || "A"}`));
      (teacherData || []).forEach((t: any) => checkBirthday(t.date_of_birth, t.name, "teacher", t.subject || "Teacher"));
      (staffData || []).forEach((s: any) => checkBirthday((s as any).date_of_birth, (s as any).name, "staff", (s as any).designation || "Staff"));
      setBirthdayPeople(birthdays);

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

  // Treat Partial vouchers as paid for counts; add the actually-received portion to "collected"
  const feeCollected = filteredVouchers
    .filter(v => v.status === "Paid" || v.status === "Partial")
    .reduce((s, v) => s + (v.status === "Paid" ? Number(v.amount) : Number(v.amount_paid || 0)), 0);
  const feePartial = filteredVouchers.filter(v => v.status === "Partial").reduce((s, v) => s + Number(v.amount_paid || 0), 0);
  const feePending = filteredVouchers
    .filter(v => v.status === "Pending" || v.status === "Partial")
    .reduce((s, v) => s + (v.status === "Pending" ? Number(v.amount) : Math.max(0, Number(v.amount) - Number(v.amount_paid || 0))), 0);
  const feeOverdue = filteredVouchers.filter(v => v.status === "Overdue").reduce((s, v) => s + Number(v.amount), 0);

  // Head-wise summary (Due / Received / Pending) including arrears
  const HEADS: { key: keyof FeeVoucher; label: string }[] = [
    { key: "registration_fee", label: "Registration" },
    { key: "admission_fee", label: "Admission" },
    { key: "security_deposit", label: "Security" },
    { key: "tuition_fee", label: "Tuition" },
    { key: "annual_charges", label: "Annual" },
    { key: "trip_charges", label: "Trip" },
    { key: "books_charges", label: "Books" },
    { key: "arrears", label: "Arrears" },
    { key: "late_fee", label: "Late Fee" },
  ];
  const headSummary = useMemo(() => HEADS.map(({ key, label }) => {
    let due = 0, received = 0;
    filteredVouchers.forEach(v => {
      const headAmt = Number((v as any)[key] || 0);
      if (!headAmt) return;
      due += headAmt;
      const paid = Number(v.amount_paid || 0);
      const total = Number(v.amount || 0);
      if (v.status === "Paid") received += headAmt;
      else if (v.status === "Partial" && total > 0) received += Math.min(headAmt, headAmt * (paid / total));
    });
    return { label, due, received, pending: Math.max(0, due - received) };
  }).filter(h => h.due > 0), [filteredVouchers]);

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

          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Fees", amount: filteredVouchers.reduce((s,v) => s + Number(v.amount), 0), cls: "text-foreground" },
              { label: "Total Received", amount: feeCollected, cls: "text-success" },
              { label: "Partial Received", amount: feePartial, cls: "" , style: { color: "hsl(217 91% 50%)" } as any },
              { label: "Total Pending", amount: feePending, cls: "text-warning" },
              { label: "Total Overdue", amount: feeOverdue, cls: "text-destructive" },
              { label: "Scholarship", amount: students.filter(s => !Number((s as any).monthly_fee || 0)).length, cls: "text-primary", isCount: true },
            ].map((s: any, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4 text-center">
                  <p className={`font-display text-xl font-bold ${s.cls}`} style={s.style}>
                    {s.isCount ? s.amount : `₨ ${s.amount.toLocaleString("en-PK")}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {headSummary.length > 0 && (
            <Card className="mb-4 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Fee Head-wise Summary {filterLabel !== "All Time" ? `— ${filterLabel}` : ""}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Head</th>
                      <th className="px-3 py-2 text-right font-medium">Due</th>
                      <th className="px-3 py-2 text-right font-medium">Received</th>
                      <th className="px-3 py-2 text-right font-medium">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headSummary.map(h => (
                      <tr key={h.label} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{h.label}</td>
                        <td className="px-3 py-2 text-right">₨ {Math.round(h.due).toLocaleString("en-PK")}</td>
                        <td className="px-3 py-2 text-right text-success">₨ {Math.round(h.received).toLocaleString("en-PK")}</td>
                        <td className="px-3 py-2 text-right text-warning">₨ {Math.round(h.pending).toLocaleString("en-PK")}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-muted/30 font-semibold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right">₨ {Math.round(headSummary.reduce((s,h) => s+h.due, 0)).toLocaleString("en-PK")}</td>
                      <td className="px-3 py-2 text-right text-success">₨ {Math.round(headSummary.reduce((s,h) => s+h.received, 0)).toLocaleString("en-PK")}</td>
                      <td className="px-3 py-2 text-right text-warning">₨ {Math.round(headSummary.reduce((s,h) => s+h.pending, 0)).toLocaleString("en-PK")}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {chartData.length > 0 && (
            <Card className="mb-4 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Monthly Fee Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: number) => `₨ ${value.toLocaleString("en-PK")}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                    <Legend />
                    <Bar dataKey="paid" name="Paid" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (v: number) => v > 0 ? `${(v/1000).toFixed(0)}k` : '', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Bar dataKey="pending" name="Pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (v: number) => v > 0 ? `${(v/1000).toFixed(0)}k` : '', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Bar dataKey="overdue" name="Overdue" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (v: number) => v > 0 ? `${(v/1000).toFixed(0)}k` : '', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
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
                    <BarChart data={enrollmentByClass} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Bar dataKey="count" name="Students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} />
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
                         ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value, percent, x, y, textAnchor }) => (
                          <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" className="fill-foreground text-xs font-medium">
                            {`${name} ${value} (${(percent * 100).toFixed(0)}%)`}
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

          {/* Birthday Alerts */}
          {birthdayPeople.length > 0 && (
            <Card className="mb-4 shadow-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Cake className="h-5 w-5 text-primary" /> 🎂 Birthday Alerts
                  <Badge variant="secondary" className="ml-2 text-xs">{birthdayPeople.length} upcoming</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                  {birthdayPeople.map((bp, i) => {
                    const dob = new Date(bp.date_of_birth);
                    const today = new Date();
                    const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                    const diffDays = Math.floor((thisYearBday.getTime() - today.getTime()) / 86400000);
                    const isToday = diffDays === 0;
                    const label = isToday ? "Today! 🎉" : diffDays === 1 ? "Tomorrow" : diffDays < 0 ? "Yesterday" : `In ${diffDays} days`;
                    const age = today.getFullYear() - dob.getFullYear();
                    return (
                      <div key={i} className="flex items-center justify-between py-2.5 gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${isToday ? "bg-primary/20" : "bg-muted"}`}>
                            🎂
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{bp.name}</p>
                            <p className="text-xs text-muted-foreground">{bp.detail} · Turning {age}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={bp.type === "student" ? "default" : "secondary"} className="text-[10px]">
                            {bp.type === "student" ? "Student" : bp.type === "teacher" ? "Teacher" : "Staff"}
                          </Badge>
                          <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Parent Signups with Linking Status */}
          <Card className="mt-4 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" /> Parent Accounts
                {recentParents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{recentParents.length} total</Badge>
                )}
                {(() => {
                  const unlinked = recentParents.filter(p => !students.some(s => s.parent_user_id === p.user_id)).length;
                  return unlinked > 0 ? <Badge variant="destructive" className="text-xs">{unlinked} unlinked</Badge> : null;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentParents.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground text-sm">No parent signups yet.</p>
              ) : (
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {recentParents.map(parent => {
                    const joinedAgo = getTimeAgo(parent.created_at);
                    const linkedStudents = students.filter(s => s.parent_user_id === parent.user_id);
                    const isLinked = linkedStudents.length > 0;
                    return (
                      <div key={parent.id} className="flex items-center justify-between py-3 gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm ${isLinked ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {parent.full_name?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{parent.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{parent.phone || "No phone"}</p>
                            {isLinked ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {linkedStudents.map(s => (
                                  <Badge key={s.id} variant="outline" className="text-[10px] bg-success/5 border-success/30 text-success">
                                    {s.name} ({s.class}-{s.section || "A"})
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px] mt-1 bg-destructive/5 border-destructive/30 text-destructive">
                                Not linked to any student
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="outline" className="text-[10px]">{joinedAgo}</Badge>
                          <Badge variant={isLinked ? "default" : "destructive"} className="text-[10px]">
                            {isLinked ? "Linked" : "Unlinked"}
                          </Badge>
                        </div>
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
