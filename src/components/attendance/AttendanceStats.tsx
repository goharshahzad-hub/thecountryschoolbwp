import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface AttendanceStatsProps {
  present: number;
  absent: number;
  late: number;
  total: number;
}

const AttendanceStats = ({ present, absent, late, total }: AttendanceStatsProps) => {
  if (total === 0) return null;

  const stats = [
    { label: "Present", value: present, icon: CheckCircle, color: "text-success" },
    { label: "Absent", value: absent, icon: XCircle, color: "text-destructive" },
    { label: "Late", value: late, icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Icon className={`h-8 w-8 ${color}`} />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AttendanceStats;
