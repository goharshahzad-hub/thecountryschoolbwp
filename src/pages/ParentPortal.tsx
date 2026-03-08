import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/logo.jpg";
import { LogOut, User, GraduationCap, ClipboardCheck, BookOpen, Receipt, Calendar, FileText } from "lucide-react";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  status: string;
  fee_status: string;
  father_name: string;
  gender: string;
  phone: string | null;
  whatsapp: string | null;
  monthly_fee: number | null;
  photo_url: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  student_id: string;
}

interface FeeVoucher {
  id: string;
  voucher_no: string;
  month: string;
  year: number;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  tuition_fee: number;
  discount: number;
  arrears: number;
  late_fee: number;
  student_id: string;
}

interface TestResult {
  id: string;
  exam_type: string;
  term: string;
  obtained_marks: number;
  total_marks: number;
  grade: string | null;
  exam_date: string | null;
  student_id: string;
  subjects: { name: string } | null;
}

interface TimetableEntry {
  id: string;
  class_name: string;
  section: string;
  day_of_week: string;
  time_slot: string;
  subject: string;
  teacher_name: string | null;
}

const ParentPortal = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [feeVouchers, setFeeVouchers] = useState<FeeVoucher[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/parent-login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfileName(data.full_name || user.email || "");
      });

    supabase
      .from("students")
      .select("*")
      .eq("parent_user_id", user.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setStudents(data);

        const studentIds = data.map(s => s.id);
        const classKeys = [...new Set(data.map(s => `${s.class}|||${s.section || "A"}`))];

        // Fetch attendance, fee vouchers, test results in parallel
        supabase
          .from("attendance_records")
          .select("*")
          .in("student_id", studentIds)
          .order("date", { ascending: false })
          .then(({ data: d }) => { if (d) setAttendance(d); });

        supabase
          .from("fee_vouchers")
          .select("*")
          .in("student_id", studentIds)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(50)
          .then(({ data: d }) => { if (d) setFeeVouchers(d); });

        supabase
          .from("test_results")
          .select("*, subjects(name)")
          .in("student_id", studentIds)
          .order("exam_date", { ascending: false })
          .then(({ data: d }) => { if (d) setTestResults(d as any); });

        // Fetch timetable for children's classes
        const timetablePromises = classKeys.map(key => {
          const [cls, sec] = key.split("|||");
          return supabase
            .from("timetable_entries")
            .select("*")
            .eq("class_name", cls)
            .eq("section", sec);
        });
        Promise.all(timetablePromises).then(results => {
          const all = results.flatMap(r => r.data || []);
          setTimetable(all);
        });
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getStudentName = (studentId: string) => students.find(s => s.id === studentId)?.name || "Unknown";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-9 w-9 rounded-full object-cover" />
            <div>
              <p className="font-display text-sm font-bold text-foreground">Parent Portal</p>
              <p className="text-[10px] text-muted-foreground">The Country School</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{profileName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome, {profileName || "Parent"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">View your children's complete academic information</p>
        </div>

        {students.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">No Students Linked</h3>
              <p className="text-center text-sm text-muted-foreground max-w-md">
                Your account hasn't been linked to any students yet. Please contact the school administration to link your children to your account.
              </p>
              <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>📞 +92 322 6107000</p>
                <p>📧 thecountryschoolbwp@gmail.com</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{students.length}</p>
                    <p className="text-xs text-muted-foreground">Children</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <ClipboardCheck className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {attendance.filter(a => a.status === "present").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Present Days</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Receipt className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {feeVouchers.filter(v => v.status === "Pending").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending Fees</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {testResults.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Results</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for all sections */}
            <Tabs defaultValue="children" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="children">Children</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="timetable">Timetable</TabsTrigger>
              </TabsList>

              {/* Children Tab */}
              <TabsContent value="children">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Your Children</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Father</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Monthly Fee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fee Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map(s => (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                              <TableCell className="font-medium">{s.name}</TableCell>
                              <TableCell>{s.father_name}</TableCell>
                              <TableCell>{s.class}-{s.section || "A"}</TableCell>
                              <TableCell>{s.gender}</TableCell>
                              <TableCell>Rs. {(s.monthly_fee || 0).toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="default" className={s.status === "Active" ? "bg-success text-success-foreground" : ""}>{s.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  s.fee_status === "Paid" ? "border-success/30 text-success" :
                                  s.fee_status === "Pending" ? "border-warning/30 text-warning" :
                                  "border-destructive/30 text-destructive"
                                }>{s.fee_status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                {/* Monthly Summary per Child */}
                {students.map(student => {
                  const studentAtt = attendance.filter(a => a.student_id === student.id);
                  // Group by month
                  const monthlyMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
                  studentAtt.forEach(a => {
                    const d = new Date(a.date);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    if (!monthlyMap[key]) monthlyMap[key] = { present: 0, absent: 0, late: 0, total: 0 };
                    monthlyMap[key].total++;
                    if (a.status === "present") monthlyMap[key].present++;
                    else if (a.status === "absent") monthlyMap[key].absent++;
                    else if (a.status === "late") monthlyMap[key].late++;
                  });
                  const months = Object.keys(monthlyMap).sort().reverse();

                  return (
                    <Card key={student.id} className="mb-4 shadow-card">
                      <CardHeader>
                        <CardTitle className="font-display text-lg">{student.name} — Monthly Attendance</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {months.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">No attendance records.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Month</TableHead>
                                  <TableHead>Present</TableHead>
                                  <TableHead>Absent</TableHead>
                                  <TableHead>Late</TableHead>
                                  <TableHead>Total Days</TableHead>
                                  <TableHead>Attendance %</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {months.map(m => {
                                  const d = monthlyMap[m];
                                  const pct = d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 0;
                                  const [yr, mo] = m.split("-");
                                  const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" });
                                  return (
                                    <TableRow key={m}>
                                      <TableCell className="font-medium">{label}</TableCell>
                                      <TableCell className="text-success font-semibold">{d.present}</TableCell>
                                      <TableCell className="text-destructive font-semibold">{d.absent}</TableCell>
                                      <TableCell className="text-warning font-semibold">{d.late}</TableCell>
                                      <TableCell>{d.total}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={
                                          pct >= 90 ? "border-success/30 text-success" :
                                          pct >= 75 ? "border-warning/30 text-warning" :
                                          "border-destructive/30 text-destructive"
                                        }>{pct}%</Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Detailed Records */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Detailed Records</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {attendance.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No attendance records found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendance.slice(0, 50).map(a => (
                              <TableRow key={a.id}>
                                <TableCell>{new Date(a.date).toLocaleDateString("en-PK", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</TableCell>
                                <TableCell className="font-medium">{getStudentName(a.student_id)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    a.status === "present" ? "border-success/30 text-success" :
                                    a.status === "absent" ? "border-destructive/30 text-destructive" :
                                    "border-warning/30 text-warning"
                                  }>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Fee Vouchers</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {feeVouchers.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No fee vouchers found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Voucher #</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Month</TableHead>
                              <TableHead>Tuition</TableHead>
                              <TableHead>Discount</TableHead>
                              <TableHead>Arrears</TableHead>
                              <TableHead>Late Fee</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {feeVouchers.map(v => (
                              <TableRow key={v.id}>
                                <TableCell className="font-mono text-xs">{v.voucher_no}</TableCell>
                                <TableCell className="font-medium">{getStudentName(v.student_id)}</TableCell>
                                <TableCell>{v.month} {v.year}</TableCell>
                                <TableCell>Rs. {v.tuition_fee.toLocaleString()}</TableCell>
                                <TableCell className="text-success">-Rs. {v.discount.toLocaleString()}</TableCell>
                                <TableCell>Rs. {v.arrears.toLocaleString()}</TableCell>
                                <TableCell>Rs. {v.late_fee.toLocaleString()}</TableCell>
                                <TableCell className="font-semibold">Rs. {v.amount.toLocaleString()}</TableCell>
                                <TableCell>{new Date(v.due_date).toLocaleDateString("en-PK")}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    v.status === "Paid" ? "border-success/30 text-success" :
                                    v.status === "Pending" ? "border-warning/30 text-warning" :
                                    "border-destructive/30 text-destructive"
                                  }>{v.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results">
                {students.map(student => {
                  const studentResults = testResults.filter(r => r.student_id === student.id);
                  if (studentResults.length === 0) {
                    return (
                      <Card key={student.id} className="mb-4 shadow-card">
                        <CardHeader><CardTitle className="font-display text-lg">{student.name} — Results</CardTitle></CardHeader>
                        <CardContent><p className="py-4 text-center text-sm text-muted-foreground">No results found.</p></CardContent>
                      </Card>
                    );
                  }

                  // Monthly Tests
                  const monthlyTests = studentResults.filter(r => r.exam_type === "Monthly Test");
                  const monthlyByMonth: Record<string, typeof studentResults> = {};
                  monthlyTests.forEach(r => {
                    const key = r.exam_date ? new Date(r.exam_date).toLocaleDateString("en-PK", { month: "long", year: "numeric" }) : "Unknown";
                    if (!monthlyByMonth[key]) monthlyByMonth[key] = [];
                    monthlyByMonth[key].push(r);
                  });

                  // Term Results
                  const terms = ["Term 1", "Term 2", "Term 3"];
                  const termResults: Record<string, typeof studentResults> = {};
                  terms.forEach(t => {
                    const tr = studentResults.filter(r => r.term === t && r.exam_type !== "Monthly Test");
                    if (tr.length > 0) termResults[t] = tr;
                  });

                  // Annual (all terms combined)
                  const allTermResults = studentResults.filter(r => r.exam_type !== "Monthly Test");
                  const subjectMap: Record<string, { name: string; terms: Record<string, { obtained: number; total: number }> }> = {};
                  allTermResults.forEach(r => {
                    const subName = r.subjects?.name || "Unknown";
                    const subId = r.subject_id || subName;
                    if (!subjectMap[subId]) subjectMap[subId] = { name: subName, terms: {} };
                    if (!subjectMap[subId].terms[r.term]) subjectMap[subId].terms[r.term] = { obtained: 0, total: 0 };
                    subjectMap[subId].terms[r.term].obtained += r.obtained_marks;
                    subjectMap[subId].terms[r.term].total += r.total_marks;
                  });

                  const getGrade = (pct: number) => pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "F";
                  const getPctClass = (pct: number) => pct >= 80 ? "border-success/30 text-success" : pct >= 50 ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive";

                  const ResultTable = ({ results }: { results: typeof studentResults }) => {
                    const totalObt = results.reduce((s, r) => s + r.obtained_marks, 0);
                    const totalMax = results.reduce((s, r) => s + r.total_marks, 0);
                    const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;
                    return (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Obtained</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>%</TableHead>
                              <TableHead>Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.map(r => {
                              const pct = r.total_marks > 0 ? Math.round((r.obtained_marks / r.total_marks) * 100) : 0;
                              return (
                                <TableRow key={r.id}>
                                  <TableCell className="font-medium">{r.subjects?.name || "-"}</TableCell>
                                  <TableCell>{r.obtained_marks}</TableCell>
                                  <TableCell>{r.total_marks}</TableCell>
                                  <TableCell><Badge variant="outline" className={getPctClass(pct)}>{pct}%</Badge></TableCell>
                                  <TableCell>{r.grade || getGrade(pct)}</TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/30 font-semibold">
                              <TableCell>Total</TableCell>
                              <TableCell>{totalObt}</TableCell>
                              <TableCell>{totalMax}</TableCell>
                              <TableCell><Badge variant="outline" className={getPctClass(overallPct)}>{overallPct}%</Badge></TableCell>
                              <TableCell>{getGrade(overallPct)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    );
                  };

                  return (
                    <div key={student.id} className="mb-6 space-y-4">
                      <h2 className="font-display text-xl font-bold text-foreground">{student.name} — Academic Record</h2>

                      {/* Monthly Tests */}
                      {Object.keys(monthlyByMonth).length > 0 && (
                        <Card className="shadow-card">
                          <CardHeader><CardTitle className="font-display text-base">📝 Monthly Tests</CardTitle></CardHeader>
                          <CardContent className="space-y-4 p-4">
                            {Object.entries(monthlyByMonth).map(([month, results]) => (
                              <div key={month}>
                                <p className="mb-2 text-sm font-semibold text-muted-foreground">{month}</p>
                                <ResultTable results={results} />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Term-wise Results */}
                      {Object.keys(termResults).length > 0 && (
                        <Card className="shadow-card">
                          <CardHeader><CardTitle className="font-display text-base">📊 Term-wise Results</CardTitle></CardHeader>
                          <CardContent className="space-y-4 p-4">
                            {Object.entries(termResults).map(([term, results]) => (
                              <div key={term}>
                                <p className="mb-2 text-sm font-semibold text-muted-foreground">{term}</p>
                                <ResultTable results={results} />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Annual Report Card */}
                      {Object.keys(subjectMap).length > 0 && (
                        <Card className="shadow-card">
                          <CardHeader><CardTitle className="font-display text-base">🎓 Annual Report Card (All Terms Combined)</CardTitle></CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Subject</TableHead>
                                    {terms.map(t => <TableHead key={t}>{t}</TableHead>)}
                                    <TableHead>Total</TableHead>
                                    <TableHead>%</TableHead>
                                    <TableHead>Grade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(() => {
                                    let grandObt = 0, grandTotal = 0;
                                    const rows = Object.entries(subjectMap).map(([subId, sub]) => {
                                      let subObt = 0, subTotal = 0;
                                      const termCells = terms.map(t => {
                                        const d = sub.terms[t];
                                        if (d) { subObt += d.obtained; subTotal += d.total; }
                                        return <TableCell key={t}>{d ? `${d.obtained}/${d.total}` : "-"}</TableCell>;
                                      });
                                      grandObt += subObt; grandTotal += subTotal;
                                      const pct = subTotal > 0 ? Math.round((subObt / subTotal) * 100) : 0;
                                      return (
                                        <TableRow key={subId}>
                                          <TableCell className="font-medium">{sub.name}</TableCell>
                                          {termCells}
                                          <TableCell className="font-semibold">{subObt}/{subTotal}</TableCell>
                                          <TableCell><Badge variant="outline" className={getPctClass(pct)}>{pct}%</Badge></TableCell>
                                          <TableCell>{getGrade(pct)}</TableCell>
                                        </TableRow>
                                      );
                                    });
                                    const gPct = grandTotal > 0 ? Math.round((grandObt / grandTotal) * 100) : 0;
                                    return (
                                      <>
                                        {rows}
                                        <TableRow className="bg-muted/30 font-semibold">
                                          <TableCell>Grand Total</TableCell>
                                          {terms.map(t => <TableCell key={t}>-</TableCell>)}
                                          <TableCell>{grandObt}/{grandTotal}</TableCell>
                                          <TableCell><Badge variant="outline" className={getPctClass(gPct)}>{gPct}%</Badge></TableCell>
                                          <TableCell>{getGrade(gPct)}</TableCell>
                                        </TableRow>
                                      </>
                                    );
                                  })()}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </TabsContent>

              {/* Timetable Tab */}
              <TabsContent value="timetable">
                {students.map(student => {
                  const classTimetable = timetable
                    .filter(t => t.class_name === student.class && t.section === (student.section || "A"))
                    .sort((a, b) => {
                      const dayDiff = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
                      return dayDiff !== 0 ? dayDiff : a.time_slot.localeCompare(b.time_slot);
                    });

                  const days = [...new Set(classTimetable.map(t => t.day_of_week))].sort(
                    (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
                  );

                  return (
                    <Card key={student.id} className="mb-4 shadow-card">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Timetable — {student.name} (Class {student.class}-{student.section || "A"})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {classTimetable.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">No timetable available for this class.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Day</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Teacher</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {days.map(day => {
                                  const slots = classTimetable.filter(t => t.day_of_week === day);
                                  return slots.map((slot, i) => (
                                    <TableRow key={slot.id}>
                                      {i === 0 && (
                                        <TableCell rowSpan={slots.length} className="font-semibold bg-muted/30 align-top">
                                          {day}
                                        </TableCell>
                                      )}
                                      <TableCell className="text-xs">{slot.time_slot}</TableCell>
                                      <TableCell className="font-medium">{slot.subject}</TableCell>
                                      <TableCell className="text-muted-foreground">{slot.teacher_name || "-"}</TableCell>
                                    </TableRow>
                                  ));
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to school website
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ParentPortal;
