import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Download, Pencil, Trash2, Printer } from "lucide-react";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/BulkActionBar";

interface Teacher {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  classes: string;
  phone: string | null;
  qualification: string | null;
  cnic: string | null;
  salary: number | null;
  status: string;
  joining_date: string | null;
}

const emptyForm = { teacher_id: "", name: "", subject: "", classes: "", phone: "", qualification: "", cnic: "", salary: "", status: "Active", joining_date: "" };

const generateTeacherId = (count: number) => {
  return `TCH-${(count + 1).toString().padStart(4, "0")}`;
};

const Teachers = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchTeachers = async () => {
    const { data } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
    if (data) setTeachers(data);
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_id.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const bulk = useBulkSelect(filtered);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacher_id.trim() || !form.name.trim()) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      teacher_id: form.teacher_id.trim(),
      name: form.name.trim(),
      subject: form.subject.trim(),
      classes: form.classes.trim(),
      phone: form.phone.trim(),
      qualification: form.qualification.trim(),
      cnic: form.cnic.trim(),
      salary: form.salary ? parseFloat(form.salary) : 0,
      status: form.status,
      joining_date: form.joining_date || null,
    };

    const { error } = editingId
      ? await supabase.from("teachers").update(payload).eq("id", editingId)
      : await supabase.from("teachers").insert(payload);

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingId ? "Updated" : "Added", description: `Teacher ${editingId ? "updated" : "added"} successfully.` });
      setDialogOpen(false); setForm(emptyForm); setEditingId(null); fetchTeachers();
    }
  };

  const handleEdit = (t: Teacher) => {
    setForm({ teacher_id: t.teacher_id, name: t.name, subject: t.subject, classes: t.classes, phone: t.phone || "", qualification: t.qualification || "", cnic: t.cnic || "", salary: t.salary?.toString() || "", status: t.status, joining_date: t.joining_date || "" });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this teacher?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchTeachers(); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${bulk.count} selected teachers?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(bulk.selectedIds);
    const { error } = await supabase.from("teachers").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: `${ids.length} teachers deleted` }); bulk.clear(); fetchTeachers(); }
  };

  const handleBulkPrint = () => {
    const selected = filtered.filter(t => bulk.selectedIds.has(t.id));
    const rows = selected.map(t => `
      <tr>
        <td>${t.teacher_id}</td><td style="text-align:left">${t.name}</td>
        <td>${t.subject}</td><td>${t.classes}</td><td>${t.phone || "—"}</td>
        <td>${t.qualification || "—"}</td><td>${t.salary ? `₨ ${Number(t.salary).toLocaleString("en-PK")}` : "—"}</td><td>${t.status}</td>
      </tr>`).join("");
    printA4(`<div class="print-page">
      ${schoolHeader("TEACHER STAFF LIST")}
      <p class="list-subtitle">Selected Teachers: ${selected.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p>
      <table><thead><tr><th>ID</th><th>Name</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Qualification</th><th>Salary</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      ${schoolFooter()}
    </div>`, "Teacher List");
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage faculty members ({teachers.length} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = filtered.map(t => `<tr><td>${t.teacher_id}</td><td style="text-align:left">${t.name}</td><td>${t.subject}</td><td>${t.classes}</td><td>${t.phone || "—"}</td><td>${t.qualification || "—"}</td><td>${t.salary ? `₨ ${Number(t.salary).toLocaleString("en-PK")}` : "—"}</td><td>${t.status}</td></tr>`).join("");
            downloadA4Pdf(`<div class="print-page">${schoolHeader("TEACHING STAFF LIST")}<p class="list-subtitle">Total: ${filtered.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>ID</th><th>Name</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Qualification</th><th>Salary</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Teachers");
          }}><Download className="mr-2 h-4 w-4" />Save PDF</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = filtered.map(t => `
              <tr>
                <td>${t.teacher_id}</td><td style="text-align:left">${t.name}</td>
                <td>${t.subject}</td><td>${t.classes}</td><td>${t.phone || "—"}</td>
                <td>${t.qualification || "—"}</td><td>${t.salary ? `₨ ${Number(t.salary).toLocaleString("en-PK")}` : "—"}</td><td>${t.status}</td>
              </tr>`).join("");
            printA4(`<div class="print-page">
              ${schoolHeader("TEACHER STAFF LIST")}
              <p class="list-subtitle">Total Teachers: ${filtered.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p>
              <table><thead><tr><th>ID</th><th>Name</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Qualification</th><th>Salary</th><th>Status</th></tr></thead>
              <tbody>${rows}</tbody></table>
              ${schoolFooter()}
            </div>`, "Teacher List");
          }}><Printer className="mr-2 h-4 w-4" />Print List</Button>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setForm({ ...emptyForm, teacher_id: generateTeacherId(teachers.length) })}><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Teacher" : "Add New Teacher"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Teacher ID *</Label><Input value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} readOnly={!editingId} className={!editingId ? "bg-muted" : ""} required /></div>
                <div className="space-y-2"><Label>Name *</Label><Input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Subject</Label><Input placeholder="Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                <div className="space-y-2"><Label>Classes</Label><Input placeholder="9-A, 10-A" value={form.classes} onChange={e => setForm({ ...form, classes: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input placeholder="0321-XXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Qualification</Label><Input placeholder="M.Sc" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
                <div className="space-y-2"><Label>CNIC</Label><Input placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} /></div>
                <div className="space-y-2"><Label>Salary (PKR)</Label><Input type="number" placeholder="25000" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Resigned">Resigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Add Teacher"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <BulkActionBar count={bulk.count} onDelete={handleBulkDelete} onPrint={handleBulkPrint} onClear={bulk.clear} deleting={bulkDeleting} />

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, ID, or subject..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-10"><Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} aria-label="Select all" /></TableHead>
                <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Classes</TableHead><TableHead>Phone</TableHead><TableHead>Qualification</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No teachers found</TableCell></TableRow> :
                filtered.map(t => (
                  <TableRow key={t.id} data-state={bulk.selectedIds.has(t.id) ? "selected" : undefined}>
                    <TableCell><Checkbox checked={bulk.selectedIds.has(t.id)} onCheckedChange={() => bulk.toggle(t.id)} /></TableCell>
                    <TableCell className="font-mono text-xs">{t.teacher_id}</TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.classes}</TableCell>
                    <TableCell className="text-muted-foreground">{t.phone}</TableCell>
                    <TableCell className="text-xs">{t.qualification}</TableCell>
                    <TableCell><Badge variant={t.status === "Active" ? "default" : "secondary"} className={t.status === "Active" ? "bg-success text-success-foreground" : ""}>{t.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default Teachers;
