import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

interface SortableTableHeadProps {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDirection: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHead = ({ label, sortKey, currentSort, currentDirection, onSort, className }: SortableTableHeadProps) => {
  const isActive = currentSort === sortKey;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground transition-colors ${className || ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </span>
    </TableHead>
  );
};

export default SortableTableHead;

export function useTableSort<T>(defaultKey: string, defaultDir: "asc" | "desc" = "asc") {
  const [sortKey, setSortKey] = (await import("react")).useState(defaultKey);
  const [sortDir, setSortDir] = (await import("react")).useState<"asc" | "desc">(defaultDir);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortData = (data: T[]) => {
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string"
        ? aVal.localeCompare(bVal, undefined, { numeric: true })
        : aVal - bVal;
      return sortDir === "asc" ? cmp : -cmp;
    });
  };

  return { sortKey, sortDir, handleSort, sortData };
}
