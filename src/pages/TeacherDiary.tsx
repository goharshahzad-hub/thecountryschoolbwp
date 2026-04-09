import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Printer, Save } from "lucide-react";
import { format } from "date-fns";
import { classOptions, diarySubjectOptions } from "@/lib/constants";
import { printDiarySlips } from "@/components/diary/DiaryPrint";

interface DiaryEntry {
  id: string;
  class_name: string;
  section: string;
  subject: string;
  homework_text: string;
  date: string;
}

const TeacherDiary = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_name: "", section: "A", subject: "", homework_text: "", date: new Date().toISOString().split("T")[0],
  });

  const fetchEntries = async () => {
    const { data } = await supabase.from("diary_entries").select("*").order("date", { ascending: false }).limit(50);
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSubmit = async () => {
    if (!form.class_name || !form.subject || !form.homework_text.trim()) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("diary_entries").insert({
      class_name: form.class_name, section: form.section, subject: form.subject,
      homework_text: form.homework_text.trim(), date: form.date,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Diary entry added!" });
      setForm(f => ({ ...f, subject: "", homework_text: "" }));
      fetchEntries();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("diary_entries").delete().eq("id", id);
    toast({ title: "Deleted" }); fetchEntries();
  };

  const todayEntries = entries.filter(e => e.date === new Date().toISOString().split("T")[0]);

  return (
    <TeacherLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Diary / Homework</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add homework entries for your classes</p>
        </div>
        {todayEntries.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => printDiarySlips(todayEntries)}>
            <Printer className="mr-2 h-4 w-4" />Print Today's Slips
          </Button>
        )}
      </div>

      {/* Add Entry Form */}
      <Card className="mb-6 shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">New Entry</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Class *</Label>
              <Select value={form.class_name} onValueChange={v => setForm(f => ({ ...f, class_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Section</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject *</Label>
              <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>{diarySubjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSubmit} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Add"}
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs">Homework *</Label>
            <Textarea value={form.homework_text} onChange={e => setForm(f => ({ ...f, homework_text: e.target.value }))} placeholder="Write homework details..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Recent Entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Homework</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No entries yet</TableCell></TableRow>
              ) : entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(e.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{e.class_name}-{e.section}</TableCell>
                  <TableCell>{e.subject}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{e.homework_text}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TeacherLayout>
  );
};

export default TeacherDiary;
