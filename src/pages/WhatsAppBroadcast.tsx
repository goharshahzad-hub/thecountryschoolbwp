import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Users, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { classOptions } from "@/lib/constants";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useToast } from "@/hooks/use-toast";
import { useBulkSelect } from "@/hooks/useBulkSelect";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  father_name: string;
  phone: string | null;
  whatsapp: string | null;
  status: string;
}

const WhatsAppBroadcast = () => {
  const { settings } = useSchoolSettings();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("all");
  const [message, setMessage] = useState(
    `Assalam o Alaikum,\n\nDear Parent,\n\nThis is to inform you from ${settings.school_name} that:\n\n[Your message here]\n\nThank you.\n${settings.school_name}\n${settings.campus}, ${settings.city}`
  );

  useEffect(() => {
    supabase.from("students").select("id, student_id, name, class, section, father_name, phone, whatsapp, status")
      .eq("status", "Active")
      .order("class")
      .then(({ data }) => { if (data) setStudents(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (filterClass === "all") return students;
    return students.filter(s => s.class === filterClass);
  }, [students, filterClass]);

  const withPhone = useMemo(() => {
    return filtered.filter(s => s.whatsapp || s.phone);
  }, [filtered]);

  const bulk = useBulkSelect(withPhone);

  const buildUrl = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    const full = clean.startsWith("0") ? "92" + clean.slice(1) : clean;
    return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
  };

  const handleSendAll = () => {
    const targets = bulk.count > 0
      ? withPhone.filter(s => bulk.selectedIds.has(s.id))
      : withPhone;

    if (targets.length === 0) {
      toast({ title: "No recipients", description: "No students with phone numbers to send to.", variant: "destructive" });
      return;
    }

    if (!confirm(`This will open ${targets.length} WhatsApp tab(s). You need to send each one manually. Continue?`)) return;

    let opened = 0;
    targets.forEach((s, i) => {
      const phone = s.whatsapp || s.phone || "";
      if (!phone) return;
      setTimeout(() => {
        window.open(buildUrl(phone), "_blank");
      }, i * 800);
      opened++;
    });

    toast({ title: "WhatsApp Broadcast", description: `Opening ${opened} WhatsApp tab(s). Send each message manually.` });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">WhatsApp Broadcast</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send bulk WhatsApp messages to parents class-wise or school-wide</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message Editor */}
        <div className="lg:col-span-1">
          <Card className="shadow-card sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[hsl(142,70%,45%)]" />
                Message Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes ({students.length} students)</SelectItem>
                    {classOptions.map(c => {
                      const count = students.filter(s => s.class === c).length;
                      return <SelectItem key={c} value={c}>{c} ({count})</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={10}
                  className="text-sm"
                />
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Recipients</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{bulk.count > 0 ? bulk.count : withPhone.length}</span>
                  <span className="text-xs text-muted-foreground">{bulk.count > 0 ? "selected" : "parents with phone numbers"}</span>
                </div>
                {filtered.length - withPhone.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {filtered.length - withPhone.length} student(s) have no phone number
                  </p>
                )}
              </div>
              <Button
                className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white"
                onClick={handleSendAll}
              >
                <Send className="mr-2 h-4 w-4" />
                {bulk.count > 0 ? `Send to ${bulk.count} Selected` : `Send to All (${withPhone.length})`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recipients List */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                Recipients ({withPhone.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="p-8 text-center text-muted-foreground">Loading...</p>
              ) : withPhone.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No students with phone numbers found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"><Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} aria-label="Select all" /></TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Guardian/Father</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withPhone.map((s, i) => {
                      const phone = s.whatsapp || s.phone || "";
                      return (
                        <TableRow key={s.id} data-state={bulk.selectedIds.has(s.id) ? "selected" : undefined}>
                          <TableCell><Checkbox checked={bulk.selectedIds.has(s.id)} onCheckedChange={() => bulk.toggle(s.id)} /></TableCell>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.father_name}</TableCell>
                          <TableCell>{s.class}-{s.section}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{phone}</TableCell>
                          <TableCell>
                            <a href={buildUrl(phone)} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
                                <Send className="mr-1 h-3.5 w-3.5" /> Send
                              </Button>
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppBroadcast;
