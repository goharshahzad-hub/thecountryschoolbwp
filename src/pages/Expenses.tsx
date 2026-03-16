import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Filter, DollarSign, TrendingDown, Download, Printer } from "lucide-react";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";
import SortableTableHead, { useTableSort } from "@/components/SortableTableHead";

const EXPENSE_HEADS = [
  "Teaching Staff Salaries", "Non-Teaching Staff Salaries", "Electricity", "Gas", "Water",
  "Internet & Phone", "Rent", "Building Maintenance", "Furniture & Equipment",
  "Stationery & Supplies", "Books & Learning Materials", "Transport / Fuel",
  "Examination Expenses", "Events & Functions", "Sports & Activities",
  "Cleaning & Janitorial", "Security", "Insurance", "Marketing & Advertising", "Miscellaneous",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online"];

interface Expense {
  id: string; expense_head: string; description: string; amount: number;
  expense_date: string; month: string; year: number; paid_to: string;
  payment_method: string; receipt_no: string; remarks: string; created_at: string;
}

const defaultForm = {
  expense_head: "", description: "", amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  month: MONTHS[new Date().getMonth()],
  year: new Date().getFullYear().toString(),
  paid_to: "", payment_method: "Cash", receipt_no: "", remarks: "",
};

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterHead, setFilterHead] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    if (!error) setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const availableYears = useMemo(() => {
    const years = [...new Set(expenses.map(e => e.year))];
    if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
    return years.sort((a, b) => b - a);
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterMonth !== "all" && e.month !== filterMonth) return false;
      if (filterYear !== "all" && e.year !== Number(filterYear)) return false;
      if (filterHead !== "all" && e.expense_head !== filterHead) return false;
      if (search && !e.description.toLowerCase().includes(search.toLowerCase()) &&
          !e.paid_to.toLowerCase().includes(search.toLowerCase()) &&
          !e.expense_head.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [expenses, filterMonth, filterYear, filterHead, search]);

  const { sortKey, sortDir, handleSort, sortData } = useTableSort<Expense>("expense_date", "desc");
  const sorted = sortData(filtered);

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const headwiseTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(e => { map[e.expense_head] = (map[e.expense_head] || 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleSubmit = async () => {
    if (!form.expense_head || !form.amount || Number(form.amount) <= 0) {
      toast({ title: "Error", description: "Expense head and valid amount are required", variant: "destructive" });
      return;
    }
    const payload = {
      expense_head: form.expense_head, description: form.description, amount: Number(form.amount),
      expense_date: form.expense_date, month: form.month, year: Number(form.year),
      paid_to: form.paid_to, payment_method: form.payment_method, receipt_no: form.receipt_no, remarks: form.remarks,
    };

    if (editingId) {
      const { error } = await supabase.from("expenses").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Expense updated" });
    } else {
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Expense added" });
    }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); fetchExpenses();
  };

  const handleEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({
      expense_head: e.expense_head, description: e.description || "", amount: e.amount.toString(),
      expense_date: e.expense_date, month: e.month, year: e.year.toString(),
      paid_to: e.paid_to || "", payment_method: e.payment_method, receipt_no: e.receipt_no || "", remarks: e.remarks || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    toast({ title: "Expense deleted" }); fetchExpenses();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Expense Sheet</h1>
          <p className="text-sm text-muted-foreground">Track and manage all school expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = sorted.map(e => `<tr><td>${e.expense_date}</td><td>${e.expense_head}</td><td>${e.description}</td><td>${e.paid_to}</td><td>${e.payment_method}</td><td>₨ ${Number(e.amount).toLocaleString("en-PK")}</td></tr>`).join("");
            downloadA4Pdf(`<div class="print-page">${schoolHeader("EXPENSE REPORT")}<div class="print-info"><div>Total Expenses: <span>₨ ${totalFiltered.toLocaleString("en-PK")}</span></div><div>Entries: <span>${sorted.length}</span></div></div><table><thead><tr><th>Date</th><th>Head</th><th>Description</th><th>Paid To</th><th>Method</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Expenses");
          }}><Download className="mr-2 h-4 w-4" />Save PDF</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = sorted.map(e => `<tr><td>${e.expense_date}</td><td>${e.expense_head}</td><td>${e.description}</td><td>${e.paid_to}</td><td>${e.payment_method}</td><td>₨ ${Number(e.amount).toLocaleString("en-PK")}</td></tr>`).join("");
            printA4(`<div class="print-page">${schoolHeader("EXPENSE REPORT")}<div class="print-info"><div>Total Expenses: <span>₨ ${totalFiltered.toLocaleString("en-PK")}</span></div><div>Entries: <span>${sorted.length}</span></div></div><table><thead><tr><th>Date</th><th>Head</th><th>Description</th><th>Paid To</th><th>Method</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Expense Report");
          }}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Button onClick={() => { setEditingId(null); setForm(defaultForm); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <TrendingDown className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="font-display text-xl font-bold text-destructive">₨ {totalFiltered.toLocaleString("en-PK")}</p>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="font-display text-xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Entries</p>
          </CardContent>
        </Card>
        {headwiseTotals.slice(0, 2).map(([head, total]) => (
          <Card key={head} className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="font-display text-lg font-bold text-foreground">₨ {total.toLocaleString("en-PK")}</p>
              <p className="text-xs text-muted-foreground truncate">{head}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-[180px]" />
        <Select value={filterHead} onValueChange={setFilterHead}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Expense Head" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Heads</SelectItem>
            {EXPENSE_HEADS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[110px]"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Headwise Breakdown */}
      {headwiseTotals.length > 0 && (
        <Card className="mb-4 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Headwise Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {headwiseTotals.map(([head, total]) => (
                <div key={head} className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2">
                  <span className="text-xs text-muted-foreground truncate mr-2">{head}</span>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">₨ {total.toLocaleString("en-PK")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="Date" sortKey="expense_date" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableTableHead label="Expense Head" sortKey="expense_head" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableTableHead label="Description" sortKey="description" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableTableHead label="Paid To" sortKey="paid_to" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableTableHead label="Method" sortKey="payment_method" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableTableHead label="Amount" sortKey="amount" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} className="text-right" />
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No expenses found</TableCell></TableRow>
              ) : (
                sorted.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{e.expense_date}</TableCell>
                    <TableCell className="font-medium">{e.expense_head}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                    <TableCell>{e.paid_to}</TableCell>
                    <TableCell>{e.payment_method}</TableCell>
                    <TableCell className="text-right font-semibold">₨ {Number(e.amount).toLocaleString("en-PK")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(e)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Expense Head *</Label>
              <Select value={form.expense_head} onValueChange={v => setForm(f => ({ ...f, expense_head: v }))}>
                <SelectTrigger><SelectValue placeholder="Select head" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_HEADS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount (₨) *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month</Label>
                <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Paid To</Label><Input value={form.paid_to} onChange={e => setForm(f => ({ ...f, paid_to: e.target.value }))} /></div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Receipt No.</Label><Input value={form.receipt_no} onChange={e => setForm(f => ({ ...f, receipt_no: e.target.value }))} /></div>
            <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></div>
            <Button onClick={handleSubmit} className="w-full">{editingId ? "Update" : "Add"} Expense</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Expenses;
