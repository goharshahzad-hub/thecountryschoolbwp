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
import { Plus, Search, Printer, Receipt, Pencil, Trash2 } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printVoucher, setPrintVoucher] = useState<FeeVoucher | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    student_id: "", amount: "", fee_type: "Monthly", month: months[new Date().getMonth()],
    year: new Date().getFullYear().toString(), due_date: "", status: "Pending", remarks: ""
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
    const year = new Date().getFullYear();
    return `VCH-${year}-${(vouchers.length + 1).toString().padStart(5, "0")}`;
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
    setPrintVoucher(v);
    setTimeout(() => {
      const content = printRef.current;
      if (!content) return;
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<html><head><title>Fee Voucher - ${v.voucher_no}</title><style>
        body{font-family:Arial,sans-serif;padding:20px;color:#222}
        .voucher{border:2px solid #333;padding:24px;max-width:600px;margin:auto}
        .header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:16px}
        .header h1{font-size:20px;margin:0}
        .header p{font-size:12px;color:#666;margin:4px 0}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ddd;font-size:14px}
        .row .label{color:#666}
        .total{font-size:18px;font-weight:bold;border-top:2px solid #333;padding-top:12px;margin-top:12px}
        .footer{text-align:center;margin-top:20px;font-size:11px;color:#999}
        @media print{body{padding:0}}
      </style></head><body>${content.innerHTML}<script>window.print();window.close()</script></body></html>`);
      win.document.close();
    }, 100);
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
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Generate Voucher</Button>
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
              <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Generating..." : "Generate Voucher"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
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
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(v)}><Printer className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden print template */}
      <div className="hidden">
        <div ref={printRef}>
          {printVoucher && (() => {
            const student = getStudent(printVoucher.student_id);
            return (
              <div className="voucher">
                <div className="header">
                  <h1>{settings.school_name} — {settings.campus}</h1>
                  <p>{settings.city}, Pakistan</p>
                  <p style={{ fontSize: "16px", fontWeight: "bold", marginTop: "8px" }}>FEE VOUCHER</p>
                </div>
                <div className="row"><span className="label">Voucher No:</span><span>{printVoucher.voucher_no}</span></div>
                <div className="row"><span className="label">Student ID:</span><span>{student?.student_id}</span></div>
                <div className="row"><span className="label">Student Name:</span><span>{student?.name}</span></div>
                <div className="row"><span className="label">Father's Name:</span><span>{student?.father_name}</span></div>
                <div className="row"><span className="label">Class:</span><span>{student?.class}-{student?.section}</span></div>
                <div className="row"><span className="label">Fee Type:</span><span>{printVoucher.fee_type}</span></div>
                <div className="row"><span className="label">Month / Year:</span><span>{printVoucher.month} {printVoucher.year}</span></div>
                <div className="row"><span className="label">Due Date:</span><span>{printVoucher.due_date}</span></div>
                <div className="row"><span className="label">Status:</span><span>{printVoucher.status}</span></div>
                {printVoucher.remarks && <div className="row"><span className="label">Remarks:</span><span>{printVoucher.remarks}</span></div>}
                <div className="row total"><span>Total Amount:</span><span>₨ {Number(printVoucher.amount).toLocaleString("en-PK")}</span></div>
                <div className="footer">
                  <p>This is a computer-generated voucher. Please pay at the school office before the due date.</p>
                  <p>📞 {settings.phone} | 📧 {settings.email}</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeeVouchers;
