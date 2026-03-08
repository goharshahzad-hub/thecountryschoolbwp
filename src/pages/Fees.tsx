import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const feesData = [
  { id: "TCS-001", name: "Ahmed Khan", class: "10-A", amount: "₨ 5,000", dueDate: "2026-03-01", status: "Paid", paidDate: "2026-02-28" },
  { id: "TCS-002", name: "Fatima Ali", class: "9-B", amount: "₨ 5,000", dueDate: "2026-03-01", status: "Pending", paidDate: "-" },
  { id: "TCS-003", name: "Usman Tariq", class: "8-A", amount: "₨ 4,500", dueDate: "2026-03-01", status: "Paid", paidDate: "2026-03-01" },
  { id: "TCS-004", name: "Ayesha Noor", class: "7-B", amount: "₨ 4,500", dueDate: "2026-03-01", status: "Paid", paidDate: "2026-02-25" },
  { id: "TCS-005", name: "Hassan Raza", class: "10-A", amount: "₨ 5,000", dueDate: "2026-03-01", status: "Overdue", paidDate: "-" },
  { id: "TCS-006", name: "Zainab Bibi", class: "6-A", amount: "₨ 4,000", dueDate: "2026-03-01", status: "Paid", paidDate: "2026-03-02" },
  { id: "TCS-007", name: "Bilal Ahmad", class: "5-B", amount: "₨ 3,500", dueDate: "2026-03-01", status: "Pending", paidDate: "-" },
  { id: "TCS-008", name: "Maryam Iqbal", class: "10-B", amount: "₨ 5,000", dueDate: "2026-03-01", status: "Paid", paidDate: "2026-02-27" },
];

const Fees = () => {
  const paid = feesData.filter(f => f.status === "Paid").length;
  const pending = feesData.filter(f => f.status === "Pending").length;
  const overdue = feesData.filter(f => f.status === "Overdue").length;

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

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feesData.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">{f.id}</TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.class}</TableCell>
                  <TableCell className="font-medium">{f.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{f.dueDate}</TableCell>
                  <TableCell className="text-muted-foreground">{f.paidDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      f.status === "Paid" ? "border-success/30 text-success" :
                      f.status === "Pending" ? "border-warning/30 text-warning" :
                      "border-destructive/30 text-destructive"
                    }>{f.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Fees;
