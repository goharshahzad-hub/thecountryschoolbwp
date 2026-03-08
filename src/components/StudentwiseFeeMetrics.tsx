import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface FeeVoucher {
  student_id: string;
  amount: number;
  status: string;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  monthly_fee?: number | null;
}

interface Props {
  vouchers: FeeVoucher[];
  students: Student[];
}

const StudentwiseFeeMetrics = ({ vouchers, students }: Props) => {
  const studentMetrics = students
    .map(s => {
      const sv = vouchers.filter(v => v.student_id === s.id);
      const monthlyFee = (s as any).monthly_fee || 0;
      const pendingAmt = sv.filter(v => v.status === "Pending").reduce((sum, v) => sum + Number(v.amount), 0);
      const overdueAmt = sv.filter(v => v.status === "Overdue").reduce((sum, v) => sum + Number(v.amount), 0);
      const paidAmt = sv.filter(v => v.status === "Paid").reduce((sum, v) => sum + Number(v.amount), 0);
      const totalDue = pendingAmt + overdueAmt;
      return { ...s, monthlyFee, pendingAmt, overdueAmt, paidAmt, totalDue, voucherCount: sv.length };
    })
    .filter(s => s.voucherCount > 0 || s.monthlyFee > 0)
    .sort((a, b) => b.totalDue - a.totalDue);

  if (studentMetrics.length === 0) return null;

  const totalMonthly = studentMetrics.reduce((s, m) => s + m.monthlyFee, 0);
  const totalPaid = studentMetrics.reduce((s, m) => s + m.paidAmt, 0);
  const totalPending = studentMetrics.reduce((s, m) => s + m.pendingAmt, 0);
  const totalOverdue = studentMetrics.reduce((s, m) => s + m.overdueAmt, 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Student-wise Fee Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Monthly Fee</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead className="text-right">Total Due</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentMetrics.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.class}-{s.section}</TableCell>
                <TableCell className="text-right font-medium">₨ {s.monthlyFee.toLocaleString("en-PK")}</TableCell>
                <TableCell className="text-right text-success font-medium">₨ {s.paidAmt.toLocaleString("en-PK")}</TableCell>
                <TableCell className="text-right text-warning font-medium">₨ {s.pendingAmt.toLocaleString("en-PK")}</TableCell>
                <TableCell className="text-right text-destructive font-medium">₨ {s.overdueAmt.toLocaleString("en-PK")}</TableCell>
                <TableCell className="text-right font-bold">₨ {s.totalDue.toLocaleString("en-PK")}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={
                      s.totalDue === 0
                        ? "border-success/30 text-success"
                        : s.overdueAmt > 0
                        ? "border-destructive/30 text-destructive"
                        : "border-warning/30 text-warning"
                    }
                  >
                    {s.totalDue === 0 ? "Clear" : s.overdueAmt > 0 ? "Overdue" : "Due"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={3} className="text-right">Totals</TableCell>
              <TableCell className="text-right">₨ {totalMonthly.toLocaleString("en-PK")}</TableCell>
              <TableCell className="text-right text-success">₨ {totalPaid.toLocaleString("en-PK")}</TableCell>
              <TableCell className="text-right text-warning">₨ {totalPending.toLocaleString("en-PK")}</TableCell>
              <TableCell className="text-right text-destructive">₨ {totalOverdue.toLocaleString("en-PK")}</TableCell>
              <TableCell className="text-right font-bold">₨ {(totalPending + totalOverdue).toLocaleString("en-PK")}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StudentwiseFeeMetrics;
