import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { classOptions, diarySubjectOptions } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiaryEntry {
  id: string;
  class_name: string;
  section: string;
  subject: string;
  homework_text: string;
  date: string;
}

interface DiaryEntryFormProps {
  onSuccess: () => void;
  onClose: () => void;
  editingEntry?: DiaryEntry | null;
}

const DiaryEntryForm = ({ onSuccess, onClose, editingEntry }: DiaryEntryFormProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_name: "",
    section: "A",
    subjects: [] as string[],
    customSubject: "",
    homework_text: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (editingEntry) {
      const subjectParts = editingEntry.subject.split(", ").map(s => s.trim());
      const knownSubjects = subjectParts.filter(s => diarySubjectOptions.includes(s));
      const customParts = subjectParts.filter(s => !diarySubjectOptions.includes(s));
      setForm({
        class_name: editingEntry.class_name,
        section: editingEntry.section,
        subjects: knownSubjects,
        customSubject: customParts.join(", "),
        homework_text: editingEntry.homework_text,
        date: editingEntry.date,
      });
    }
  }, [editingEntry]);

  const toggleSubject = (subject: string) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allSubjects = [...form.subjects];
    if (form.customSubject.trim()) {
      allSubjects.push(form.customSubject.trim());
    }
    if (!form.class_name || allSubjects.length === 0 || !form.homework_text.trim()) {
      toast({ title: "Error", description: "Please fill class, at least one subject, and homework details", variant: "destructive" });
      return;
    }
    setSaving(true);
    const subjectStr = allSubjects.join(", ");
    const payload = {
      class_name: form.class_name,
      section: form.section,
      subject: subjectStr,
      homework_text: form.homework_text.trim(),
      date: form.date,
    };

    const { error } = editingEntry
      ? await supabase.from("diary_entries").update(payload).eq("id", editingEntry.id)
      : await supabase.from("diary_entries").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingEntry ? "Diary entry updated" : "Diary entry added" });
      onClose();
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Class *</Label>
          <Select value={form.class_name} onValueChange={v => setForm({ ...form, class_name: v })}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Section</Label>
          <Select value={form.section} onValueChange={v => setForm({ ...form, section: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subjects * (select multiple)</Label>
        <div className="grid grid-cols-3 gap-2 rounded-md border p-3 max-h-[160px] overflow-y-auto">
          {SUBJECT_LIST.map(sub => (
            <label key={sub} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.subjects.includes(sub)}
                onCheckedChange={() => toggleSubject(sub)}
              />
              {sub}
            </label>
          ))}
        </div>
        <Input
          placeholder="Other subject (type manually)"
          value={form.customSubject}
          onChange={e => setForm({ ...form, customSubject: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>Homework / Diary Details *</Label>
        <Textarea placeholder="Write homework details here..." value={form.homework_text} onChange={e => setForm({ ...form, homework_text: e.target.value })} rows={4} required />
      </div>

      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>
        {saving ? "Saving..." : editingEntry ? "Update Entry" : "Add Entry"}
      </Button>
    </form>
  );
};

export default DiaryEntryForm;
