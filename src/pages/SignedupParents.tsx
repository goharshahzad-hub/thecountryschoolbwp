import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Trash2, Link2, Unlink, UserCheck, UserX, Users } from "lucide-react";

interface ParentProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  father_name: string;
  parent_user_id: string | null;
}

const SignedupParents = () => {
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all");

  // Link dialog - supports multiple student selection
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkParent, setLinkParent] = useState<ParentProfile | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteParent, setDeleteParent] = useState<ParentProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: pData }, { data: sData }] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, phone, created_at").eq("role", "parent").order("created_at", { ascending: false }),
      supabase.from("students").select("id, student_id, name, class, section, father_name, parent_user_id"),
    ]);
    setParents(pData || []);
    setStudents(sData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getLinkedStudents = (userId: string) => students.filter(s => s.parent_user_id === userId);

  const filteredParents = useMemo(() => {
    return parents.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = !q || p.full_name.toLowerCase().includes(q) || (p.phone || "").includes(q);
      const linked = getLinkedStudents(p.user_id).length > 0;
      if (filterStatus === "linked" && !linked) return false;
      if (filterStatus === "unlinked" && linked) return false;
      return matchesSearch;
    });
  }, [parents, students, search, filterStatus]);

  const unlinkedStudents = useMemo(() => students.filter(s => !s.parent_user_id), [students]);
  const allStudentsForLink = useMemo(() => students, [students]);

  const handleLink = async () => {
    if (!linkParent || selectedStudentIds.length === 0) return;
    const results = await Promise.all(
      selectedStudentIds.map(sid =>
        supabase.from("students").update({ parent_user_id: linkParent.user_id }).eq("id", sid)
      )
    );
    const hasError = results.some(r => r.error);
    if (hasError) {
      toast.error("Some students failed to link.");
    } else {
      toast.success(`${selectedStudentIds.length} student(s) linked successfully!`);
      setLinkDialogOpen(false);
      setSelectedStudentIds([]);
      fetchData();
    }
  };

  const addStudentToSelection = () => {
    if (selectedStudentId && !selectedStudentIds.includes(selectedStudentId)) {
      setSelectedStudentIds(prev => [...prev, selectedStudentId]);
      setSelectedStudentId("");
    }
  };

  const removeStudentFromSelection = (id: string) => {
    setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
  };

  const handleUnlink = async (studentId: string) => {
    const { error } = await supabase.from("students").update({ parent_user_id: null }).eq("id", studentId);
    if (error) {
      toast.error("Failed to unlink: " + error.message);
    } else {
      toast.success("Student unlinked.");
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteParent) return;
    setDeleting(true);
    // Unlink all students first
    await supabase.from("students").update({ parent_user_id: null }).eq("parent_user_id", deleteParent.user_id);
    // Delete profile
    const { error } = await supabase.from("profiles").delete().eq("id", deleteParent.id);
    if (error) {
      toast.error("Failed to delete parent profile: " + error.message);
    } else {
      toast.success("Parent profile deleted.");
      setDeleteDialogOpen(false);
      fetchData();
    }
    setDeleting(false);
  };

  const totalLinked = parents.filter(p => getLinkedStudents(p.user_id).length > 0).length;
  const totalUnlinked = parents.length - totalLinked;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Signedup Parents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage parent accounts, link/unlink students, and review signups.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
            <div><p className="font-display text-2xl font-bold text-foreground">{parents.length}</p><p className="text-xs text-muted-foreground">Total Parents</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"><UserCheck className="h-5 w-5" /></div>
            <div><p className="font-display text-2xl font-bold text-success">{totalLinked}</p><p className="text-xs text-muted-foreground">Linked</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"><UserX className="h-5 w-5" /></div>
            <div><p className="font-display text-2xl font-bold text-destructive">{totalUnlinked}</p><p className="text-xs text-muted-foreground">Unlinked</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v: "all" | "linked" | "unlinked") => setFilterStatus(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parents</SelectItem>
            <SelectItem value="linked">Linked</SelectItem>
            <SelectItem value="unlinked">Unlinked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : filteredParents.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No parents found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParents.map((parent, idx) => {
                  const linked = getLinkedStudents(parent.user_id);
                  const isLinked = linked.length > 0;
                  return (
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{parent.full_name || "—"}</TableCell>
                      <TableCell>{parent.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{getTimeAgo(parent.created_at)}</TableCell>
                      <TableCell>
                        {isLinked ? (
                          <Badge variant="default" className="bg-success/15 text-success border-success/30 hover:bg-success/20">
                            <UserCheck className="mr-1 h-3 w-3" /> Linked
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20">
                            <UserX className="mr-1 h-3 w-3" /> Unlinked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isLinked ? (
                          <div className="flex flex-wrap gap-1">
                            {linked.map(s => (
                              <span key={s.id} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                                {s.name} ({s.class}{s.section ? `-${s.section}` : ""})
                                <button onClick={() => handleUnlink(s.id)} className="ml-1 text-destructive hover:text-destructive/80" title="Unlink">
                                  <Unlink className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setLinkParent(parent); setSelectedStudentIds([]); setSelectedStudentId(""); setLinkDialogOpen(true); }}>
                            <Link2 className="mr-1 h-3 w-3" /> Link Students
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setDeleteParent(parent); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Students to {linkParent?.full_name}</DialogTitle>
            <DialogDescription>Select one or more students to link to this parent account.</DialogDescription>
          </DialogHeader>

          {/* Student selector */}
          <div className="flex gap-2">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a student..." />
              </SelectTrigger>
              <SelectContent>
                {allStudentsForLink.filter(s => !selectedStudentIds.includes(s.id)).map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.student_id} — {s.name} ({s.class}{s.section ? `-${s.section}` : ""}) {s.parent_user_id ? "⚠️ Linked" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={addStudentToSelection} disabled={!selectedStudentId}>Add</Button>
          </div>

          {/* Selected students list */}
          {selectedStudentIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Students to link ({selectedStudentIds.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedStudentIds.map(sid => {
                  const s = allStudentsForLink.find(st => st.id === sid);
                  if (!s) return null;
                  return (
                    <span key={sid} className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                      {s.name} ({s.class})
                      <button onClick={() => removeStudentFromSelection(sid)} className="ml-1 text-destructive hover:text-destructive/80">×</button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLink} disabled={selectedStudentIds.length === 0}>
              Link {selectedStudentIds.length} Student(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Parent Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteParent?.full_name}</strong>'s profile? 
              All student links will be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SignedupParents;
