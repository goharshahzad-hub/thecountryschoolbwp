import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";

interface TimetableEntry {
  id: string;
  class_name: string;
  section: string;
  day_of_week: string;
  time_slot: string;
  subject: string;
  teacher_name: string | null;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const Timetable = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ class_name: "", section: "A", day_of_week: "Monday", time_slot: "", subject: "", teacher_name: "" });

  const fetchEntries = async () => {
    const { data } = await supabase.from("timetable_entries").select("*").order("time_slot");
    if (data) {
      setEntries(data);
      const classes = [...new Set(data.map(e => `${e.class_name}-${e.section}`))].sort();
      setClassOptions(classes);
      if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = entries.filter(e => `${e.class_name}-${e.section}` === selectedClass);
  const timeSlots = [...new Set(filtered.map(e => e.time_slot))].sort();

  const getEntry = (time: string, day: string) => filtered.find(e => e.time_slot === time && e.day_of_week === day);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_name.trim() || !form.time_slot.trim() || !form.subject.trim()) {
      toast({ title: "Error", description: "Fill required fields", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      class_name: form.class_name.trim(), section: form.section, day_of_week: form.day_of_week,
      time_slot: form.time_slot.trim(), subject: form.subject.trim(), teacher_name: form.teacher_name.trim(),
    };
    const { error } = editingId
      ? await supabase.from("timetable_entries").update(payload).eq("id", editingId)
      : await supabase.from("timetable_entries").insert(payload);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingId ? "Updated" : "Added" });
      setDialogOpen(false); setEditingId(null);
      setForm({ class_name: "", section: "A", day_of_week: "Monday", time_slot: "", subject: "", teacher_name: "" });
      fetchEntries();
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setForm({ class_name: entry.class_name, section: entry.section, day_of_week: entry.day_of_week, time_slot: entry.time_slot, subject: entry.subject, teacher_name: entry.teacher_name || "" });
    setEditingId(entry.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this timetable entry?")) return;
    await supabase.from("timetable_entries").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchEntries();
  };

  const buildTimetableHtml = () => {
    if (timeSlots.length === 0) return "";
    const rows = timeSlots.map(time => {
      const cells = days.map(day => {
        const entry = getEntry(time, day);
        return `<td style="padding:8px;border:1px solid #333;text-align:center;">${entry ? `<strong>${entry.subject}</strong>${entry.teacher_name ? `<br><span style="font-size:10px;color:#666;">${entry.teacher_name}</span>` : ""}` : "—"}</td>`;
      }).join("");
      return `<tr><td style="padding:8px;border:1px solid #333;font-weight:bold;white-space:nowrap;">${time}</td>${cells}</tr>`;
    }).join("");

    return `
      <div class="print-page">
        ${schoolHeader(`CLASS ${selectedClass} — WEEKLY TIMETABLE`)}
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="padding:8px;border:1px solid #333;">Time</th>
              ${days.map(d => `<th style="padding:8px;border:1px solid #333;">${d}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${schoolFooter()}
      </div>
    `;
  };

  const handlePrint = () => {
    const html = buildTimetableHtml();
    if (!html) return;
    printA4(html, `Timetable - ${selectedClass}`);
  };

  const handleDownloadPdf = async () => {
    const html = buildTimetableHtml();
    if (!html) return;
    await downloadA4Pdf(html, `Timetable_${selectedClass}`);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground">Weekly class schedule</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {classOptions.length > 0 && (
            <>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={timeSlots.length === 0}>
                <Printer className="mr-2 h-4 w-4" />Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={timeSlots.length === 0}>
                <Download className="mr-2 h-4 w-4" />Save PDF
              </Button>
            </>
          )}
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm({ class_name: "", section: "A", day_of_week: "Monday", time_slot: "", subject: "", teacher_name: "" }); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Entry" : "Add Timetable Entry"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Class *</Label><Input placeholder="10" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={form.section} onValueChange={v => setForm({ ...form, section: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Day *</Label>
                  <Select value={form.day_of_week} onValueChange={v => setForm({ ...form, day_of_week: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Time Slot *</Label><Input placeholder="8:00 - 8:40" value={form.time_slot} onChange={e => setForm({ ...form, time_slot: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Subject *</Label><Input placeholder="Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Teacher</Label><Input placeholder="Teacher name" value={form.teacher_name} onChange={e => setForm({ ...form, teacher_name: e.target.value })} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Add Entry"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card overflow-x-auto">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No timetable entries yet. Click "Add Entry" to create your schedule.</p>
          ) : timeSlots.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No entries for this class. Select another class or add entries.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-left font-semibold text-foreground">Time</th>
                  {days.map(d => (
                    <th key={d} className="p-3 text-left font-semibold text-foreground">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-3 font-medium text-muted-foreground whitespace-nowrap">{time}</td>
                    {days.map(day => {
                      const entry = getEntry(time, day);
                      return (
                        <td key={day} className="p-3 text-foreground">
                          {entry ? (
                            <div className="group flex items-center gap-1">
                              <div>
                                <span className="text-sm">{entry.subject}</span>
                                {entry.teacher_name && <p className="text-xs text-muted-foreground">{entry.teacher_name}</p>}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 ml-auto">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(entry)}><Pencil className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(entry.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Timetable;
