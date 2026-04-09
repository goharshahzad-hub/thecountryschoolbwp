import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Plus, Trash2 } from "lucide-react";
import { printA4, schoolHeader, schoolFooter, generateQRData } from "@/lib/printUtils";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online"];

interface LineItem {
  description: string;
  amount: string;
}

const ReceiptGenerator = () => {
  const { settings } = useSchoolSettings();
  const [form, setForm] = useState({
    receipt_no: `REC-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    received_from: "",
    purpose: "",
    payment_method: "Cash",
    remarks: "",
  });
  const [items, setItems] = useState<LineItem[]>([{ description: "", amount: "" }]);

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const addItem = () => setItems([...items, { description: "", amount: "" }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const buildReceiptHtml = () => {
    const qrData = generateQRData("Receipt", { No: form.receipt_no, From: form.received_from, Amount: `Rs${total}` });
    const qrImg = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}" alt="QR" style="width:70px;height:70px;" />`;

    const rows = items.filter(i => i.description && i.amount).map((item, idx) =>
      `<tr><td style="text-align:center">${idx + 1}</td><td>${item.description}</td><td style="text-align:right;font-weight:bold">₨ ${parseFloat(item.amount).toLocaleString("en-PK")}</td></tr>`
    ).join("");

    return `
      <div class="print-page">
        ${schoolHeader("PAYMENT RECEIPT", qrData)}
        <div class="print-info print-info-3col">
          <div><span>Receipt No:</span> ${form.receipt_no}</div>
          <div><span>Date:</span> ${form.date}</div>
          <div><span>Payment Method:</span> ${form.payment_method}</div>
        </div>
        <div class="print-info">
          <div><span>Received From:</span> ${form.received_from}</div>
          <div><span>Purpose:</span> ${form.purpose}</div>
        </div>
        <table>
          <thead><tr><th style="width:40px">#</th><th style="text-align:left">Description</th><th style="text-align:right;width:120px">Amount</th></tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="2" style="text-align:right"><strong>Total Amount</strong></td>
              <td style="text-align:right"><strong>₨ ${total.toLocaleString("en-PK")}</strong></td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:12px;font-size:12px;padding:8px;border:1px solid #ddd;background:#f9f9f9;">
          <strong>Amount in words:</strong> ${numberToWords(total)} Rupees Only
        </div>
        ${form.remarks ? `<div style="margin-top:8px;font-size:11px;"><strong>Remarks:</strong> ${form.remarks}</div>` : ""}
        <div class="signatures">
          <div>Received By</div>
          <div>Authorized Signature</div>
          <div>Stamp</div>
        </div>
        ${schoolFooter()}
      </div>
    `;
  };

  const handlePrint = () => printA4(buildReceiptHtml(), `Receipt ${form.receipt_no}`);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Receipt Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate general payment receipts with school branding</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Receipt Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Receipt No.</Label>
                <Input value={form.receipt_no} onChange={e => setForm(f => ({ ...f, receipt_no: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Received From *</Label>
                <Input value={form.received_from} onChange={e => setForm(f => ({ ...f, received_from: e.target.value }))} placeholder="Name of payer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purpose</Label>
                <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Admission Fee, Donation" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">Line Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input placeholder="Description" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} className="flex-1" />
                  <Input type="number" placeholder="Amount" value={item.amount} onChange={e => updateItem(idx, "amount", e.target.value)} className="w-28" />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              ))}
              <div className="mt-2 text-right font-display text-lg font-bold text-foreground">
                Total: ₨ {total.toLocaleString("en-PK")}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" rows={2} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePrint} className="gradient-primary text-primary-foreground flex-1">
                <Printer className="mr-2 h-4 w-4" />Print Receipt
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
                <p><strong>From:</strong> {form.received_from || "—"}</p>
                <p><strong>Method:</strong> {form.payment_method}</p>
              </div>
              {items.filter(i => i.description).map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs border-b border-dashed border-border pb-1">
                  <span>{item.description}</span>
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
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
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
