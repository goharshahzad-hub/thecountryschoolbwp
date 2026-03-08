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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Printer, BarChart3, Pencil, Trash2, Users, CalendarDays, MessageCircle } from "lucide-react";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";

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

interface Student { id: string; student_id: string; name: string; class: string; section: string | null; father_name: string; whatsapp: string | null; phone: string | null; }
interface Subject { id: string; name: string; code: string; }

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const gradeFromPercent = (p: number) => p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "F";
const gradeColor = (g: string) => g === "A+" || g === "A" ? "border-success/30 text-success" : g === "B" || g === "C" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive";

const Results = () => {
  const { toast } = useToast();
  const { settings } = useSchoolSettings();
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
  const [classReportClass, setClassReportClass] = useState<string>("");
  const [classReportType, setClassReportType] = useState<string>("term");
  const [classReportTerm, setClassReportTerm] = useState<string>("Term 1");
  const printRef = useRef<HTMLDivElement>(null);
  const annualPrintRef = useRef<HTMLDivElement>(null);
  const classReportRef = useRef<HTMLDivElement>(null);

  // Monthly test bulk entry state
  const [mtBulkClass, setMtBulkClass] = useState("");
  const [mtBulkSubject, setMtBulkSubject] = useState("");
  const [mtBulkMonth, setMtBulkMonth] = useState("");
  const [mtBulkTotalMarks, setMtBulkTotalMarks] = useState("100");
  const [mtBulkExamDate, setMtBulkExamDate] = useState("");
  const [mtBulkMarks, setMtBulkMarks] = useState<Record<string, string>>({});
  const [mtBulkSaving, setMtBulkSaving] = useState(false);

  // Monthly test result card state
  const [mtViewClass, setMtViewClass] = useState("");
  const [mtViewSubject, setMtViewSubject] = useState("");
  const [mtViewMonth, setMtViewMonth] = useState("");

  // Term-wise bulk entry state
  const [bulkClass, setBulkClass] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkTerm, setBulkTerm] = useState("Term 1");
  const [bulkExamType, setBulkExamType] = useState("Mid Term");
  const [bulkTotalMarks, setBulkTotalMarks] = useState("100");
  const [bulkExamDate, setBulkExamDate] = useState("");
  const [bulkMarks, setBulkMarks] = useState<Record<string, string>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  // Monthly test card state (term-wise section)
  const [monthlyClass, setMonthlyClass] = useState("");
  const [monthlySubject, setMonthlySubject] = useState("");
  const [monthlyTerm, setMonthlyTerm] = useState("Term 1");
  const [monthlyExamType, setMonthlyExamType] = useState("Mid Term");

  const [form, setForm] = useState({
    student_id: "", subject_id: "", exam_type: "Monthly Test", term: "Term 1",
    total_marks: "100", obtained_marks: "", remarks: "", exam_date: ""
  });

  const fetchData = async () => {
    const [{ data: r }, { data: st }, { data: sub }] = await Promise.all([
      supabase.from("test_results").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section, father_name, whatsapp, phone"),
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
  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

  // ========== FORM HANDLERS ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.subject_id || !form.obtained_marks) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const total = parseFloat(form.total_marks);
    const obtained = parseFloat(form.obtained_marks);
    const grade = gradeFromPercent((obtained / total) * 100);
    setSaving(true);
    const payload = {
      student_id: form.student_id, subject_id: form.subject_id,
      exam_type: form.exam_type, term: form.term,
      total_marks: total, obtained_marks: obtained, grade,
      remarks: form.remarks.trim(), exam_date: form.exam_date || null,
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

  // ========== MONTHLY TEST (Jan-Dec) HANDLERS ==========
  const mtBulkClassStudents = mtBulkClass ? students.filter(s => s.class === mtBulkClass).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const handleMtBulkSubmit = async () => {
    if (!mtBulkClass || !mtBulkSubject || !mtBulkMonth) {
      toast({ title: "Error", description: "Select class, subject and month", variant: "destructive" });
      return;
    }
    const entries = mtBulkClassStudents
      .filter(s => mtBulkMarks[s.id] && mtBulkMarks[s.id].trim() !== "")
      .map(s => {
        const obtained = parseFloat(mtBulkMarks[s.id]);
        const total = parseFloat(mtBulkTotalMarks);
        return {
          student_id: s.id, subject_id: mtBulkSubject,
          exam_type: "Monthly Test", term: mtBulkMonth,
          total_marks: total, obtained_marks: obtained,
          grade: gradeFromPercent((obtained / total) * 100),
          exam_date: mtBulkExamDate || null, remarks: "",
        };
      });
    if (entries.length === 0) {
      toast({ title: "Error", description: "Enter marks for at least one student", variant: "destructive" });
      return;
    }
    setMtBulkSaving(true);
    const { error } = await supabase.from("test_results").insert(entries);
    setMtBulkSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Success", description: `${entries.length} monthly test results saved` });
      setMtBulkMarks({});
      fetchData();
    }
  };

  // Monthly test view data
  const mtViewStudents = mtViewClass ? students.filter(s => s.class === mtViewClass).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const mtViewResults = results.filter(r =>
    r.exam_type === "Monthly Test" &&
    mtViewStudents.some(s => s.id === r.student_id) &&
    (mtViewMonth ? r.term === mtViewMonth : true) &&
    (mtViewSubject && mtViewSubject !== "all" ? r.subject_id === mtViewSubject : true)
  );

  const handlePrintMonthlyTest = () => {
    if (!mtViewClass) { toast({ title: "Error", description: "Select a class", variant: "destructive" }); return; }
    const subjectName = (mtViewSubject && mtViewSubject !== "all") ? getSubject(mtViewSubject)?.name : "All Subjects";
    const monthLabel = mtViewMonth || "All Months";

    let tableHtml = "";
    if (mtViewSubject && mtViewSubject !== "all") {
      const subResults = mtViewResults.filter(r => r.subject_id === mtViewSubject);
      const rows = mtViewStudents.map((s, i) => {
        const r = subResults.find(r => r.student_id === s.id);
        return `<tr>
          <td>${i + 1}</td><td style="text-align:left">${s.student_id}</td><td style="text-align:left">${s.name}</td>
          <td>${r ? r.total_marks : "—"}</td><td>${r ? r.obtained_marks : "—"}</td>
          <td>${r ? ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1) + "%" : "—"}</td>
          <td>${r ? r.grade : "—"}</td>
        </tr>`;
      }).join("");
      tableHtml = `<table><thead><tr><th>#</th><th>ID</th><th>Student Name</th><th>Total</th><th>Obtained</th><th>%</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      const allSubIds = [...new Set(mtViewResults.map(r => r.subject_id))];
      const headerCols = allSubIds.map(sid => `<th>${getSubject(sid)?.name || "—"}</th>`).join("");
      const rows = mtViewStudents.map((s, i) => {
        const cols = allSubIds.map(sid => {
          const r = mtViewResults.find(r => r.student_id === s.id && r.subject_id === sid);
          return `<td>${r ? `${r.obtained_marks}/${r.total_marks}` : "—"}</td>`;
        }).join("");
        const total = allSubIds.reduce((sum, sid) => { const r = mtViewResults.find(r => r.student_id === s.id && r.subject_id === sid); return sum + (r ? Number(r.obtained_marks) : 0); }, 0);
        const maxTotal = allSubIds.reduce((sum, sid) => { const r = mtViewResults.find(r => r.student_id === s.id && r.subject_id === sid); return sum + (r ? Number(r.total_marks) : 0); }, 0);
        return `<tr><td>${i + 1}</td><td style="text-align:left">${s.name}</td>${cols}<td><strong>${total}/${maxTotal}</strong></td><td><strong>${maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) + "%" : "—"}</strong></td></tr>`;
      }).join("");
      tableHtml = `<table><thead><tr><th>#</th><th>Student Name</th>${headerCols}<th>Total</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    printA4(`<div class="print-page">
      ${schoolHeader(`MONTHLY TEST RESULT — ${monthLabel.toUpperCase()}`)}
      <div class="print-info">
        <div>Class: <span>${mtViewClass}</span></div>
        <div>Subject: <span>${subjectName}</span></div>
        <div>Month: <span>${monthLabel}</span></div>
        <div>Total Students: <span>${mtViewStudents.length}</span></div>
      </div>
      ${tableHtml}
      ${schoolFooter()}
    </div>`, `Monthly Test - ${monthLabel} - Class ${mtViewClass}`);
  };

  // ========== TERM-WISE HANDLERS ==========
  const bulkClassStudents = bulkClass ? students.filter(s => s.class === bulkClass).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const handleBulkSubmit = async () => {
    if (!bulkClass || !bulkSubject) {
      toast({ title: "Error", description: "Select class and subject", variant: "destructive" });
      return;
    }
    const entries = bulkClassStudents
      .filter(s => bulkMarks[s.id] && bulkMarks[s.id].trim() !== "")
      .map(s => {
        const obtained = parseFloat(bulkMarks[s.id]);
        const total = parseFloat(bulkTotalMarks);
        return {
          student_id: s.id, subject_id: bulkSubject,
          exam_type: bulkExamType, term: bulkTerm,
          total_marks: total, obtained_marks: obtained,
          grade: gradeFromPercent((obtained / total) * 100),
          exam_date: bulkExamDate || null, remarks: "",
        };
      });
    if (entries.length === 0) {
      toast({ title: "Error", description: "Enter marks for at least one student", variant: "destructive" });
      return;
    }
    setBulkSaving(true);
    const { error } = await supabase.from("test_results").insert(entries);
    setBulkSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Success", description: `${entries.length} results saved` });
      setBulkMarks({});
      fetchData();
    }
  };

  // Term-wise result card data
  const monthlyClassStudents = monthlyClass ? students.filter(s => s.class === monthlyClass).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const monthlyResults = results.filter(r =>
    monthlyClassStudents.some(s => s.id === r.student_id) &&
    (monthlySubject && monthlySubject !== "all" ? r.subject_id === monthlySubject : true) &&
    r.term === monthlyTerm &&
    r.exam_type === monthlyExamType
  );

  const handlePrintTermCard = () => {
    if (!monthlyClass) { toast({ title: "Error", description: "Select a class", variant: "destructive" }); return; }
    const subjectName = (monthlySubject && monthlySubject !== "all") ? getSubject(monthlySubject)?.name : "All Subjects";

    let tableHtml = "";
    if (monthlySubject && monthlySubject !== "all") {
      const subResults = monthlyResults.filter(r => r.subject_id === monthlySubject);
      const rows = monthlyClassStudents.map((s, i) => {
        const r = subResults.find(r => r.student_id === s.id);
        return `<tr>
          <td>${i + 1}</td><td style="text-align:left">${s.student_id}</td><td style="text-align:left">${s.name}</td>
          <td>${r ? r.total_marks : "—"}</td><td>${r ? r.obtained_marks : "—"}</td>
          <td>${r ? ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1) + "%" : "—"}</td>
          <td>${r ? r.grade : "—"}</td>
        </tr>`;
      }).join("");
      tableHtml = `<table><thead><tr><th>#</th><th>ID</th><th>Student Name</th><th>Total</th><th>Obtained</th><th>%</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      const allSubIds = [...new Set(monthlyResults.map(r => r.subject_id))];
      const headerCols = allSubIds.map(sid => `<th>${getSubject(sid)?.name || "—"}</th>`).join("");
      const rows = monthlyClassStudents.map((s, i) => {
        const cols = allSubIds.map(sid => {
          const r = monthlyResults.find(r => r.student_id === s.id && r.subject_id === sid);
          return `<td>${r ? `${r.obtained_marks}/${r.total_marks}` : "—"}</td>`;
        }).join("");
        const total = allSubIds.reduce((sum, sid) => { const r = monthlyResults.find(r => r.student_id === s.id && r.subject_id === sid); return sum + (r ? Number(r.obtained_marks) : 0); }, 0);
        const maxTotal = allSubIds.reduce((sum, sid) => { const r = monthlyResults.find(r => r.student_id === s.id && r.subject_id === sid); return sum + (r ? Number(r.total_marks) : 0); }, 0);
        return `<tr><td>${i + 1}</td><td style="text-align:left">${s.name}</td>${cols}<td><strong>${total}/${maxTotal}</strong></td><td><strong>${maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) + "%" : "—"}</strong></td></tr>`;
      }).join("");
      tableHtml = `<table><thead><tr><th>#</th><th>Student Name</th>${headerCols}<th>Total</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    printA4(`<div class="print-page">
      ${schoolHeader(`${monthlyExamType.toUpperCase()} — ${monthlyTerm}`)}
      <div class="print-info">
        <div>Class: <span>${monthlyClass}</span></div>
        <div>Subject: <span>${subjectName}</span></div>
        <div>Term: <span>${monthlyTerm}</span></div>
        <div>Total Students: <span>${monthlyClassStudents.length}</span></div>
      </div>
      ${tableHtml}
      ${schoolFooter()}
    </div>`, `${monthlyExamType} - Class ${monthlyClass}`);
  };

  const handlePrintReport = () => {
    if (!reportStudent) { toast({ title: "Error", description: "Select a student first", variant: "destructive" }); return; }
    setTimeout(() => { if (printRef.current) printA4(printRef.current.innerHTML, "Report Card"); }, 100);
  };
  const handlePrintAnnual = () => {
    if (!annualStudent) { toast({ title: "Error", description: "Select a student first", variant: "destructive" }); return; }
    setTimeout(() => { if (annualPrintRef.current) printA4(annualPrintRef.current.innerHTML, "Annual Report"); }, 100);
  };
  const handlePrintClassReport = () => {
    if (!classReportClass) { toast({ title: "Error", description: "Select a class first", variant: "destructive" }); return; }
    setTimeout(() => { if (classReportRef.current) printA4(classReportRef.current.innerHTML, "Class Reports"); }, 100);
  };

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("0")) cleaned = "92" + cleaned.slice(1);
    if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    return cleaned;
  };

  const sendMonthlyTestAlerts = () => {
    if (!mtViewClass || !mtViewMonth || mtViewResults.length === 0) return;
    const allSubIds = [...new Set(mtViewResults.map(r => r.subject_id))];
    let opened = 0;
    mtViewStudents.forEach((s, i) => {
      const contact = s.whatsapp || s.phone;
      if (!contact) return;
      const studentResultsList = allSubIds.map(sid => {
        const r = mtViewResults.find(r => r.student_id === s.id && r.subject_id === sid);
        if (!r) return null;
        const subName = getSubject(sid)?.name || "Subject";
        const pct = ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(0);
        const isAbsent = r.remarks?.toLowerCase().includes("absent");
        return `• ${subName}: ${isAbsent ? "Absent" : `${r.obtained_marks}/${r.total_marks} (${pct}%)`}`;
      }).filter(Boolean);
      if (studentResultsList.length === 0) return;
      const totalObt = allSubIds.reduce((sum, sid) => { const r = mtViewResults.find(r => r.student_id === s.id && r.subject_id === sid); return sum + (r && !r.remarks?.toLowerCase().includes("absent") ? Number(r.obtained_marks) : 0); }, 0);
      const totalMax = allSubIds.reduce((sum, sid) => { const r = mtViewResults.find(r => r.student_id === s.id && r.subject_id === sid); return sum + (r ? Number(r.total_marks) : 0); }, 0);
      const overallPct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(0) : "0";
      const phone = formatPhone(contact);
      const message = encodeURIComponent(
        `Dear Parent,\n\nMonthly Test Result for *${mtViewMonth} ${new Date().getFullYear()}*\n\nStudent: *${s.name}* (${s.student_id})\nClass: *${s.class}-${s.section || "A"}*\n\n*Subject-wise Results:*\n${studentResultsList.join("\n")}\n\n*Overall: ${totalObt}/${totalMax} (${overallPct}%)*\n\nPlease encourage your child to maintain/improve their performance.\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.\nPhone: ${settings.phone}`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }, i * 800);
      opened++;
    });
    if (opened === 0) {
      toast({ title: "No contacts", description: "No WhatsApp/phone numbers found for students.", variant: "destructive" });
    } else {
      toast({ title: "WhatsApp Alerts", description: `Opening ${opened} WhatsApp message(s). Send each one manually.` });
    }
  };

  const sendTermResultAlerts = () => {
    if (!monthlyClass || monthlyResults.length === 0) return;
    const allSubIds = [...new Set(monthlyResults.map(r => r.subject_id))];
    let opened = 0;
    monthlyClassStudents.forEach((s, i) => {
      const contact = s.whatsapp || s.phone;
      if (!contact) return;
      const sResults = monthlyResults.filter(r => r.student_id === s.id);
      if (sResults.length === 0) return;
      const subjectLines = allSubIds.map(sid => {
        const r = sResults.find(r => r.subject_id === sid);
        if (!r) return null;
        const subName = getSubject(sid)?.name || "Subject";
        const isAbsent = r.remarks?.toLowerCase().includes("absent");
        const pct = ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(0);
        return `• ${subName}: ${isAbsent ? "Absent" : `${r.obtained_marks}/${r.total_marks} (${pct}%)`}`;
      }).filter(Boolean);
      if (subjectLines.length === 0) return;
      const totalObt = sResults.filter(r => !r.remarks?.toLowerCase().includes("absent")).reduce((sum, r) => sum + Number(r.obtained_marks), 0);
      const totalMax = sResults.reduce((sum, r) => sum + Number(r.total_marks), 0);
      const overallPct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(0) : "0";
      const phone = formatPhone(contact);
      const message = encodeURIComponent(
        `Dear Parent,\n\n*${monthlyExamType} Result — ${monthlyTerm}*\n\nStudent: *${s.name}* (${s.student_id})\nClass: *${s.class}-${s.section || "A"}*\n\n*Subject-wise Results:*\n${subjectLines.join("\n")}\n\n*Overall: ${totalObt}/${totalMax} (${overallPct}%)*\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.\nPhone: ${settings.phone}`
      );
      setTimeout(() => { window.open(`https://wa.me/${phone}?text=${message}`, "_blank"); }, i * 800);
      opened++;
    });
    if (opened === 0) toast({ title: "No contacts", description: "No WhatsApp/phone numbers found.", variant: "destructive" });
    else toast({ title: "WhatsApp Alerts", description: `Opening ${opened} message(s). Send each one manually.` });
  };

  const sendAnnualResultAlert = () => {
    if (!annualStudent) return;
    const s = getStudent(annualStudent);
    if (!s) return;
    const contact = s.whatsapp || s.phone;
    if (!contact) { toast({ title: "No contact", description: "No WhatsApp/phone number found for this student.", variant: "destructive" }); return; }
    const terms = ["Term 1", "Term 2", "Term 3"];
    const allTermResults = terms.map(t => results.filter(r => r.student_id === annualStudent && r.term === t));
    const allSubjectIds = [...new Set(results.filter(r => r.student_id === annualStudent && terms.includes(r.term)).map(r => r.subject_id))];
    if (allSubjectIds.length === 0) { toast({ title: "No results", description: "No annual results found.", variant: "destructive" }); return; }
    let grandTotal = 0, grandObt = 0;
    const subjectLines = allSubjectIds.map(subId => {
      const subName = getSubject(subId)?.name || "Subject";
      let subTotal = 0, subObt = 0;
      const termMarks = terms.map((t, ti) => {
        const r = allTermResults[ti].find(r => r.subject_id === subId);
        if (r) { const isAbsent = r.remarks?.toLowerCase().includes("absent"); subTotal += Number(r.total_marks); if (!isAbsent) subObt += Number(r.obtained_marks); return isAbsent ? "Abs" : `${r.obtained_marks}`; }
        return "—";
      });
      grandTotal += subTotal; grandObt += subObt;
      const pct = subTotal > 0 ? ((subObt / subTotal) * 100).toFixed(0) : "0";
      return `• ${subName}: ${termMarks.join(" | ")} = ${subObt}/${subTotal} (${pct}%)`;
    });
    const grandPct = grandTotal > 0 ? ((grandObt / grandTotal) * 100).toFixed(0) : "0";
    const phone = formatPhone(contact);
    const message = encodeURIComponent(
      `Dear Parent,\n\n*Annual Combined Result Card ${new Date().getFullYear()}*\n\nStudent: *${s.name}* (${s.student_id})\nClass: *${s.class}-${s.section || "A"}*\n\n*Subject Results (T1 | T2 | T3 = Total):*\n${subjectLines.join("\n")}\n\n*Grand Total: ${grandObt}/${grandTotal} (${grandPct}%)*\n*Grade: ${gradeFromPercent(Number(grandPct))}*\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.\nPhone: ${settings.phone}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    toast({ title: "WhatsApp Alert", description: "Opening WhatsApp message. Send it manually." });
  };

  const sendBulkAnnualAlerts = () => {
    if (!classReportClass) return;
    const classStudents = students.filter(s => s.class === classReportClass).sort((a, b) => a.name.localeCompare(b.name));
    const terms = ["Term 1", "Term 2", "Term 3"];
    let opened = 0;
    classStudents.forEach((s, i) => {
      const contact = s.whatsapp || s.phone;
      if (!contact) return;
      const allSubjectIds = [...new Set(results.filter(r => r.student_id === s.id && terms.includes(r.term)).map(r => r.subject_id))];
      if (allSubjectIds.length === 0) return;
      const allTermResults = terms.map(t => results.filter(r => r.student_id === s.id && r.term === t));
      let grandTotal = 0, grandObt = 0;
      const subjectLines = allSubjectIds.map(subId => {
        const subName = getSubject(subId)?.name || "Subject";
        let subTotal = 0, subObt = 0;
        const termMarks = terms.map((t, ti) => {
          const r = allTermResults[ti].find(r => r.subject_id === subId);
          if (r) { const isAbsent = r.remarks?.toLowerCase().includes("absent"); subTotal += Number(r.total_marks); if (!isAbsent) subObt += Number(r.obtained_marks); return isAbsent ? "Abs" : `${r.obtained_marks}`; }
          return "—";
        });
        grandTotal += subTotal; grandObt += subObt;
        const pct = subTotal > 0 ? ((subObt / subTotal) * 100).toFixed(0) : "0";
        return `• ${subName}: ${termMarks.join(" | ")} = ${subObt}/${subTotal} (${pct}%)`;
      });
      const grandPct = grandTotal > 0 ? ((grandObt / grandTotal) * 100).toFixed(0) : "0";
      const phone = formatPhone(contact);
      const message = encodeURIComponent(
        `Dear Parent,\n\n*Annual Combined Result Card ${new Date().getFullYear()}*\n\nStudent: *${s.name}* (${s.student_id})\nClass: *${s.class}-${s.section || "A"}*\n\n*Subject Results (T1 | T2 | T3 = Total):*\n${subjectLines.join("\n")}\n\n*Grand Total: ${grandObt}/${grandTotal} (${grandPct}%)*\n*Grade: ${gradeFromPercent(Number(grandPct))}*\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.\nPhone: ${settings.phone}`
      );
      setTimeout(() => { window.open(`https://wa.me/${phone}?text=${message}`, "_blank"); }, i * 800);
      opened++;
    });
    if (opened === 0) toast({ title: "No contacts", description: "No WhatsApp/phone numbers found.", variant: "destructive" });
    else toast({ title: "WhatsApp Alerts", description: `Opening ${opened} message(s) for Class ${classReportClass}. Send each one manually.` });
  };

  const sendBulkTermAlerts = () => {
    if (!classReportClass || !classReportTerm) return;
    const classStudents = students.filter(s => s.class === classReportClass).sort((a, b) => a.name.localeCompare(b.name));
    let opened = 0;
    classStudents.forEach((s, i) => {
      const contact = s.whatsapp || s.phone;
      if (!contact) return;
      const sResults = results.filter(r => r.student_id === s.id && r.term === classReportTerm && r.exam_type !== "Monthly Test");
      if (sResults.length === 0) return;
      const subjectLines = sResults.map(r => {
        const subName = getSubject(r.subject_id)?.name || "Subject";
        const isAbsent = r.remarks?.toLowerCase().includes("absent");
        const pct = ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(0);
        return `• ${subName}: ${isAbsent ? "Absent" : `${r.obtained_marks}/${r.total_marks} (${pct}%)`}`;
      });
      const totalObt = sResults.filter(r => !r.remarks?.toLowerCase().includes("absent")).reduce((sum, r) => sum + Number(r.obtained_marks), 0);
      const totalMax = sResults.reduce((sum, r) => sum + Number(r.total_marks), 0);
      const overallPct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(0) : "0";
      const phone = formatPhone(contact);
      const message = encodeURIComponent(
        `Dear Parent,\n\n*${classReportTerm} Result Card*\n\nStudent: *${s.name}* (${s.student_id})\nClass: *${s.class}-${s.section || "A"}*\n\n*Subject-wise Results:*\n${subjectLines.join("\n")}\n\n*Overall: ${totalObt}/${totalMax} (${overallPct}%)*\n*Grade: ${gradeFromPercent(Number(overallPct))}*\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.\nPhone: ${settings.phone}`
      );
      setTimeout(() => { window.open(`https://wa.me/${phone}?text=${message}`, "_blank"); }, i * 800);
      opened++;
    });
    if (opened === 0) toast({ title: "No contacts", description: "No WhatsApp/phone numbers found.", variant: "destructive" });
    else toast({ title: "WhatsApp Alerts", description: `Opening ${opened} message(s) for Class ${classReportClass} — ${classReportTerm}. Send each one manually.` });
  };


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
          <p className="mt-1 text-sm text-muted-foreground">Monthly tests (Jan–Dec) and term-wise results</p>
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
                <Label>Term / Month</Label>
                <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
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

      {/* ====== TABS: Monthly Tests vs Term Results ====== */}
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly" className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Monthly Tests (Jan–Dec)</TabsTrigger>
          <TabsTrigger value="term" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Term-wise Results & Reports</TabsTrigger>
        </TabsList>

        {/* ============ MONTHLY TESTS TAB ============ */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Monthly Test Bulk Entry */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Monthly Test — Bulk Marks Entry</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end mb-4">
                <div className="space-y-2 min-w-[140px]">
                  <Label>Month *</Label>
                  <Select value={mtBulkMonth} onValueChange={setMtBulkMonth}>
                    <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[140px]">
                  <Label>Class *</Label>
                  <Select value={mtBulkClass} onValueChange={v => { setMtBulkClass(v); setMtBulkMarks({}); }}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[150px]">
                  <Label>Subject *</Label>
                  <Select value={mtBulkSubject} onValueChange={setMtBulkSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[100px]">
                  <Label>Total Marks</Label>
                  <Input type="number" value={mtBulkTotalMarks} onChange={e => setMtBulkTotalMarks(e.target.value)} className="w-24" />
                </div>
                <div className="space-y-2 min-w-[140px]">
                  <Label>Exam Date</Label>
                  <Input type="date" value={mtBulkExamDate} onChange={e => setMtBulkExamDate(e.target.value)} />
                </div>
              </div>
              {mtBulkClass && mtBulkSubject && mtBulkMonth && mtBulkClassStudents.length > 0 && (
                <>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="w-32">Obtained Marks</TableHead>
                      <TableHead className="w-20">Grade</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {mtBulkClassStudents.map((s, i) => {
                        const val = mtBulkMarks[s.id] || "";
                        const pct = val ? (parseFloat(val) / parseFloat(mtBulkTotalMarks)) * 100 : 0;
                        return (
                          <TableRow key={s.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{s.class}-{s.section}</TableCell>
                            <TableCell>
                              <Input type="number" placeholder={`/ ${mtBulkTotalMarks}`} value={val}
                                onChange={e => setMtBulkMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                                className="w-28 h-8" max={parseFloat(mtBulkTotalMarks)} min={0} />
                            </TableCell>
                            <TableCell>
                              {val ? <Badge variant="outline" className={gradeColor(gradeFromPercent(pct))}>{gradeFromPercent(pct)}</Badge> : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleMtBulkSubmit} disabled={mtBulkSaving} className="gradient-primary text-primary-foreground">
                      {mtBulkSaving ? "Saving..." : `Save ${Object.values(mtBulkMarks).filter(v => v.trim()).length} Results`}
                    </Button>
                  </div>
                </>
              )}
              {mtBulkClass && mtBulkSubject && mtBulkMonth && mtBulkClassStudents.length === 0 && (
                <p className="text-sm text-muted-foreground">No students found in Class {mtBulkClass}.</p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Test Result View */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Monthly Test Results (Jan–Dec)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end mb-4">
                <div className="space-y-2 min-w-[140px]">
                  <Label>Month *</Label>
                  <Select value={mtViewMonth} onValueChange={setMtViewMonth}>
                    <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[140px]">
                  <Label>Class *</Label>
                  <Select value={mtViewClass} onValueChange={setMtViewClass}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[150px]">
                  <Label>Subject</Label>
                  <Select value={mtViewSubject} onValueChange={setMtViewSubject}>
                    <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePrintMonthlyTest} variant="outline" disabled={!mtViewClass || !mtViewMonth}>
                  <Printer className="mr-2 h-4 w-4" />Print Result
                </Button>
                {mtViewClass && mtViewMonth && mtViewResults.length > 0 && (
                  <Button onClick={sendMonthlyTestAlerts} variant="outline" className="border-success/30 text-success hover:bg-success/10">
                    <MessageCircle className="mr-2 h-4 w-4" />WhatsApp Results ({mtViewStudents.filter(s => mtViewResults.some(r => r.student_id === s.id)).length})
                  </Button>
                )}
              </div>
              {mtViewClass && mtViewMonth && mtViewResults.length > 0 && (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>#</TableHead><TableHead>Student</TableHead><TableHead>Subject</TableHead>
                    <TableHead>Total</TableHead><TableHead>Obtained</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {mtViewResults.map((r, i) => {
                      const pct = ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{getStudent(r.student_id)?.name}</TableCell>
                          <TableCell>{getSubject(r.subject_id)?.name}</TableCell>
                          <TableCell>{r.total_marks}</TableCell>
                          <TableCell>{r.obtained_marks}</TableCell>
                          <TableCell>{pct}%</TableCell>
                          <TableCell><Badge variant="outline" className={gradeColor(r.grade || "")}>{r.grade}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {mtViewClass && mtViewMonth && mtViewResults.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No monthly test results found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TERM-WISE RESULTS TAB ============ */}
        <TabsContent value="term" className="space-y-6">
          {/* Term Bulk Entry */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Term-wise Bulk Marks Entry</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end mb-4">
                <div className="space-y-2 min-w-[150px]">
                  <Label>Class *</Label>
                  <Select value={bulkClass} onValueChange={v => { setBulkClass(v); setBulkMarks({}); }}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[150px]">
                  <Label>Subject *</Label>
                  <Select value={bulkSubject} onValueChange={setBulkSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[130px]">
                  <Label>Exam Type</Label>
                  <Select value={bulkExamType} onValueChange={setBulkExamType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mid Term">Mid Term</SelectItem>
                      <SelectItem value="Final Term">Final Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[120px]">
                  <Label>Term</Label>
                  <Select value={bulkTerm} onValueChange={setBulkTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[100px]">
                  <Label>Total Marks</Label>
                  <Input type="number" value={bulkTotalMarks} onChange={e => setBulkTotalMarks(e.target.value)} className="w-24" />
                </div>
                <div className="space-y-2 min-w-[140px]">
                  <Label>Exam Date</Label>
                  <Input type="date" value={bulkExamDate} onChange={e => setBulkExamDate(e.target.value)} />
                </div>
              </div>
              {bulkClass && bulkSubject && bulkClassStudents.length > 0 && (
                <>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="w-32">Obtained Marks</TableHead>
                      <TableHead className="w-20">Grade</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {bulkClassStudents.map((s, i) => {
                        const val = bulkMarks[s.id] || "";
                        const pct = val ? (parseFloat(val) / parseFloat(bulkTotalMarks)) * 100 : 0;
                        return (
                          <TableRow key={s.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{s.class}-{s.section}</TableCell>
                            <TableCell>
                              <Input type="number" placeholder={`/ ${bulkTotalMarks}`} value={val}
                                onChange={e => setBulkMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                                className="w-28 h-8" max={parseFloat(bulkTotalMarks)} min={0} />
                            </TableCell>
                            <TableCell>
                              {val ? <Badge variant="outline" className={gradeColor(gradeFromPercent(pct))}>{gradeFromPercent(pct)}</Badge> : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleBulkSubmit} disabled={bulkSaving} className="gradient-primary text-primary-foreground">
                      {bulkSaving ? "Saving..." : `Save ${Object.values(bulkMarks).filter(v => v.trim()).length} Results`}
                    </Button>
                  </div>
                </>
              )}
              {bulkClass && bulkSubject && bulkClassStudents.length === 0 && (
                <p className="text-sm text-muted-foreground">No students found in Class {bulkClass}.</p>
              )}
            </CardContent>
          </Card>

          {/* Term Result Card */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Term Result Card</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end mb-4">
                <div className="space-y-2 min-w-[150px]">
                  <Label>Class *</Label>
                  <Select value={monthlyClass} onValueChange={setMonthlyClass}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[150px]">
                  <Label>Subject</Label>
                  <Select value={monthlySubject} onValueChange={setMonthlySubject}>
                    <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[130px]">
                  <Label>Exam Type</Label>
                  <Select value={monthlyExamType} onValueChange={setMonthlyExamType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mid Term">Mid Term</SelectItem>
                      <SelectItem value="Final Term">Final Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[120px]">
                  <Label>Term</Label>
                  <Select value={monthlyTerm} onValueChange={setMonthlyTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePrintTermCard} variant="outline" disabled={!monthlyClass}>
                  <Printer className="mr-2 h-4 w-4" />Print Result Card
                </Button>
                {monthlyClass && monthlyResults.length > 0 && (
                  <Button onClick={sendTermResultAlerts} variant="outline" className="border-success/30 text-success hover:bg-success/10">
                    <MessageCircle className="mr-2 h-4 w-4" />WhatsApp Results ({monthlyClassStudents.filter(s => monthlyResults.some(r => r.student_id === s.id)).length})
                  </Button>
                )}
              </div>
              {monthlyClass && monthlyResults.length > 0 && (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>#</TableHead><TableHead>Student</TableHead><TableHead>Subject</TableHead>
                    <TableHead>Total</TableHead><TableHead>Obtained</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {monthlyResults.map((r, i) => {
                      const pct = ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{getStudent(r.student_id)?.name}</TableCell>
                          <TableCell>{getSubject(r.subject_id)?.name}</TableCell>
                          <TableCell>{r.total_marks}</TableCell>
                          <TableCell>{r.obtained_marks}</TableCell>
                          <TableCell>{pct}%</TableCell>
                          <TableCell><Badge variant="outline" className={gradeColor(r.grade || "")}>{r.grade}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {monthlyClass && monthlyResults.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No results found for the selected filters.</p>
              )}
            </CardContent>
          </Card>

          {/* Report Card Generator */}
          <Card className="shadow-card">
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
                        const isAbsent = r.remarks?.toLowerCase().includes("absent");
                        const pct = isAbsent ? "—" : ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1) + "%";
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{getSubject(r.subject_id)?.name}</TableCell>
                            <TableCell>{r.total_marks}</TableCell>
                            <TableCell className={isAbsent ? "text-destructive font-bold" : ""}>{isAbsent ? "Absent" : r.obtained_marks}</TableCell>
                            <TableCell>{pct}</TableCell>
                            <TableCell><Badge variant="outline" className={isAbsent ? "border-destructive/30 text-destructive" : gradeColor(r.grade || "")}>{isAbsent ? "Absent" : r.grade}</Badge></TableCell>
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

          {/* Annual Combined Report Card */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Annual Combined Result Card</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label>Select Student</Label>
                  <Select value={annualStudent} onValueChange={setAnnualStudent}>
                    <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.student_id} - {s.name} (Class {s.class})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePrintAnnual} variant="outline" disabled={!annualStudent}>
                  <Printer className="mr-2 h-4 w-4" />Print Annual Report
                </Button>
                <Button onClick={sendAnnualResultAlert} variant="outline" disabled={!annualStudent} className="border-success/30 text-success hover:bg-success/10">
                  <MessageCircle className="mr-2 h-4 w-4" />WhatsApp Annual Result
                </Button>
              </div>
              {annualStudent && (() => {
                const annualStudentData = getStudent(annualStudent);
                const terms = ["Term 1", "Term 2", "Term 3"];
                const allTermResults = terms.map(t => results.filter(r => r.student_id === annualStudent && r.term === t));
                const allSubjectIds = [...new Set(results.filter(r => r.student_id === annualStudent && terms.includes(r.term)).map(r => r.subject_id))];
                if (allSubjectIds.length === 0) return <p className="mt-4 text-sm text-muted-foreground">No results found for this student.</p>;
                return (
                  <div className="mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead rowSpan={2}>Subject</TableHead>
                          {terms.map(t => <TableHead key={t} colSpan={3} className="text-center border-l border-border">{t}</TableHead>)}
                          <TableHead colSpan={3} className="text-center border-l border-border bg-muted">Annual</TableHead>
                        </TableRow>
                        <TableRow>
                          {terms.map(t => (
                            <>{/* @ts-ignore */}
                              <TableHead key={`${t}-t`} className="text-center border-l border-border text-xs">Total</TableHead>
                              <TableHead key={`${t}-o`} className="text-center text-xs">Obt</TableHead>
                              <TableHead key={`${t}-g`} className="text-center text-xs">Grade</TableHead>
                            </>
                          ))}
                          <TableHead className="text-center border-l border-border text-xs bg-muted">Total</TableHead>
                          <TableHead className="text-center text-xs bg-muted">Obt</TableHead>
                          <TableHead className="text-center text-xs bg-muted">Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSubjectIds.map(subId => {
                          let annualTotal = 0, annualObt = 0;
                          return (
                            <TableRow key={subId}>
                              <TableCell className="font-medium">{getSubject(subId)?.name}</TableCell>
                              {terms.map(t => {
                                const r = allTermResults[terms.indexOf(t)].find(r => r.subject_id === subId);
                                if (r) { annualTotal += Number(r.total_marks); annualObt += Number(r.obtained_marks); }
                                return (
                                  <>{/* @ts-ignore */}
                                    <TableCell key={`${t}-${subId}-t`} className="text-center border-l border-border">{r ? r.total_marks : "—"}</TableCell>
                                    <TableCell key={`${t}-${subId}-o`} className="text-center">{r ? r.obtained_marks : "—"}</TableCell>
                                    <TableCell key={`${t}-${subId}-g`} className="text-center">
                                      {r ? <Badge variant="outline" className={gradeColor(r.grade || "")}>{r.grade}</Badge> : "—"}
                                    </TableCell>
                                  </>
                                );
                              })}
                              <TableCell className="text-center border-l border-border bg-muted/50 font-medium">{annualTotal || "—"}</TableCell>
                              <TableCell className="text-center bg-muted/50 font-medium">{annualObt || "—"}</TableCell>
                              <TableCell className="text-center bg-muted/50">
                                {annualTotal > 0 ? <Badge variant="outline" className={gradeColor(gradeFromPercent((annualObt / annualTotal) * 100))}>{gradeFromPercent((annualObt / annualTotal) * 100)}</Badge> : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {(() => {
                          let grandTotal = 0, grandObt = 0;
                          const termTotals = terms.map(t => {
                            const tr = allTermResults[terms.indexOf(t)];
                            const tt = tr.reduce((s, r) => s + Number(r.total_marks), 0);
                            const to = tr.reduce((s, r) => s + Number(r.obtained_marks), 0);
                            grandTotal += tt; grandObt += to;
                            return { tt, to };
                          });
                          return (
                            <TableRow className="font-bold bg-muted/50">
                              <TableCell>Grand Total</TableCell>
                              {termTotals.map((t, i) => (
                                <>{/* @ts-ignore */}
                                  <TableCell key={`gt-${i}-t`} className="text-center border-l border-border">{t.tt || "—"}</TableCell>
                                  <TableCell key={`gt-${i}-o`} className="text-center">{t.to || "—"}</TableCell>
                                  <TableCell key={`gt-${i}-g`} className="text-center">
                                    {t.tt > 0 ? <Badge variant="outline" className={gradeColor(gradeFromPercent((t.to / t.tt) * 100))}>{gradeFromPercent((t.to / t.tt) * 100)}</Badge> : "—"}
                                  </TableCell>
                                </>
                              ))}
                              <TableCell className="text-center border-l border-border">{grandTotal}</TableCell>
                              <TableCell className="text-center">{grandObt}</TableCell>
                              <TableCell className="text-center">
                                {grandTotal > 0 ? <Badge variant="outline" className={gradeColor(gradeFromPercent((grandObt / grandTotal) * 100))}>{gradeFromPercent((grandObt / grandTotal) * 100)}</Badge> : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Class-wise Report Generation */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Class-wise Report Generation</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 min-w-[160px]">
                  <Label>Select Class</Label>
                  <Select value={classReportClass} onValueChange={setClassReportClass}>
                    <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                    <SelectContent>
                      {uniqueClasses.map(c => (
                        <SelectItem key={c} value={c}>Class {c} ({students.filter(s => s.class === c).length} students)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[140px]">
                  <Label>Report Type</Label>
                  <Select value={classReportType} onValueChange={setClassReportType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term">Term-wise</SelectItem>
                      <SelectItem value="annual">Annual Combined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {classReportType === "term" && (
                  <div className="space-y-2 min-w-[120px]">
                    <Label>Term</Label>
                    <Select value={classReportTerm} onValueChange={setClassReportTerm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handlePrintClassReport} variant="outline" disabled={!classReportClass}>
                  <Printer className="mr-2 h-4 w-4" />Print All Report Cards
                </Button>
                {classReportClass && classReportType === "annual" && (
                  <Button onClick={sendBulkAnnualAlerts} variant="outline" className="border-success/30 text-success hover:bg-success/10">
                    <MessageCircle className="mr-2 h-4 w-4" />WhatsApp Annual ({students.filter(s => s.class === classReportClass).length})
                  </Button>
                )}
              </div>
              {classReportClass && (
                <p className="mt-3 text-sm text-muted-foreground">
                  This will generate {classReportType === "annual" ? "annual combined" : `${classReportTerm}`} report cards for all {students.filter(s => s.class === classReportClass).length} students in Class {classReportClass}.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* All Results Table */}
      <Card className="shadow-card mt-6">
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
                <TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead>Term/Month</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead><TableHead className="text-right">Actions</TableHead>
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

      {/* Hidden print templates */}
      <div className="hidden">
        <div ref={printRef}>
          {student && studentResults.length > 0 && (() => {
            const totalMarks = studentResults.reduce((s, r) => s + Number(r.total_marks), 0);
            const obtainedMarks = studentResults.reduce((s, r) => s + Number(r.obtained_marks), 0);
            const overallPct = (obtainedMarks / totalMarks) * 100;
            return (
              <div className="report">
                <div className="header"><h1>The Country School — Fahad Campus</h1><h2>REPORT CARD / RESULT CARD</h2><p>Academic Year {new Date().getFullYear()}</p></div>
                <div className="info">
                  <div>Student ID: <span>{student.student_id}</span></div><div>Name: <span>{student.name}</span></div>
                  <div>Father's Name: <span>{student.father_name}</span></div><div>Class: <span>{student.class}-{student.section}</span></div>
                  <div>Term: <span>{reportTerm}</span></div>
                </div>
                <table><thead><tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th><th>Percentage</th><th>Grade</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {studentResults.map(r => { const isAbsent = r.remarks?.toLowerCase().includes("absent"); return (<tr key={r.id}><td style={{ textAlign: "left" }}>{getSubject(r.subject_id)?.name}</td><td>{r.total_marks}</td><td style={isAbsent ? { color: "red", fontWeight: "bold" } : {}}>{isAbsent ? "Absent" : r.obtained_marks}</td><td>{isAbsent ? "—" : ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1) + "%"}</td><td><strong>{isAbsent ? "Absent" : r.grade}</strong></td><td style={{ fontSize: "11px" }}>{r.remarks || "—"}</td></tr>); })}
                    <tr className="total-row"><td style={{ textAlign: "left" }}><strong>Grand Total</strong></td><td><strong>{totalMarks}</strong></td><td><strong>{obtainedMarks}</strong></td><td><strong>{overallPct.toFixed(1)}%</strong></td><td><strong>{gradeFromPercent(overallPct)}</strong></td><td></td></tr>
                  </tbody>
                </table>
                <div className="grade-summary">Overall Grade: <strong>{gradeFromPercent(overallPct)}</strong> | Position: _____ | Attendance: _____%</div>
                <div className="signatures"><div>Class Teacher</div><div>Principal</div><div>Parent's Signature</div></div>
                <div className="footer"><p>📞 +92 322 6107000 | 📧 thecountryschoolbwp@gmail.com</p><p>This is a computer-generated report card.</p></div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="hidden">
        <div ref={annualPrintRef}>
          {(() => {
            const s = getStudent(annualStudent);
            if (!s) return null;
            const terms = ["Term 1", "Term 2", "Term 3"];
            const allSubjectIds = [...new Set(results.filter(r => r.student_id === annualStudent && terms.includes(r.term)).map(r => r.subject_id))];
            if (allSubjectIds.length === 0) return null;
            const allTermResults = terms.map(t => results.filter(r => r.student_id === annualStudent && r.term === t));
            let grandTotal = 0, grandObt = 0;
            return (
              <div className="report">
                <div className="header"><h1>The Country School — Fahad Campus</h1><h2>ANNUAL COMBINED RESULT CARD</h2><p>Academic Year {new Date().getFullYear()}</p></div>
                <div className="info">
                  <div>Student ID: <span>{s.student_id}</span></div><div>Name: <span>{s.name}</span></div>
                  <div>Father's Name: <span>{s.father_name}</span></div><div>Class: <span>{s.class}-{s.section}</span></div>
                </div>
                <table>
                  <thead>
                    <tr><th rowSpan={2} style={{ verticalAlign: "bottom" }}>Subject</th>{terms.map(t => <th key={t} colSpan={3} style={{ borderLeft: "2px solid #333" }}>{t}</th>)}<th colSpan={3} style={{ borderLeft: "2px solid #333", background: "#e8e8e8" }}>Annual</th></tr>
                    <tr>{terms.map(t => (<><th key={`${t}-t`} style={{ borderLeft: "2px solid #333", fontSize: "10px" }}>Total</th><th key={`${t}-o`} style={{ fontSize: "10px" }}>Obt</th><th key={`${t}-g`} style={{ fontSize: "10px" }}>Grade</th></>))}<th style={{ borderLeft: "2px solid #333", fontSize: "10px", background: "#e8e8e8" }}>Total</th><th style={{ fontSize: "10px", background: "#e8e8e8" }}>Obt</th><th style={{ fontSize: "10px", background: "#e8e8e8" }}>Grade</th></tr>
                  </thead>
                  <tbody>
                    {allSubjectIds.map(subId => {
                      let subTotal = 0, subObt = 0;
                      return (<tr key={subId}><td style={{ textAlign: "left" }}>{getSubject(subId)?.name}</td>{terms.map((t, ti) => { const r = allTermResults[ti].find(r => r.subject_id === subId); if (r) { subTotal += Number(r.total_marks); subObt += Number(r.obtained_marks); } return (<><td key={`${t}-${subId}-t`} style={{ borderLeft: "2px solid #333" }}>{r ? r.total_marks : "—"}</td><td key={`${t}-${subId}-o`}>{r ? r.obtained_marks : "—"}</td><td key={`${t}-${subId}-g`}><strong>{r ? r.grade : "—"}</strong></td></>); })}<td style={{ borderLeft: "2px solid #333", background: "#f5f5f5" }}><strong>{subTotal || "—"}</strong></td><td style={{ background: "#f5f5f5" }}><strong>{subObt || "—"}</strong></td><td style={{ background: "#f5f5f5" }}><strong>{subTotal > 0 ? gradeFromPercent((subObt / subTotal) * 100) : "—"}</strong></td></tr>);
                    })}
                    {(() => {
                      const termTotals = terms.map((t, ti) => { const tr = allTermResults[ti]; const tt = tr.reduce((s, r) => s + Number(r.total_marks), 0); const to = tr.reduce((s, r) => s + Number(r.obtained_marks), 0); grandTotal += tt; grandObt += to; return { tt, to }; });
                      return (<tr className="total-row"><td style={{ textAlign: "left" }}><strong>Grand Total</strong></td>{termTotals.map((t, i) => (<><td key={`gt-${i}-t`} style={{ borderLeft: "2px solid #333" }}><strong>{t.tt || "—"}</strong></td><td key={`gt-${i}-o`}><strong>{t.to || "—"}</strong></td><td key={`gt-${i}-g`}><strong>{t.tt > 0 ? gradeFromPercent((t.to / t.tt) * 100) : "—"}</strong></td></>))}<td style={{ borderLeft: "2px solid #333", background: "#e8e8e8" }}><strong>{grandTotal}</strong></td><td style={{ background: "#e8e8e8" }}><strong>{grandObt}</strong></td><td style={{ background: "#e8e8e8" }}><strong>{grandTotal > 0 ? gradeFromPercent((grandObt / grandTotal) * 100) : "—"}</strong></td></tr>);
                    })()}
                  </tbody>
                </table>
                <div className="grade-summary">Overall Annual Grade: <strong>{grandTotal > 0 ? gradeFromPercent((grandObt / grandTotal) * 100) : "N/A"}</strong> | Overall Percentage: <strong>{grandTotal > 0 ? ((grandObt / grandTotal) * 100).toFixed(1) : "0"}%</strong> | Position: _____ | Attendance: _____%</div>
                <div className="signatures"><div>Class Teacher</div><div>Principal</div><div>Parent's Signature</div></div>
                <div className="footer"><p>📞 +92 322 6107000 | 📧 thecountryschoolbwp@gmail.com</p><p>This is a computer-generated annual result card.</p></div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="hidden">
        <div ref={classReportRef}>
          {classReportClass && (() => {
            const classStudents = students.filter(s => s.class === classReportClass).sort((a, b) => a.name.localeCompare(b.name));
            const terms = ["Term 1", "Term 2", "Term 3"];
            if (classReportType === "term") {
              return classStudents.map(st => {
                const sResults = results.filter(r => r.student_id === st.id && r.term === classReportTerm);
                if (sResults.length === 0) return null;
                const totalMarks = sResults.reduce((s, r) => s + Number(r.total_marks), 0);
                const obtainedMarks = sResults.reduce((s, r) => s + Number(r.obtained_marks), 0);
                const overallPct = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
                return (
                  <div key={st.id} className="report" style={{ pageBreakAfter: "always", marginBottom: "40px" }}>
                    <div className="header"><h1>The Country School — Fahad Campus</h1><h2>REPORT CARD / RESULT CARD</h2><p>Academic Year {new Date().getFullYear()}</p></div>
                    <div className="info"><div>Student ID: <span>{st.student_id}</span></div><div>Name: <span>{st.name}</span></div><div>Father's Name: <span>{st.father_name}</span></div><div>Class: <span>{st.class}-{st.section}</span></div><div>Term: <span>{classReportTerm}</span></div></div>
                    <table><thead><tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th><th>Percentage</th><th>Grade</th><th>Remarks</th></tr></thead>
                      <tbody>
                        {sResults.map(r => { const isAbsent = r.remarks?.toLowerCase().includes("absent"); return (<tr key={r.id}><td style={{ textAlign: "left" }}>{getSubject(r.subject_id)?.name}</td><td>{r.total_marks}</td><td style={isAbsent ? { color: "red", fontWeight: "bold" } : {}}>{isAbsent ? "Absent" : r.obtained_marks}</td><td>{isAbsent ? "—" : ((Number(r.obtained_marks) / Number(r.total_marks)) * 100).toFixed(1) + "%"}</td><td><strong>{isAbsent ? "Absent" : r.grade}</strong></td><td style={{ fontSize: "11px" }}>{r.remarks || "—"}</td></tr>); })}
                        <tr className="total-row"><td style={{ textAlign: "left" }}><strong>Grand Total</strong></td><td><strong>{totalMarks}</strong></td><td><strong>{obtainedMarks}</strong></td><td><strong>{overallPct.toFixed(1)}%</strong></td><td><strong>{gradeFromPercent(overallPct)}</strong></td><td></td></tr>
                      </tbody>
                    </table>
                    <div className="grade-summary">Overall Grade: <strong>{gradeFromPercent(overallPct)}</strong> | Position: _____ | Attendance: _____%</div>
                    <div className="signatures"><div>Class Teacher</div><div>Principal</div><div>Parent's Signature</div></div>
                    <div className="footer"><p>📞 +92 322 6107000 | 📧 thecountryschoolbwp@gmail.com</p><p>This is a computer-generated report card.</p></div>
                  </div>
                );
              });
            } else {
              return classStudents.map(st => {
                const allSubjectIds = [...new Set(results.filter(r => r.student_id === st.id && terms.includes(r.term)).map(r => r.subject_id))];
                if (allSubjectIds.length === 0) return null;
                const allTermResults = terms.map(t => results.filter(r => r.student_id === st.id && r.term === t));
                let grandTotal = 0, grandObt = 0;
                return (
                  <div key={st.id} className="report" style={{ pageBreakAfter: "always", marginBottom: "40px" }}>
                    <div className="header"><h1>The Country School — Fahad Campus</h1><h2>ANNUAL COMBINED RESULT CARD</h2><p>Academic Year {new Date().getFullYear()}</p></div>
                    <div className="info"><div>Student ID: <span>{st.student_id}</span></div><div>Name: <span>{st.name}</span></div><div>Father's Name: <span>{st.father_name}</span></div><div>Class: <span>{st.class}-{st.section}</span></div></div>
                    <table>
                      <thead>
                        <tr><th rowSpan={2} style={{ verticalAlign: "bottom" }}>Subject</th>{terms.map(t => <th key={t} colSpan={3} style={{ borderLeft: "2px solid #333" }}>{t}</th>)}<th colSpan={3} style={{ borderLeft: "2px solid #333", background: "#e8e8e8" }}>Annual</th></tr>
                        <tr>{terms.map(t => (<><th key={`${t}-t`} style={{ borderLeft: "2px solid #333", fontSize: "10px" }}>Total</th><th key={`${t}-o`} style={{ fontSize: "10px" }}>Obt</th><th key={`${t}-g`} style={{ fontSize: "10px" }}>Grade</th></>))}<th style={{ borderLeft: "2px solid #333", fontSize: "10px", background: "#e8e8e8" }}>Total</th><th style={{ fontSize: "10px", background: "#e8e8e8" }}>Obt</th><th style={{ fontSize: "10px", background: "#e8e8e8" }}>Grade</th></tr>
                      </thead>
                      <tbody>
                        {allSubjectIds.map(subId => {
                          let subTotal = 0, subObt = 0;
                          return (<tr key={subId}><td style={{ textAlign: "left" }}>{getSubject(subId)?.name}</td>{terms.map((t, ti) => { const r = allTermResults[ti].find(r => r.subject_id === subId); const isAbsent = r?.remarks?.toLowerCase().includes("absent"); if (r && !isAbsent) { subTotal += Number(r.total_marks); subObt += Number(r.obtained_marks); } else if (r && isAbsent) { subTotal += Number(r.total_marks); } return (<><td key={`${t}-${subId}-t`} style={{ borderLeft: "2px solid #333" }}>{r ? r.total_marks : "—"}</td><td key={`${t}-${subId}-o`} style={isAbsent ? { color: "red", fontWeight: "bold" } : {}}>{isAbsent ? "Absent" : r ? r.obtained_marks : "—"}</td><td key={`${t}-${subId}-g`}><strong>{isAbsent ? "Abs" : r ? r.grade : "—"}</strong></td></>); })}<td style={{ borderLeft: "2px solid #333", background: "#f5f5f5" }}><strong>{subTotal || "—"}</strong></td><td style={{ background: "#f5f5f5" }}><strong>{subObt || "—"}</strong></td><td style={{ background: "#f5f5f5" }}><strong>{subTotal > 0 ? gradeFromPercent((subObt / subTotal) * 100) : "—"}</strong></td></tr>);
                        })}
                        {(() => {
                          const termTotals = terms.map((t, ti) => { const tr = allTermResults[ti]; const tt = tr.reduce((s, r) => s + Number(r.total_marks), 0); const to = tr.reduce((s, r) => s + Number(r.obtained_marks), 0); grandTotal += tt; grandObt += to; return { tt, to }; });
                          return (<tr className="total-row"><td style={{ textAlign: "left" }}><strong>Grand Total</strong></td>{termTotals.map((t, i) => (<><td key={`gt-${i}-t`} style={{ borderLeft: "2px solid #333" }}><strong>{t.tt || "—"}</strong></td><td key={`gt-${i}-o`}><strong>{t.to || "—"}</strong></td><td key={`gt-${i}-g`}><strong>{t.tt > 0 ? gradeFromPercent((t.to / t.tt) * 100) : "—"}</strong></td></>))}<td style={{ borderLeft: "2px solid #333", background: "#e8e8e8" }}><strong>{grandTotal}</strong></td><td style={{ background: "#e8e8e8" }}><strong>{grandObt}</strong></td><td style={{ background: "#e8e8e8" }}><strong>{grandTotal > 0 ? gradeFromPercent((grandObt / grandTotal) * 100) : "—"}</strong></td></tr>);
                        })()}
                      </tbody>
                    </table>
                    <div className="grade-summary">Overall Annual Grade: <strong>{grandTotal > 0 ? gradeFromPercent((grandObt / grandTotal) * 100) : "N/A"}</strong> | Overall Percentage: <strong>{grandTotal > 0 ? ((grandObt / grandTotal) * 100).toFixed(1) : "0"}%</strong> | Position: _____ | Attendance: _____%</div>
                    <div className="signatures"><div>Class Teacher</div><div>Principal</div><div>Parent's Signature</div></div>
                    <div className="footer"><p>📞 +92 322 6107000 | 📧 thecountryschoolbwp@gmail.com</p><p>This is a computer-generated annual result card.</p></div>
                  </div>
                );
              });
            }
          })()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Results;
