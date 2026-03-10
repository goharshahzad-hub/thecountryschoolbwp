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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Pencil, Trash2, Printer, CreditCard, Download } from "lucide-react";
import { downloadCSV } from "@/lib/csvUtils";
import PhotoUpload from "@/components/PhotoUpload";
import IDCard from "@/components/IDCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/BulkActionBar";

interface Teacher {
  id: string; teacher_id: string; name: string; subject: string; classes: string;
  phone: string | null; qualification: string | null; cnic: string | null;
  salary: number | null; status: string; joining_date: string | null;
}

interface NonTeachingStaff {
  id: string; staff_id: string; name: string; designation: string; department: string;
  phone: string | null; cnic: string | null; salary: number | null;
  qualification: string | null; address: string | null; joining_date: string | null; status: string;
}

const emptyTeacherForm = { teacher_id: "", name: "", subject: "", classes: "", phone: "", qualification: "", cnic: "", salary: "", status: "Active", joining_date: "", photo_url: "", date_of_birth: "" };
const emptyStaffForm = { staff_id: "", name: "", designation: "", department: "", phone: "", cnic: "", salary: "", qualification: "", address: "", status: "Active", joining_date: "", photo_url: "", date_of_birth: "" };

const genTeacherId = (n: number) => `TCH-${(n + 1).toString().padStart(4, "0")}`;
const genStaffId = (n: number) => `STF-${(n + 1).toString().padStart(4, "0")}`;

const Employees = () => {
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tSearch, setTSearch] = useState("");
  const [tLoading, setTLoading] = useState(true);
  const [tDialogOpen, setTDialogOpen] = useState(false);
  const [tForm, setTForm] = useState(emptyTeacherForm);
  const [tEditId, setTEditId] = useState<string | null>(null);
  const [tSaving, setTSaving] = useState(false);
  const [tCardItem, setTCardItem] = useState<any>(null);
  const [tBulkDeleting, setTBulkDeleting] = useState(false);

  const [staff, setStaff] = useState<NonTeachingStaff[]>([]);
  const [sSearch, setSSearch] = useState("");
  const [sLoading, setSLoading] = useState(true);
  const [sDialogOpen, setSDialogOpen] = useState(false);
  const [sForm, setSForm] = useState(emptyStaffForm);
  const [sEditId, setSEditId] = useState<string | null>(null);
  const [sSaving, setSSaving] = useState(false);
  const [sCardItem, setSCardItem] = useState<any>(null);
  const [sBulkDeleting, setSBulkDeleting] = useState(false);

  const fetchTeachers = async () => {
    const { data } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
    if (data) setTeachers(data);
    setTLoading(false);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("non_teaching_staff" as any).select("*").order("created_at", { ascending: false });
    if (data) setStaff(data as any);
    setSLoading(false);
  };

  useEffect(() => { fetchTeachers(); fetchStaff(); }, []);

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(tSearch.toLowerCase()) ||
    t.teacher_id.toLowerCase().includes(tSearch.toLowerCase()) ||
    t.subject.toLowerCase().includes(tSearch.toLowerCase())
  );

  const tBulk = useBulkSelect(filteredTeachers);

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tForm.teacher_id.trim() || !tForm.name.trim()) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" }); return;
    }
    // Duplicate check
    if (!tEditId) {
      const dup = teachers.find(t => t.teacher_id === tForm.teacher_id.trim());
      if (dup) { toast({ title: "Duplicate", description: `Teacher ID "${tForm.teacher_id}" already exists.`, variant: "destructive" }); return; }
    }
    setTSaving(true);
    const payload = {
      teacher_id: tForm.teacher_id.trim(), name: tForm.name.trim(), subject: tForm.subject.trim(),
      classes: tForm.classes.trim(), phone: tForm.phone.trim(), qualification: tForm.qualification.trim(),
      cnic: tForm.cnic.trim(), salary: tForm.salary ? parseFloat(tForm.salary) : 0,
      status: tForm.status, joining_date: tForm.joining_date || null, photo_url: tForm.photo_url,
      date_of_birth: tForm.date_of_birth || null,
    };
    const { error } = tEditId
      ? await supabase.from("teachers").update(payload as any).eq("id", tEditId)
      : await supabase.from("teachers").insert(payload as any);
    setTSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: tEditId ? "Updated" : "Added" }); setTDialogOpen(false); setTForm(emptyTeacherForm); setTEditId(null); fetchTeachers(); }
  };

  const handleTeacherEdit = (t: Teacher) => {
    setTForm({ teacher_id: t.teacher_id, name: t.name, subject: t.subject, classes: t.classes, phone: t.phone || "", qualification: t.qualification || "", cnic: t.cnic || "", salary: t.salary?.toString() || "", status: t.status, joining_date: t.joining_date || "", photo_url: (t as any).photo_url || "" });
    setTEditId(t.id); setTDialogOpen(true);
  };

  const handleTeacherDelete = async (id: string) => {
    if (!confirm("Delete this teacher?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchTeachers(); }
  };

  const handleTeacherBulkDelete = async () => {
    if (!confirm(`Delete ${tBulk.count} selected teachers?`)) return;
    setTBulkDeleting(true);
    const ids = Array.from(tBulk.selectedIds);
    const { error } = await supabase.from("teachers").delete().in("id", ids);
    setTBulkDeleting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: `${ids.length} teachers deleted` }); tBulk.clear(); fetchTeachers(); }
  };

  const handleTeacherBulkPrint = () => {
    const selected = filteredTeachers.filter(t => tBulk.selectedIds.has(t.id));
    const rows = selected.map(t => `<tr><td>${t.teacher_id}</td><td style="text-align:left">${t.name}</td><td>${t.subject}</td><td>${t.classes}</td><td>${t.phone || "—"}</td><td>${t.qualification || "—"}</td><td>${t.salary ? `₨ ${Number(t.salary).toLocaleString("en-PK")}` : "—"}</td><td>${t.status}</td></tr>`).join("");
    printA4(`<div class="print-page">${schoolHeader("TEACHING STAFF LIST")}<p class="list-subtitle">Selected: ${selected.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>ID</th><th>Name</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Qualification</th><th>Salary</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Teaching Staff List");
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(sSearch.toLowerCase()) ||
    s.staff_id.toLowerCase().includes(sSearch.toLowerCase()) ||
    s.designation.toLowerCase().includes(sSearch.toLowerCase())
  );

  const sBulk = useBulkSelect(filteredStaff);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sForm.staff_id.trim() || !sForm.name.trim()) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" }); return;
    }
    setSSaving(true);
    const payload = {
      staff_id: sForm.staff_id.trim(), name: sForm.name.trim(), designation: sForm.designation.trim(),
      department: sForm.department.trim(), phone: sForm.phone.trim(), cnic: sForm.cnic.trim(),
      salary: sForm.salary ? parseFloat(sForm.salary) : 0, qualification: sForm.qualification.trim(),
      address: sForm.address.trim(), status: sForm.status, joining_date: sForm.joining_date || null, photo_url: sForm.photo_url,
    };
    const { error } = sEditId
      ? await supabase.from("non_teaching_staff" as any).update(payload as any).eq("id", sEditId)
      : await supabase.from("non_teaching_staff" as any).insert(payload as any);
    setSSaving(false);
    if (error) toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    else { toast({ title: sEditId ? "Updated" : "Added" }); setSDialogOpen(false); setSForm(emptyStaffForm); setSEditId(null); fetchStaff(); }
  };

  const handleStaffEdit = (s: NonTeachingStaff) => {
    setSForm({ staff_id: s.staff_id, name: s.name, designation: s.designation, department: s.department, phone: s.phone || "", cnic: s.cnic || "", salary: s.salary?.toString() || "", qualification: s.qualification || "", address: s.address || "", status: s.status, joining_date: s.joining_date || "", photo_url: (s as any).photo_url || "" });
    setSEditId(s.id); setSDialogOpen(true);
  };

  const handleStaffDelete = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    const { error } = await supabase.from("non_teaching_staff" as any).delete().eq("id", id);
    if (error) toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchStaff(); }
  };

  const handleStaffBulkDelete = async () => {
    if (!confirm(`Delete ${sBulk.count} selected staff?`)) return;
    setSBulkDeleting(true);
    const ids = Array.from(sBulk.selectedIds);
    const { error } = await supabase.from("non_teaching_staff" as any).delete().in("id", ids);
    setSBulkDeleting(false);
    if (error) toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    else { toast({ title: "Deleted", description: `${ids.length} staff deleted` }); sBulk.clear(); fetchStaff(); }
  };

  const handleStaffBulkPrint = () => {
    const selected = filteredStaff.filter(s => sBulk.selectedIds.has(s.id));
    const rows = selected.map(s => `<tr><td>${s.staff_id}</td><td style="text-align:left">${s.name}</td><td>${s.designation}</td><td>${s.department}</td><td>${s.phone || "—"}</td><td>${s.salary ? `₨ ${Number(s.salary).toLocaleString("en-PK")}` : "—"}</td><td>${s.status}</td></tr>`).join("");
    printA4(`<div class="print-page">${schoolHeader("NON-TEACHING STAFF LIST")}<p class="list-subtitle">Selected: ${selected.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Phone</th><th>Salary</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Non-Teaching Staff List");
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage teaching & non-teaching staff ({teachers.length + staff.length} total)</p>
      </div>

      <Tabs defaultValue="teaching" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teaching">Teaching Staff ({teachers.length})</TabsTrigger>
          <TabsTrigger value="non-teaching">Non-Teaching Staff ({staff.length})</TabsTrigger>
        </TabsList>

        {/* ═══ TEACHING STAFF TAB ═══ */}
        <TabsContent value="teaching" className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              const csvData = filteredTeachers.map(t => ({ teacher_id: t.teacher_id, name: t.name, subject: t.subject, classes: t.classes, phone: t.phone || "", qualification: t.qualification || "", salary: t.salary || 0, status: t.status }));
              downloadCSV(csvData, "Teaching_Staff", [
                { key: "teacher_id", label: "ID" }, { key: "name", label: "Name" }, { key: "subject", label: "Subject" }, { key: "classes", label: "Classes" },
                { key: "phone", label: "Phone" }, { key: "qualification", label: "Qualification" }, { key: "salary", label: "Salary" }, { key: "status", label: "Status" }
              ]);
            }}><Download className="mr-2 h-4 w-4" />Save CSV</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const rows = filteredTeachers.map(t => `<tr><td>${t.teacher_id}</td><td style="text-align:left">${t.name}</td><td>${t.subject}</td><td>${t.classes}</td><td>${t.phone || "—"}</td><td>${t.qualification || "—"}</td><td>${t.salary ? `₨ ${Number(t.salary).toLocaleString("en-PK")}` : "—"}</td><td>${t.status}</td></tr>`).join("");
              printA4(`<div class="print-page">${schoolHeader("TEACHING STAFF LIST")}<p class="list-subtitle">Total: ${filteredTeachers.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>ID</th><th>Name</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Qualification</th><th>Salary</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Teaching Staff List");
            }}><Printer className="mr-2 h-4 w-4" />Print List</Button>

            <Dialog open={tDialogOpen} onOpenChange={o => { setTDialogOpen(o); if (!o) { setTForm(emptyTeacherForm); setTEditId(null); } }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setTForm({ ...emptyTeacherForm, teacher_id: genTeacherId(teachers.length) })}><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-display">{tEditId ? "Edit Teacher" : "Add New Teacher"}</DialogTitle></DialogHeader>
                <form onSubmit={handleTeacherSubmit} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Teacher ID *</Label><Input value={tForm.teacher_id} onChange={e => setTForm({ ...tForm, teacher_id: e.target.value })} readOnly={!tEditId} className={!tEditId ? "bg-muted" : ""} required /></div>
                  <div className="space-y-2"><Label>Name *</Label><Input placeholder="Full name" value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Select value={tForm.subject} onValueChange={v => setTForm({ ...tForm, subject: v })}>
                      <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Principal">Principal</SelectItem>
                        <SelectItem value="Vice Principal">Vice Principal</SelectItem>
                        <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                        <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                        <SelectItem value="Teacher">Teacher</SelectItem>
                        <SelectItem value="Assistant Teacher">Assistant Teacher</SelectItem>
                        <SelectItem value="Subject Specialist">Subject Specialist</SelectItem>
                        <SelectItem value="Class Teacher">Class Teacher</SelectItem>
                        <SelectItem value="Coordinator">Coordinator</SelectItem>
                        <SelectItem value="Librarian">Librarian</SelectItem>
                        <SelectItem value="Lab Instructor">Lab Instructor</SelectItem>
                        <SelectItem value="PTI (Physical Training Instructor)">PTI (Physical Training Instructor)</SelectItem>
                        <SelectItem value="Qari/Qaria">Qari/Qaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Classes</Label><Input placeholder="9-A, 10-A" value={tForm.classes} onChange={e => setTForm({ ...tForm, classes: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="0321-XXXXXXX" value={tForm.phone} onChange={e => setTForm({ ...tForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Qualification</Label><Input placeholder="M.Sc" value={tForm.qualification} onChange={e => setTForm({ ...tForm, qualification: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CNIC</Label><Input placeholder="XXXXX-XXXXXXX-X" value={tForm.cnic} onChange={e => setTForm({ ...tForm, cnic: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Salary (PKR)</Label><Input type="number" placeholder="25000" value={tForm.salary} onChange={e => setTForm({ ...tForm, salary: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={tForm.joining_date} onChange={e => setTForm({ ...tForm, joining_date: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={tForm.status} onValueChange={v => setTForm({ ...tForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="On Leave">On Leave</SelectItem><SelectItem value="Resigned">Resigned</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <PhotoUpload currentUrl={tForm.photo_url} onUpload={url => setTForm({ ...tForm, photo_url: url })} folder="teachers" id={tForm.teacher_id} />
                  <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={tSaving}>{tSaving ? "Saving..." : tEditId ? "Update" : "Add Teacher"}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <BulkActionBar count={tBulk.count} onDelete={handleTeacherBulkDelete} onPrint={handleTeacherBulkPrint} onClear={tBulk.clear} deleting={tBulkDeleting} />

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, ID, or subject..." className="pl-9" value={tSearch} onChange={e => setTSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tLoading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-10"><Checkbox checked={tBulk.allSelected} onCheckedChange={tBulk.toggleAll} aria-label="Select all" /></TableHead>
                    <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Classes</TableHead><TableHead>Phone</TableHead><TableHead>Qualification</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No teachers found</TableCell></TableRow> :
                    filteredTeachers.map(t => (
                      <TableRow key={t.id} data-state={tBulk.selectedIds.has(t.id) ? "selected" : undefined}>
                        <TableCell><Checkbox checked={tBulk.selectedIds.has(t.id)} onCheckedChange={() => tBulk.toggle(t.id)} /></TableCell>
                        <TableCell className="font-mono text-xs">{t.teacher_id}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.subject}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.classes}</TableCell>
                        <TableCell className="text-muted-foreground">{t.phone}</TableCell>
                        <TableCell className="text-xs">{t.qualification}</TableCell>
                        <TableCell><Badge variant={t.status === "Active" ? "default" : "secondary"} className={t.status === "Active" ? "bg-success text-success-foreground" : ""}>{t.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setTCardItem(t)} title="ID Card"><CreditCard className="h-4 w-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleTeacherEdit(t)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleTeacherDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ NON-TEACHING STAFF TAB ═══ */}
        <TabsContent value="non-teaching" className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              const csvData = filteredStaff.map(s => ({ staff_id: s.staff_id, name: s.name, designation: s.designation, department: s.department, phone: s.phone || "", salary: s.salary || 0, status: s.status }));
              downloadCSV(csvData, "Non_Teaching_Staff", [
                { key: "staff_id", label: "ID" }, { key: "name", label: "Name" }, { key: "designation", label: "Designation" }, { key: "department", label: "Department" },
                { key: "phone", label: "Phone" }, { key: "salary", label: "Salary" }, { key: "status", label: "Status" }
              ]);
            }}><Download className="mr-2 h-4 w-4" />Save CSV</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const rows = filteredStaff.map(s => `<tr><td>${s.staff_id}</td><td style="text-align:left">${s.name}</td><td>${s.designation}</td><td>${s.department}</td><td>${s.phone || "—"}</td><td>${s.salary ? `₨ ${Number(s.salary).toLocaleString("en-PK")}` : "—"}</td><td>${s.status}</td></tr>`).join("");
              printA4(`<div class="print-page">${schoolHeader("NON-TEACHING STAFF LIST")}<p class="list-subtitle">Total: ${filteredStaff.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Phone</th><th>Salary</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Non-Teaching Staff List");
            }}><Printer className="mr-2 h-4 w-4" />Print List</Button>

            <Dialog open={sDialogOpen} onOpenChange={o => { setSDialogOpen(o); if (!o) { setSForm(emptyStaffForm); setSEditId(null); } }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setSForm({ ...emptyStaffForm, staff_id: genStaffId(staff.length) })}><Plus className="mr-2 h-4 w-4" />Add Staff</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-display">{sEditId ? "Edit Staff" : "Add Non-Teaching Staff"}</DialogTitle></DialogHeader>
                <form onSubmit={handleStaffSubmit} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Staff ID *</Label><Input value={sForm.staff_id} onChange={e => setSForm({ ...sForm, staff_id: e.target.value })} readOnly={!sEditId} className={!sEditId ? "bg-muted" : ""} required /></div>
                  <div className="space-y-2"><Label>Name *</Label><Input placeholder="Full name" value={sForm.name} onChange={e => setSForm({ ...sForm, name: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Select value={sForm.designation} onValueChange={v => setSForm({ ...sForm, designation: v })}>
                      <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office Manager">Office Manager</SelectItem>
                        <SelectItem value="Accountant">Accountant</SelectItem>
                        <SelectItem value="Clerk">Clerk</SelectItem>
                        <SelectItem value="Receptionist">Receptionist</SelectItem>
                        <SelectItem value="Data Entry Operator">Data Entry Operator</SelectItem>
                        <SelectItem value="IT Support">IT Support</SelectItem>
                        <SelectItem value="Lab Attendant">Lab Attendant</SelectItem>
                        <SelectItem value="Peon">Peon</SelectItem>
                        <SelectItem value="Sweeper">Sweeper</SelectItem>
                        <SelectItem value="Guard">Guard</SelectItem>
                        <SelectItem value="Watchman">Watchman</SelectItem>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Cook">Cook</SelectItem>
                        <SelectItem value="Helper">Helper</SelectItem>
                        <SelectItem value="Gardener">Gardener</SelectItem>
                        <SelectItem value="Electrician">Electrician</SelectItem>
                        <SelectItem value="Plumber">Plumber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={sForm.department} onValueChange={v => setSForm({ ...sForm, department: v })}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Accounts">Accounts</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Kitchen/Canteen">Kitchen/Canteen</SelectItem>
                        <SelectItem value="Library">Library</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="0321-XXXXXXX" value={sForm.phone} onChange={e => setSForm({ ...sForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CNIC</Label><Input placeholder="XXXXX-XXXXXXX-X" value={sForm.cnic} onChange={e => setSForm({ ...sForm, cnic: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Qualification</Label><Input placeholder="Matric" value={sForm.qualification} onChange={e => setSForm({ ...sForm, qualification: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Salary (PKR)</Label><Input type="number" placeholder="15000" value={sForm.salary} onChange={e => setSForm({ ...sForm, salary: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={sForm.joining_date} onChange={e => setSForm({ ...sForm, joining_date: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={sForm.status} onValueChange={v => setSForm({ ...sForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="On Leave">On Leave</SelectItem><SelectItem value="Resigned">Resigned</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2"><Label>Address</Label><Input placeholder="Complete address" value={sForm.address} onChange={e => setSForm({ ...sForm, address: e.target.value })} /></div>
                  <PhotoUpload currentUrl={sForm.photo_url} onUpload={url => setSForm({ ...sForm, photo_url: url })} folder="staff" id={sForm.staff_id} />
                  <div className="col-span-2"><Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={sSaving}>{sSaving ? "Saving..." : sEditId ? "Update" : "Add Staff"}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <BulkActionBar count={sBulk.count} onDelete={handleStaffBulkDelete} onPrint={handleStaffBulkPrint} onClear={sBulk.clear} deleting={sBulkDeleting} />

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, ID, or designation..." className="pl-9" value={sSearch} onChange={e => setSSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sLoading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-10"><Checkbox checked={sBulk.allSelected} onCheckedChange={sBulk.toggleAll} aria-label="Select all" /></TableHead>
                    <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Department</TableHead><TableHead>Phone</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No staff found</TableCell></TableRow> :
                    filteredStaff.map(s => (
                      <TableRow key={s.id} data-state={sBulk.selectedIds.has(s.id) ? "selected" : undefined}>
                        <TableCell><Checkbox checked={sBulk.selectedIds.has(s.id)} onCheckedChange={() => sBulk.toggle(s.id)} /></TableCell>
                        <TableCell className="font-mono text-xs">{s.staff_id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.designation}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.department}</TableCell>
                        <TableCell className="text-muted-foreground">{s.phone}</TableCell>
                        <TableCell className="text-xs">{s.salary ? `₨ ${Number(s.salary).toLocaleString("en-PK")}` : "—"}</TableCell>
                        <TableCell><Badge variant={s.status === "Active" ? "default" : "secondary"} className={s.status === "Active" ? "bg-success text-success-foreground" : ""}>{s.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSCardItem(s)} title="ID Card"><CreditCard className="h-4 w-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleStaffEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleStaffDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!tCardItem} onOpenChange={o => { if (!o) setTCardItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Teacher ID Card</DialogTitle></DialogHeader>
          {tCardItem && (
            <IDCard data={{
              photo_url: (tCardItem as any).photo_url,
              id_number: tCardItem.teacher_id,
              name: tCardItem.name,
              subtitle: tCardItem.subject || "Teacher",
              extra_lines: [
                `<strong>ID:</strong> ${tCardItem.teacher_id}`,
                tCardItem.classes ? `<strong>Classes:</strong> ${tCardItem.classes}` : "",
                tCardItem.phone ? `<strong>Phone:</strong> ${tCardItem.phone}` : "",
              ].filter(Boolean),
              type: "teacher",
            }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sCardItem} onOpenChange={o => { if (!o) setSCardItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Staff ID Card</DialogTitle></DialogHeader>
          {sCardItem && (
            <IDCard data={{
              photo_url: (sCardItem as any).photo_url,
              id_number: sCardItem.staff_id,
              name: sCardItem.name,
              subtitle: sCardItem.designation || "Staff",
              extra_lines: [
                `<strong>ID:</strong> ${sCardItem.staff_id}`,
                sCardItem.department ? `<strong>Dept:</strong> ${sCardItem.department}` : "",
                sCardItem.phone ? `<strong>Phone:</strong> ${sCardItem.phone}` : "",
              ].filter(Boolean),
              type: "staff",
            }} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Employees;
