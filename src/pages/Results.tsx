import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Printer, BarChart3, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type: string;
  term: string;
  total_marks: number;
  obtained_marks: number;
  grade: string | null;
  remarks: string | null;
  exam_date: string | null;
}

interface Student { id: string; student_id: string; name: string; class: string; section: string | null; father_name: string; }
interface Subject { id: string; name: string; code: string; }

const gradeFromPercent = (p: number) => p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "F";
const gradeColor = (g: string) => g === "A+" || g === "A" ? "border-success/30 text-success" : g === "B" || g === "C" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive";

const Results = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportStudent, setReportStudent] = useState<string>("");
  const [reportTerm, setReportTerm] = useState<string>("Term 1");
  const [annualStudent, setAnnualStudent] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);
  const annualPrintRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    student_id: "", subject_id: "", exam_type: "Monthly Test", term: "Term 1",
    total_marks: "100", obtained_marks: "", remarks: "", exam_date: ""
  });

  const fetchData = async () => {
    const [{ data: r }, { data: st }, { data: sub }] = await Promise.all([
      supabase.from("test_results").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section, father_name"),
      supabase.from("subjects").select("*").order("name"),
    ]);
    if (r) setResults(r);
    if (st) setStudents(st);
    if (sub) setSubjects(sub);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStudent = (id: string) => students.find(s => s.id === id);
  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.subject_id || !form.obtained_marks) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const total = parseFloat(form.total_marks);
    const obtained = parseFloat(form.obtained_marks);
    const percent = (obtained / total) * 100;
    const grade = gradeFromPercent(percent);

    setSaving(true);
    const payload = {
      student_id: form.student_id,
      subject_id: form.subject_id,
      exam_type: form.exam_type,
      term: form.term,
      total_marks: total,
      obtained_marks: obtained,
      grade,
      remarks: form.remarks.trim(),
      exam_date: form.exam_date || null,
    };

    const { error } = editingId
      ? await supabase.from("test_results").update(payload).eq("id", editingId)
      : await supabase.from("test_results").insert(payload);

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingId ? "Updated" : "Result Added" }); setDialogOpen(false); setEditingId(null); fetchData(); }
  };

  const handleEdit = (r: TestResult) => {
    setForm({
      student_id: r.student_id, subject_id: r.subject_id, exam_type: r.exam_type, term: r.term,
      total_marks: r.total_marks.toString(), obtained_marks: r.obtained_marks.toString(),
      remarks: r.remarks || "", exam_date: r.exam_date || ""
    });
    setEditingId(r.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this result?")) return;
    await supabase.from("test_results").delete().eq("id", id);
    fetchData();
    toast({ title: "Deleted" });
  };

  const handlePrintReport = () => {
    if (!reportStudent) { toast({ title: "Error", description: "Select a student first", variant: "destructive" }); return; }
    setTimeout(() => {
      const content = printRef.current;
      if (!content) return;
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<html><head><title>Report Card</title><style>
        body{font-family:Arial,sans-serif;padding:20px;color:#222}
        .report{border:2px solid #333;padding:24px;max-width:700px;margin:auto}
        .header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:16px}
        .header h1{font-size:22px;margin:0;color:#c0392b}
        .header h2{font-size:16px;margin:4px 0}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:13px}
        .info div span{font-weight:bold}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #333;padding:8px;text-align:center}
        th{background:#f0f0f0}
        .total-row{font-weight:bold;background:#f9f9f9}
        .grade-summary{margin-top:16px;text-align:center;font-size:16px}
        .footer{text-align:center;margin-top:24px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:12px}
        .signatures{display:flex;justify-content:space-between;margin-top:40px;font-size:12px}
        .signatures div{text-align:center;border-top:1px solid #333;padding-top:4px;width:150px}
        @media print{body{padding:0}}
      </style></head><body>${content.innerHTML}<script>window.print();window.close()</script></body></html>`);
      win.document.close();
    }, 100);
  };

  const studentResults = results.filter(r => r.student_id === reportStudent && r.term === reportTerm);
  const student = getStudent(reportStudent);

  const filtered = results.filter(r => {
    const s = getStudent(r.student_id);
    const sub = getSubject(r.subject_id);
    return s?.name.toLowerCase().includes(search.toLowerCase()) ||
      s?.student_id.toLowerCase().includes(search.toLowerCase()) ||
      sub?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Test Results & Report Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record marks and generate report cards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Result</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Result" : "Add Test Result"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Student *</Label>
                <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.student_id} - {s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <Select value={form.exam_type} onValueChange={v => setForm({ ...form, exam_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly Test">Monthly Test</SelectItem>
                    <SelectItem value="Mid Term">Mid Term</SelectItem>
                    <SelectItem value="Final Term">Final Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Total Marks</Label><Input type="number" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: e.target.value })} /></div>
              <div className="space-y-2"><Label>Obtained Marks *</Label><Input type="number" value={form.obtained_marks} onChange={e => setForm({ ...form, obtained_marks: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Exam Date</Label><Input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
              <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Add Result"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Card Generator */}
      <Card className="mb-6 shadow-card">
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Generate Report Card</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Select Student</Label>
              <Select value={reportStudent} onValueChange={setReportStudent}>
                <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.student_id} - {s.name} (Class {s.class})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={reportTerm} onValueChange={setReportTerm}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={handlePrintReport} variant="outline" disabled={!reportStudent}>
              <Printer className="mr-2 h-4 w-4" />Print Report Card
            </Button>
          </div>

          {reportStudent && studentResults.length > 0 && (
            <div className="mt-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Subject</TableHead><TableHead>Total</TableHead><TableHead>Obtained</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead>Remarks</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {studentResults.map(r => {
                    const pct = ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{getSubject(r.subject_id)?.name}</TableCell>
                        <TableCell>{r.total_marks}</TableCell>
                        <TableCell>{r.obtained_marks}</TableCell>
                        <TableCell>{pct}%</TableCell>
                        <TableCell><Badge variant="outline" className={gradeColor(r.grade || "")}>{r.grade}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.remarks}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell>{studentResults.reduce((s, r) => s + Number(r.total_marks), 0)}</TableCell>
                    <TableCell>{studentResults.reduce((s, r) => s + Number(r.obtained_marks), 0)}</TableCell>
                    <TableCell>{((studentResults.reduce((s, r) => s + Number(r.obtained_marks), 0) / studentResults.reduce((s, r) => s + Number(r.total_marks), 0)) * 100).toFixed(1)}%</TableCell>
                    <TableCell colSpan={2}>
                      <Badge variant="outline" className={gradeColor(gradeFromPercent((studentResults.reduce((s, r) => s + Number(r.obtained_marks), 0) / studentResults.reduce((s, r) => s + Number(r.total_marks), 0)) * 100))}>
                        {gradeFromPercent((studentResults.reduce((s, r) => s + Number(r.obtained_marks), 0) / studentResults.reduce((s, r) => s + Number(r.total_marks), 0)) * 100)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Results Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search results..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead>Term</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No results</TableCell></TableRow> :
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{getStudent(r.student_id)?.name}</TableCell>
                    <TableCell>{getSubject(r.subject_id)?.name}</TableCell>
                    <TableCell className="text-xs">{r.exam_type}</TableCell>
                    <TableCell>{r.term}</TableCell>
                    <TableCell>{r.obtained_marks}/{r.total_marks}</TableCell>
                    <TableCell><Badge variant="outline" className={gradeColor(r.grade || "")}>{r.grade}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden print template for report card */}
      <div className="hidden">
        <div ref={printRef}>
          {student && studentResults.length > 0 && (() => {
            const totalMarks = studentResults.reduce((s, r) => s + Number(r.total_marks), 0);
            const obtainedMarks = studentResults.reduce((s, r) => s + Number(r.obtained_marks), 0);
            const overallPct = (obtainedMarks / totalMarks) * 100;
            return (
              <div className="report">
                <div className="header">
                  <h1>The Country School — Fahad Campus</h1>
                  <h2>REPORT CARD / RESULT CARD</h2>
                  <p>Academic Year {new Date().getFullYear()}</p>
                </div>
                <div className="info">
                  <div>Student ID: <span>{student.student_id}</span></div>
                  <div>Name: <span>{student.name}</span></div>
                  <div>Father's Name: <span>{student.father_name}</span></div>
                  <div>Class: <span>{student.class}-{student.section}</span></div>
                  <div>Term: <span>{reportTerm}</span></div>
                </div>
                <table>
                  <thead>
                    <tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th><th>Percentage</th><th>Grade</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {studentResults.map(r => (
                      <tr key={r.id}>
                        <td style={{ textAlign: "left" }}>{getSubject(r.subject_id)?.name}</td>
                        <td>{r.total_marks}</td>
                        <td>{r.obtained_marks}</td>
                        <td>{((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1)}%</td>
                        <td><strong>{r.grade}</strong></td>
                        <td style={{ fontSize: "11px" }}>{r.remarks || "—"}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td style={{ textAlign: "left" }}><strong>Grand Total</strong></td>
                      <td><strong>{totalMarks}</strong></td>
                      <td><strong>{obtainedMarks}</strong></td>
                      <td><strong>{overallPct.toFixed(1)}%</strong></td>
                      <td><strong>{gradeFromPercent(overallPct)}</strong></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <div className="grade-summary">
                  Overall Grade: <strong>{gradeFromPercent(overallPct)}</strong> | 
                  Position: _____ | 
                  Attendance: _____%
                </div>
                <div className="signatures">
                  <div>Class Teacher</div>
                  <div>Principal</div>
                  <div>Parent's Signature</div>
                </div>
                <div className="footer">
                  <p>📞 +92 322 6107000 | 📧 thecountryschoolbwp@gmail.com</p>
                  <p>This is a computer-generated report card.</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Results;
