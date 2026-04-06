import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Status = "present" | "absent" | "late";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  whatsapp: string | null;
  phone: string | null;
}

interface ClassOption {
  label: string;
  class: string;
  section: string;
}

export function useAttendance() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateString = selectedDate.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  const isToday = dateString === today;

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("id, student_id, name, class, section, whatsapp, phone")
        .eq("status", "Active")
        .order("name");
      if (data) {
        setStudents(data);
        const uniqueClasses = [...new Set(data.map(s => `${s.class}-${s.section || "A"}`))].sort();
        const options = uniqueClasses.map(c => {
          const [cls, sec] = c.split("-");
          return { label: c, class: cls, section: sec };
        });
        setClassOptions(options);
        if (options.length > 0) setSelectedClass(options[0].label);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => `${s.class}-${s.section || "A"}` === selectedClass);

  useEffect(() => {
    if (!selectedClass || filteredStudents.length === 0) return;
    const fetchAttendance = async () => {
      const ids = filteredStudents.map(s => s.id);
      const { data } = await supabase
        .from("attendance_records")
        .select("id, student_id, status")
        .eq("date", dateString)
        .in("student_id", ids);
      const existing: Record<string, string> = {};
      const att: Record<string, Status> = {};
      if (data) {
        data.forEach(r => { existing[r.student_id] = r.id; att[r.student_id] = r.status as Status; });
      }
      filteredStudents.forEach(s => { if (!att[s.id]) att[s.id] = "present"; });
      setAttendance(att);
      setExistingRecords(existing);
      setSelectedIds(new Set());
      setEditingId(null);
      setSaved(Object.keys(existing).length > 0);
    };
    fetchAttendance();
  }, [selectedClass, students, dateString]);

  const toggleStatus = useCallback((studentId: string) => {
    setAttendance(prev => {
      const order: Status[] = ["present", "absent", "late"];
      const next = order[(order.indexOf(prev[studentId]) + 1) % 3];
      return { ...prev, [studentId]: next };
    });
  }, []);

  const setStatusForStudent = useCallback((studentId: string, status: Status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map(s => s.id))
    );
  }, [filteredStudents]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const updates = filteredStudents.map(async (s) => {
      const status = attendance[s.id] || "present";
      if (existingRecords[s.id]) {
        return supabase.from("attendance_records").update({ status }).eq("id", existingRecords[s.id]);
      } else {
        return supabase.from("attendance_records").insert({ student_id: s.id, date: dateString, status });
      }
    });
    await Promise.all(updates);
    const ids = filteredStudents.map(s => s.id);
    const { data } = await supabase.from("attendance_records").select("id, student_id, status").eq("date", dateString).in("student_id", ids);
    if (data) {
      const existing: Record<string, string> = {};
      data.forEach(r => { existing[r.student_id] = r.id; });
      setExistingRecords(existing);
    }
    setSaving(false);
    setSaved(true);
    toast({ title: "Saved", description: `Attendance saved for ${dateString}.` });
  }, [filteredStudents, attendance, existingRecords, dateString, toast]);

  const handleDeleteSingle = useCallback(async (studentId: string) => {
    const recordId = existingRecords[studentId];
    if (!recordId) {
      toast({ title: "No Record", description: "No saved attendance record for this student.", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this attendance record?")) return;
    const { error } = await supabase.from("attendance_records").delete().eq("id", recordId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setExistingRecords(prev => { const next = { ...prev }; delete next[studentId]; return next; });
    setAttendance(prev => ({ ...prev, [studentId]: "present" }));
    toast({ title: "Deleted", description: "Attendance record removed." });
  }, [existingRecords, toast]);

  const handleEditSave = useCallback(async (studentId: string) => {
    const recordId = existingRecords[studentId];
    if (!recordId) return;
    const status = attendance[studentId];
    const { error } = await supabase.from("attendance_records").update({ status }).eq("id", recordId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEditingId(null);
    toast({ title: "Updated", description: `Attendance updated to ${status}.` });
  }, [existingRecords, attendance, toast]);

  const handleBulkDelete = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds).filter(id => existingRecords[id]);
    if (idsToDelete.length === 0) {
      toast({ title: "No Records", description: "No saved attendance records for selected students.", variant: "destructive" });
      return;
    }
    if (!confirm(`Delete attendance for ${idsToDelete.length} student(s)?`)) return;
    const recordIds = idsToDelete.map(id => existingRecords[id]);
    const { error } = await supabase.from("attendance_records").delete().in("id", recordIds);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setExistingRecords(prev => {
      const next = { ...prev };
      idsToDelete.forEach(id => delete next[id]);
      return next;
    });
    setAttendance(prev => {
      const next = { ...prev };
      idsToDelete.forEach(id => { next[id] = "present"; });
      return next;
    });
    setSelectedIds(new Set());
    toast({ title: "Deleted", description: `${idsToDelete.length} record(s) removed.` });
  }, [selectedIds, existingRecords, toast]);

  const handleBulkSetStatus = useCallback((status: Status) => {
    const newAtt = { ...attendance };
    selectedIds.forEach(id => { newAtt[id] = status; });
    setAttendance(newAtt);
    toast({ title: "Updated", description: `${selectedIds.size} student(s) marked as ${status}.` });
  }, [selectedIds, attendance, toast]);

  const counts = {
    present: Object.values(attendance).filter(v => v === "present").length,
    absent: Object.values(attendance).filter(v => v === "absent").length,
    late: Object.values(attendance).filter(v => v === "late").length,
  };

  const absentStudents = filteredStudents.filter(s => attendance[s.id] === "absent");
  const lateStudents = filteredStudents.filter(s => attendance[s.id] === "late");

  return {
    students, filteredStudents, classOptions, selectedClass, setSelectedClass,
    attendance, existingRecords, loading, saving, saved, selectedIds, editingId,
    setEditingId, today: dateString, counts, absentStudents, lateStudents,
    toggleStatus, setStatusForStudent, toggleSelect, toggleSelectAll,
    handleSave, handleDeleteSingle, handleEditSave, handleBulkDelete, handleBulkSetStatus,
    setSelectedIds, selectedDate, setSelectedDate, isToday,
  };
}
