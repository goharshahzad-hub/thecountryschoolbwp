import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { sortClasses } from "@/lib/constants";

interface FeeVoucher {
  student_id: string;
  amount: number;
  status: string;
  amount_paid?: number | null;
  arrears?: number | null;
}

interface Student {
  id: string;
  name: string;
  class: string;
  section: string | null;
  monthly_fee?: number | null;
}

interface ClasswiseFeeMetricsProps {
  vouchers: FeeVoucher[];
  students: Student[];
  compact?: boolean;
}

const ClasswiseFeeMetrics = ({ vouchers, students, compact = false }: ClasswiseFeeMetricsProps) => {
  const classNames = sortClasses([...new Set(students.map(s => s.class))]);

  const metrics = classNames.map(cls => {
    const classStudents = students.filter(s => s.class === cls);
    const classStudentIds = new Set(classStudents.map(s => s.id));
    const classVouchers = vouchers.filter(v => classStudentIds.has(v.student_id));

    // Scholarship students = monthly_fee 0 (or null)
    const scholarshipCount = classStudents.filter(s => !Number(s.monthly_fee || 0)).length;

    let totalAmount = 0, paidAmount = 0, partialPaid = 0, pendingAmount = 0, overdueAmount = 0, arrearsAmount = 0;
    let paidCount = 0, partialCount = 0, pendingCount = 0, overdueCount = 0;
    classVouchers.forEach(v => {
      const amt = Number(v.amount) || 0;
      const paid = Number(v.amount_paid || 0);
      totalAmount += amt;
      arrearsAmount += Number(v.arrears || 0);
      if (v.status === "Paid") { paidAmount += amt; paidCount++; }
      else if (v.status === "Partial") { partialPaid += paid; partialCount++; pendingAmount += Math.max(0, amt - paid); }
      else if (v.status === "Pending") { pendingAmount += amt; pendingCount++; }
      else if (v.status === "Overdue") { overdueAmount += amt; overdueCount++; }
    });

    // Treat partial as "received" for collection-rate purposes
    const received = paidAmount + partialPaid;
    const collectionRate = totalAmount > 0 ? Math.round((received / totalAmount) * 100) : 0;

    return {
      className: cls, totalStudents: classStudentIds.size, scholarshipCount,
      totalAmount, paidAmount, partialPaid, pendingAmount, overdueAmount, arrearsAmount,
      paidCount, partialCount, pendingCount, overdueCount, collectionRate,
    };
  });

  const totals = metrics.reduce((acc, m) => ({
    totalStudents: acc.totalStudents + m.totalStudents,
    scholarshipCount: acc.scholarshipCount + m.scholarshipCount,
    totalAmount: acc.totalAmount + m.totalAmount,
    paidAmount: acc.paidAmount + m.paidAmount,
    partialPaid: acc.partialPaid + m.partialPaid,
    pendingAmount: acc.pendingAmount + m.pendingAmount,
    overdueAmount: acc.overdueAmount + m.overdueAmount,
    arrearsAmount: acc.arrearsAmount + m.arrearsAmount,
    paidCount: acc.paidCount + m.paidCount,
    partialCount: acc.partialCount + m.partialCount,
    pendingCount: acc.pendingCount + m.pendingCount,
    overdueCount: acc.overdueCount + m.overdueCount,
  }), { totalStudents:0,scholarshipCount:0,totalAmount:0,paidAmount:0,partialPaid:0,pendingAmount:0,overdueAmount:0,arrearsAmount:0,paidCount:0,partialCount:0,pendingCount:0,overdueCount:0 });

  const overallReceived = totals.paidAmount + totals.partialPaid;
  const overallRate = totals.totalAmount > 0 ? Math.round((overallReceived / totals.totalAmount) * 100) : 0;

  if (metrics.length === 0) return null;

  const fmt = (n: number) => `₨ ${n.toLocaleString("en-PK")}`;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Class-wise Fee Collection</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead className="text-center">Students</TableHead>
              <TableHead className="text-center">Scholarship</TableHead>
              {!compact && <TableHead className="text-right">Voucher Total</TableHead>}
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Partial Recv.</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead className="text-right">Arrears</TableHead>
              <TableHead className="text-center">Coll. %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map(m => (
              <TableRow key={m.className}>
                <TableCell className="font-medium">Class {m.className}</TableCell>
                <TableCell className="text-center">{m.totalStudents}</TableCell>
                <TableCell className="text-center">
                  {m.scholarshipCount > 0 ? <Badge variant="outline" className="border-primary/30 text-primary">{m.scholarshipCount}</Badge> : "—"}
                </TableCell>
                {!compact && <TableCell className="text-right font-medium">{fmt(m.totalAmount)}</TableCell>}
                <TableCell className="text-right">
                  <span className="text-success font-medium">{fmt(m.paidAmount)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.paidCount})</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-info font-medium" style={{ color: "hsl(217 91% 50%)" }}>{fmt(m.partialPaid)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.partialCount})</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-warning font-medium">{fmt(m.pendingAmount)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.pendingCount})</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-destructive font-medium">{fmt(m.overdueAmount)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.overdueCount})</span>
                </TableCell>
                <TableCell className="text-right text-destructive">{fmt(m.arrearsAmount)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={m.collectionRate >= 80 ? "border-success/30 text-success" : m.collectionRate >= 50 ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive"}>
                    {m.collectionRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-center">{totals.totalStudents}</TableCell>
              <TableCell className="text-center">{totals.scholarshipCount}</TableCell>
              {!compact && <TableCell className="text-right">{fmt(totals.totalAmount)}</TableCell>}
              <TableCell className="text-right text-success">{fmt(totals.paidAmount)} <span className="text-xs">({totals.paidCount})</span></TableCell>
              <TableCell className="text-right">{fmt(totals.partialPaid)} <span className="text-xs">({totals.partialCount})</span></TableCell>
              <TableCell className="text-right text-warning">{fmt(totals.pendingAmount)} <span className="text-xs">({totals.pendingCount})</span></TableCell>
              <TableCell className="text-right text-destructive">{fmt(totals.overdueAmount)} <span className="text-xs">({totals.overdueCount})</span></TableCell>
              <TableCell className="text-right text-destructive">{fmt(totals.arrearsAmount)}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={overallRate >= 80 ? "border-success/30 text-success" : overallRate >= 50 ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive"}>
                  {overallRate}%
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClasswiseFeeMetrics;
