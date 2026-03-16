import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";
import StudentwiseFeeMetrics from "@/components/StudentwiseFeeMetrics";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";
import SortableTableHead, { useTableSort } from "@/components/SortableTableHead";

interface FeeRecord {
  id: string; voucher_no: string; student_id: string; amount: number;
  fee_type: string; month: string; year: number; due_date: string;
  paid_date: string | null; status: string;
}

interface Student {
  id: string; student_id: string; name: string; class: string; section: string | null;
}

const Fees = () => {
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: feeData }, { data: studentData }] = await Promise.all([
      supabase.from("fee_vouchers").select("*").order("created_at", { ascending: false }).limit(10000),
      supabase.from("students").select("id, student_id, name, class, section, monthly_fee").limit(5000),
    ]);
    if (feeData) setFees(feeData);
    if (studentData) setStudents(studentData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStudent = (id: string) => students.find(s => s.id === id);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fee record?")) return;
    const { error } = await supabase.from("fee_vouchers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchData(); }
  };

  const markPaid = async (id: string) => {
    await supabase.from("fee_vouchers").update({ status: "Paid", paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    fetchData();
    toast({ title: "Marked as Paid" });
  };

  const paidCount = fees.filter(f => f.status === "Paid").length;
  const pendingCount = fees.filter(f => f.status === "Pending").length;
  const overdueCount = fees.filter(f => f.status === "Overdue").length;
  const paidAmount = fees.filter(f => f.status === "Paid").reduce((s, f) => s + Number(f.amount), 0);
  const pendingAmount = fees.filter(f => f.status === "Pending").reduce((s, f) => s + Number(f.amount), 0);
  const overdueAmount = fees.filter(f => f.status === "Overdue").reduce((s, f) => s + Number(f.amount), 0);
  const totalAmount = paidAmount + pendingAmount + overdueAmount;

  const statusColor = (s: string) => s === "Paid" ? "border-success/30 text-success" : s === "Pending" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive";

  // Add sorting - augment fees with student name for sorting
  const feesWithName = fees.map(f => ({
    ...f,
    studentName: getStudent(f.student_id)?.name || "",
    className: getStudent(f.student_id) ? `${getStudent(f.student_id)!.class}-${getStudent(f.student_id)!.section}` : "",
  }));

  const { sortKey, sortDir, handleSort, sortData } = useTableSort<typeof feesWithName[0]>("voucher_no", "desc");
  const sorted = sortData(feesWithName);

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fee Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage student fee payments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = fees.map(f => {
              const student = students.find(s => s.id === f.student_id);
              return `<tr><td>${f.voucher_no}</td><td style="text-align:left">${student?.name || "—"}</td><td>${student ? `${student.class}-${student.section}` : "—"}</td><td>₨ ${Number(f.amount).toLocaleString("en-PK")}</td><td>${f.due_date}</td><td>${f.paid_date || "—"}</td><td>${f.status}</td></tr>`;
            }).join("");
            downloadA4Pdf(`<div class="print-page">${schoolHeader("FEE REPORT")}<table><thead><tr><th>Voucher</th><th>Student</th><th>Class</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Fee_Report");
          }}><Download className="mr-2 h-4 w-4" />Save PDF</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = fees.map(f => {
              const student = students.find(s => s.id === f.student_id);
              return `<tr><td>${f.voucher_no}</td><td style="text-align:left">${student?.name || "—"}</td><td>${student ? `${student.class}-${student.section}` : "—"}</td><td>₨ ${Number(f.amount).toLocaleString("en-PK")}</td><td>${f.due_date}</td><td>${f.paid_date || "—"}</td><td>${f.status}</td></tr>`;
            }).join("");
            printA4(`<div class="print-page">${schoolHeader("FEE COLLECTION REPORT")}<div class="print-info"><div>Generated: <span>${new Date().toLocaleDateString("en-PK")}</span></div><div>Total Records: <span>${fees.length}</span></div><div>Total Collected: <span>₨ ${paidAmount.toLocaleString("en-PK")}</span></div><div>Total Pending: <span>₨ ${(pendingAmount + overdueAmount).toLocaleString("en-PK")}</span></div></div><table><thead><tr><th>Voucher</th><th>Student</th><th>Class</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Fee Report");
          }}><Printer className="mr-2 h-4 w-4" />Print Report</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Amount", amount: totalAmount, count: fees.length, cls: "text-foreground" },
          { label: "Paid", amount: paidAmount, count: paidCount, cls: "text-success" },
          { label: "Pending", amount: pendingAmount, count: pendingCount, cls: "text-warning" },
          { label: "Overdue", amount: overdueAmount, count: overdueCount, cls: "text-destructive" },
        ].map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className={`font-display text-xl font-bold ${s.cls}`}>₨ {s.amount.toLocaleString("en-PK")}</p>
              <p className="text-xs text-muted-foreground">{s.label} ({s.count} vouchers)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6"><ClasswiseFeeMetrics vouchers={fees} students={students} /></div>
      <div className="mb-6"><StudentwiseFeeMetrics vouchers={fees} students={students} /></div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : fees.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No fee records yet. Generate vouchers from the Fee Vouchers page.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead label="Voucher" sortKey="voucher_no" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <SortableTableHead label="Student" sortKey="studentName" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <SortableTableHead label="Class" sortKey="className" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <SortableTableHead label="Amount" sortKey="amount" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <SortableTableHead label="Due Date" sortKey="due_date" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <SortableTableHead label="Paid Date" sortKey="paid_date" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <SortableTableHead label="Status" sortKey="status" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.voucher_no}</TableCell>
                    <TableCell className="font-medium">{f.studentName || "—"}</TableCell>
                    <TableCell>{f.className || "—"}</TableCell>
                    <TableCell className="font-medium">₨ {Number(f.amount).toLocaleString("en-PK")}</TableCell>
                    <TableCell className="text-muted-foreground">{f.due_date}</TableCell>
                    <TableCell className="text-muted-foreground">{f.paid_date || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(f.status)}>{f.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {f.status !== "Paid" && (
                        <Button variant="outline" size="sm" className="mr-1" onClick={() => markPaid(f.id)}>Mark Paid</Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Fees;
