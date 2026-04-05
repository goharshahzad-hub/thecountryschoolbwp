import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Trash2, Pencil } from "lucide-react";

type Status = "present" | "absent" | "late";

interface Student {
  id: string;
  student_id: string;
  name: string;
}

interface AttendanceTableProps {
  students: Student[];
  attendance: Record<string, Status>;
  existingRecords: Record<string, string>;
  selectedIds: Set<string>;
  editingId: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleStatus: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditStatus: (id: string, status: Status) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
  noStudents: boolean;
}

const statusConfig: Record<Status, { icon: typeof CheckCircle; badgeClass: string }> = {
  present: { icon: CheckCircle, badgeClass: "border-success/30 bg-success/10 text-success" },
  absent: { icon: XCircle, badgeClass: "border-destructive/30 bg-destructive/10 text-destructive" },
  late: { icon: Clock, badgeClass: "border-warning/30 bg-warning/10 text-warning" },
};

const AttendanceTable = ({
  students, attendance, existingRecords, selectedIds, editingId,
  onToggleSelect, onToggleSelectAll, onToggleStatus,
  onEditStart, onEditStatus, onEditSave, onEditCancel, onDelete,
  loading, noStudents,
}: AttendanceTableProps) => {
  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
  }

  if (students.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        {noStudents ? "No students found. Add students first." : "No students in this class."}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={selectedIds.size === students.length && students.length > 0}
              onCheckedChange={onToggleSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Student ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-center w-28">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s, i) => {
          const status = attendance[s.id] || "present";
          const { icon: StatusIcon, badgeClass } = statusConfig[status];
          const hasSaved = !!existingRecords[s.id];
          const isEditing = editingId === s.id;

          return (
            <TableRow
              key={s.id}
              className={selectedIds.has(s.id) ? "bg-primary/5" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(s.id)}
                  onCheckedChange={() => onToggleSelect(s.id)}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-center">
                {isEditing ? (
                  <Select value={status} onValueChange={(v) => onEditStatus(s.id, v as Status)}>
                    <SelectTrigger className="w-32 mx-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <button onClick={() => onToggleStatus(s.id)}>
                    <Badge variant="outline" className={badgeClass}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </button>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="default" onClick={() => onEditSave(s.id)} className="h-7 text-xs">
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onEditCancel} className="h-7 text-xs">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {hasSaved && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditStart(s.id)} title="Edit record">
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      )}
                      {hasSaved && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(s.id)} title="Delete record">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AttendanceTable;
