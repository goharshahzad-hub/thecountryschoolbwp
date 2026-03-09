import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Save, Printer, MessageCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { downloadCSV } from "@/lib/csvUtils";

type Status = "present" | "absent" | "late";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  whatsapp: string | null;
  phone: string | null;
}

interface ClassOption {
  label: string;
  class: string;
  section: string;
}

const Attendance = () => {
  const { toast } = useToast();
  const { settings } = useSchoolSettings();
  const [students, setStudents] = useState<Student[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from("students").select("id, student_id, name, class, section, whatsapp, phone").eq("status", "Active").order("name");
      if (data) {
        setStudents(data);
        const uniqueClasses = [...new Set(data.map(s => `${s.class}-${s.section || "A"}`))].sort();
        const options = uniqueClasses.map(c => {
          const [cls, sec] = c.split("-");
          return { label: c, class: cls, section: sec };
        });
        setClassOptions(options);
        if (options.length > 0) setSelectedClass(options[0].label);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => `${s.class}-${s.section || "A"}` === selectedClass);

  useEffect(() => {
    if (!selectedClass || filteredStudents.length === 0) return;
    const fetchAttendance = async () => {
      const ids = filteredStudents.map(s => s.id);
      const { data } = await supabase.from("attendance_records").select("id, student_id, status").eq("date", today).in("student_id", ids);
      const existing: Record<string, string> = {};
      const att: Record<string, Status> = {};
      if (data) {
        data.forEach(r => { existing[r.student_id] = r.id; att[r.student_id] = r.status as Status; });
      }
      filteredStudents.forEach(s => { if (!att[s.id]) att[s.id] = "present"; });
      setAttendance(att);
      setExistingRecords(existing);
    };
    fetchAttendance();
  }, [selectedClass, students]);

  const toggle = (studentId: string) => {
    setAttendance(prev => {
      const order: Status[] = ["present", "absent", "late"];
      const next = order[(order.indexOf(prev[studentId]) + 1) % 3];
      return { ...prev, [studentId]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = filteredStudents.map(async (s) => {
      const status = attendance[s.id] || "present";
      if (existingRecords[s.id]) {
        return supabase.from("attendance_records").update({ status }).eq("id", existingRecords[s.id]);
      } else {
        return supabase.from("attendance_records").insert({ student_id: s.id, date: today, status });
      }
    });
    await Promise.all(updates);
    setSaving(false);
    setSaved(true);
    toast({ title: "Saved", description: "Attendance saved successfully." });
  };

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("0")) cleaned = "92" + cleaned.slice(1);
    if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    return cleaned;
  };

  const absentStudents = filteredStudents.filter(s => attendance[s.id] === "absent");
  const lateStudents = filteredStudents.filter(s => attendance[s.id] === "late");

  const sendWhatsAppAlerts = (type: "absent" | "late") => {
    const dateStr = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const targetStudents = type === "absent" ? absentStudents : lateStudents;
    const statusText = type === "absent" ? "absent" : "late";
    let opened = 0;
    targetStudents.forEach((s, i) => {
      const contact = s.whatsapp || s.phone;
      if (!contact) return;
      const phone = formatPhone(contact);
      const message = encodeURIComponent(
        `Dear Parent,\n\nThis is to inform you that your child, *${s.name}* (${s.student_id}), was marked *${statusText}* on ${dateStr}, at *${settings.school_name}*, *${settings.campus}*, *${settings.city}*.\n\nPlease contact the school for any queries. Phone: ${settings.phone}\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }, i * 800);
      opened++;
    });
    if (opened === 0) {
      toast({ title: "No contacts", description: `No WhatsApp/phone numbers found for ${statusText} students.`, variant: "destructive" });
    } else {
      toast({ title: "WhatsApp Alerts", description: `Opening ${opened} WhatsApp message(s). Send each one manually.` });
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!existingRecords[studentId]) return;
    await supabase.from("attendance_records").delete().eq("id", existingRecords[studentId]);
    const newExisting = { ...existingRecords };
    delete newExisting[studentId];
    setExistingRecords(newExisting);
    toast({ title: "Deleted", description: "Attendance record removed." });
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
          <p className="mt-1 text-sm text-muted-foreground">Mark daily attendance — {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          {classOptions.length > 0 && (
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {classOptions.map(c => (
                  <SelectItem key={c.label} value={c.label}>Class {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            const rows = filteredStudents.map((s, i) => `
              <tr>
                <td>${i + 1}</td><td>${s.student_id}</td><td style="text-align:left">${s.name}</td>
                <td>${(attendance[s.id] || "present").charAt(0).toUpperCase() + (attendance[s.id] || "present").slice(1)}</td>
              </tr>`).join("");
            printA4(`<div class="print-page">
              ${schoolHeader("DAILY ATTENDANCE SHEET")}
              <div class="print-info"><div>Class: <span>${selectedClass}</span></div><div>Date: <span>${new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></div>
              <div>Present: <span>${counts.present}</span></div><div>Absent: <span>${counts.absent}</span> | Late: <span>${counts.late}</span></div></div>
              <table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Status</th></tr></thead>
              <tbody>${rows}</tbody></table>
              ${schoolFooter()}
            </div>`, "Attendance Sheet");
          }}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Button onClick={handleSave} disabled={saving || filteredStudents.length === 0} className="gradient-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Attendance"}
          </Button>
          {saved && absentStudents.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => sendWhatsAppAlerts("absent")} className="border-success/30 text-success hover:bg-success/10">
              <MessageCircle className="mr-2 h-4 w-4" />Alert Absent ({absentStudents.length})
            </Button>
          )}
          {saved && lateStudents.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => sendWhatsAppAlerts("late")} className="border-warning/30 text-warning hover:bg-warning/10">
              <MessageCircle className="mr-2 h-4 w-4" />Alert Late ({lateStudents.length})
            </Button>
          )}
        </div>
      </div>

      {filteredStudents.length > 0 && (
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
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {selectedClass ? `Class ${selectedClass}` : "Select a class"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {students.length === 0 ? "No students found. Add students first." : "No students in this class."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="text-left">
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.student_id}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      attendance[s.id] === "present" ? "border-success/30 bg-success/10 text-success" :
                      attendance[s.id] === "absent" ? "border-destructive/30 bg-destructive/10 text-destructive" :
                      "border-warning/30 bg-warning/10 text-warning"
                    }
                  >
                    {attendance[s.id] === "present" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {attendance[s.id] === "absent" && <XCircle className="mr-1 h-3 w-3" />}
                    {attendance[s.id] === "late" && <Clock className="mr-1 h-3 w-3" />}
                    {(attendance[s.id] || "present").charAt(0).toUpperCase() + (attendance[s.id] || "present").slice(1)}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Attendance;
