import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sortClasses } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface StudentAttendance {
  id: string;
  student_id: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

const AttendanceReport = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedClass, setSelectedClass] = useState("");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [report, setReport] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch class options
  useEffect(() => {
    supabase.from("students").select("class, section").eq("status", "Active").then(({ data }) => {
      if (data) {
        const unique = sortClasses([...new Set(data.map(s => `${s.class}-${s.section || "A"}`))]);
        setClassOptions(unique);
        if (unique.length > 0) setSelectedClass(unique[0]);
      }
    });
  }, []);

  // Fetch report data
  useEffect(() => {
    if (!selectedClass) return;
    const fetchReport = async () => {
      setLoading(true);
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

      const [cls, sec] = selectedClass.split("-");
      const { data: students } = await supabase
        .from("students").select("id, student_id, name")
        .eq("class", cls).eq("section", sec || "A").eq("status", "Active").order("name");

      if (!students || students.length === 0) { setReport([]); setLoading(false); return; }

      const ids = students.map(s => s.id);
      const { data: records } = await supabase
        .from("attendance_records").select("student_id, status")
        .gte("date", startDate).lte("date", endDate).in("student_id", ids);

      const countMap: Record<string, { present: number; absent: number; late: number }> = {};
      ids.forEach(id => { countMap[id] = { present: 0, absent: 0, late: 0 }; });
      if (records) {
        records.forEach(r => {
          if (countMap[r.student_id]) {
            const s = r.status as "present" | "absent" | "late";
            countMap[r.student_id][s]++;
          }
        });
      }

      // Working days = unique dates with any attendance records for this class
      const uniqueDates = new Set(records?.map(r => r.student_id ? records.find(x => x.student_id === r.student_id) : null));
      const workingDays = records ? new Set(records.map(() => "")).size : 0;

      const reportData: StudentAttendance[] = students.map(s => {
        const c = countMap[s.id];
        const total = c.present + c.absent + c.late;
        const percentage = total > 0 ? Math.round(((c.present + c.late) / total) * 100) : 0;
        return { ...s, ...c, total, percentage };
      });

      setReport(reportData);
      setLoading(false);
    };
    fetchReport();
  }, [selectedClass, selectedMonth, selectedYear]);

  const classTotals = report.reduce((acc, s) => ({
    present: acc.present + s.present,
    absent: acc.absent + s.absent,
    late: acc.late + s.late,
    total: acc.total + s.total,
  }), { present: 0, absent: 0, late: 0, total: 0 });

  const classPercentage = classTotals.total > 0
    ? Math.round(((classTotals.present + classTotals.late) / classTotals.total) * 100) : 0;

  const monthName = months[parseInt(selectedMonth)];

  const buildPrintHtml = () => {
    const rows = report.map((s, i) => `
      <tr><td>${i + 1}</td><td>${s.student_id}</td><td style="text-align:left">${s.name}</td>
      <td>${s.present}</td><td>${s.absent}</td><td>${s.late}</td><td>${s.total}</td><td>${s.percentage}%</td></tr>`).join("");
    return `<div class="print-page">${schoolHeader("MONTHLY ATTENDANCE REPORT")}
      <div class="print-info"><div>Class: <span>${selectedClass}</span></div><div>Month: <span>${monthName} ${selectedYear}</span></div>
      <div>Class Attendance: <span>${classPercentage}%</span></div></div>
      <table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>%</th></tr></thead>
      <tbody>${rows}</tbody></table>${schoolFooter()}</div>`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Monthly Attendance Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">View attendance percentages per student and class</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {classOptions.length > 0 && (
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => downloadA4Pdf(buildPrintHtml(), `AttendanceReport_${selectedClass}_${monthName}_${selectedYear}`)}>
            <Download className="mr-2 h-4 w-4" />Save PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => printA4(buildPrintHtml(), "Attendance Report")}>
            <Printer className="mr-2 h-4 w-4" />Print
          </Button>
        </div>
      </div>

      {/* Class Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{report.length}</p><p className="text-xs text-muted-foreground">Students</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{classTotals.present}</p><p className="text-xs text-muted-foreground">Total Present</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{classTotals.absent}</p><p className="text-xs text-muted-foreground">Total Absent</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">{classTotals.late}</p><p className="text-xs text-muted-foreground">Total Late</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{classPercentage}%</p><p className="text-xs text-muted-foreground">Class Attendance</p></CardContent></Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Class {selectedClass} — {monthName} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : report.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No attendance records found for this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Total Days</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-center text-success font-medium">{s.present}</TableCell>
                    <TableCell className="text-center text-destructive font-medium">{s.absent}</TableCell>
                    <TableCell className="text-center text-warning font-medium">{s.late}</TableCell>
                    <TableCell className="text-center">{s.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={
                        s.percentage >= 90 ? "border-success/30 text-success" :
                        s.percentage >= 75 ? "border-warning/30 text-warning" :
                        "border-destructive/30 text-destructive"
                      }>
                        {s.percentage}%
                      </Badge>
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

export default AttendanceReport;
