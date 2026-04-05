import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Trash2, X } from "lucide-react";

type Status = "present" | "absent" | "late";

interface AttendanceBulkBarProps {
  count: number;
  onSetStatus: (status: Status) => void;
  onDelete: () => void;
  onClear: () => void;
}

const AttendanceBulkBar = ({ count, onSetStatus, onDelete, onClear }: AttendanceBulkBarProps) => {
  if (count === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <span className="text-sm font-medium text-foreground">{count} selected</span>
      <Button size="sm" variant="outline" onClick={() => onSetStatus("present")} className="border-success/30 text-success">
        <CheckCircle className="mr-1 h-3.5 w-3.5" />Present
      </Button>
      <Button size="sm" variant="outline" onClick={() => onSetStatus("absent")} className="border-destructive/30 text-destructive">
        <XCircle className="mr-1 h-3.5 w-3.5" />Absent
      </Button>
      <Button size="sm" variant="outline" onClick={() => onSetStatus("late")} className="border-warning/30 text-warning">
        <Clock className="mr-1 h-3.5 w-3.5" />Late
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="mr-1 h-3.5 w-3.5" />Clear
      </Button>
    </div>
  );
};

export default AttendanceBulkBar;
