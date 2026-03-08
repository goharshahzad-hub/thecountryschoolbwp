import { Button } from "@/components/ui/button";
import { Trash2, Printer, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkActionBarProps {
  count: number;
  onDelete?: () => void;
  onPrint?: () => void;
  onClear: () => void;
  deleting?: boolean;
}

const BulkActionBar = ({ count, onDelete, onPrint, onClear, deleting }: BulkActionBarProps) => {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 mb-4">
      <span className="text-sm font-medium text-foreground">{count} selected</span>
      <div className="flex gap-2 ml-auto">
        {onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />Print Selected
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />{deleting ? "Deleting..." : "Delete Selected"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionBar;
