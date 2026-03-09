import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Megaphone, Bell, Pencil, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_public: boolean;
  expires_at: string | null;
  created_at: string;
}

const TYPES = ["General", "Holiday", "Event", "PTM", "Exam", "Important"];

const typeColor = (type: string) => {
  const map: Record<string, string> = {
    General: "border-primary/30 text-primary",
    Holiday: "border-success/30 text-success",
    Event: "border-secondary/30 text-secondary",
    PTM: "border-warning/30 text-warning",
    Exam: "border-destructive/30 text-destructive",
    Important: "border-destructive/30 text-destructive",
  };
  return map[type] || "border-muted-foreground/30 text-muted-foreground";
};

const emptyForm = { title: "", content: "", type: "General", is_public: true, expires_at: "" };

const Announcements = () => {
  const { toast } = useToast();
  const { settings } = useSchoolSettings();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      is_public: form.is_public,
      expires_at: form.expires_at || null,
    };
    const { error } = editingId
      ? await supabase.from("announcements").update(payload).eq("id", editingId)
      : await supabase.from("announcements").insert(payload);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingId ? "Announcement updated" : "Announcement posted" });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchAnnouncements(); }
  };

  const today = new Date().toISOString().split("T")[0];
  const active = announcements.filter(a => !a.expires_at || a.expires_at >= today);
  const expired = announcements.filter(a => a.expires_at && a.expires_at < today);

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("0")) cleaned = "92" + cleaned.slice(1);
    if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    return cleaned;
  };

  const sendAnnouncementWhatsApp = async (announcement: Announcement) => {
    const { data: parentStudents } = await supabase
      .from("students")
      .select("id, name, class, section, whatsapp, phone, father_name")
      .eq("status", "Active");
    if (!parentStudents || parentStudents.length === 0) {
      toast({ title: "No students", description: "No active students found to send alerts.", variant: "destructive" });
      return;
    }
    let opened = 0;
    parentStudents.forEach((s, i) => {
      const contact = s.whatsapp || s.phone;
      if (!contact) return;
      const phone = formatPhone(contact);
      const message = encodeURIComponent(
        `Dear Parent,\n\n📢 *${announcement.type.toUpperCase()} ANNOUNCEMENT*\n\n*${announcement.title}*\n\n${announcement.content}\n\nRegards,\nAdmin Office\n${settings.school_name}, ${settings.campus}, ${settings.city}.\nPhone: ${settings.phone}`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }, i * 800);
      opened++;
    });
    if (opened === 0) {
      toast({ title: "No contacts", description: "No WhatsApp/phone numbers found.", variant: "destructive" });
    } else {
      toast({ title: "WhatsApp Alerts", description: `Opening ${opened} WhatsApp message(s). Send each one manually.` });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Announcements & Notices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Post school-wide announcements visible on website & parent portal</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? "Edit Announcement" : "Post Announcement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="Announcement title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea placeholder="Write announcement details..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expires On (optional)</Label>
                  <Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_public} onCheckedChange={v => setForm({ ...form, is_public: v })} />
                <Label>Show on public website</Label>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Announcement" : "Post Announcement"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-4">
          {active.length === 0 && expired.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Megaphone className="mx-auto mb-2 h-8 w-8" />
                <p>No announcements yet. Post one to get started!</p>
              </CardContent>
            </Card>
          )}

          {active.map(a => (
            <Card key={a.id} className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="h-4 w-4 text-primary" />
                      <h3 className="font-display font-semibold text-foreground">{a.title}</h3>
                      <Badge variant="outline" className={typeColor(a.type)}>{a.type}</Badge>
                      {a.is_public && <Badge variant="secondary" className="text-[10px]">Public</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{a.content}</p>
                    <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                      <span>Posted: {format(new Date(a.created_at), "dd MMM yyyy")}</span>
                      {a.expires_at && <span>Expires: {format(new Date(a.expires_at), "dd MMM yyyy")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => sendAnnouncementWhatsApp(a)} title="Send via WhatsApp">
                      <MessageCircle className="h-4 w-4 text-[hsl(142,70%,45%)]" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setForm({ title: a.title, content: a.content, type: a.type, is_public: a.is_public, expires_at: a.expires_at || "" });
                      setEditingId(a.id);
                      setDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {expired.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Expired ({expired.length})</h3>
              {expired.map(a => (
                <Card key={a.id} className="shadow-card mb-2 opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-semibold text-foreground">{a.title}</h4>
                          <Badge variant="outline" className={typeColor(a.type)}>{a.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Expired: {a.expires_at && format(new Date(a.expires_at), "dd MMM yyyy")}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Announcements;
