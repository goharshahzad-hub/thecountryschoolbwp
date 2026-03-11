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

interface ClassMetric {
  className: string;
  totalStudents: number;
  expectedMonthly: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  collectionRate: number;
}

const ClasswiseFeeMetrics = ({ vouchers, students, compact = false }: ClasswiseFeeMetricsProps) => {
  const classNames = [...new Set(students.map(s => s.class))].sort();

  const metrics: ClassMetric[] = classNames.map(cls => {
    const classStudents = students.filter(s => s.class === cls);
    const classStudentIds = new Set(classStudents.map(s => s.id));
    const classVouchers = vouchers.filter(v => classStudentIds.has(v.student_id));
    const expectedMonthly = classStudents.reduce((s, st) => s + ((st as any).monthly_fee || 0), 0);

    const paid = classVouchers.filter(v => v.status === "Paid");
    const pending = classVouchers.filter(v => v.status === "Pending");
    const overdue = classVouchers.filter(v => v.status === "Overdue");

    const totalAmount = classVouchers.reduce((s, v) => s + Number(v.amount), 0);
    const paidAmount = paid.reduce((s, v) => s + Number(v.amount), 0);

    return {
      className: cls,
      totalStudents: classStudentIds.size,
      expectedMonthly,
      totalAmount,
      paidAmount,
      pendingAmount: pending.reduce((s, v) => s + Number(v.amount), 0),
      overdueAmount: overdue.reduce((s, v) => s + Number(v.amount), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      collectionRate: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    };
  });

  const totals = metrics.reduce(
    (acc, m) => ({
      totalAmount: acc.totalAmount + m.totalAmount,
      paidAmount: acc.paidAmount + m.paidAmount,
      pendingAmount: acc.pendingAmount + m.pendingAmount,
      overdueAmount: acc.overdueAmount + m.overdueAmount,
      paidCount: acc.paidCount + m.paidCount,
      pendingCount: acc.pendingCount + m.pendingCount,
      overdueCount: acc.overdueCount + m.overdueCount,
    }),
    { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 }
  );

  const overallRate = totals.totalAmount > 0 ? Math.round((totals.paidAmount / totals.totalAmount) * 100) : 0;

  if (metrics.length === 0) return null;

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
              {!compact && <TableHead className="text-right">Voucher Total</TableHead>}
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead className="text-center">Collection %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map(m => (
              <TableRow key={m.className}>
                <TableCell className="font-medium">Class {m.className}</TableCell>
                <TableCell className="text-center">{m.totalStudents}</TableCell>
                {!compact && (
                  <TableCell className="text-right font-medium">₨ {m.totalAmount.toLocaleString("en-PK")}</TableCell>
                )}
                <TableCell className="text-right">
                  <span className="text-success font-medium">₨ {m.paidAmount.toLocaleString("en-PK")}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.paidCount})</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-warning font-medium">₨ {m.pendingAmount.toLocaleString("en-PK")}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.pendingCount})</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-destructive font-medium">₨ {m.overdueAmount.toLocaleString("en-PK")}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({m.overdueCount})</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={
                      m.collectionRate >= 80
                        ? "border-success/30 text-success"
                        : m.collectionRate >= 50
                        ? "border-warning/30 text-warning"
                        : "border-destructive/30 text-destructive"
                    }
                  >
                    {m.collectionRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-center">{metrics.reduce((s, m) => s + m.totalStudents, 0)}</TableCell>
              {!compact && (
                <TableCell className="text-right">₨ {totals.totalAmount.toLocaleString("en-PK")}</TableCell>
              )}
              <TableCell className="text-right text-success">
                ₨ {totals.paidAmount.toLocaleString("en-PK")}
                <span className="ml-1 text-xs">({totals.paidCount})</span>
              </TableCell>
              <TableCell className="text-right text-warning">
                ₨ {totals.pendingAmount.toLocaleString("en-PK")}
                <span className="ml-1 text-xs">({totals.pendingCount})</span>
              </TableCell>
              <TableCell className="text-right text-destructive">
                ₨ {totals.overdueAmount.toLocaleString("en-PK")}
                <span className="ml-1 text-xs">({totals.overdueCount})</span>
              </TableCell>
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
