import React, { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Printer, Pencil, Trash2, Users, Check, X, AlertTriangle, CheckCircle, MessageCircle, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/BulkActionBar";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";

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
  phone: string | null;
  whatsapp: string | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LATE_FEE = 300;

const getDueDate = (month: string, year: number) => {
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1) return "";
  const d = new Date(year, monthIdx, 7);
  if (d.getDay() === 0) d.setDate(8);
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
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<Record<string, string>>({});
  const [inlineSaving, setInlineSaving] = useState(false);

  const [bulkForm, setBulkForm] = useState({
    class_name: "",
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
    remarks: "",
    registration_fee: "0",
    admission_fee: "0",
    security_deposit: "0",
    tuition_fee: "",
    annual_charges: "0",
    trip_charges: "0",
    books_charges: "0",
    arrears: "0",
    late_fee: "0",
    discount: "0",
  });

  const fetchData = async () => {
    const [{ data: v }, { data: s }] = await Promise.all([
      supabase.from("fee_vouchers").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section, father_name, monthly_fee, phone, whatsapp"),
    ]);
    if (v) setVouchers(v);
    if (s) setStudents(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStudent = (id: string) => students.find(s => s.id === id);

  // Calculate arrears from student's last month unpaid vouchers + late fee
  const calcStudentArrears = (studentId: string, currentMonth: string, currentYear: number) => {
    const currentMonthIdx = MONTHS.indexOf(currentMonth);
    let prevMonth: string;
    let prevYear: number;
    if (currentMonthIdx === 0) {
      prevMonth = MONTHS[11];
      prevYear = currentYear - 1;
    } else {
      prevMonth = MONTHS[currentMonthIdx - 1];
      prevYear = currentYear;
    }
    const unpaid = vouchers.filter(
      v => v.student_id === studentId && v.month === prevMonth && v.year === prevYear && v.status !== "Paid"
    );
    if (unpaid.length === 0) return 0;
    const unpaidTotal = unpaid.reduce((sum, v) => sum + Number(v.amount), 0);
    return unpaidTotal + LATE_FEE;
  };

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
    const arrears = calcStudentArrears(studentId, form.month, parseInt(form.year));
    setForm(f => ({
      ...f,
      student_id: studentId,
      tuition_fee: student?.monthly_fee ? String(student.monthly_fee) : f.tuition_fee,
      arrears: String(arrears),
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
    const bulkRegFee = parseFloat(bulkForm.registration_fee) || 0;
    const bulkAdmFee = parseFloat(bulkForm.admission_fee) || 0;
    const bulkSecDep = parseFloat(bulkForm.security_deposit) || 0;
    const bulkAnnual = parseFloat(bulkForm.annual_charges) || 0;
    const bulkTrip = parseFloat(bulkForm.trip_charges) || 0;
    const bulkBooks = parseFloat(bulkForm.books_charges) || 0;
    const bulkArrears = parseFloat(bulkForm.arrears) || 0;
    const bulkLateFee = parseFloat(bulkForm.late_fee) || 0;
    const bulkDiscount = parseFloat(bulkForm.discount) || 0;
    const useBulkTuition = bulkForm.tuition_fee.trim() !== "";
    const bulkTuition = parseFloat(bulkForm.tuition_fee) || 0;

    const bulkYear = parseInt(bulkForm.year);

    const rows = classStudents.map((s, i) => {
      const tuition = useBulkTuition ? bulkTuition : (s.monthly_fee || 0);
      // Auto-calculate per-student arrears from last month's unpaid + late fee
      const studentArrears = calcStudentArrears(s.id, bulkForm.month, bulkYear);
      const arrears = studentArrears > 0 ? studentArrears : bulkArrears;
      const total = bulkRegFee + bulkAdmFee + bulkSecDep + tuition + bulkAnnual + bulkTrip + bulkBooks + arrears + bulkLateFee - bulkDiscount;
      return {
        voucher_no: generateVoucherNo(i),
        student_id: s.id,
        amount: total,
        tuition_fee: tuition,
        fee_type: "Monthly",
        month: bulkForm.month,
        year: bulkYear,
        due_date: dueDate,
        issue_date: new Date().toISOString().split("T")[0],
        status: "Pending" as string,
        remarks: bulkForm.remarks.trim(),
        registration_fee: bulkRegFee,
        admission_fee: bulkAdmFee,
        security_deposit: bulkSecDep,
        annual_charges: bulkAnnual,
        trip_charges: bulkTrip,
        books_charges: bulkBooks,
        arrears: arrears,
        late_fee: bulkLateFee,
        discount: bulkDiscount,
        late_fee_amount: LATE_FEE,
      };
    });
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

  const FEE_FIELDS = [
    { key: "registration_fee", label: "Reg. Fee" },
    { key: "admission_fee", label: "Adm. Fee" },
    { key: "security_deposit", label: "Security" },
    { key: "tuition_fee", label: "Tuition" },
    { key: "annual_charges", label: "Annual" },
    { key: "trip_charges", label: "Trip" },
    { key: "books_charges", label: "Books" },
    { key: "arrears", label: "Arrears" },
    { key: "late_fee", label: "Late Fee" },
    { key: "discount", label: "Discount" },
  ];

  const startInlineEdit = (v: FeeVoucher) => {
    setInlineEditId(v.id);
    setInlineForm({
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
      status: v.status,
      remarks: v.remarks || "",
    });
  };

  const calcInlineTotal = () => {
    const sum = ["registration_fee", "admission_fee", "security_deposit", "tuition_fee", "annual_charges", "trip_charges", "books_charges", "arrears", "late_fee"]
      .reduce((s, k) => s + (parseFloat(inlineForm[k]) || 0), 0);
    return sum - (parseFloat(inlineForm.discount) || 0);
  };

  const saveInlineEdit = async () => {
    if (!inlineEditId) return;
    setInlineSaving(true);
    const total = calcInlineTotal();
    const payload = {
      registration_fee: parseFloat(inlineForm.registration_fee) || 0,
      admission_fee: parseFloat(inlineForm.admission_fee) || 0,
      security_deposit: parseFloat(inlineForm.security_deposit) || 0,
      tuition_fee: parseFloat(inlineForm.tuition_fee) || 0,
      annual_charges: parseFloat(inlineForm.annual_charges) || 0,
      trip_charges: parseFloat(inlineForm.trip_charges) || 0,
      books_charges: parseFloat(inlineForm.books_charges) || 0,
      arrears: parseFloat(inlineForm.arrears) || 0,
      late_fee: parseFloat(inlineForm.late_fee) || 0,
      discount: parseFloat(inlineForm.discount) || 0,
      status: inlineForm.status,
      remarks: inlineForm.remarks.trim(),
      amount: total,
      paid_date: inlineForm.status === "Paid" ? new Date().toISOString().split("T")[0] : null,
    };
    const { error } = await supabase.from("fee_vouchers").update(payload).eq("id", inlineEditId);
    setInlineSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Voucher Updated" }); setInlineEditId(null); fetchData(); }
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
      { label: "Last Month Late Fee", amount: v.late_fee || 0 },
      { label: "Discount", amount: -((v as any).discount || 0) },
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
          <tr><td class="lbl">Guardian/Father's Name</td><td>${student?.father_name || "—"}</td></tr>
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

    return { slipContent, voucherNo: v.voucher_no };
  };

  const printSingleVoucher = (v: FeeVoucher) => {
    const { slipContent, voucherNo } = handlePrint(v);
    const voucherStyles = `
      @page { size: A4 landscape; margin: 8mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
      .voucher-container { display: flex; width: 100%; height: 100vh; gap: 0; }
      .slip { flex: 1; border: 1px solid #333; padding: 10px 12px; display: flex; flex-direction: column; }
      .slip + .slip { border-left: 2px dashed #999; }
      .slip-title { text-align: center; font-weight: bold; font-size: 12px; text-transform: uppercase; background: #c0392b; color: #fff; padding: 4px; margin-bottom: 6px; letter-spacing: 1px; }
      .slip-school { text-align: center; font-size: 15px; font-weight: bold; color: #c0392b; }
      .slip-campus { text-align: center; font-size: 10px; color: #666; margin-bottom: 4px; }
      .slip-heading { text-align: center; font-size: 13px; font-weight: bold; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; margin-bottom: 6px; }
      .slip-info { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 6px; }
      .slip-info td { padding: 3px 5px; border: 1px solid #ddd; }
      .slip-info .lbl { font-weight: bold; width: 38%; background: #f5f5f5; }
      .desc-title { font-weight: bold; font-size: 11px; background: #eee; padding: 3px 5px; border: 1px solid #ddd; border-bottom: none; }
      .fee-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      .fee-table td { padding: 3px 5px; border: 1px solid #ddd; }
      .fee-table .amt { text-align: right; font-weight: bold; width: 35%; }
      .totals-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
      .totals-table td { padding: 4px 5px; border: 1px solid #999; font-weight: bold; }
      .totals-table .amt { text-align: right; width: 35%; }
      .highlight-green { background: #d4edda; color: #155724; }
      .highlight-yellow { background: #fff3cd; color: #856404; }
      .highlight-red { background: #f8d7da; color: #721c24; }
      .slip-sign { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px; font-size: 9px; }
      .slip-sign div { border-top: 1px solid #333; padding-top: 3px; width: 70px; text-align: center; }
      @media print { .print-preview-bar { display: none !important; } body { padding: 0; } }
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Fee Challan - ${voucherNo}</title><style>${voucherStyles}
      .print-preview-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #c0392b; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; font-family: Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
      .print-preview-bar span { font-size: 14px; font-weight: bold; }
      .print-preview-bar button { background: #fff; color: #c0392b; border: none; padding: 8px 24px; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer; }
      .print-preview-bar button:hover { background: #f0f0f0; }
      .print-preview-bar .close-btn { background: transparent; color: #fff; font-size: 13px; border: 1px solid rgba(255,255,255,0.4); padding: 6px 16px; border-radius: 4px; margin-left: 8px; }
      body { padding-top: 50px; }
    </style></head><body>
      <div class="print-preview-bar"><span>📄 Fee Challan ${voucherNo} — Print Preview</span><div><button onclick="window.print()">🖨️ Print</button><button class="close-btn" onclick="window.close()">✕ Close</button></div></div>
      <div class="voucher-container">${slipContent("School Copy")}${slipContent("Bank Copy")}${slipContent("Student Copy")}</div>
    </body></html>`);
    win.document.close();
  };

  const printMultipleVouchers = (vouchersToPrint: FeeVoucher[]) => {
    const pages = vouchersToPrint.map(v => {
      const { slipContent } = handlePrint(v);
      return `<div class="voucher-container page-break">${slipContent("School Copy")}${slipContent("Bank Copy")}${slipContent("Student Copy")}</div>`;
    });

    const voucherStyles = `
      @page { size: A4 landscape; margin: 8mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
      .voucher-container { display: flex; width: 100%; height: 100vh; gap: 0; }
      .page-break { page-break-after: always; }
      .page-break:last-child { page-break-after: auto; }
      .slip { flex: 1; border: 1px solid #333; padding: 10px 12px; display: flex; flex-direction: column; }
      .slip + .slip { border-left: 2px dashed #999; }
      .slip-title { text-align: center; font-weight: bold; font-size: 12px; text-transform: uppercase; background: #c0392b; color: #fff; padding: 4px; margin-bottom: 6px; letter-spacing: 1px; }
      .slip-school { text-align: center; font-size: 15px; font-weight: bold; color: #c0392b; }
      .slip-campus { text-align: center; font-size: 10px; color: #666; margin-bottom: 4px; }
      .slip-heading { text-align: center; font-size: 13px; font-weight: bold; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; margin-bottom: 6px; }
      .slip-info { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 6px; }
      .slip-info td { padding: 3px 5px; border: 1px solid #ddd; }
      .slip-info .lbl { font-weight: bold; width: 38%; background: #f5f5f5; }
      .desc-title { font-weight: bold; font-size: 11px; background: #eee; padding: 3px 5px; border: 1px solid #ddd; border-bottom: none; }
      .fee-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      .fee-table td { padding: 3px 5px; border: 1px solid #ddd; }
      .fee-table .amt { text-align: right; font-weight: bold; width: 35%; }
      .totals-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
      .totals-table td { padding: 4px 5px; border: 1px solid #999; font-weight: bold; }
      .totals-table .amt { text-align: right; width: 35%; }
      .highlight-green { background: #d4edda; color: #155724; }
      .highlight-yellow { background: #fff3cd; color: #856404; }
      .highlight-red { background: #f8d7da; color: #721c24; }
      .slip-sign { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px; font-size: 9px; }
      .slip-sign div { border-top: 1px solid #333; padding-top: 3px; width: 70px; text-align: center; }
      @media print { .print-preview-bar { display: none !important; } body { padding: 0; } }
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Fee Challans — Bulk Print (${vouchersToPrint.length})</title><style>${voucherStyles}
      .print-preview-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #c0392b; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; font-family: Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
      .print-preview-bar span { font-size: 14px; font-weight: bold; }
      .print-preview-bar button { background: #fff; color: #c0392b; border: none; padding: 8px 24px; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer; }
      .print-preview-bar button:hover { background: #f0f0f0; }
      .print-preview-bar .close-btn { background: transparent; color: #fff; font-size: 13px; border: 1px solid rgba(255,255,255,0.4); padding: 6px 16px; border-radius: 4px; margin-left: 8px; }
      body { padding-top: 50px; }
    </style></head><body>
      <div class="print-preview-bar"><span>📄 Bulk Print — ${vouchersToPrint.length} Challans</span><div><button onclick="window.print()">🖨️ Print All</button><button class="close-btn" onclick="window.close()">✕ Close</button></div></div>
      ${pages.join("")}
    </body></html>`);
    win.document.close();
  };

  const filtered = vouchers.filter(v => {
    const student = getStudent(v.student_id);
    return v.voucher_no.toLowerCase().includes(search.toLowerCase()) ||
      student?.name.toLowerCase().includes(search.toLowerCase()) ||
      student?.student_id.toLowerCase().includes(search.toLowerCase());
  });

  const bulk = useBulkSelect(filtered);

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${bulk.count} selected vouchers?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(bulk.selectedIds);
    const { error } = await supabase.from("fee_vouchers").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: `${ids.length} vouchers deleted` }); bulk.clear(); fetchData(); }
  };

  const handleBulkPrint = () => {
    const selected = filtered.filter(v => bulk.selectedIds.has(v.id));
    if (selected.length === 0) return;
    printMultipleVouchers(selected);
  };

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
    { key: "late_fee", label: "Last Month Late Fee" },
    { key: "discount", label: "Discount" },
  ];

  // Defaulter list: vouchers past due date that are not Paid
  const today = new Date().toISOString().split("T")[0];
  const defaulters = useMemo(() => {
    return vouchers.filter(v => v.status !== "Paid" && v.due_date < today);
  }, [vouchers, today]);

  const defaultersByClass = useMemo(() => {
    const map: Record<string, { student: Student; voucher: FeeVoucher }[]> = {};
    defaulters.forEach(v => {
      const student = getStudent(v.student_id);
      if (!student) return;
      const cls = `${student.class}-${student.section || "A"}`;
      if (!map[cls]) map[cls] = [];
      map[cls].push({ student, voucher: v });
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [defaulters, students]);

  const [defaulterClassFilter, setDefaulterClassFilter] = useState<string>("all");

  const filteredDefaulterClasses = defaulterClassFilter === "all"
    ? defaultersByClass
    : defaultersByClass.filter(([cls]) => cls === defaulterClassFilter);

  // Upcoming due: vouchers with due date = tomorrow, not yet paid
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const upcomingDue = useMemo(() => {
    return vouchers.filter(v => v.status !== "Paid" && v.due_date === tomorrow).map(v => {
      const student = getStudent(v.student_id);
      return student ? { student, voucher: v } : null;
    }).filter(Boolean) as { student: Student; voucher: FeeVoucher }[];
  }, [vouchers, tomorrow, students]);

  const buildWhatsAppUrl = (phone: string, studentName: string, amount: number, dueDate: string, month: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
    const message = encodeURIComponent(
      `Assalam o Alaikum,\n\nThis is a reminder from *${settings.school_name}* that the fee for your child *${studentName}* of *₨ ${amount.toLocaleString("en-PK")}* for the month of *${month}* is due on *${dueDate}*.\n\nPlease submit the fee before the due date to avoid a late fee charge of ₨ ${LATE_FEE}.\n\nThank you.\n${settings.school_name}\n${settings.campus}, ${settings.city}`
    );
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  const printDefaulterList = (className?: string) => {
    const classesToPrint = className
      ? defaultersByClass.filter(([cls]) => cls === className)
      : filteredDefaulterClasses;

    if (classesToPrint.length === 0) return;

    const pages = classesToPrint.map(([cls, items]) => {
      const rows = items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.student.student_id}</td>
          <td style="text-align:left">${item.student.name}</td>
          <td style="text-align:left">${item.student.father_name}</td>
          <td>${item.voucher.month} ${item.voucher.year}</td>
          <td>${item.voucher.due_date}</td>
          <td style="text-align:right; font-weight:bold">₨ ${Number(item.voucher.amount).toLocaleString("en-PK")}</td>
          <td>${item.student.phone || item.student.whatsapp || "—"}</td>
        </tr>
      `).join("");
      const classTotal = items.reduce((s, item) => s + Number(item.voucher.amount), 0);
      return `
        <div class="print-page">
          ${schoolHeader("Fee Defaulter List")}
          <div class="print-info">
            <div><span>Class:</span> ${cls}</div>
            <div><span>Date:</span> ${new Date().toLocaleDateString("en-PK")}</div>
            <div><span>Total Defaulters:</span> ${items.length}</div>
            <div><span>Total Outstanding:</span> ₨ ${classTotal.toLocaleString("en-PK")}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Reg. No</th><th style="text-align:left">Student Name</th><th style="text-align:left">Guardian/Father's Name</th><th>Month</th><th>Due Date</th><th style="text-align:right">Amount</th><th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="6" style="text-align:right">Total Outstanding</td>
                <td style="text-align:right">₨ ${classTotal.toLocaleString("en-PK")}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          ${schoolFooter()}
        </div>
      `;
    });

    printA4(pages.join(""), "Fee Defaulter List");
  };

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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Generate Class-wise Challans</DialogTitle></DialogHeader>
              <form onSubmit={handleBulkGenerate} className="grid grid-cols-2 gap-3">
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

                <div className="col-span-2 border-t border-border pt-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">Fee Breakdown (applied to all students)</p>
                </div>
                {[
                  { key: "registration_fee", label: "Registration Fee" },
                  { key: "admission_fee", label: "Admission Fee" },
                  { key: "security_deposit", label: "Security Deposit" },
                  { key: "tuition_fee", label: "Tuition Fee" },
                  { key: "annual_charges", label: "Annual Charges" },
                  { key: "trip_charges", label: "Trip Charges" },
                  { key: "books_charges", label: "Books/Summer Pack" },
                  { key: "arrears", label: "Arrears" },
                  { key: "late_fee", label: "Last Month Late Fee" },
                  { key: "discount", label: "Discount" },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      type="number"
                      placeholder={f.key === "tuition_fee" ? "Auto from student" : "0"}
                      value={(bulkForm as any)[f.key]}
                      onChange={e => setBulkForm({ ...bulkForm, [f.key]: e.target.value })}
                    />
                  </div>
                ))}

                <div className="col-span-2 space-y-2"><Label>Remarks</Label><Input value={bulkForm.remarks} onChange={e => setBulkForm({ ...bulkForm, remarks: e.target.value })} /></div>
                <div className="col-span-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p>• Leave Tuition Fee blank to auto-fill from each student's monthly fee</p>
                  <p>• Due date: 7th {bulkForm.month} {bulkForm.year} (8th if Sunday)</p>
                  <p>• Late fee after due date: ₨{LATE_FEE}</p>
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

      <Tabs defaultValue="vouchers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vouchers">All Vouchers</TabsTrigger>
          <TabsTrigger value="defaulters" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Defaulters
            {defaulters.length > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                {defaulters.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers">
          <BulkActionBar count={bulk.count} onDelete={handleBulkDelete} onPrint={handleBulkPrint} onClear={bulk.clear} deleting={bulkDeleting} />

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
                    <TableHead className="w-10"><Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} aria-label="Select all" /></TableHead>
                    <TableHead>Challan No</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Month</TableHead><TableHead>Tuition</TableHead><TableHead>Total</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No challans</TableCell></TableRow> :
                    filtered.map(v => {
                      const student = getStudent(v.student_id);
                      const isInlineEditing = inlineEditId === v.id;
                      return (
                        <React.Fragment key={v.id}>
                          <TableRow data-state={bulk.selectedIds.has(v.id) ? "selected" : undefined} className={isInlineEditing ? "bg-accent/30" : ""}>
                            <TableCell><Checkbox checked={bulk.selectedIds.has(v.id)} onCheckedChange={() => bulk.toggle(v.id)} /></TableCell>
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
                              <Button variant="ghost" size="icon" onClick={() => isInlineEditing ? setInlineEditId(null) : startInlineEdit(v)} title="Edit inline">
                                <Pencil className={`h-4 w-4 ${isInlineEditing ? "text-primary" : ""}`} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => printSingleVoucher(v)}><Printer className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                          {isInlineEditing && (
                            <TableRow className="bg-accent/10 hover:bg-accent/10">
                              <TableCell colSpan={10} className="p-3">
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  {FEE_FIELDS.map(f => (
                                    <div key={f.key} className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                                      <Input
                                        type="number"
                                        className="h-8 text-sm"
                                        value={inlineForm[f.key] || "0"}
                                        onChange={e => setInlineForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <Select value={inlineForm.status} onValueChange={val => setInlineForm(prev => ({ ...prev, status: val }))}>
                                      <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Overdue">Overdue</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">Remarks</Label>
                                    <Input className="h-8 text-sm" value={inlineForm.remarks} onChange={e => setInlineForm(prev => ({ ...prev, remarks: e.target.value }))} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">New Total</Label>
                                    <p className="h-8 flex items-center font-bold text-sm">₨ {calcInlineTotal().toLocaleString("en-PK")}</p>
                                  </div>
                                  <div className="flex gap-1 pt-4">
                                    <Button size="sm" onClick={saveInlineEdit} disabled={inlineSaving} className="gradient-primary text-primary-foreground">
                                      <Check className="mr-1 h-4 w-4" />{inlineSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setInlineEditId(null)}>
                                      <X className="mr-1 h-4 w-4" />Cancel
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaulters">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">
                {defaulters.length} unpaid voucher{defaulters.length !== 1 ? "s" : ""} past due date
              </span>
            </div>
            <div className="flex gap-2">
              <Select value={defaulterClassFilter} onValueChange={setDefaulterClassFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {defaultersByClass.map(([cls]) => (
                    <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => printDefaulterList()}>
                <Printer className="mr-2 h-4 w-4" /> Print Defaulter List
              </Button>
            </div>
          </div>

          {filteredDefaulterClasses.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                <p>No defaulters found. All fees are up to date!</p>
              </CardContent>
            </Card>
          ) : (
            filteredDefaulterClasses.map(([cls, items]) => (
              <Card key={cls} className="shadow-card mb-4">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="font-display text-base">
                    Class {cls}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({items.length} defaulter{items.length !== 1 ? "s" : ""} — ₨ {items.reduce((s, i) => s + Number(i.voucher.amount), 0).toLocaleString("en-PK")})
                    </span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => printDefaulterList(cls)}>
                    <Printer className="mr-1 h-3.5 w-3.5" /> Print
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Reg. No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Guardian/Father's Name</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, i) => (
                        <TableRow key={item.voucher.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{item.student.student_id}</TableCell>
                          <TableCell className="font-medium">{item.student.name}</TableCell>
                          <TableCell>{item.student.father_name}</TableCell>
                          <TableCell>{item.voucher.month} {item.voucher.year}</TableCell>
                          <TableCell className="text-destructive">{item.voucher.due_date}</TableCell>
                          <TableCell className="text-right font-bold">₨ {Number(item.voucher.amount).toLocaleString("en-PK")}</TableCell>
                          <TableCell className="text-muted-foreground">{item.student.phone || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default FeeVouchers;
