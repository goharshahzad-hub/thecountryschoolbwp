import TeacherLayout from "@/components/TeacherLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { subjectOptions } from "@/lib/constants";

const examTypes = ["Monthly Test", "Term 1", "Term 2", "Annual"];
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Student { id: string; student_id: string; name: string; }
interface Subject { id: string; name: string; }

const TeacherResults = () => {
  const { toast } = useToast();
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [examType, setExamType] = useState("Monthly Test");
  const [term, setTerm] = useState("Term 1");
  const [totalMarks, setTotalMarks] = useState("100");
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("students").select("class, section").eq("status", "Active").then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(s => `${s.class}-${s.section || "A"}`))].sort();
        setClassOptions(unique);
        if (unique.length > 0) setSelectedClass(unique[0]);
      }
    });
    supabase.from("subjects").select("id, name").then(({ data }) => {
      if (data && data.length > 0) {
        setSubjects(data);
        setSelectedSubject(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const [cls, sec] = selectedClass.split("-");
    supabase.from("students").select("id, student_id, name").eq("class", cls).eq("section", sec || "A").eq("status", "Active").order("name").then(({ data }) => {
      if (data) {
        setStudents(data);
        const m: Record<string, string> = {};
        data.forEach(s => { m[s.id] = ""; });
        setMarks(m);
      }
    });
  }, [selectedClass]);

  const handleSave = async () => {
    if (!selectedSubject) { toast({ title: "Error", description: "Select a subject", variant: "destructive" }); return; }
    setSaving(true);
    const total = Number(totalMarks) || 100;
    const entries = students.filter(s => marks[s.id] !== "").map(s => {
      const obtained = Number(marks[s.id]) || 0;
      const pct = (obtained / total) * 100;
      let grade = "F";
      if (pct >= 90) grade = "A+";
      else if (pct >= 80) grade = "A";
      else if (pct >= 70) grade = "B";
      else if (pct >= 60) grade = "C";
      else if (pct >= 50) grade = "D";
      return {
        student_id: s.id,
        subject_id: selectedSubject,
        exam_type: examType,
        term,
        total_marks: total,
        obtained_marks: obtained,
        grade,
      };
    });
    if (entries.length === 0) { toast({ title: "Error", description: "Enter marks for at least one student", variant: "destructive" }); setSaving(false); return; }
    const { error } = await supabase.from("test_results").insert(entries);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: `Results saved for ${entries.length} students.` });
  };

  return (
    <TeacherLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Enter Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add monthly test, term or annual results</p>
      </div>

      <Card className="mb-6 shadow-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Exam Type</Label>
              <Select value={examType} onValueChange={v => { setExamType(v); setTerm(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total Marks</Label>
              <Input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Results"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Class {selectedClass} — Enter Marks</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No students in this class.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-32 text-center">Obtained Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0"
                        max={totalMarks}
                        className="mx-auto w-24 text-center"
                        value={marks[s.id] || ""}
                        onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="0"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TeacherLayout>
  );
};

export default TeacherResults;
