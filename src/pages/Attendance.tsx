import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Save, Printer, MessageCircle, Download, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useAttendance } from "@/hooks/useAttendance";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";
import AttendanceStats from "@/components/attendance/AttendanceStats";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import AttendanceBulkBar from "@/components/attendance/AttendanceBulkBar";

type Status = "present" | "absent" | "late";

const Attendance = () => {
  const { settings } = useSchoolSettings();
  const {
    filteredStudents, classOptions, selectedClass, setSelectedClass,
    attendance, existingRecords, loading, saving, saved, selectedIds, editingId,
    setEditingId, today, counts, absentStudents, lateStudents, students,
    toggleStatus, setStatusForStudent, toggleSelect, toggleSelectAll,
    handleSave, handleDeleteSingle, handleEditSave, handleBulkDelete, handleBulkSetStatus,
    setSelectedIds, selectedDate, setSelectedDate, isToday,
  } = useAttendance();

  const dateStr = selectedDate.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("0")) cleaned = "92" + cleaned.slice(1);
    if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    return cleaned;
  };

  const sendWhatsAppAlerts = (type: "absent" | "late") => {
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
  };

  const buildPrintHtml = () => {
    const rows = filteredStudents.map((s, i) => `
      <tr><td>${i + 1}</td><td>${s.student_id}</td><td style="text-align:left">${s.name}</td>
      <td>${(attendance[s.id] || "present").charAt(0).toUpperCase() + (attendance[s.id] || "present").slice(1)}</td></tr>`).join("");
    return `<div class="print-page">${schoolHeader("DAILY ATTENDANCE SHEET")}
      <div class="print-info"><div>Class: <span>${selectedClass}</span></div><div>Date: <span>${dateStr}</span></div>
      <div>Present: <span>${counts.present}</span></div><div>Absent: <span>${counts.absent}</span> | Late: <span>${counts.late}</span></div></div>
      <table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      ${schoolFooter()}</div>`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isToday ? "Mark daily attendance" : "Viewing past attendance"} — {dateStr}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-44 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                disabled={(date) => date > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

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
          <Button variant="outline" size="sm" onClick={() => downloadA4Pdf(buildPrintHtml(), `Attendance_${selectedClass}_${today}`)}>
            <Download className="mr-2 h-4 w-4" />Save PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => printA4(buildPrintHtml(), "Attendance Sheet")}>
            <Printer className="mr-2 h-4 w-4" />Print
          </Button>
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

      <AttendanceStats
        present={counts.present}
        absent={counts.absent}
        late={counts.late}
        total={filteredStudents.length}
      />

      <AttendanceBulkBar
        count={selectedIds.size}
        onSetStatus={handleBulkSetStatus}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {selectedClass ? `Class ${selectedClass} — ${format(selectedDate, "dd MMM yyyy")}` : "Select a class"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            students={filteredStudents}
            attendance={attendance}
            existingRecords={existingRecords}
            selectedIds={selectedIds}
            editingId={editingId}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onToggleStatus={toggleStatus}
            onEditStart={(id) => setEditingId(id)}
            onEditStatus={setStatusForStudent}
            onEditSave={handleEditSave}
            onEditCancel={() => setEditingId(null)}
            onDelete={handleDeleteSingle}
            loading={loading}
            noStudents={students.length === 0}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Attendance;
