import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import SearchableCombobox from "@/components/SearchableCombobox";
import { History, Filter, Download, Printer } from "lucide-react";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";

interface PaymentRow {
  id: string;
  receipt_no: string;
  payment_date: string;
  student_id: string | null;
  voucher_id: string | null;
  fee_head: string;
  description: string;
  amount: number;
  payment_method: string;
  remarks: string;
  created_at: string;
}
interface Student { id: string; student_id: string; name: string; class: string; section: string | null; father_name: string; parent_user_id: string | null; }
interface Voucher { id: string; voucher_no: string; month: string; year: number; status: string; }
interface ResultRow { id: string; student_id: string; subject_id: string; obtained_marks: number; total_marks: number; exam_type: string; term: string; exam_date: string | null; }
interface Attendance { id: string; student_id: string; date: string; status: string; }

const PaymentHistory = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [parents, setParents] = useState<{ user_id: string; full_name: string; phone: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [studentId, setStudentId] = useState("");
  const [parentId, setParentId] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    (async () => {
      const [p, v, s, r, a, parProfs] = await Promise.all([
        supabase.from("payment_records" as any).select("*").order("payment_date", { ascending: false }),
        supabase.from("fee_vouchers").select("id, voucher_no, month, year, status"),
        supabase.from("students").select("id, student_id, name, class, section, father_name, parent_user_id"),
        supabase.from("test_results").select("id, student_id, subject_id, obtained_marks, total_marks, exam_type, term, exam_date").order("exam_date", { ascending: false }).limit(500),
        supabase.from("attendance_records").select("id, student_id, date, status").order("date", { ascending: false }).limit(1000),
        supabase.from("profiles").select("user_id, full_name, phone").eq("role", "parent"),
      ]);
      setPayments((p.data as any) || []);
      setVouchers((v.data as any) || []);
      setStudents((s.data as any) || []);
      setResults((r.data as any) || []);
      setAttendance((a.data as any) || []);
      setParents((parProfs.data as any) || []);
      setLoading(false);
    })();
  }, []);

  const sMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const vMap = useMemo(() => new Map(vouchers.map((v) => [v.id, v])), [vouchers]);

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class))).sort(), [students]);

  const matchesStudent = (sid: string | null) => {
    if (!sid) return !studentId && !parentId && !classFilter;
    const st = sMap.get(sid);
    if (!st) return false;
    if (studentId && sid !== studentId) return false;
    if (parentId && st.parent_user_id !== parentId) return false;
    if (classFilter && st.class !== classFilter) return false;
    return true;
  };
  const inDateRange = (d: string) => (!from || d >= from) && (!to || d <= to);

  const filteredPayments = payments.filter((p) => matchesStudent(p.student_id) && inDateRange(p.payment_date));
  const filteredResults = results.filter((r) => matchesStudent(r.student_id) && inDateRange(r.exam_date || ""));
  const filteredAttendance = attendance.filter((r) => matchesStudent(r.student_id) && inDateRange(r.date));
  const filteredVouchers = vouchers.filter((v) => {
    const recs = payments.filter((p) => p.voucher_id === v.id);
    // Show voucher if any linked payment matches OR if direct student filter matches via payment-link
    return recs.some((p) => matchesStudent(p.student_id) && inDateRange(p.payment_date));
  });

  const printAll = () => {
    const rows = filteredPayments.map((p) => {
      const st = p.student_id ? sMap.get(p.student_id) : null;
      const v = p.voucher_id ? vMap.get(p.voucher_id) : null;
      return `<tr><td>${p.payment_date}</td><td>${p.receipt_no}</td><td>${st?.name || "—"}</td><td>${st ? `${st.class}-${st.section || ""}` : "—"}</td><td>${p.fee_head}</td><td>${v?.voucher_no || "—"}</td><td style="text-align:right">₨ ${Number(p.amount).toLocaleString("en-PK")}</td><td>${p.payment_method}</td></tr>`;
    }).join("");
    const total = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
    const html = `<div class="print-page">${schoolHeader("PAYMENT HISTORY REPORT")}
      <div class="print-info"><div><span>From:</span> ${from || "All"}</div><div><span>To:</span> ${to || "All"}</div><div><span>Records:</span> ${filteredPayments.length}</div></div>
      <table><thead><tr><th>Date</th><th>Receipt No</th><th>Student</th><th>Class</th><th>Head</th><th>Voucher</th><th>Amount</th><th>Method</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="6" style="text-align:right"><strong>Total</strong></td><td style="text-align:right"><strong>₨ ${total.toLocaleString("en-PK")}</strong></td><td></td></tr></tbody></table>
      ${schoolFooter()}</div>`;
    printA4(html, "Payment History Report");
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-3">
        <History className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Activity & Payment History</h1>
          <p className="text-sm text-muted-foreground">Search every payment, result and attendance record by date, class, student or parent.</p>
        </div>
      </div>

      <Card className="shadow-card mb-6">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 font-display text-base"><Filter className="h-4 w-4" />Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Student</label>
              <SearchableCombobox
                options={[{ value: "", label: "All Students" }, ...students.map((s) => ({ value: s.id, label: s.name, sublabel: `${s.student_id} • ${s.class}-${s.section || ""}` }))]}
                value={studentId}
                onChange={setStudentId}
                placeholder="All students"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Parent</label>
              <SearchableCombobox
                options={[{ value: "", label: "All Parents" }, ...parents.map((p) => ({ value: p.user_id, label: p.full_name || "(no name)", sublabel: p.phone || "" }))]}
                value={parentId}
                onChange={setParentId}
                placeholder="All parents"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Class</label>
              <SearchableCombobox
                options={[{ value: "", label: "All Classes" }, ...classes.map((c) => ({ value: c, label: c }))]}
                value={classFilter}
                onChange={setClassFilter}
                placeholder="All classes"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setStudentId(""); setParentId(""); setClassFilter(""); setFrom(""); setTo(""); }}>Clear Filters</Button>
            <Button size="sm" onClick={printAll} className="gradient-primary text-primary-foreground"><Printer className="mr-2 h-4 w-4" />Print Payments</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">Payments ({filteredPayments.length})</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers ({filteredVouchers.length})</TabsTrigger>
          <TabsTrigger value="results">Results ({filteredResults.length})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance ({filteredAttendance.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card><CardContent className="p-0">
            {loading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> :
            filteredPayments.length === 0 ? <p className="p-8 text-center text-muted-foreground">No payments match your filters.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Head</TableHead><TableHead>Voucher</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead></TableRow></TableHeader>
              <TableBody>{filteredPayments.map((p) => {
                const st = p.student_id ? sMap.get(p.student_id) : null;
                const v = p.voucher_id ? vMap.get(p.voucher_id) : null;
                return <TableRow key={p.id}><TableCell>{p.payment_date}</TableCell><TableCell className="font-mono text-xs">{p.receipt_no}</TableCell><TableCell>{st?.name || "—"}{st && <span className="text-xs text-muted-foreground"> • {st.class}-{st.section || ""}</span>}</TableCell><TableCell><Badge variant="outline">{p.fee_head}</Badge></TableCell><TableCell className="font-mono text-xs">{v?.voucher_no || "—"}</TableCell><TableCell className="text-right font-bold">₨ {Number(p.amount).toLocaleString("en-PK")}</TableCell><TableCell>{p.payment_method}</TableCell></TableRow>;
              })}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card><CardContent className="p-0">
            {filteredVouchers.length === 0 ? <p className="p-8 text-center text-muted-foreground">No vouchers paid in this filter range.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>Voucher</TableHead><TableHead>Month</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{filteredVouchers.map((v) => <TableRow key={v.id}><TableCell className="font-mono text-xs">{v.voucher_no}</TableCell><TableCell>{v.month}</TableCell><TableCell>{v.year}</TableCell><TableCell><Badge>{v.status}</Badge></TableCell></TableRow>)}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="results">
          <Card><CardContent className="p-0">
            {filteredResults.length === 0 ? <p className="p-8 text-center text-muted-foreground">No results match your filters.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Term / Exam</TableHead><TableHead className="text-right">Marks</TableHead></TableRow></TableHeader>
              <TableBody>{filteredResults.map((r) => {
                const st = sMap.get(r.student_id);
                return <TableRow key={r.id}><TableCell>{r.exam_date || "—"}</TableCell><TableCell>{st?.name || "—"}</TableCell><TableCell>{r.term} • {r.exam_type}</TableCell><TableCell className="text-right">{r.obtained_marks}/{r.total_marks}</TableCell></TableRow>;
              })}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card><CardContent className="p-0">
            {filteredAttendance.length === 0 ? <p className="p-8 text-center text-muted-foreground">No attendance records match your filters.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{filteredAttendance.map((r) => {
                const st = sMap.get(r.student_id);
                return <TableRow key={r.id}><TableCell>{r.date}</TableCell><TableCell>{st?.name || "—"}</TableCell><TableCell><Badge variant={r.status === "present" ? "default" : "destructive"}>{r.status}</Badge></TableCell></TableRow>;
              })}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PaymentHistory;
