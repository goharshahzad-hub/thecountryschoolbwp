import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ShieldCheck, ShieldX, Clock, UserCheck, Pencil, Trash2, ShieldOff, Mail } from "lucide-react";

interface AdminRequest {
  id: string; user_id: string; full_name: string; email: string;
  phone: string | null; status: string; reviewed_at: string | null; created_at: string;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { color: "bg-green-100 text-green-700", icon: ShieldCheck },
  rejected: { color: "bg-red-100 text-red-700", icon: ShieldX },
};

type PendingAction = null | {
  type: "approve_admin" | "revoke_admin" | "reset_admin_password";
  label: string;
  target_user_id?: string;
  target_email?: string;
  target_name?: string;
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<AdminRequest | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });

  // Code verification dialog
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const fetchRequests = async () => {
    const { data } = await supabase.from("admin_requests").select("*").order("created_at", { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  };
  useEffect(() => { fetchRequests(); }, []);

  const startAction = (action: NonNullable<PendingAction>) => {
    setPendingAction(action);
    setCode("");
    setCodeSent(false);
  };

  const sendCode = async () => {
    if (!pendingAction) return;
    setCodeLoading(true);
    const { error } = await supabase.functions.invoke("request-admin-action-code", {
      body: {
        action_type: pendingAction.type,
        target_user_id: pendingAction.target_user_id,
        target_email: pendingAction.target_email,
        target_name: pendingAction.target_name,
      },
    });
    setCodeLoading(false);
    if (error) { toast.error("Could not send code: " + error.message); return; }
    setCodeSent(true);
    toast.success("Verification code sent to goharshahzad@gmail.com");
  };

  const submitCode = async () => {
    if (!pendingAction || !code.trim()) return;
    setCodeLoading(true);
    const { data, error } = await supabase.functions.invoke("verify-admin-action", {
      body: {
        code: code.trim(),
        action_type: pendingAction.type,
        target_user_id: pendingAction.target_user_id,
        target_email: pendingAction.target_email,
      },
    });
    setCodeLoading(false);
    if (error || (data as any)?.error) {
      toast.error("Verification failed: " + (error?.message || (data as any)?.error));
      return;
    }
    toast.success(`${pendingAction.label} — completed`);
    setPendingAction(null);
    fetchRequests();
  };

  const handleReject = async (req: AdminRequest) => {
    setProcessing(req.id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("admin_requests").update({
      status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);
    toast.success(`Request from ${req.full_name} has been rejected.`);
    setProcessing(null);
    fetchRequests();
  };

  const handleDelete = async (req: AdminRequest) => {
    if (!confirm(`Delete request from ${req.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("admin_requests").delete().eq("id", req.id);
    if (error) { toast.error("Failed to delete: " + error.message); return; }
    toast.success("Request deleted.");
    fetchRequests();
  };

  const openEdit = (req: AdminRequest) => {
    setEditingReq(req);
    setEditForm({ full_name: req.full_name, email: req.email, phone: req.phone || "" });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingReq) return;
    const { error } = await supabase.from("admin_requests").update({
      full_name: editForm.full_name.trim(), email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
    }).eq("id", editingReq.id);
    if (error) toast.error("Failed to update: " + error.message);
    else { toast.success("Request updated."); setEditDialogOpen(false); fetchRequests(); }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Access Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All admin approvals, revocations, and password resets require a one-time code sent to <span className="font-medium text-foreground">goharshahzad@gmail.com</span>.
          {pendingCount > 0 && <span className="ml-2 font-medium text-warning">({pendingCount} pending)</span>}
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <UserCheck className="h-5 w-5 text-primary" />
            All Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Loading...</p>
            : requests.length === 0 ? <p className="py-8 text-center text-muted-foreground">No admin access requests yet.</p>
            : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const config = statusConfig[req.status] || statusConfig.pending;
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="whitespace-nowrap text-xs">{format(new Date(req.created_at), "dd MMM yyyy, hh:mm a")}</TableCell>
                        <TableCell className="font-medium">{req.full_name}</TableCell>
                        <TableCell className="text-sm">{req.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{req.phone || "—"}</TableCell>
                        <TableCell><Badge variant="secondary" className={config.color}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {req.status === "pending" && (
                              <>
                                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => startAction({ type: "approve_admin", label: "Approve admin", target_user_id: req.user_id, target_email: req.email, target_name: req.full_name })}>
                                  <ShieldCheck className="mr-1 h-3 w-3" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(req)} disabled={processing === req.id}>
                                  <ShieldX className="mr-1 h-3 w-3" /> Reject
                                </Button>
                              </>
                            )}
                            {req.status === "approved" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startAction({ type: "reset_admin_password", label: "Reset admin password", target_user_id: req.user_id, target_email: req.email, target_name: req.full_name })} title="Reset password">
                                  <Mail className="mr-1 h-3 w-3" /> Reset Pwd
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => startAction({ type: "revoke_admin", label: "Revoke admin access", target_user_id: req.user_id, target_email: req.email, target_name: req.full_name })} title="Revoke admin">
                                  <ShieldOff className="mr-1 h-3 w-3" /> Revoke
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => openEdit(req)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(req)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit Admin Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Verification Dialog */}
      <Dialog open={!!pendingAction} onOpenChange={(o) => { if (!o) setPendingAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> {pendingAction?.label}</DialogTitle>
            <DialogDescription>
              For: <span className="font-medium text-foreground">{pendingAction?.target_name || pendingAction?.target_email}</span>
            </DialogDescription>
          </DialogHeader>
          {!codeSent ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A 6-digit verification code will be emailed to <span className="font-medium text-foreground">goharshahzad@gmail.com</span>. Enter it on the next step to confirm this action.
              </p>
              <Button onClick={sendCode} disabled={codeLoading} className="w-full gradient-primary text-primary-foreground">
                {codeLoading ? "Sending..." : "Send verification code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">A 6-digit code has been emailed to goharshahzad@gmail.com (valid 15 minutes).</p>
              <div className="space-y-2">
                <Label>Enter code</Label>
                <Input value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} placeholder="123456" inputMode="numeric" className="text-center text-2xl tracking-[8px] font-bold" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={sendCode} disabled={codeLoading}>Resend</Button>
                <Button onClick={submitCode} disabled={codeLoading || code.length !== 6} className="flex-1 gradient-primary text-primary-foreground">
                  {codeLoading ? "Verifying..." : "Confirm action"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminRequests;
