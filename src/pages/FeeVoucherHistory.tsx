import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Download, Printer, Search, History, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sortClasses, compareClassNames } from "@/lib/constants";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";

interface Voucher {
  id: string; student_id: string; student_name: string | null;
  class: string | null; month: string; year: number;
  amount: number; amount_paid: number | null; status: string;
  due_date: string | null; paid_date: string | null; created_at: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QTRS: Record<string, string[]> = {
  Q1: ["January","February","March"],
  Q2: ["April","May","June"],
  Q3: ["July","August","September"],
  Q4: ["October","November","December"],
};

const fmt = (n: number) => `₨ ${Math.round(n).toLocaleString("en-PK")}`;

const FeeVoucherHistory = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"month" | "quarter" | "annual" | "mtd">("month");
  const today = new Date();
  const [year, setYear] = useState<string>(today.getFullYear().toString());
  const [month, setMonth] = useState<string>(MONTHS[today.getMonth()]);
  const [quarter, setQuarter] = useState<string>("Q1");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("fee_vouchers")
        .select("id, student_id, student_name, class, month, year, amount, amount_paid, status, due_date, paid_date, created_at")
        .order("year", { ascending: false }).order("month").limit(20000);
      setVouchers((data || []) as any);
      setLoading(false);
    })();
  }, []);

  const availableYears = useMemo(() => {
    const ys = Array.from(new Set(vouchers.map(v => v.year))).sort((a, b) => b - a);
    return ys.length ? ys : [today.getFullYear()];
  }, [vouchers]);

  const periodVouchers = useMemo(() => {
    return vouchers.filter(v => {
      if (mode === "month") return v.year === Number(year) && v.month === month;
      if (mode === "quarter") return v.year === Number(year) && QTRS[quarter].includes(v.month);
      if (mode === "annual") return v.year === Number(year);
      if (mode === "mtd") {
        // current calendar month, only entries up to today
        const isCurrent = v.year === today.getFullYear() && v.month === MONTHS[today.getMonth()];
        if (!isCurrent) return false;
        const created = new Date(v.created_at);
        return created <= today;
      }
      return true;
    });
  }, [vouchers, mode, year, month, quarter]);

  const periodLabel = useMemo(() => {
    if (mode === "month") return `${month} ${year}`;
    if (mode === "quarter") return `${quarter} ${year} (${QTRS[quarter].join(", ")})`;
    if (mode === "annual") return `Year ${year}`;
    return `Month to Date — ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  }, [mode, year, month, quarter]);

  const totals = useMemo(() => {
    let billed = 0, collected = 0, outstanding = 0;
    periodVouchers.forEach(v => {
      const amt = Number(v.amount || 0);
      const paid = Number(v.amount_paid || 0);
      billed += amt;
      if (v.status === "Paid") collected += amt;
      else if (v.status === "Partial") { collected += paid; outstanding += Math.max(0, amt - paid); }
      else outstanding += amt;
    });
    return { billed, collected, outstanding, count: periodVouchers.length };
  }, [periodVouchers]);

  const trendData = useMemo(() => {
    // For month/MTD: per-day. For quarter: per-month. For annual: per-month.
    if (mode === "month" || mode === "mtd") {
      const map: Record<string, { day: string; collected: number; billed: number }> = {};
      periodVouchers.forEach(v => {
        const d = v.paid_date ? new Date(v.paid_date) : new Date(v.created_at);
        const key = `${d.getDate()}`;
        if (!map[key]) map[key] = { day: key, collected: 0, billed: 0 };
        map[key].billed += Number(v.amount || 0);
        if (v.status === "Paid") map[key].collected += Number(v.amount || 0);
        else if (v.status === "Partial") map[key].collected += Number(v.amount_paid || 0);
      });
      return Object.values(map).sort((a, b) => Number(a.day) - Number(b.day));
    }
    // grouped by month
    const map: Record<string, { name: string; collected: number; outstanding: number }> = {};
    periodVouchers.forEach(v => {
      if (!map[v.month]) map[v.month] = { name: v.month.slice(0, 3), collected: 0, outstanding: 0 };
      const amt = Number(v.amount || 0);
      const paid = Number(v.amount_paid || 0);
      if (v.status === "Paid") map[v.month].collected += amt;
      else if (v.status === "Partial") { map[v.month].collected += paid; map[v.month].outstanding += Math.max(0, amt - paid); }
      else map[v.month].outstanding += amt;
    });
    return MONTHS.filter(m => map[m]).map(m => map[m]);
  }, [periodVouchers, mode]);

  const classBreakdown = useMemo(() => {
    const map: Record<string, { class: string; billed: number; collected: number; outstanding: number; count: number }> = {};
    periodVouchers.forEach(v => {
      const cls = v.class || "—";
      if (!map[cls]) map[cls] = { class: cls, billed: 0, collected: 0, outstanding: 0, count: 0 };
      const amt = Number(v.amount || 0);
      const paid = Number(v.amount_paid || 0);
      map[cls].billed += amt;
      map[cls].count += 1;
      if (v.status === "Paid") map[cls].collected += amt;
      else if (v.status === "Partial") { map[cls].collected += paid; map[cls].outstanding += Math.max(0, amt - paid); }
      else map[cls].outstanding += amt;
    });
    return Object.values(map).sort((a, b) => compareClassNames(a.class, b.class));
  }, [periodVouchers]);

  const classOpts = useMemo(() => sortClasses(Array.from(new Set(vouchers.map(v => v.class).filter(Boolean) as string[]))), [vouchers]);

  const filteredList = useMemo(() => {
    return periodVouchers.filter(v => {
      if (classFilter !== "all" && v.class !== classFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(v.student_name || "").toLowerCase().includes(s) && !(v.student_id || "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [periodVouchers, classFilter, statusFilter, search]);

  const buildPrintHtml = () => {
    const summaryRows = classBreakdown.map(r => `<tr>
      <td style="text-align:left">${r.class}</td>
      <td>${r.count}</td>
      <td>${fmt(r.billed)}</td>
      <td style="color:#15803d">${fmt(r.collected)}</td>
      <td style="color:#b45309">${fmt(r.outstanding)}</td>
    </tr>`).join("");
    return `<div class="print-page">
      ${schoolHeader(`FEE VOUCHER REPORT — ${periodLabel.toUpperCase()}`)}
      <p class="list-subtitle">Total Vouchers: ${totals.count} &nbsp;|&nbsp; Billed: ${fmt(totals.billed)} &nbsp;|&nbsp; Collected: ${fmt(totals.collected)} &nbsp;|&nbsp; Outstanding: ${fmt(totals.outstanding)}</p>
      <h3 style="margin:14px 0 4px;font-size:13px;">Class-wise breakdown</h3>
      <table><thead><tr><th>Class</th><th>#</th><th>Billed</th><th>Collected</th><th>Outstanding</th></tr></thead><tbody>${summaryRows}</tbody></table>
      ${schoolFooter()}
    </div>`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Voucher History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Month-wise, quarterly, annual, and month-to-date fee reports</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadA4Pdf(buildPrintHtml(), `Vouchers_${periodLabel}`)}>
            <Download className="mr-2 h-4 w-4" /> Save PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => printA4(buildPrintHtml(), `Vouchers ${periodLabel}`)}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="month">Monthly</TabsTrigger>
          <TabsTrigger value="quarter">Quarterly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
          <TabsTrigger value="mtd">Month-to-Date</TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="mt-4">
          {/* Period selectors */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground mr-2">{periodLabel}</span>
            {mode !== "mtd" && (
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {mode === "month" && (
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {mode === "quarter" && (
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(QTRS).map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>

          {/* Totals */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-4">
            {[
              { label: "Total Vouchers", value: totals.count.toString(), cls: "text-foreground" },
              { label: "Billed", value: fmt(totals.billed), cls: "text-foreground" },
              { label: "Collected", value: fmt(totals.collected), cls: "text-success" },
              { label: "Outstanding", value: fmt(totals.outstanding), cls: "text-warning" },
            ].map((s, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4 text-center">
                  <p className={`font-display text-xl font-bold ${s.cls}`}>{loading ? "..." : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trend chart */}
          {trendData.length > 0 && (
            <Card className="mb-4 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Collection Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  {mode === "month" || mode === "mtd" ? (
                    <LineChart data={trendData as any}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="collected" stroke="hsl(142,71%,45%)" name="Collected" strokeWidth={2} />
                      <Line type="monotone" dataKey="billed" stroke="hsl(217,91%,50%)" name="Billed" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={trendData as any}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="collected" fill="hsl(142,71%,45%)" name="Collected" radius={[4,4,0,0]} />
                      <Bar dataKey="outstanding" fill="hsl(38,92%,50%)" name="Outstanding" radius={[4,4,0,0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Class-wise breakdown */}
          <Card className="mb-4 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Class-wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Vouchers</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classBreakdown.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No vouchers in this period.</TableCell></TableRow>
                  ) : classBreakdown.map(r => (
                    <TableRow key={r.class}>
                      <TableCell className="font-medium">{r.class}</TableCell>
                      <TableCell className="text-right">{r.count}</TableCell>
                      <TableCell className="text-right">{fmt(r.billed)}</TableCell>
                      <TableCell className="text-right text-success">{fmt(r.collected)}</TableCell>
                      <TableCell className="text-right text-warning">{fmt(r.outstanding)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Full voucher list */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Voucher List ({filteredList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Search by student name or ID" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOpts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No vouchers match.</TableCell></TableRow>
                    ) : filteredList.slice(0, 500).map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.student_name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.student_id}</TableCell>
                        <TableCell>{v.class || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{v.month} {v.year}</TableCell>
                        <TableCell className="text-right">{fmt(Number(v.amount || 0))}</TableCell>
                        <TableCell className="text-right">{fmt(Number(v.amount_paid || 0))}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            v.status === "Paid" ? "bg-green-100 text-green-700" :
                            v.status === "Partial" ? "bg-blue-100 text-blue-700" :
                            v.status === "Overdue" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }>{v.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredList.length > 500 && (
                  <p className="text-xs text-center text-muted-foreground mt-2">Showing first 500 of {filteredList.length}. Use filters or export to see more.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default FeeVoucherHistory;
