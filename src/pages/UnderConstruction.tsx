import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Construction, Hammer, Wrench, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  id: string;
  title: string;
  description: string;
  status: string;
  enabled: boolean;
  sort_order: number;
}

const STATUSES = ["Planning", "In Progress", "Coming Soon", "Beta", "Live"];

const statusColor = (s: string) =>
  s === "In Progress" ? "bg-primary/10 text-primary border-primary/30"
  : s === "Coming Soon" ? "bg-warning/10 text-warning border-warning/30"
  : s === "Live" ? "bg-success/10 text-success border-success/30"
  : s === "Beta" ? "bg-accent/10 text-accent border-accent/30"
  : "bg-muted text-muted-foreground border-border";

const empty = { title: "", description: "", status: "Planning", sort_order: 99 };

const UnderConstruction = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; status: string; sort_order: number }>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("construction_features").select("*").order("sort_order");
    setFeatures((data as Feature[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleEnabled = async (f: Feature) => {
    const { error } = await supabase.from("construction_features").update({ enabled: !f.enabled }).eq("id", f.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, enabled: !f.enabled } : x));
    toast({ title: !f.enabled ? "Enabled" : "Disabled", description: f.title });
  };

  const openAdd = () => { setEditingId(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (f: Feature) => {
    setEditingId(f.id);
    setForm({ title: f.title, description: f.description, status: f.status, sort_order: f.sort_order });
    setDialogOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    if (editingId) {
      const { error } = await supabase.from("construction_features").update(form).eq("id", editingId);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      toast({ title: "Updated" });
    } else {
      const { error } = await supabase.from("construction_features").insert({ ...form, enabled: true });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      toast({ title: "Added" });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (f: Feature) => {
    if (!confirm(`Delete "${f.title}"?`)) return;
    const { error } = await supabase.from("construction_features").delete().eq("id", f.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    load();
  };

  return (
    <DashboardLayout>
      <Card className="p-6 md:p-10 mb-6 bg-gradient-to-br from-primary/5 via-background to-warning/5 border-primary/20">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex gap-3">
            <Construction className="h-12 w-12 text-primary animate-pulse" />
            <Hammer className="h-12 w-12 text-warning" />
            <Wrench className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">App Under Construction</h1>
          <p className="text-muted-foreground max-w-2xl">
            Modules and features currently in development or planned for upcoming releases. Admins can enable, disable,
            add or edit entries below.
          </p>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <Clock className="h-3 w-3 mr-1" /> Active development in progress
          </Badge>
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${features.filter(f => f.enabled).length} enabled · ${features.length} total`}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Feature" : "Add Feature"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Description *</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">{editingId ? "Update" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <Card key={f.id} className={`p-5 transition-shadow hover:shadow-elevated ${!f.enabled ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base">{f.title}</h3>
                <Badge variant="outline" className={`mt-1 ${statusColor(f.status)}`}>{f.status}</Badge>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Switch checked={f.enabled} onCheckedChange={() => toggleEnabled(f)} aria-label="Toggle" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{f.description}</p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(f)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mt-6 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Toggle a feature off to hide it from public roadmap views. Use "Add Feature" to publish new upcoming items.
        </p>
      </Card>
    </DashboardLayout>
  );
};

export default UnderConstruction;
