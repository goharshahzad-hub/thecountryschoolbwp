import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, User, Pencil, Trash2, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "@/lib/csvUtils";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { useToast } from "@/hooks/use-toast";

interface ClassItem {
  id: string;
  name: string;
  section: string | null;
  level: string;
  room: string | null;
  max_students: number | null;
  class_teacher_id: string | null;
}

const sectionColors: Record<string, string> = {
  Primary: "bg-accent/10 text-accent-foreground border-accent/30",
  Middle: "bg-secondary/10 text-secondary border-secondary/30",
  High: "bg-primary/10 text-primary border-primary/30",
};

const emptyForm = { name: "", section: "A", level: "Primary", room: "", max_students: "40" };

const Classes = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("name");
    if (data) setClasses(data);
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: "Error", description: "Class name is required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), section: form.section, level: form.level, room: form.room.trim(), max_students: parseInt(form.max_students) || 40 };
    const { error } = editingId
      ? await supabase.from("classes").update(payload).eq("id", editingId)
      : await supabase.from("classes").insert(payload);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingId ? "Updated" : "Added" }); setDialogOpen(false); setForm(emptyForm); setEditingId(null); fetchClasses(); }
  };

  const handleEdit = (c: ClassItem) => {
    setForm({ name: c.name, section: c.section || "A", level: c.level, room: c.room || "", max_students: c.max_students?.toString() || "40" });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchClasses(); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage classes and sections ({classes.length} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const csvData = classes.map(c => ({ name: c.name, section: c.section, level: c.level, room: c.room || "", max_students: c.max_students || 0 }));
            downloadCSV(csvData, "Classes", [
              { key: "name", label: "Class Name" }, { key: "section", label: "Section" }, { key: "level", label: "Level" }, { key: "room", label: "Room" }, { key: "max_students", label: "Max Students" }
            ]);
          }}><Download className="mr-2 h-4 w-4" />Save CSV</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = classes.map(c => `<tr><td>${c.name}</td><td>${c.section}</td><td>${c.level}</td><td>${c.room || "—"}</td><td>${c.max_students}</td></tr>`).join("");
            printA4(`<div class="print-page">${schoolHeader("CLASS LIST")}<p class="list-subtitle">Total Classes: ${classes.length}</p><table><thead><tr><th>Class</th><th>Section</th><th>Level</th><th>Room</th><th>Max Students</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Class List");
          }}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Class</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Class" : "Add New Class"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Class Name *</Label><Input placeholder="Class 10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={form.section} onValueChange={v => setForm({ ...form, section: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pre-School">Pre-School</SelectItem><SelectItem value="Primary">Primary</SelectItem><SelectItem value="Middle">Middle</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Room</Label><Input placeholder="Room 101" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
              <div className="space-y-2"><Label>Max Students</Label><Input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} /></div>
              <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Add Class"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : classes.length === 0 ? <p className="text-center text-muted-foreground py-8">No classes yet. Add your first class.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, i) => (
            <Card key={c.id} className="shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-foreground">{c.name}-{c.section}</h3>
                  <Badge variant="outline" className={sectionColors[c.level] || ""}>{c.level}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>Max <span className="text-foreground font-medium">{c.max_students}</span> students</span>
                  </div>
                  {c.room && <p className="text-xs text-muted-foreground">{c.room}</p>}
                </div>
                <div className="mt-3 flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Classes;
