import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Clock, Save, Printer, MessageCircle, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      setSelectedIds(new Set());
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map(s => s.id))
    );
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

  const handleDeleteSingle = async (studentId: string) => {
    const recordId = existingRecords[studentId];
    if (!recordId) {
      toast({ title: "No Record", description: "No saved attendance record for this student today.", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this attendance record?")) return;
    const { error } = await supabase.from("attendance_records").delete().eq("id", recordId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setExistingRecords(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    setAttendance(prev => ({ ...prev, [studentId]: "present" }));
    toast({ title: "Deleted", description: "Attendance record removed." });
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds).filter(id => existingRecords[id]);
    if (idsToDelete.length === 0) {
      toast({ title: "No Records", description: "No saved attendance records for selected students.", variant: "destructive" });
      return;
    }
    if (!confirm(`Delete attendance for ${idsToDelete.length} student(s)?`)) return;
    const recordIds = idsToDelete.map(id => existingRecords[id]);
    await supabase.from("attendance_records").delete().in("id", recordIds);
    const newExisting = { ...existingRecords };
    const newAtt = { ...attendance };
    idsToDelete.forEach(id => { delete newExisting[id]; newAtt[id] = "present"; });
    setExistingRecords(newExisting);
    setAttendance(newAtt);
    setSelectedIds(new Set());
    toast({ title: "Deleted", description: `${idsToDelete.length} attendance record(s) removed.` });
  };

  const handleBulkSetStatus = (status: Status) => {
    const newAtt = { ...attendance };
    selectedIds.forEach(id => { newAtt[id] = status; });
    setAttendance(newAtt);
    toast({ title: "Updated", description: `${selectedIds.size} student(s) marked as ${status}.` });
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
        <div className="flex flex-wrap gap-2">
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
            const csvData = filteredStudents.map((s, i) => ({
              sr: i + 1, student_id: s.student_id, name: s.name,
              status: (attendance[s.id] || "present").charAt(0).toUpperCase() + (attendance[s.id] || "present").slice(1)
            }));
            downloadCSV(csvData, `Attendance_${selectedClass}_${today}`, [
              { key: "sr", label: "#" }, { key: "student_id", label: "Student ID" }, { key: "name", label: "Name" }, { key: "status", label: "Status" }
            ]);
          }}><Download className="mr-2 h-4 w-4" />Save CSV</Button>
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

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkSetStatus("present")} className="border-success/30 text-success">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />Mark Present
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkSetStatus("absent")} className="border-destructive/30 text-destructive">
            <XCircle className="mr-1 h-3.5 w-3.5" />Mark Absent
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkSetStatus("late")} className="border-warning/30 text-warning">
            <Clock className="mr-1 h-3.5 w-3.5" />Mark Late
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />Delete Records
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center justify-between">
            <span>{selectedClass ? `Class ${selectedClass}` : "Select a class"}</span>
            {filteredStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
                <span className="text-xs text-muted-foreground font-normal">Select All</span>
              </div>
            )}
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
                <div
                  key={s.id}
                  className={`flex w-full items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 ${selectedIds.has(s.id) ? "bg-primary/5 border-primary/30" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleSelect(s.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <button onClick={() => toggle(s.id)} className="text-left">
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.student_id}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(s.id)}>
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
                    {existingRecords[s.id] && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteSingle(s.id)} title="Delete record">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Attendance;
