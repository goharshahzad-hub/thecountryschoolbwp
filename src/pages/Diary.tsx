import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, BookOpen, Search, Printer, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { classOptions } from "@/lib/constants";
import { format } from "date-fns";
import DiaryEntryForm from "@/components/diary/DiaryEntryForm";
import DiaryWhatsApp from "@/components/diary/DiaryWhatsApp";
import { printSingleDiaryAs8, printMultipleDiarySlips } from "@/components/diary/DiaryPrint";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/BulkActionBar";

interface DiaryEntry {
  id: string;
  class_name: string;
  section: string;
  subject: string;
  homework_text: string;
  date: string;
  created_at: string;
}

const Diary = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("diary_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = entries.filter(e => {
    if (filterClass !== "all" && e.class_name !== filterClass) return false;
    if (filterDate && e.date !== filterDate) return false;
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.homework_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bulk = useBulkSelect(filtered);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this diary entry?")) return;
    const { error } = await supabase.from("diary_entries").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchEntries(); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${bulk.count} selected entries?`)) return;
    const ids = Array.from(bulk.selectedIds);
    const { error } = await supabase.from("diary_entries").delete().in("id", ids);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `${ids.length} entries deleted` }); bulk.clear(); fetchEntries(); }
  };

  const handleBulkPrint = () => {
    const selected = filtered.filter(e => bulk.selectedIds.has(e.id));
    printMultipleDiarySlips(selected);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Diary / Homework</h1>
          <p className="mt-1 text-sm text-muted-foreground">Post daily homework and diary entries for each class</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DiaryWhatsApp entries={filtered} />
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditingEntry(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">{editingEntry ? "Edit Diary Entry" : "New Diary Entry"}</DialogTitle>
              </DialogHeader>
              <DiaryEntryForm onSuccess={fetchEntries} onClose={() => { setDialogOpen(false); setEditingEntry(null); }} editingEntry={editingEntry} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by subject or homework..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-[160px]" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
      </div>

      <BulkActionBar
        count={bulk.count}
        onDelete={handleBulkDelete}
        onPrint={handleBulkPrint}
        onClear={bulk.clear}
      />

      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-2 h-8 w-8" />
              <p>No diary entries found for the selected filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Homework / Diary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Checkbox checked={bulk.selectedIds.has(entry.id)} onCheckedChange={() => bulk.toggle(entry.id)} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{entry.class_name}-{entry.section}</TableCell>
                    <TableCell className="font-medium">{entry.subject}</TableCell>
                    <TableCell className="max-w-[400px]">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.homework_text}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => printSingleDiaryAs8(entry)} title="Print 8 slips">
                          <Printer className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

export default Diary;
