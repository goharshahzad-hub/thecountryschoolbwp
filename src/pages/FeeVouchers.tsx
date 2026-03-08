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
import { Plus, Search, Printer, Receipt, Pencil, Trash2, Users } from "lucide-react";
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

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
  

  const [form, setForm] = useState({
    student_id: "", amount: "", fee_type: "Monthly", month: months[new Date().getMonth()],
    year: new Date().getFullYear().toString(), due_date: "", status: "Pending", remarks: ""
  });

  const [bulkForm, setBulkForm] = useState({
    class_name: "", amount: "", fee_type: "Monthly", month: months[new Date().getMonth()],
    year: new Date().getFullYear().toString(), due_date: "", remarks: ""
  });

  const fetchData = async () => {
    const [{ data: v }, { data: s }] = await Promise.all([
      supabase.from("fee_vouchers").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section, father_name")
    ]);
    if (v) setVouchers(v);
    if (s) setStudents(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStudent = (id: string) => students.find(s => s.id === id);

  const generateVoucherNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `VCH-${year}-${month}-${(vouchers.length + 1).toString().padStart(5, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.amount || !form.due_date) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      student_id: form.student_id,
      amount: parseFloat(form.amount),
      fee_type: form.fee_type,
      month: form.month,
      year: parseInt(form.year),
      due_date: form.due_date,
      status: form.status,
      remarks: form.remarks.trim(),
    };

    const { error } = editingId
      ? await supabase.from("fee_vouchers").update(payload).eq("id", editingId)
      : await supabase.from("fee_vouchers").insert({ ...payload, voucher_no: generateVoucherNo() });

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingId ? "Updated" : "Voucher Generated" }); setDialogOpen(false); setEditingId(null); fetchData(); }
  };

  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.class_name || !bulkForm.amount || !bulkForm.due_date) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const classStudents = students.filter(s => s.class === bulkForm.class_name);
    if (classStudents.length === 0) {
      toast({ title: "No Students", description: `No students found in Class ${bulkForm.class_name}`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const baseIndex = vouchers.length + 1;
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const rows = classStudents.map((s, i) => ({
      voucher_no: `VCH-${year}-${month}-${(baseIndex + i).toString().padStart(5, "0")}`,
      student_id: s.id,
      amount: parseFloat(bulkForm.amount),
      fee_type: bulkForm.fee_type,
      month: bulkForm.month,
      year: parseInt(bulkForm.year),
      due_date: bulkForm.due_date,
      status: "Pending" as string,
      remarks: bulkForm.remarks.trim(),
    }));
    const { error } = await supabase.from("fee_vouchers").insert(rows);
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
      student_id: v.student_id, amount: v.amount.toString(), fee_type: v.fee_type,
      month: v.month, year: v.year.toString(), due_date: v.due_date,
      status: v.status, remarks: v.remarks || ""
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
    const slipContent = (title: string) => `
      <div class="slip">
        <div class="slip-title">${title}</div>
        <div class="slip-school">${settings.school_name}</div>
        <div class="slip-campus">${settings.campus}, ${settings.city}</div>
        <div class="slip-heading">FEE VOUCHER</div>
        <table class="slip-table">
          <tr><td class="lbl">Voucher No</td><td>${v.voucher_no}</td></tr>
          <tr><td class="lbl">Student ID</td><td>${student?.student_id || "—"}</td></tr>
          <tr><td class="lbl">Student Name</td><td>${student?.name || "—"}</td></tr>
          <tr><td class="lbl">Father Name</td><td>${student?.father_name || "—"}</td></tr>
          <tr><td class="lbl">Class</td><td>${student?.class}-${student?.section}</td></tr>
          <tr><td class="lbl">Fee Type</td><td>${v.fee_type}</td></tr>
          <tr><td class="lbl">Month / Year</td><td>${v.month} ${v.year}</td></tr>
          <tr><td class="lbl">Due Date</td><td>${v.due_date}</td></tr>
          <tr><td class="lbl">Status</td><td>${v.status}</td></tr>
          ${v.remarks ? `<tr><td class="lbl">Remarks</td><td>${v.remarks}</td></tr>` : ""}
        </table>
        <div class="slip-total">₨ ${Number(v.amount).toLocaleString("en-PK")}</div>
        <div class="slip-sign">
          <div>Accountant Sign</div>
          <div>Stamp</div>
        </div>
      </div>`;

    const voucherStyles = `
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 10px; color: #222; }
      .voucher-container {
        display: flex;
        width: 100%;
        height: 100vh;
        gap: 0;
      }
      .slip {
        flex: 1;
        border: 1px solid #333;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      .slip + .slip { border-left: 2px dashed #999; }
      .slip-title {
        text-align: center;
        font-weight: bold;
        font-size: 11px;
        text-transform: uppercase;
        background: #c0392b;
        color: #fff;
        padding: 4px;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }
      .slip-school {
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        color: #c0392b;
      }
      .slip-campus {
        text-align: center;
        font-size: 9px;
        color: #666;
        margin-bottom: 6px;
      }
      .slip-heading {
        text-align: center;
        font-size: 12px;
        font-weight: bold;
        border-top: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        padding: 4px 0;
        margin-bottom: 8px;
      }
      .slip-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
        margin-bottom: 8px;
      }
      .slip-table td {
        padding: 3px 6px;
        border: 1px solid #ddd;
      }
      .slip-table .lbl {
        font-weight: bold;
        width: 40%;
        background: #f5f5f5;
      }
      .slip-total {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        border: 2px solid #c0392b;
        padding: 6px;
        margin: 8px 0;
        color: #c0392b;
      }
      .slip-sign {
        display: flex;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 30px;
        font-size: 9px;
      }
      .slip-sign div {
        border-top: 1px solid #333;
        padding-top: 3px;
        width: 80px;
        text-align: center;
      }
      .slip-footer {
        text-align: center;
        font-size: 7px;
        color: #999;
        margin-top: 6px;
      }
      @media print { body { padding: 0; } }
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Fee Voucher - ${v.voucher_no}</title><style>${voucherStyles}</style></head><body>
      <div class="voucher-container">
        ${slipContent("School Copy")}
        ${slipContent("Bank Copy")}
        ${slipContent("Student Copy")}
      </div>
      <script>window.print();window.close()<\/script>
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

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fee Vouchers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate and manage fee vouchers in PKR</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Users className="mr-2 h-4 w-4" />Class-wise Generate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">Generate Class-wise Vouchers</DialogTitle></DialogHeader>
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
                <div className="space-y-2"><Label>Amount per Student (PKR) *</Label><Input type="number" placeholder="5000" value={bulkForm.amount} onChange={e => setBulkForm({ ...bulkForm, amount: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Fee Type</Label>
                  <Select value={bulkForm.fee_type} onValueChange={v => setBulkForm({ ...bulkForm, fee_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Admission">Admission</SelectItem>
                      <SelectItem value="Exam">Exam Fee</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={bulkForm.month} onValueChange={v => setBulkForm({ ...bulkForm, month: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Year</Label><Input type="number" value={bulkForm.year} onChange={e => setBulkForm({ ...bulkForm, year: e.target.value })} /></div>
                <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={bulkForm.due_date} onChange={e => setBulkForm({ ...bulkForm, due_date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Remarks</Label><Input value={bulkForm.remarks} onChange={e => setBulkForm({ ...bulkForm, remarks: e.target.value })} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Generating..." : `Generate for All Students in Class`}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Single Voucher</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Voucher" : "Generate Fee Voucher"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.student_id} - {s.name} (Class {s.class})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Amount (PKR) *</Label><Input type="number" placeholder="5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Fee Type</Label>
                  <Select value={form.fee_type} onValueChange={v => setForm({ ...form, fee_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Admission">Admission</SelectItem>
                      <SelectItem value="Exam">Exam Fee</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={form.month} onValueChange={v => setForm({ ...form, month: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
                <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Voucher" : "Generate Voucher"}</Button></div>
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
                <TableHead>Voucher No</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Type</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vouchers</TableCell></TableRow> :
                filtered.map(v => {
                  const student = getStudent(v.student_id);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.voucher_no}</TableCell>
                      <TableCell className="font-medium">{student?.name || "—"}</TableCell>
                      <TableCell>{student?.class}-{student?.section}</TableCell>
                      <TableCell className="text-xs">{v.fee_type}</TableCell>
                      <TableCell>{v.month} {v.year}</TableCell>
                      <TableCell className="font-medium">₨ {Number(v.amount).toLocaleString("en-PK")}</TableCell>
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
