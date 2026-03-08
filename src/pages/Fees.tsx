import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ClasswiseFeeMetrics from "@/components/ClasswiseFeeMetrics";

interface FeeRecord {
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
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
}

const Fees = () => {
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: feeData }, { data: studentData }] = await Promise.all([
      supabase.from("fee_vouchers").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section"),
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

  const paid = fees.filter(f => f.status === "Paid").length;
  const pending = fees.filter(f => f.status === "Pending").length;
  const overdue = fees.filter(f => f.status === "Overdue").length;

  const statusColor = (s: string) => s === "Paid" ? "border-success/30 text-success" : s === "Pending" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive";

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fee Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage student fee payments</p>
        </div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export Report</Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Paid", count: paid, cls: "text-success" },
          { label: "Pending", count: pending, cls: "text-warning" },
          { label: "Overdue", count: overdue, cls: "text-destructive" },
        ].map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className={`font-display text-3xl font-bold ${s.cls}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <ClasswiseFeeMetrics vouchers={fees} students={students} />
      </div>

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
                  <TableHead>Voucher</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map(f => {
                  const student = getStudent(f.student_id);
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.voucher_no}</TableCell>
                      <TableCell className="font-medium">{student?.name || "—"}</TableCell>
                      <TableCell>{student ? `${student.class}-${student.section}` : "—"}</TableCell>
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

export default Fees;
