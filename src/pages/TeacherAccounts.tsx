import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Key, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeacherAccount {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
}

const TeacherAccounts = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccount | null>(null);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [newPassword, setNewPassword] = useState("");

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-teacher", {
      body: { action: "list" },
    });
    if (error) {
      toast({ title: "Error", description: "Failed to load teacher accounts", variant: "destructive" });
    } else {
      setTeachers(data?.teachers || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.full_name) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-teacher", {
      body: { action: "create", email: form.email, password: form.password, full_name: form.full_name, phone: form.phone },
    });
    setSaving(false);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to create account", variant: "destructive" });
    } else {
      toast({ title: "Teacher Account Created", description: `${form.full_name} can now login at /teacher-login` });
      setDialogOpen(false);
      setForm({ email: "", password: "", full_name: "", phone: "" });
      fetchTeachers();
    }
  };

  const handleDelete = async (teacher: TeacherAccount) => {
    if (!confirm(`Delete teacher account for ${teacher.full_name} (${teacher.email})? This cannot be undone.`)) return;
    const { data, error } = await supabase.functions.invoke("manage-teacher", {
      body: { action: "delete", user_id: teacher.user_id },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${teacher.full_name}'s account has been removed` });
      fetchTeachers();
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTeacher || !newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-teacher", {
      body: { action: "reset_password", user_id: selectedTeacher.user_id, new_password: newPassword },
    });
    setSaving(false);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to reset password", variant: "destructive" });
    } else {
      toast({ title: "Password Reset", description: `Password updated for ${selectedTeacher.full_name}` });
      setResetDialogOpen(false);
      setNewPassword("");
      setSelectedTeacher(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Teacher Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage teacher login credentials for the Teacher Portal</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />Create Teacher Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Teacher Login</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="Teacher's full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="teacher@school.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input type="tel" placeholder="03XX-XXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>• Teacher will login at <strong>/teacher-login</strong> with these credentials</p>
                <p>• They will have access to attendance marking and results entry</p>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Active Teacher Accounts ({teachers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teachers.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No teacher accounts created yet. Click "Create Teacher Account" to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t, i) => (
                  <TableRow key={t.user_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{t.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.email}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(t.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedTeacher(t); setResetDialogOpen(true); }}>
                        <Key className="mr-1 h-3.5 w-3.5" />Reset Password
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={o => { setResetDialogOpen(o); if (!o) { setSelectedTeacher(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{selectedTeacher?.full_name}</strong> ({selectedTeacher?.email})
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={handleResetPassword} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</> : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherAccounts;
