import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Check, X, Clock, Trash2 } from "lucide-react";

type Query = {
  id: string;
  student_name: string;
  father_name: string;
  phone: string;
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

const AdmissionQueries = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    const { data, error } = await supabase
      .from("admission_queries")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setQueries(data);
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Admission Queries</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and manage admission inquiries from the website</p>
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
                    <TableHead>Father</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Message</TableHead>
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
                      <TableCell>{q.phone}</TableCell>
                      <TableCell>{q.applying_for_class}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{q.message || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[q.status] || ""}>{q.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {q.status !== "Contacted" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(q.id, "Contacted")} title="Mark Contacted">
                              <Clock className="h-3 w-3" />
                            </Button>
                          )}
                          {q.status !== "Resolved" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(q.id, "Resolved")} title="Mark Resolved">
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
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
    </DashboardLayout>
  );
};

export default AdmissionQueries;
