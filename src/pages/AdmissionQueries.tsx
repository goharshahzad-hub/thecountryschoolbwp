import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Check, Clock, Trash2, Eye, Phone, MessageCircle, Mail } from "lucide-react";

type Query = {
  id: string;
  student_name: string;
  father_name: string;
  phone: string;
  mother_phone?: string | null;
  whatsapp?: string | null;
  email: string;
  applying_for_class: string;
  message: string;
  status: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
};

const waLink = (raw: string | null | undefined, text: string) => {
  if (!raw) return null;
  const clean = raw.replace(/[^0-9]/g, "");
  const full = clean.startsWith("0") ? "92" + clean.slice(1) : clean;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
};

const AdmissionQueries = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Query | null>(null);

  const fetchQueries = async () => {
    const { data, error } = await supabase
      .from("admission_queries")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setQueries(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchQueries(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("admission_queries").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Marked as ${status}`); fetchQueries(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this query?")) return;
    const { error } = await supabase.from("admission_queries").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Query deleted"); fetchQueries(); }
  };

  // The website form packs DOB, CNIC, Address etc. into the message field as
  // "Key: Value" lines. Parse them out for readable display.
  const parseDetails = (msg: string) => {
    const lines = (msg || "").split("\n").map(l => l.trim()).filter(Boolean);
    const details: { label: string; value: string }[] = [];
    const freeText: string[] = [];
    for (const line of lines) {
      const m = line.match(/^([A-Z][A-Za-z0-9 \-/]+):\s*(.+)$/);
      if (m) details.push({ label: m[1], value: m[2] });
      else freeText.push(line);
    }
    return { details, note: freeText.join(" ").trim() };
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Admission Queries</h1>
        <p className="mt-1 text-sm text-muted-foreground">View, contact, and manage admission inquiries from the website</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <MessageSquare className="h-5 w-5 text-primary" />
            All Queries ({queries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : queries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No admission queries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Guardian/Father</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="whitespace-nowrap text-xs">{format(new Date(q.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-medium">{q.student_name}</TableCell>
                      <TableCell>{q.father_name}</TableCell>
                      <TableCell className="text-sm">{q.phone}</TableCell>
                      <TableCell>{q.applying_for_class}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[q.status] || ""}>{q.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => setViewing(q)} title="View full details">
                            <Eye className="h-3 w-3" />
                          </Button>
                          {q.whatsapp && (
                            <a href={waLink(q.whatsapp, `Assalam o Alaikum ${q.father_name}, regarding your admission inquiry for ${q.student_name}…`) || "#"} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline" title="WhatsApp father"><MessageCircle className="h-3 w-3 text-green-600" /></Button>
                            </a>
                          )}
                          {q.phone && (
                            <a href={`tel:${q.phone}`}><Button size="sm" variant="outline" title="Call"><Phone className="h-3 w-3" /></Button></a>
                          )}
                          {q.status !== "Contacted" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(q.id, "Contacted")} title="Mark Contacted"><Clock className="h-3 w-3" /></Button>
                          )}
                          {q.status !== "Resolved" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(q.id, "Resolved")} title="Mark Resolved"><Check className="h-3 w-3" /></Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDelete(q.id)} title="Delete"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {viewing?.student_name} — {viewing?.applying_for_class}
            </DialogTitle>
          </DialogHeader>
          {viewing && (() => {
            const parsed = parseDetails(viewing.message);
            const photo = parsed.details.find(d => /^Photo$/i.test(d.label));
            const formB = parsed.details.find(d => /^Form[- ]?B$/i.test(d.label));
            const isUrl = (v: string) => /^https?:\/\//.test(v);
            return (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  {photo && isUrl(photo.value) && (
                    <img src={photo.value} alt={viewing.student_name} className="h-24 w-24 rounded-md object-cover border" />
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                    <div><span className="text-muted-foreground">Guardian:</span> <span className="font-medium">{viewing.father_name}</span></div>
                    <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{viewing.applying_for_class}</span></div>
                    <div><span className="text-muted-foreground">Father's phone:</span> {viewing.phone || "—"}</div>
                    <div><span className="text-muted-foreground">Mother's phone:</span> {viewing.mother_phone || "—"}</div>
                    <div><span className="text-muted-foreground">WhatsApp:</span> {viewing.whatsapp || "—"}</div>
                    <div><span className="text-muted-foreground">Email:</span> {viewing.email || "—"}</div>
                    <div><span className="text-muted-foreground">Submitted:</span> {format(new Date(viewing.created_at), "dd MMM yyyy, hh:mm a")}</div>
                  </div>
                </div>

                {parsed.details.length > 0 && (
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Form details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {parsed.details.filter(d => !/^Photo$/i.test(d.label) && !/^Form[- ]?B$/i.test(d.label)).map((d, i) => (
                        <div key={i}>
                          <span className="text-muted-foreground">{d.label}:</span> <span className="font-medium break-words">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.note && (
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Parent's message</p>
                    <p className="whitespace-pre-wrap">{parsed.note}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {formB && isUrl(formB.value) && (
                    <a href={formB.value} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline"><Eye className="mr-1 h-3 w-3" /> View Form-B</Button>
                    </a>
                  )}
                  {viewing.whatsapp && (
                    <a href={waLink(viewing.whatsapp, `Assalam o Alaikum ${viewing.father_name}, regarding ${viewing.student_name}'s admission inquiry…`) || "#"} target="_blank" rel="noreferrer">
                      <Button size="sm" className="gradient-primary text-primary-foreground"><MessageCircle className="mr-1 h-3 w-3" /> WhatsApp father</Button>
                    </a>
                  )}
                  {viewing.mother_phone && (
                    <a href={waLink(viewing.mother_phone, `Assalam o Alaikum, regarding ${viewing.student_name}'s admission inquiry…`) || "#"} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline"><MessageCircle className="mr-1 h-3 w-3 text-green-600" /> WhatsApp mother</Button>
                    </a>
                  )}
                  {viewing.phone && (
                    <a href={`tel:${viewing.phone}`}><Button size="sm" variant="outline"><Phone className="mr-1 h-3 w-3" /> Call</Button></a>
                  )}
                  {viewing.email && (
                    <a href={`mailto:${viewing.email}`}><Button size="sm" variant="outline"><Mail className="mr-1 h-3 w-3" /> Email</Button></a>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdmissionQueries;
