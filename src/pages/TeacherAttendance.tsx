import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Save, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAttendance } from "@/hooks/useAttendance";
import AttendanceStats from "@/components/attendance/AttendanceStats";
import AttendanceTable from "@/components/attendance/AttendanceTable";

const TeacherAttendance = () => {
  const {
    filteredStudents, classOptions, selectedClass, setSelectedClass,
    attendance, existingRecords, loading, saving, selectedIds, editingId,
    setEditingId, counts, students,
    toggleStatus, setStatusForStudent, toggleSelect, toggleSelectAll,
    handleSave, handleDeleteSingle, handleEditSave,
    setSelectedIds, selectedDate, setSelectedDate, isToday,
  } = useAttendance();

  const dateStr = selectedDate.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <TeacherLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Mark Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isToday ? "Mark daily attendance" : "Viewing past attendance"} — {dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-44 justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />{format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {classOptions.length > 0 && (
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {classOptions.map(c => <SelectItem key={c.label} value={c.label}>Class {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleSave} disabled={saving || filteredStudents.length === 0} className="gradient-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      <AttendanceStats present={counts.present} absent={counts.absent} late={counts.late} total={filteredStudents.length} />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {selectedClass ? `Class ${selectedClass} — ${format(selectedDate, "dd MMM yyyy")}` : "Select a class"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            students={filteredStudents} attendance={attendance} existingRecords={existingRecords}
            selectedIds={selectedIds} editingId={editingId}
            onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
            onToggleStatus={toggleStatus} onEditStart={(id) => setEditingId(id)}
            onEditStatus={setStatusForStudent} onEditSave={handleEditSave}
            onEditCancel={() => setEditingId(null)} onDelete={handleDeleteSingle}
            loading={loading} noStudents={students.length === 0}
          />
        </CardContent>
      </Card>
    </TeacherLayout>
  );
};

export default TeacherAttendance;
