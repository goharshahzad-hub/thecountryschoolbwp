import { useState, useEffect } from "react";
import { classOptions } from "@/lib/constants";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Pencil, Trash2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, schoolHeader, schoolFooter } from "@/lib/printUtils";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/BulkActionBar";

interface Admission {
  id: string;
  application_no: string;
  student_name: string;
  father_name: string;
  mother_name: string | null;
  date_of_birth: string;
  gender: string;
  religion: string | null;
  nationality: string | null;
  cnic_bform: string | null;
  father_cnic: string | null;
  father_occupation: string | null;
  father_phone: string | null;
  mother_phone: string | null;
  address: string | null;
  previous_school: string | null;
  previous_class: string | null;
  applying_for_class: string;
  applying_for_section: string | null;
  admission_date: string | null;
  status: string;
  remarks: string | null;
}

const emptyForm = {
  application_no: "", student_name: "", father_name: "", mother_name: "", date_of_birth: "",
  gender: "Male", religion: "Islam", nationality: "Pakistani", cnic_bform: "", father_cnic: "",
  father_occupation: "", father_phone: "", mother_phone: "", whatsapp: "", address: "", previous_school: "",
  previous_class: "", applying_for_class: "", applying_for_section: "A", status: "Pending", remarks: ""
};

const Admissions = () => {
  const { toast } = useToast();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchAdmissions = async () => {
    const { data } = await supabase.from("admissions").select("*").order("created_at", { ascending: false });
    if (data) setAdmissions(data);
    setLoading(false);
  };

  useEffect(() => { fetchAdmissions(); }, []);

  const filtered = admissions.filter(a =>
    a.student_name.toLowerCase().includes(search.toLowerCase()) ||
    a.application_no.toLowerCase().includes(search.toLowerCase()) ||
    a.father_name.toLowerCase().includes(search.toLowerCase())
  );

  const bulk = useBulkSelect(filtered);

  const generateAppNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const count = admissions.length + 1;
    return `ADM-${year}-${month}-${count.toString().padStart(4, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.father_name.trim() || !form.date_of_birth || !form.applying_for_class.trim()) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      application_no: form.application_no || generateAppNo(),
      student_name: form.student_name.trim(),
      father_name: form.father_name.trim(),
      mother_name: form.mother_name.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      religion: form.religion,
      nationality: form.nationality,
      cnic_bform: form.cnic_bform.trim(),
      father_cnic: form.father_cnic.trim(),
      father_occupation: form.father_occupation.trim(),
      father_phone: form.father_phone.trim(),
      mother_phone: form.mother_phone.trim(),
      whatsapp: form.whatsapp.trim(),
      address: form.address.trim(),
      previous_school: form.previous_school.trim(),
      previous_class: form.previous_class.trim(),
      applying_for_class: form.applying_for_class.trim(),
      applying_for_section: form.applying_for_section,
      status: form.status,
      remarks: form.remarks.trim(),
    };

    const { error } = editingId
      ? await supabase.from("admissions").update(payload).eq("id", editingId)
      : await supabase.from("admissions").insert(payload);

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingId ? "Updated" : "Application Submitted" }); setDialogOpen(false); setForm(emptyForm); setEditingId(null); fetchAdmissions(); }
  };

  const handleEdit = (a: Admission) => {
    setForm({
      application_no: a.application_no, student_name: a.student_name, father_name: a.father_name,
      mother_name: a.mother_name || "", date_of_birth: a.date_of_birth, gender: a.gender,
      religion: a.religion || "Islam", nationality: a.nationality || "Pakistani",
      cnic_bform: a.cnic_bform || "", father_cnic: a.father_cnic || "",
      father_occupation: a.father_occupation || "", father_phone: a.father_phone || "",
      mother_phone: a.mother_phone || "", whatsapp: (a as any).whatsapp || "", address: a.address || "",
      previous_school: a.previous_school || "", previous_class: a.previous_class || "",
      applying_for_class: a.applying_for_class, applying_for_section: a.applying_for_section || "A",
      status: a.status, remarks: a.remarks || ""
    });
    setEditingId(a.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this admission application?")) return;
    const { error } = await supabase.from("admissions").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchAdmissions(); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${bulk.count} selected applications?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(bulk.selectedIds);
    const { error } = await supabase.from("admissions").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: `${ids.length} applications deleted` }); bulk.clear(); fetchAdmissions(); }
  };

  const handleBulkPrint = () => {
    const selected = filtered.filter(a => bulk.selectedIds.has(a.id));
    const rows = selected.map(a => `<tr><td>${a.application_no}</td><td style="text-align:left">${a.student_name}</td><td>${a.father_name}</td><td>${a.applying_for_class}-${a.applying_for_section}</td><td>${a.gender}</td><td>${a.status}</td></tr>`).join("");
    printA4(`<div class="print-page">${schoolHeader("ADMISSION APPLICATIONS")}<p class="list-subtitle">Selected: ${selected.length} | Generated: ${new Date().toLocaleDateString("en-PK")}</p><table><thead><tr><th>App No</th><th>Student</th><th>Father</th><th>Class</th><th>Gender</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>${schoolFooter()}</div>`, "Admissions List");
  };

  const statusColor = (s: string) => s === "Approved" ? "border-success/30 text-success" : s === "Rejected" ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning";

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage admission applications ({admissions.length} total)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setForm({ ...emptyForm, application_no: generateAppNo() })}><Plus className="mr-2 h-4 w-4" />New Admission</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Application" : "New Admission Form"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Application No</Label><Input value={form.application_no} readOnly className="bg-muted" /></div>
                  <div className="space-y-2"><Label>Student Name *</Label><Input placeholder="Full name" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Date of Birth *</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Religion</Label><Input value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Nationality</Label><Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
                  <div className="space-y-2"><Label>B-Form / CNIC No</Label><Input placeholder="XXXXX-XXXXXXX-X" value={form.cnic_bform} onChange={e => setForm({ ...form, cnic_bform: e.target.value })} /></div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Parent / Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Father's Name *</Label><Input value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Father's CNIC</Label><Input placeholder="XXXXX-XXXXXXX-X" value={form.father_cnic} onChange={e => setForm({ ...form, father_cnic: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Father's Occupation</Label><Input value={form.father_occupation} onChange={e => setForm({ ...form, father_occupation: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Father's Phone</Label><Input placeholder="0300-XXXXXXX" value={form.father_phone} onChange={e => setForm({ ...form, father_phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Mother's Name</Label><Input value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Mother's Phone</Label><Input value={form.mother_phone} onChange={e => setForm({ ...form, mother_phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>WhatsApp Number</Label><Input placeholder="0300-XXXXXXX" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
                  <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea placeholder="Complete address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Academic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Previous School</Label><Input value={form.previous_school} onChange={e => setForm({ ...form, previous_school: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Previous Class</Label><Input value={form.previous_class} onChange={e => setForm({ ...form, previous_class: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Applying for Class *</Label>
                    <Select value={form.applying_for_class} onValueChange={v => setForm({ ...form, applying_for_class: v })}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classOptions.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={form.applying_for_section} onValueChange={v => setForm({ ...form, applying_for_section: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Application" : "Submit Admission Form"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <BulkActionBar count={bulk.count} onDelete={handleBulkDelete} onPrint={handleBulkPrint} onClear={bulk.clear} deleting={bulkDeleting} />

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or application no..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-10"><Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} aria-label="Select all" /></TableHead>
                <TableHead>App No</TableHead><TableHead>Student</TableHead><TableHead>Father</TableHead><TableHead>Applying For</TableHead><TableHead>Gender</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No admission applications</TableCell></TableRow> :
                filtered.map(a => (
                  <TableRow key={a.id} data-state={bulk.selectedIds.has(a.id) ? "selected" : undefined}>
                    <TableCell><Checkbox checked={bulk.selectedIds.has(a.id)} onCheckedChange={() => bulk.toggle(a.id)} /></TableCell>
                    <TableCell className="font-mono text-xs">{a.application_no}</TableCell>
                    <TableCell className="font-medium">{a.student_name}</TableCell>
                    <TableCell>{a.father_name}</TableCell>
                    <TableCell>Class {a.applying_for_class}-{a.applying_for_section}</TableCell>
                    <TableCell>{a.gender}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor(a.status)}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Print Form" onClick={() => {
                        const formHtml = `<div class="print-page">
                          ${schoolHeader("ADMISSION APPLICATION FORM")}
                          <div class="form-section"><h3>Student Information</h3>
                            <div class="form-row"><span class="label">Application No:</span><span class="value">${a.application_no}</span></div>
                            <div class="form-row"><span class="label">Student Name:</span><span class="value">${a.student_name}</span></div>
                            <div class="form-row"><span class="label">Date of Birth:</span><span class="value">${a.date_of_birth}</span></div>
                            <div class="form-row"><span class="label">Gender:</span><span class="value">${a.gender}</span></div>
                            <div class="form-row"><span class="label">Religion:</span><span class="value">${a.religion || "—"}</span></div>
                            <div class="form-row"><span class="label">Nationality:</span><span class="value">${a.nationality || "—"}</span></div>
                            <div class="form-row"><span class="label">B-Form/CNIC:</span><span class="value">${a.cnic_bform || "—"}</span></div>
                          </div>
                          <div class="form-section"><h3>Parent / Guardian Information</h3>
                            <div class="form-row"><span class="label">Father's Name:</span><span class="value">${a.father_name}</span></div>
                            <div class="form-row"><span class="label">Father's CNIC:</span><span class="value">${a.father_cnic || "—"}</span></div>
                            <div class="form-row"><span class="label">Father's Occupation:</span><span class="value">${a.father_occupation || "—"}</span></div>
                            <div class="form-row"><span class="label">Father's Phone:</span><span class="value">${a.father_phone || "—"}</span></div>
                            <div class="form-row"><span class="label">Mother's Name:</span><span class="value">${a.mother_name || "—"}</span></div>
                            <div class="form-row"><span class="label">Mother's Phone:</span><span class="value">${a.mother_phone || "—"}</span></div>
                            <div class="form-row"><span class="label">Address:</span><span class="value">${a.address || "—"}</span></div>
                          </div>
                          <div class="form-section"><h3>Academic Information</h3>
                            <div class="form-row"><span class="label">Previous School:</span><span class="value">${a.previous_school || "—"}</span></div>
                            <div class="form-row"><span class="label">Previous Class:</span><span class="value">${a.previous_class || "—"}</span></div>
                            <div class="form-row"><span class="label">Applying for Class:</span><span class="value">${a.applying_for_class}-${a.applying_for_section}</span></div>
                            <div class="form-row"><span class="label">Status:</span><span class="value">${a.status}</span></div>
                            <div class="form-row"><span class="label">Remarks:</span><span class="value">${a.remarks || "—"}</span></div>
                          </div>
                          <div class="signatures"><div>Applicant</div><div>Office Use</div><div>Principal</div></div>
                          ${schoolFooter()}
                        </div>`;
                        printA4(formHtml, `Admission - ${a.application_no}`);
                      }}><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default Admissions;
