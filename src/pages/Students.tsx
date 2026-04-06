import { useState, useEffect } from "react";
import { classOptions } from "@/lib/constants";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Download, Pencil, Trash2, Link2, Unlink, Printer, CreditCard } from "lucide-react";
import SortableTableHead, { useTableSort } from "@/components/SortableTableHead";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";
import PhotoUpload from "@/components/PhotoUpload";
import IDCard from "@/components/IDCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/BulkActionBar";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  father_name: string;
  phone: string | null;
  status: string;
  fee_status: string;
  parent_user_id: string | null;
}

interface ParentProfile {
  user_id: string;
  full_name: string;
  phone: string | null;
}

const emptyForm = { student_id: "", name: "", class: "", section: "A", father_name: "", phone: "", mother_phone: "", whatsapp: "", gender: "Male", status: "Active", fee_status: "Pending", monthly_fee: "", photo_url: "", date_of_birth: "" };

const generateStudentId = (existingStudents: { student_id: string }[]) => {
  const year = new Date().getFullYear();
  const prefix = `TCS-${year}-`;
  const existingNums = existingStudents
    .filter(s => s.student_id.startsWith(prefix))
    .map(s => parseInt(s.student_id.replace(prefix, ""), 10))
    .filter(n => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
};

const Students = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingStudent, setLinkingStudent] = useState<Student | null>(null);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cardStudent, setCardStudent] = useState<any>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchData = async () => {
    const [{ data: studentsData }, { data: parentsData }] = await Promise.all([
      supabase.from("students").select("*").order("student_id", { ascending: true }),
      supabase.from("profiles").select("user_id, full_name, phone").eq("role", "parent"),
    ]);
    if (studentsData) setStudents(studentsData);
    if (parentsData) setParents(parentsData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getParentName = (userId: string | null) => {
    if (!userId) return null;
    return parents.find(p => p.user_id === userId);
  };

  // Unique class options from data
  const uniqueClasses = [...new Set(students.map(s => `${s.class}-${s.section || "A"}`))].sort();

  // Linked parents for filter
  const linkedParentIds = [...new Set(students.filter(s => s.parent_user_id).map(s => s.parent_user_id!))];
  const linkedParents = parents.filter(p => linkedParentIds.includes(p.user_id));

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.father_name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "all" || `${s.class}-${s.section || "A"}` === classFilter;
    const matchesParent = parentFilter === "all" || s.parent_user_id === parentFilter;
    return matchesSearch && matchesClass && matchesParent;
  });

  const sort = useTableSort<Student>("student_id");
  const sorted = sort.sortData(filtered);
  const bulk = useBulkSelect(sorted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id.trim() || !form.name.trim() || !form.class.trim() || !form.father_name.trim()) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    // Duplicate check on student_id (only for new entries)
    if (!editingId) {
      const existing = students.find(s => s.student_id === form.student_id.trim());
      if (existing) {
        toast({ title: "Duplicate", description: `Student ID "${form.student_id}" already exists.`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    const basePayload = {
      student_id: form.student_id.trim(), name: form.name.trim(), class: form.class.trim(),
      section: form.section, father_name: form.father_name.trim(), phone: form.phone.trim(),
      mother_phone: form.mother_phone.trim(), whatsapp: form.whatsapp.trim(), gender: form.gender,
      status: form.status, fee_status: form.fee_status, monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : 0,
      photo_url: form.photo_url, date_of_birth: form.date_of_birth || null,
    };
    if (editingId) {
      const { error } = await supabase.from("students").update(basePayload as any).eq("id", editingId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Updated", description: "Student updated successfully." });
    } else {
      const { error } = await supabase.from("students").insert(basePayload as any);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Added", description: "Student added successfully." });
    }
    setSaving(false);
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (s: Student) => {
    setForm({ student_id: s.student_id, name: s.name, class: s.class, section: s.section || "A", father_name: s.father_name, phone: s.phone || "", mother_phone: (s as any).mother_phone || "", whatsapp: (s as any).whatsapp || "", gender: (s as any).gender || "Male", status: s.status, fee_status: s.fee_status, monthly_fee: String((s as any).monthly_fee || ""), photo_url: (s as any).photo_url || "", date_of_birth: (s as any).date_of_birth || "" });
    setEditingId(s.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: "Student removed." }); fetchData(); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${bulk.count} selected students?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(bulk.selectedIds);
    const { error } = await supabase.from("students").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: `${ids.length} students deleted` }); bulk.clear(); fetchData(); }
  };

  const handleBulkPrint = () => {
    const selected = filtered.filter(s => bulk.selectedIds.has(s.id));
    const rows = selected.map(s => `
      <tr>
        <td>${s.student_id}</td><td style="text-align:left">${s.name}</td>
        <td>${s.class}-${s.section}</td><td style="text-align:left">${s.father_name}</td>
        <td>${s.phone || "—"}</td><td>${s.status}</td><td>${s.fee_status}</td>
      </tr>`).join("");
    printA4(`<div class="print-page">
      ${schoolHeader("STUDENT LIST")}
      <p class="list-subtitle">Selected Students: ${selected.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p>
      <table><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Guardian/Father's Name</th><th>Phone</th><th>Status</th><th>Fee</th></tr></thead>
      <tbody>${rows}</tbody></table>
      ${schoolFooter()}
    </div>`, "Student List");
  };

  const openLinkDialog = (student: Student) => {
    setLinkingStudent(student);
    setSelectedParentId(student.parent_user_id || "");
    setLinkDialogOpen(true);
  };

  const handleLinkParent = async () => {
    if (!linkingStudent) return;
    const { error } = await supabase.from("students")
      .update({ parent_user_id: selectedParentId || null })
      .eq("id", linkingStudent.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: selectedParentId ? "Linked" : "Unlinked", description: selectedParentId ? "Student linked to parent account." : "Parent link removed." });
      fetchData();
    }
    setLinkDialogOpen(false);
    setLinkingStudent(null);
  };

  const handleUnlink = async (studentId: string) => {
    const { error } = await supabase.from("students").update({ parent_user_id: null }).eq("id", studentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Unlinked", description: "Parent link removed." }); fetchData(); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all enrolled students ({students.length} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = filtered.map(s => `<tr><td>${s.student_id}</td><td style="text-align:left">${s.name}</td><td>${s.class}-${s.section}</td><td style="text-align:left">${s.father_name}</td><td>${s.phone || "—"}</td><td>${s.status}</td><td>${s.fee_status}</td></tr>`).join("");
            downloadA4Pdf(`<div class="print-page">${schoolHeader("STUDENT LIST")}<p class="list-subtitle">Total Students: ${filtered.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Guardian</th><th>Phone</th><th>Status</th><th>Fee</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Students");
          }}><Download className="mr-2 h-4 w-4" />Save PDF</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = filtered.map(s => `
              <tr>
                <td>${s.student_id}</td><td style="text-align:left">${s.name}</td>
                <td>${s.class}-${s.section}</td><td style="text-align:left">${s.father_name}</td>
                <td>${s.phone || "—"}</td><td>${s.status}</td><td>${s.fee_status}</td>
              </tr>`).join("");
            printA4(`<div class="print-page">
              ${schoolHeader("STUDENT LIST")}
              <p class="list-subtitle">Total Students: ${filtered.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p>
              <table><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Guardian/Father's Name</th><th>Phone</th><th>Status</th><th>Fee</th></tr></thead>
              <tbody>${rows}</tbody></table>
              ${schoolFooter()}
            </div>`, "Student List");
          }}><Printer className="mr-2 h-4 w-4" />Print List</Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setForm({ ...emptyForm, student_id: generateStudentId(students) })}><Plus className="mr-2 h-4 w-4" />Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Student" : "Add New Student"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Student ID *</Label>
                  <Input value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} readOnly={!editingId} className={!editingId ? "bg-muted" : ""} required />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="Student name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Guardian/Father's Name *</Label>
                   <Input placeholder="Guardian/Father's name" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Guardian/Father's Phone</Label>
                  <Input placeholder="0322-XXXXXXX" value={form.phone} onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({
                      ...f,
                      phone: val,
                      ...(!f.whatsapp ? { whatsapp: val } : {}),
                    }));
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Mother's Phone</Label>
                  <Input placeholder="0300-XXXXXXX" value={form.mother_phone} onChange={e => setForm({ ...form, mother_phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input placeholder="0300-XXXXXXX" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={form.class} onValueChange={v => setForm({ ...form, class: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classOptions.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Fee (PKR)</Label>
                  <Input type="number" placeholder="0" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={form.section} onValueChange={v => setForm({ ...form, section: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fee Status</Label>
                  <Select value={form.fee_status} onValueChange={v => setForm({ ...form, fee_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <PhotoUpload
                  currentUrl={form.photo_url}
                  onUpload={url => setForm({ ...form, photo_url: url })}
                  folder="students"
                  id={form.student_id}
                />
                <div className="col-span-2">
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Student" : "Add Student"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Link Parent Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Link Parent Account</DialogTitle>
          </DialogHeader>
          {linkingStudent && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">{linkingStudent.name}</p>
                <p className="text-xs text-muted-foreground">{linkingStudent.student_id} — Class {linkingStudent.class}-{linkingStudent.section}</p>
              </div>
              <div className="space-y-2">
                <Label>Select Parent Account</Label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger><SelectValue placeholder="Choose a parent account..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No parent linked —</SelectItem>
                    {parents.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name || "Unnamed"} {p.phone ? `(${p.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {parents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No parent accounts found. Parents need to sign up first.</p>
                )}
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground"
                onClick={() => {
                  if (selectedParentId === "none") setSelectedParentId("");
                  handleLinkParent();
                }}
              >
                {selectedParentId && selectedParentId !== "none" ? "Link Parent" : "Remove Link"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BulkActionBar count={bulk.count} onDelete={handleBulkDelete} onPrint={handleBulkPrint} onClear={bulk.clear} deleting={bulkDeleting} />

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, ID, or class..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} aria-label="Select all" /></TableHead>
                  <SortableTableHead label="ID" sortKey="student_id" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <SortableTableHead label="Name" sortKey="name" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <SortableTableHead label="Class" sortKey="class" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <SortableTableHead label="Guardian/Father" sortKey="father_name" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <SortableTableHead label="Gender" sortKey="gender" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Parent</TableHead>
                  <SortableTableHead label="Status" sortKey="status" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <SortableTableHead label="Monthly Fee" sortKey="monthly_fee" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <SortableTableHead label="Fee Status" sortKey="fee_status" currentSort={sort.sortKey} currentDirection={sort.sortDir} onSort={sort.handleSort} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No students found</TableCell></TableRow>
                ) : sorted.map(s => {
                  const parent = getParentName(s.parent_user_id);
                  return (
                    <TableRow key={s.id} data-state={bulk.selectedIds.has(s.id) ? "selected" : undefined}>
                      <TableCell><Checkbox checked={bulk.selectedIds.has(s.id)} onCheckedChange={() => bulk.toggle(s.id)} /></TableCell>
                      <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.class}-{s.section}</TableCell>
                      <TableCell>{s.father_name}</TableCell>
                      <TableCell>{(s as any).gender || "Male"}</TableCell>
                      <TableCell className="text-muted-foreground">{(s as any).whatsapp || s.phone || "—"}</TableCell>
                      <TableCell>
                        {parent ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="border-primary/30 text-primary text-xs">{parent.full_name || "Linked"}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUnlink(s.id)} title="Unlink parent">
                              <Unlink className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => openLinkDialog(s)}>
                            <Link2 className="mr-1 h-3 w-3" />Link
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "Active" ? "default" : "secondary"} className={s.status === "Active" ? "bg-success text-success-foreground" : ""}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">₨ {((s as any).monthly_fee || 0).toLocaleString("en-PK")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.fee_status === "Paid" ? "border-success/30 text-success" : s.fee_status === "Pending" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive"}>{s.fee_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setCardStudent(s)} title="ID Card"><CreditCard className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openLinkDialog(s)} title="Link parent"><Link2 className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ID Card Dialog */}
      <Dialog open={!!cardStudent} onOpenChange={o => { if (!o) setCardStudent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Student ID Card</DialogTitle></DialogHeader>
          {cardStudent && (
            <IDCard data={{
              photo_url: (cardStudent as any).photo_url,
              id_number: cardStudent.student_id,
              name: cardStudent.name,
              subtitle: `Class ${cardStudent.class}-${cardStudent.section}`,
              extra_lines: [
                `<strong>Father:</strong> ${cardStudent.father_name}`,
                `<strong>ID:</strong> ${cardStudent.student_id}`,
                cardStudent.phone ? `<strong>Phone:</strong> ${cardStudent.phone}` : "",
              ].filter(Boolean),
              type: "student",
            }} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Students;
