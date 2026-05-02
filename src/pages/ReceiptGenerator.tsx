import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, Trash2, Link as LinkIcon, Save, CheckCircle2 } from "lucide-react";
import { printA4, schoolHeader, schoolFooter, generateQRData } from "@/lib/printUtils";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SearchableCombobox from "@/components/SearchableCombobox";
import PrintPreviewDialog from "@/components/PrintPreviewDialog";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online", "Easypaisa", "JazzCash"];

const FEE_HEADS = [
  "Tuition Fee",
  "Registration Fee",
  "Admission Fee",
  "Security Deposit",
  "Annual Charges",
  "Trip Charges",
  "Books / Summer Pack",
  "Late Fee",
  "Arrears",
  "Donation",
  "Examination Fee",
  "Custom",
];

interface LineItem {
  fee_head: string;
  custom_head: string;
  description: string;
  amount: string;
}

interface Student { id: string; student_id: string; name: string; class: string; section: string | null; father_name: string; parent_user_id: string | null; }
interface Voucher { id: string; voucher_no: string; student_id: string; month: string; year: number; amount: number; status: string; }
interface ParentProfile { user_id: string; full_name: string; phone: string | null; }

const ReceiptGenerator = () => {
  const { settings } = useSchoolSettings();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [parents, setParents] = useState<ParentProfile[]>([]);

  const [form, setForm] = useState({
    receipt_no: `REC-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    received_from: "",
    payment_method: "Cash",
    transaction_no: "",
    remarks: "",
    student_id: "",
    parent_id: "",
    voucher_id: "",
    auto_mark_paid: true,
  });
  const [items, setItems] = useState<LineItem[]>([
    { fee_head: "Tuition Fee", custom_head: "", description: "", amount: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [savedReceiptNo, setSavedReceiptNo] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, v, p] = await Promise.all([
        supabase.from("students").select("id, student_id, name, class, section, father_name, parent_user_id").order("name"),
        supabase.from("fee_vouchers").select("id, voucher_no, student_id, month, year, amount, status").neq("status", "Paid").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name, phone").eq("role", "parent"),
      ]);
      setStudents((s.data as any) || []);
      setVouchers((v.data as any) || []);
      setParents((p.data as any) || []);
    })();
  }, []);

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  // When a student is picked, auto-fill received_from with father name + parent if linked
  const handleStudentChange = (sid: string) => {
    const st = students.find((x) => x.id === sid);
    setForm((f) => ({
      ...f,
      student_id: sid,
      voucher_id: "",
      parent_id: st?.parent_user_id || "",
      received_from: st ? `${st.father_name} (Father of ${st.name})` : f.received_from,
    }));
  };

  const handleParentChange = (pid: string) => {
    const par = parents.find((p) => p.user_id === pid);
    setForm((f) => ({ ...f, parent_id: pid, received_from: par ? par.full_name : f.received_from }));
  };

  const handleVoucherChange = (vid: string) => {
    const v = vouchers.find((x) => x.id === vid);
    setForm((f) => ({ ...f, voucher_id: vid }));
    if (v) {
      // Pre-fill a single line item with voucher amount
      setItems([{ fee_head: "Tuition Fee", custom_head: "", description: `Voucher ${v.voucher_no} — ${v.month} ${v.year}`, amount: String(v.amount) }]);
    }
  };

  const studentVouchers = useMemo(
    () => (form.student_id ? vouchers.filter((v) => v.student_id === form.student_id) : []),
    [form.student_id, vouchers]
  );

  const addItem = () => setItems([...items, { fee_head: "Custom", custom_head: "", description: "", amount: "" }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const buildReceiptHtml = () => {
    const qrData = generateQRData("Receipt", { No: form.receipt_no, From: form.received_from, Amount: `Rs${total}` });
    const qrImg = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}" alt="QR" style="width:70px;height:70px;" />`;
    const rows = items.filter((i) => (i.fee_head || i.custom_head) && i.amount).map((item, idx) => {
      const head = item.fee_head === "Custom" ? (item.custom_head || "Custom") : item.fee_head;
      return `<tr><td style="text-align:center">${idx + 1}</td><td><strong>${head}</strong>${item.description ? `<br/><span style="font-size:10px;color:#666">${item.description}</span>` : ""}</td><td style="text-align:right;font-weight:bold">₨ ${parseFloat(item.amount).toLocaleString("en-PK")}</td></tr>`;
    }).join("");

    const linkedV = vouchers.find((v) => v.id === form.voucher_id);
    const linkedSt = students.find((s) => s.id === form.student_id);

    return `
      <div class="print-page">
        ${schoolHeader("PAYMENT RECEIPT", qrData)}
        <div class="print-info print-info-3col">
          <div><span>Receipt No:</span> ${form.receipt_no}</div>
          <div><span>Date:</span> ${form.date}</div>
          <div><span>Payment Method:</span> ${form.payment_method}</div>
        </div>
        <div class="print-info">
          <div><span>Received From:</span> ${form.received_from || "—"}</div>
          ${form.transaction_no ? `<div><span>Transaction #:</span> ${form.transaction_no}</div>` : ""}
          ${linkedSt ? `<div><span>Student:</span> ${linkedSt.name} (${linkedSt.class}-${linkedSt.section || ""})</div>` : ""}
          ${linkedV ? `<div><span>Voucher:</span> ${linkedV.voucher_no}</div>` : ""}
        </div>
        <table>
          <thead><tr><th style="width:40px">#</th><th style="text-align:left">Particulars</th><th style="text-align:right;width:120px">Amount</th></tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row"><td colspan="2" style="text-align:right"><strong>Total Amount</strong></td><td style="text-align:right"><strong>₨ ${total.toLocaleString("en-PK")}</strong></td></tr>
          </tbody>
        </table>
        <div style="margin-top:12px;font-size:12px;padding:8px;border:1px solid #ddd;background:#f9f9f9;">
          <strong>Amount in words:</strong> ${numberToWords(total)} Rupees Only
        </div>
        ${form.remarks ? `<div style="margin-top:8px;font-size:11px;"><strong>Remarks:</strong> ${form.remarks}</div>` : ""}
        <div class="signatures"><div>Received By</div><div>Authorized Signature</div><div>Stamp</div></div>
        ${schoolFooter()}
      </div>
    `;
  };

  const validateForm = () => {
    if (!form.received_from.trim() && !form.student_id) {
      toast({ title: "Missing Info", description: "Add a student or 'Received from' name", variant: "destructive" });
      return false;
    }
    if (items.filter((i) => i.amount && parseFloat(i.amount) > 0).length === 0) {
      toast({ title: "No Line Items", description: "Add at least one line item with an amount", variant: "destructive" });
      return false;
    }
    return true;
  };

  const savePaymentRecord = async () => {
    // Save one payment_records row per line item for full per-head history
    const rows = items
      .filter((i) => i.amount)
      .map((i) => ({
        receipt_no: form.receipt_no,
        payment_date: form.date,
        student_id: form.student_id || null,
        voucher_id: form.voucher_id || null,
        parent_user_id: form.parent_id || null,
        fee_head: i.fee_head === "Custom" ? (i.custom_head || "Custom") : i.fee_head,
        description: i.description,
        amount: parseFloat(i.amount) || 0,
        payment_method: form.payment_method,
        transaction_no: form.transaction_no || "",
        remarks: form.remarks,
      }));
    if (rows.length === 0) return false;
    const { error } = await supabase.from("payment_records" as any).insert(rows);
    if (error) {
      toast({ title: "Save Error", description: error.message, variant: "destructive" });
      return false;
    }
    // Auto-mark voucher as Paid
    if (form.auto_mark_paid && form.voucher_id) {
      await supabase.from("fee_vouchers").update({ status: "Paid", paid_date: form.date }).eq("id", form.voucher_id);
    }
    return true;
  };

  /** Save only — record payment in DB and reflect in student account, no print */
  const handleSaveOnly = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const ok = await savePaymentRecord();
    setSaving(false);
    if (ok) {
      setSavedReceiptNo(form.receipt_no);
      toast({
        title: "✓ Receipt Saved",
        description: `Receipt ${form.receipt_no} recorded in student account` + (form.auto_mark_paid && form.voucher_id ? " and voucher marked Paid" : ""),
      });
      // Refresh unpaid vouchers list so the just-paid voucher disappears
      const { data: v } = await supabase.from("fee_vouchers").select("id, voucher_no, student_id, month, year, amount, status").neq("status", "Paid").order("created_at", { ascending: false });
      setVouchers((v as any) || []);
    }
  };

  /** Open the print preview modal — does NOT save automatically (user can save first) */
  const handlePreview = () => {
    if (!validateForm()) return;
    setPreviewOpen(true);
  };

  /** Save (if not already) and then immediately print */
  const handleSaveAndPrint = async () => {
    if (!validateForm()) return;
    if (savedReceiptNo !== form.receipt_no) {
      setSaving(true);
      const ok = await savePaymentRecord();
      setSaving(false);
      if (!ok) return;
      setSavedReceiptNo(form.receipt_no);
      const { data: v } = await supabase.from("fee_vouchers").select("id, voucher_no, student_id, month, year, amount, status").neq("status", "Paid").order("created_at", { ascending: false });
      setVouchers((v as any) || []);
    }
    setPreviewOpen(true);
  };

  const resetForReceipt = () => {
    setForm((f) => ({
      ...f,
      receipt_no: `REC-${Date.now().toString().slice(-6)}`,
      received_from: "",
      transaction_no: "",
      remarks: "",
      student_id: "",
      parent_id: "",
      voucher_id: "",
    }));
    setItems([{ fee_head: "Tuition Fee", custom_head: "", description: "", amount: "" }]);
    setSavedReceiptNo(null);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Receipt Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate receipts linked to students, parents and fee vouchers — full history is saved automatically.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Receipt Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Receipt No.</Label>
                <Input value={form.receipt_no} onChange={(e) => setForm((f) => ({ ...f, receipt_no: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Link Student</Label>
                <SearchableCombobox
                  options={[{ value: "", label: "(no student)" }, ...students.map((s) => ({ value: s.id, label: s.name, sublabel: `${s.student_id} • ${s.class}-${s.section || ""}` }))]}
                  value={form.student_id}
                  onChange={handleStudentChange}
                  placeholder="Search student..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Link Parent</Label>
                <SearchableCombobox
                  options={[{ value: "", label: "(no parent)" }, ...parents.map((p) => ({ value: p.user_id, label: p.full_name || "(no name)", sublabel: p.phone || "" }))]}
                  value={form.parent_id}
                  onChange={handleParentChange}
                  placeholder="Search parent..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" />Link Existing Voucher (optional)</Label>
              <SearchableCombobox
                options={[{ value: "", label: "(no voucher — general payment)" }, ...studentVouchers.map((v) => ({ value: v.id, label: v.voucher_no, sublabel: `${v.month} ${v.year} — ₨${Number(v.amount).toLocaleString("en-PK")} • ${v.status}` }))]}
                value={form.voucher_id}
                onChange={handleVoucherChange}
                placeholder={form.student_id ? "Select unpaid voucher..." : "Pick a student first"}
                disabled={!form.student_id}
              />
              {form.voucher_id && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground mt-1 cursor-pointer">
                  <input type="checkbox" checked={form.auto_mark_paid} onChange={(e) => setForm((f) => ({ ...f, auto_mark_paid: e.target.checked }))} />
                  Auto-mark voucher as Paid after printing
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Received From *</Label>
              <Input value={form.received_from} onChange={(e) => setForm((f) => ({ ...f, received_from: e.target.value }))} placeholder="Name of payer" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transaction # <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  value={form.transaction_no}
                  onChange={(e) => setForm((f) => ({ ...f, transaction_no: e.target.value }))}
                  placeholder="Bank ref / cheque / TID"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">Line Items (with Fee Head)</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="rounded-md border border-border p-2 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <SearchableCombobox
                          options={FEE_HEADS.map((h) => ({ value: h, label: h }))}
                          value={item.fee_head}
                          onChange={(v) => updateItem(idx, "fee_head", v)}
                          placeholder="Fee head..."
                        />
                      </div>
                      <Input type="number" placeholder="Amount" value={item.amount} onChange={(e) => updateItem(idx, "amount", e.target.value)} className="w-28" />
                      {items.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                    {item.fee_head === "Custom" && (
                      <Input placeholder="Custom head name" value={item.custom_head} onChange={(e) => updateItem(idx, "custom_head", e.target.value)} />
                    )}
                    <Input placeholder="Description (optional)" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} className="text-xs" />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right font-display text-lg font-bold text-foreground">
                Total: ₨ {total.toLocaleString("en-PK")}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" rows={2} />
            </div>

            {savedReceiptNo === form.receipt_no && (
              <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-2 text-xs text-success">
                <CheckCircle2 className="h-4 w-4" />
                Receipt <span className="font-mono">{savedReceiptNo}</span> saved to student account.
                <Button variant="link" size="sm" className="ml-auto h-auto p-0 text-xs" onClick={resetForReceipt}>Start new receipt</Button>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <Button onClick={handleSaveOnly} disabled={saving} variant="outline" className="w-full">
                <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Only"}
              </Button>
              <Button onClick={handlePreview} variant="outline" className="w-full">
                <Printer className="mr-2 h-4 w-4" />Preview / Print
              </Button>
              <Button onClick={handleSaveAndPrint} disabled={saving} className="gradient-primary text-primary-foreground w-full">
                <Printer className="mr-2 h-4 w-4" />Save & Print
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm space-y-3">
              <div className="text-center border-b border-border pb-3">
                <p className="font-bold text-primary text-lg">{settings.school_name}</p>
                <p className="text-xs text-muted-foreground">{settings.campus}, {settings.city}</p>
                <p className="font-semibold mt-1">PAYMENT RECEIPT</p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <p><strong>Receipt No:</strong> {form.receipt_no}</p>
                <p><strong>Date:</strong> {form.date}</p>
                <p className="col-span-2"><strong>From:</strong> {form.received_from || "—"}</p>
                <p><strong>Method:</strong> {form.payment_method}</p>
                {form.voucher_id && <p><strong>Voucher:</strong> {vouchers.find((v) => v.id === form.voucher_id)?.voucher_no}</p>}
              </div>
              {items.filter((i) => i.amount).map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs border-b border-dashed border-border pb-1">
                  <span><Badge variant="outline" className="mr-1 text-[10px]">{item.fee_head === "Custom" ? item.custom_head || "Custom" : item.fee_head}</Badge>{item.description}</span>
                  <span className="font-semibold">₨ {(parseFloat(item.amount) || 0).toLocaleString("en-PK")}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-1 border-t border-border">
                <span>Total</span>
                <span>₨ {total.toLocaleString("en-PK")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };
  return convert(Math.round(num));
}

export default ReceiptGenerator;
