import { useState, useEffect } from "react";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Printer, Pencil, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

interface FeeVoucher {
  id: string;
  voucher_no: string;
  student_id: string;
  amount: number;
  fee_type: string;
  month: string;
  year: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  remarks: string | null;
  issue_date?: string;
  registration_fee?: number;
  admission_fee?: number;
  security_deposit?: number;
  tuition_fee?: number;
  annual_charges?: number;
  trip_charges?: number;
  books_charges?: number;
  arrears?: number;
  late_fee?: number;
  late_fee_amount?: number;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  father_name: string;
  monthly_fee: number | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LATE_FEE = 300;

/** Get 7th of given month/year, but if Sunday push to 8th */
const getDueDate = (month: string, year: number) => {
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1) return "";
  const d = new Date(year, monthIdx, 7);
  if (d.getDay() === 0) d.setDate(8); // Sunday → Monday
  return d.toISOString().split("T")[0];
};

const emptyFeeForm = {
  student_id: "",
  month: MONTHS[new Date().getMonth()],
  year: new Date().getFullYear().toString(),
  status: "Pending",
  remarks: "",
  registration_fee: "0",
  admission_fee: "0",
  security_deposit: "0",
  tuition_fee: "0",
  annual_charges: "0",
  trip_charges: "0",
  books_charges: "0",
  arrears: "0",
  late_fee: "0",
  discount: "0",
};

const FeeVouchers = () => {
  const { toast } = useToast();
  const { settings } = useSchoolSettings();
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFeeForm);

  const [bulkForm, setBulkForm] = useState({
    class_name: "",
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
    remarks: "",
  });

  const fetchData = async () => {
    const [{ data: v }, { data: s }] = await Promise.all([
      supabase.from("fee_vouchers").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section, father_name, monthly_fee"),
    ]);
    if (v) setVouchers(v);
    if (s) setStudents(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStudent = (id: string) => students.find(s => s.id === id);

  const generateVoucherNo = (offset = 0) => {
    const now = new Date();
    return `VCH-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${(vouchers.length + 1 + offset).toString().padStart(5, "0")}`;
  };

  const calcTotal = (f: typeof emptyFeeForm) => {
    const sum = [f.registration_fee, f.admission_fee, f.security_deposit, f.tuition_fee, f.annual_charges, f.trip_charges, f.books_charges, f.arrears, f.late_fee]
      .reduce((s, v) => s + (parseFloat(v) || 0), 0);
    return sum - (parseFloat(f.discount) || 0);
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setForm(f => ({
      ...f,
      student_id: studentId,
      tuition_fee: student?.monthly_fee ? String(student.monthly_fee) : f.tuition_fee,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) {
      toast({ title: "Error", description: "Please select a student", variant: "destructive" });
      return;
    }
    setSaving(true);
    const dueDate = getDueDate(form.month, parseInt(form.year));
    const total = calcTotal(form);
    const payload = {
      student_id: form.student_id,
      amount: total,
      fee_type: "Monthly",
      month: form.month,
      year: parseInt(form.year),
      due_date: dueDate,
      issue_date: new Date().toISOString().split("T")[0],
      status: form.status,
      remarks: form.remarks.trim(),
      registration_fee: parseFloat(form.registration_fee) || 0,
      admission_fee: parseFloat(form.admission_fee) || 0,
      security_deposit: parseFloat(form.security_deposit) || 0,
      tuition_fee: parseFloat(form.tuition_fee) || 0,
      annual_charges: parseFloat(form.annual_charges) || 0,
      trip_charges: parseFloat(form.trip_charges) || 0,
      books_charges: parseFloat(form.books_charges) || 0,
      arrears: parseFloat(form.arrears) || 0,
      late_fee: parseFloat(form.late_fee) || 0,
      discount: parseFloat(form.discount) || 0,
      late_fee_amount: LATE_FEE,
    };

    const { error } = editingId
      ? await supabase.from("fee_vouchers").update(payload).eq("id", editingId)
      : await supabase.from("fee_vouchers").insert({ ...payload, voucher_no: generateVoucherNo() } as any);

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingId ? "Updated" : "Voucher Generated" }); setDialogOpen(false); setEditingId(null); setForm(emptyFeeForm); fetchData(); }
  };

  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.class_name) {
      toast({ title: "Error", description: "Please select a class", variant: "destructive" });
      return;
    }
    const classStudents = students.filter(s => s.class === bulkForm.class_name);
    if (classStudents.length === 0) {
      toast({ title: "No Students", description: `No students found in Class ${bulkForm.class_name}`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const dueDate = getDueDate(bulkForm.month, parseInt(bulkForm.year));
    const rows = classStudents.map((s, i) => ({
      voucher_no: generateVoucherNo(i),
      student_id: s.id,
      amount: s.monthly_fee || 0,
      tuition_fee: s.monthly_fee || 0,
      fee_type: "Monthly",
      month: bulkForm.month,
      year: parseInt(bulkForm.year),
      due_date: dueDate,
      issue_date: new Date().toISOString().split("T")[0],
      status: "Pending" as string,
      remarks: bulkForm.remarks.trim(),
      registration_fee: 0, admission_fee: 0, security_deposit: 0,
      annual_charges: 0, trip_charges: 0, books_charges: 0,
      arrears: 0, late_fee: 0, late_fee_amount: LATE_FEE,
    }));
    const { error } = await supabase.from("fee_vouchers").insert(rows as any);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Bulk Vouchers Generated", description: `${rows.length} vouchers created for Class ${bulkForm.class_name}` });
      setBulkDialogOpen(false);
      fetchData();
    }
  };

  const markPaid = async (id: string) => {
    await supabase.from("fee_vouchers").update({ status: "Paid", paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    fetchData();
    toast({ title: "Marked as Paid" });
  };

  const handleEdit = (v: FeeVoucher) => {
    setForm({
      student_id: v.student_id,
      month: v.month,
      year: v.year.toString(),
      status: v.status,
      remarks: v.remarks || "",
      registration_fee: String(v.registration_fee || 0),
      admission_fee: String(v.admission_fee || 0),
      security_deposit: String(v.security_deposit || 0),
      tuition_fee: String(v.tuition_fee || 0),
      annual_charges: String(v.annual_charges || 0),
      trip_charges: String(v.trip_charges || 0),
      books_charges: String(v.books_charges || 0),
      arrears: String(v.arrears || 0),
      late_fee: String(v.late_fee || 0),
      discount: String((v as any).discount || 0),
    });
    setEditingId(v.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this voucher?")) return;
    const { error } = await supabase.from("fee_vouchers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchData(); }
  };

  const handlePrint = (v: FeeVoucher) => {
    const student = getStudent(v.student_id);
    const payableByDue = Number(v.amount) - Number(v.late_fee || 0);
    const lateFeeCharges = v.late_fee_amount || LATE_FEE;
    const payableAfterDue = payableByDue + lateFeeCharges;

    const feeLines = [
      { label: "Registration Fee", amount: v.registration_fee || 0 },
      { label: "Admission Fee", amount: v.admission_fee || 0 },
      { label: "Security Deposit", amount: v.security_deposit || 0 },
      { label: "Tuition Fee", amount: v.tuition_fee || 0 },
      { label: "Annual Charges", amount: v.annual_charges || 0 },
      { label: "Trip Charges", amount: v.trip_charges || 0 },
      { label: "Books/Summer Pack", amount: v.books_charges || 0 },
      { label: "Arrears", amount: v.arrears || 0 },
      { label: "Late Fee", amount: v.late_fee || 0 },
    ];

    const slipContent = (title: string) => `
      <div class="slip">
        <div class="slip-title">${title}</div>
        <div class="slip-school">${settings.school_name}</div>
        <div class="slip-campus">${settings.campus}, ${settings.city}</div>
        <div class="slip-heading">FEE CHALLAN</div>
        <table class="slip-info">
          <tr><td class="lbl">Challan No</td><td>${v.voucher_no}</td></tr>
          <tr><td class="lbl">Issue Date</td><td>${(v as any).issue_date || new Date().toISOString().split("T")[0]}</td></tr>
          <tr><td class="lbl">Billing Month</td><td>${v.month} ${v.year}</td></tr>
          <tr><td class="lbl">Due Date</td><td>${v.due_date}</td></tr>
          <tr><td class="lbl">Reg. No</td><td>${student?.student_id || "—"}</td></tr>
          <tr><td class="lbl">Name</td><td>${student?.name || "—"}</td></tr>
          <tr><td class="lbl">Father's Name</td><td>${student?.father_name || "—"}</td></tr>
          <tr><td class="lbl">Class</td><td>${student?.class}-${student?.section}</td></tr>
        </table>
        <div class="desc-title">Description</div>
        <table class="fee-table">
          ${feeLines.map(f => `<tr><td>${f.label}</td><td class="amt">₨ ${Number(f.amount).toLocaleString("en-PK")}</td></tr>`).join("")}
        </table>
        <table class="totals-table">
          <tr class="highlight-green"><td>Payable by Due Date</td><td class="amt">₨ ${payableByDue.toLocaleString("en-PK")}</td></tr>
          <tr class="highlight-yellow"><td>Late Fee Charges</td><td class="amt">₨ ${lateFeeCharges.toLocaleString("en-PK")}</td></tr>
          <tr class="highlight-red"><td>Payable after Due Date</td><td class="amt">₨ ${payableAfterDue.toLocaleString("en-PK")}</td></tr>
        </table>
        <div class="slip-sign">
          <div>Accountant</div>
          <div>Stamp</div>
        </div>
      </div>`;

    const voucherStyles = `
      @page { size: A4 landscape; margin: 8mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 9px; color: #222; }
      .voucher-container { display: flex; width: 100%; height: 100vh; gap: 0; }
      .slip { flex: 1; border: 1px solid #333; padding: 8px 10px; display: flex; flex-direction: column; }
      .slip + .slip { border-left: 2px dashed #999; }
      .slip-title { text-align: center; font-weight: bold; font-size: 10px; text-transform: uppercase; background: #c0392b; color: #fff; padding: 3px; margin-bottom: 6px; letter-spacing: 1px; }
      .slip-school { text-align: center; font-size: 13px; font-weight: bold; color: #c0392b; }
      .slip-campus { text-align: center; font-size: 8px; color: #666; margin-bottom: 4px; }
      .slip-heading { text-align: center; font-size: 11px; font-weight: bold; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 3px 0; margin-bottom: 6px; }
      .slip-info { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px; }
      .slip-info td { padding: 2px 4px; border: 1px solid #ddd; }
      .slip-info .lbl { font-weight: bold; width: 38%; background: #f5f5f5; }
      .desc-title { font-weight: bold; font-size: 9px; background: #eee; padding: 2px 4px; border: 1px solid #ddd; border-bottom: none; }
      .fee-table { width: 100%; border-collapse: collapse; font-size: 8px; }
      .fee-table td { padding: 2px 4px; border: 1px solid #ddd; }
      .fee-table .amt { text-align: right; font-weight: bold; width: 35%; }
      .totals-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 4px; }
      .totals-table td { padding: 3px 4px; border: 1px solid #999; font-weight: bold; }
      .totals-table .amt { text-align: right; width: 35%; }
      .highlight-green { background: #d4edda; color: #155724; }
      .highlight-yellow { background: #fff3cd; color: #856404; }
      .highlight-red { background: #f8d7da; color: #721c24; }
      .slip-sign { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px; font-size: 8px; }
      .slip-sign div { border-top: 1px solid #333; padding-top: 3px; width: 70px; text-align: center; }
      @media print { .print-preview-bar { display: none !important; } body { padding: 0; } }
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Fee Challan - ${v.voucher_no}</title><style>${voucherStyles}
      .print-preview-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #c0392b; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; font-family: Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
      .print-preview-bar span { font-size: 14px; font-weight: bold; }
      .print-preview-bar button { background: #fff; color: #c0392b; border: none; padding: 8px 24px; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer; }
      .print-preview-bar button:hover { background: #f0f0f0; }
      .print-preview-bar .close-btn { background: transparent; color: #fff; font-size: 13px; border: 1px solid rgba(255,255,255,0.4); padding: 6px 16px; border-radius: 4px; margin-left: 8px; }
      body { padding-top: 50px; }
    </style></head><body>
      <div class="print-preview-bar"><span>📄 Fee Challan ${v.voucher_no} — Print Preview</span><div><button onclick="window.print()">🖨️ Print</button><button class="close-btn" onclick="window.close()">✕ Close</button></div></div>
      <div class="voucher-container">${slipContent("School Copy")}${slipContent("Bank Copy")}${slipContent("Student Copy")}</div>
    </body></html>`);
    win.document.close();
  };

  const filtered = vouchers.filter(v => {
    const student = getStudent(v.student_id);
    return v.voucher_no.toLowerCase().includes(search.toLowerCase()) ||
      student?.name.toLowerCase().includes(search.toLowerCase()) ||
      student?.student_id.toLowerCase().includes(search.toLowerCase());
  });

  const statusColor = (s: string) => s === "Paid" ? "border-success/30 text-success" : s === "Overdue" ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning";

  const feeFields: { key: keyof typeof emptyFeeForm; label: string }[] = [
    { key: "registration_fee", label: "Registration Fee" },
    { key: "admission_fee", label: "Admission Fee" },
    { key: "security_deposit", label: "Security Deposit" },
    { key: "tuition_fee", label: "Tuition Fee" },
    { key: "annual_charges", label: "Annual Charges" },
    { key: "trip_charges", label: "Trip Charges" },
    { key: "books_charges", label: "Books/Summer Pack" },
    { key: "arrears", label: "Arrears" },
    { key: "late_fee", label: "Late Fee" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fee Vouchers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate and manage fee challans — Late fee: ₨{LATE_FEE} after due date (7th of each month)</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Generate Dialog */}
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Users className="mr-2 h-4 w-4" />Class-wise Generate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="font-display">Generate Class-wise Challans</DialogTitle></DialogHeader>
              <form onSubmit={handleBulkGenerate} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Class *</Label>
                  <Select value={bulkForm.class_name} onValueChange={v => setBulkForm({ ...bulkForm, class_name: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {uniqueClasses.map(c => (
                        <SelectItem key={c} value={c}>Class {c} ({students.filter(s => s.class === c).length} students)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={bulkForm.month} onValueChange={v => setBulkForm({ ...bulkForm, month: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Year</Label><Input type="number" value={bulkForm.year} onChange={e => setBulkForm({ ...bulkForm, year: e.target.value })} /></div>
                <div className="col-span-2 space-y-2"><Label>Remarks</Label><Input value={bulkForm.remarks} onChange={e => setBulkForm({ ...bulkForm, remarks: e.target.value })} /></div>
                <div className="col-span-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p>• Tuition fee auto-filled from each student's monthly fee</p>
                  <p>• Due date: 7th {bulkForm.month} {bulkForm.year} (8th if Sunday)</p>
                  <p>• Late fee: ₨{LATE_FEE} after due date</p>
                </div>
                <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Generating..." : "Generate Challans"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Single Voucher Dialog */}
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyFeeForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Single Challan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Challan" : "Generate Fee Challan"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={handleStudentSelect}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.student_id} - {s.name} (Class {s.class})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={form.month} onValueChange={v => setForm({ ...form, month: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>

                <div className="col-span-2 border-t border-border pt-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">Fee Breakdown</p>
                </div>
                {feeFields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input type="number" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  </div>
                ))}

                <div className="col-span-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Payable by Due Date</span>
                    <span className="font-bold text-foreground">₨ {calcTotal(form).toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Late Fee Charges (after {getDueDate(form.month, parseInt(form.year)) || "due date"})</span>
                    <span>₨ {LATE_FEE.toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium text-destructive">Payable after Due Date</span>
                    <span className="font-bold text-destructive">₨ {(calcTotal(form) + LATE_FEE).toLocaleString("en-PK")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Challan" : "Generate Challan"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Paid", count: vouchers.filter(v => v.status === "Paid").length, total: vouchers.filter(v => v.status === "Paid").reduce((s, v) => s + Number(v.amount), 0), cls: "text-success" },
          { label: "Pending", count: vouchers.filter(v => v.status === "Pending").length, total: vouchers.filter(v => v.status === "Pending").reduce((s, v) => s + Number(v.amount), 0), cls: "text-warning" },
          { label: "Overdue", count: vouchers.filter(v => v.status === "Overdue").length, total: vouchers.filter(v => v.status === "Overdue").reduce((s, v) => s + Number(v.amount), 0), cls: "text-destructive" },
        ].map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className={`font-display text-2xl font-bold ${s.cls}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label} — ₨ {s.total.toLocaleString("en-PK")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <ClasswiseFeeMetrics vouchers={vouchers} students={students} />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search vouchers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Challan No</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Month</TableHead><TableHead>Tuition</TableHead><TableHead>Total</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No challans</TableCell></TableRow> :
                filtered.map(v => {
                  const student = getStudent(v.student_id);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.voucher_no}</TableCell>
                      <TableCell className="font-medium">{student?.name || "—"}</TableCell>
                      <TableCell>{student?.class}-{student?.section}</TableCell>
                      <TableCell>{v.month} {v.year}</TableCell>
                      <TableCell className="font-medium">₨ {Number(v.tuition_fee || 0).toLocaleString("en-PK")}</TableCell>
                      <TableCell className="font-bold">₨ {Number(v.amount).toLocaleString("en-PK")}</TableCell>
                      <TableCell className="text-muted-foreground">{v.due_date}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColor(v.status)}>{v.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {v.status !== "Paid" && <Button variant="outline" size="sm" onClick={() => markPaid(v.id)}>Mark Paid</Button>}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(v)}><Printer className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default FeeVouchers;
