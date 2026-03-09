// CSV Export Utility

export const downloadCSV = (data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) => {
  if (data.length === 0) return;

  // Use provided columns or derive from first data object
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Create CSV header
  const header = cols.map(c => `"${c.label}"`).join(",");
  
  // Create CSV rows
  const rows = data.map(row => 
    cols.map(c => {
      const value = row[c.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    }).join(",")
  ).join("\n");

  const csv = `${header}\n${rows}`;
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
