import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const students = [
  "Ahmed Khan", "Fatima Ali", "Usman Tariq", "Ayesha Noor",
  "Hassan Raza", "Zainab Bibi", "Bilal Ahmad", "Maryam Iqbal",
  "Ali Hassan", "Sara Malik",
];

type Status = "present" | "absent" | "late";

const Attendance = () => {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [attendance, setAttendance] = useState<Record<string, Status>>(
    Object.fromEntries(students.map((s, i) => [s, i === 4 ? "absent" : i === 7 ? "late" : "present"]))
  );

  const toggle = (name: string) => {
    setAttendance(prev => {
      const order: Status[] = ["present", "absent", "late"];
      const next = order[(order.indexOf(prev[name]) + 1) % 3];
      return { ...prev, [name]: next };
    });
  };

  const counts = {
    present: Object.values(attendance).filter(v => v === "present").length,
    absent: Object.values(attendance).filter(v => v === "absent").length,
    late: Object.values(attendance).filter(v => v === "late").length,
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mark daily attendance</p>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["10-A", "10-B", "9-A", "9-B", "8-A"].map(c => (
              <SelectItem key={c} value={c}>Class {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">{counts.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">{counts.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-warning" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">{counts.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Class {selectedClass} — {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map((name, i) => (
              <button
                key={name}
                onClick={() => toggle(name)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">{name}</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    attendance[name] === "present" ? "border-success/30 bg-success/10 text-success" :
                    attendance[name] === "absent" ? "border-destructive/30 bg-destructive/10 text-destructive" :
                    "border-warning/30 bg-warning/10 text-warning"
                  }
                >
                  {attendance[name] === "present" && <CheckCircle className="mr-1 h-3 w-3" />}
                  {attendance[name] === "absent" && <XCircle className="mr-1 h-3 w-3" />}
                  {attendance[name] === "late" && <Clock className="mr-1 h-3 w-3" />}
                  {attendance[name].charAt(0).toUpperCase() + attendance[name].slice(1)}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Attendance;
