import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  form: {
    student_id: string;
    subject_id: string;
    obtained_marks: string;
    total_marks: string;
    term: string;
  };
  students: Array<{ id: string; name: string; class: string; section: string | null }>;
  subjects: Array<{ id: string; name: string }>;
  onGenerated: (text: string) => void;
}

const AiRemarkButton = ({ form, students, subjects, onGenerated }: Props) => {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (!form.student_id || !form.subject_id || !form.obtained_marks) {
      toast({ title: "Fill marks first", description: "Select student, subject and obtained marks.", variant: "destructive" });
      return;
    }
    const student = students.find(s => s.id === form.student_id);
    const subject = subjects.find(s => s.id === form.subject_id);
    const obtained = Number(form.obtained_marks);
    const total = Number(form.total_marks) || 100;

    setBusy(true);
    try {
      // Attendance last 90 days
      const since = new Date(); since.setDate(since.getDate() - 90);
      const { data: att } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", form.student_id)
        .gte("date", since.toISOString().slice(0, 10));
      const present = (att || []).filter(a => a.status === "Present").length;
      const attPct = att && att.length ? Math.round((present / att.length) * 100) : undefined;

      // Previous term average
      const { data: prev } = await supabase
        .from("test_results")
        .select("obtained_marks,total_marks,term")
        .eq("student_id", form.student_id)
        .neq("term", form.term);
      let prevPct: number | undefined;
      if (prev && prev.length) {
        const t = prev.reduce((s, r) => s + Number(r.total_marks || 0), 0);
        const g = prev.reduce((s, r) => s + Number(r.obtained_marks || 0), 0);
        prevPct = t ? Math.round((g / t) * 100) : undefined;
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "result_comment",
          student_name: student?.name,
          class_name: student ? `${student.class}${student.section ? "-" + student.section : ""}` : "",
          subjects: [{ subject: subject?.name || "Subject", obtained, total }],
          attendance_percent: attPct,
          previous_percent: prevPct,
        },
      });
      if (error) throw error;
      const reply = (data as any)?.reply?.trim();
      if (!reply) throw new Error("Empty AI response");
      onGenerated(reply);
      toast({ title: "AI remark generated" });
    } catch (e: any) {
      toast({ title: "AI unavailable", description: e.message || "Try again shortly.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={generate} disabled={busy} title="Generate remark with AI">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
      <span className="ml-1 hidden sm:inline">AI</span>
    </Button>
  );
};

export default AiRemarkButton;
