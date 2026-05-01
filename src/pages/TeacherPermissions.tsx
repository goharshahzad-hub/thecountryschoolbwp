import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SearchableCombobox from "@/components/SearchableCombobox";
import { ShieldCheck, Save, Users } from "lucide-react";

interface TeacherProfile {
  user_id: string;
  full_name: string;
  phone: string | null;
}

const PERMISSION_FIELDS: { key: string; label: string; group: string }[] = [
  { key: "can_view_students", label: "View Students", group: "Students" },
  { key: "can_view_all_classes", label: "View All Classes (not just own)", group: "Students" },
  { key: "can_view_attendance", label: "View Attendance", group: "Attendance" },
  { key: "can_enter_attendance", label: "Mark Attendance", group: "Attendance" },
  { key: "can_view_results", label: "View Results", group: "Results" },
  { key: "can_enter_results", label: "Enter Results", group: "Results" },
  { key: "can_view_diary", label: "View Diary", group: "Diary" },
  { key: "can_enter_diary", label: "Add Diary Entries", group: "Diary" },
  { key: "can_view_timetable", label: "View Timetable", group: "Other" },
  { key: "can_view_fees", label: "View Fees (read-only)", group: "Other" },
];

type PermRow = Record<string, boolean | string | null> & {
  id?: string;
  teacher_user_id: string | null;
  is_global_default: boolean;
};

const TeacherPermissions = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalRow, setGlobalRow] = useState<PermRow | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [teacherRow, setTeacherRow] = useState<PermRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    // teachers from profiles (role = teacher)
    const [{ data: profs }, { data: perms }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone").eq("role", "teacher").order("full_name"),
      supabase.from("teacher_permissions" as any).select("*"),
    ]);
    setTeachers(profs || []);
    const global = (perms || []).find((r: any) => r.is_global_default) || null;
    setGlobalRow(global as any);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Load per-teacher row when selection changes
  useEffect(() => {
    if (!selectedTeacher) { setTeacherRow(null); return; }
    (async () => {
      const { data } = await supabase
        .from("teacher_permissions" as any)
        .select("*")
        .eq("teacher_user_id", selectedTeacher)
        .maybeSingle();
      // If no row, fall back to copy of global
      if (!data && globalRow) {
        const seed: any = { ...globalRow };
        delete seed.id;
        seed.teacher_user_id = selectedTeacher;
        seed.is_global_default = false;
        setTeacherRow(seed);
      } else {
        setTeacherRow(data as any);
      }
    })();
  }, [selectedTeacher, globalRow]);

  const togglePerm = (row: PermRow | null, key: string) => {
    if (!row) return null;
    return { ...row, [key]: !row[key] };
  };

  const saveGlobal = async () => {
    if (!globalRow) return;
    setSaving(true);
    const payload: any = { ...globalRow };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = await supabase
      .from("teacher_permissions" as any)
      .update(payload)
      .eq("id", globalRow.id!);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Global defaults saved" });
  };

  const saveTeacher = async () => {
    if (!teacherRow || !selectedTeacher) return;
    setSaving(true);
    const payload: any = { ...teacherRow };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    payload.teacher_user_id = selectedTeacher;
    payload.is_global_default = false;

    let error;
    if (teacherRow.id) {
      ({ error } = await supabase
        .from("teacher_permissions" as any)
        .update(payload)
        .eq("id", teacherRow.id));
    } else {
      const { data, error: insErr } = await supabase
        .from("teacher_permissions" as any)
        .insert(payload)
        .select()
        .maybeSingle();
      error = insErr;
      if (data) setTeacherRow(data as any);
    }
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Teacher overrides saved" });
  };

  const resetTeacherToGlobal = async () => {
    if (!teacherRow?.id) {
      toast({ title: "Already using global defaults" });
      return;
    }
    if (!confirm("Remove this teacher's overrides and revert to global defaults?")) return;
    await supabase.from("teacher_permissions" as any).delete().eq("id", teacherRow.id);
    if (globalRow) {
      const seed: any = { ...globalRow };
      delete seed.id;
      seed.teacher_user_id = selectedTeacher;
      seed.is_global_default = false;
      setTeacherRow(seed);
    }
    toast({ title: "Reverted to global defaults" });
  };

  const renderCheckboxes = (row: PermRow | null, setter: (r: PermRow | null) => void) => {
    if (!row) return <p className="text-sm text-muted-foreground">Loading...</p>;
    const groups = Array.from(new Set(PERMISSION_FIELDS.map((f) => f.group)));
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g} className="rounded-md border border-border p-3">
            <p className="mb-2 font-display text-xs font-bold uppercase text-muted-foreground">{g}</p>
            <div className="space-y-2">
              {PERMISSION_FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={Boolean(row[f.key])}
                    onCheckedChange={() => setter(togglePerm(row, f.key))}
                    id={`perm-${f.key}`}
                  />
                  <Label htmlFor={`perm-${f.key}`} className="cursor-pointer text-sm font-normal">{f.label}</Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Teacher Access Control</h1>
          <p className="text-sm text-muted-foreground">Set global defaults that apply to all teachers, then override per-teacher when needed.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Global defaults */}
          <Card className="shadow-card border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="font-display text-lg">Global Defaults</CardTitle>
                <Badge variant="outline" className="text-xs">Applies to all teachers</Badge>
              </div>
              <Button onClick={saveGlobal} disabled={saving} className="gradient-primary text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />Save Global
              </Button>
            </CardHeader>
            <CardContent>{renderCheckboxes(globalRow, setGlobalRow)}</CardContent>
          </Card>

          {/* Per-teacher override */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">Per-Teacher Overrides</CardTitle>
              <p className="text-xs text-muted-foreground">Pick a teacher to fine-tune their access. Unchanged teachers use global defaults.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <Label className="text-xs">Select Teacher</Label>
                <SearchableCombobox
                  options={teachers.map((t) => ({
                    value: t.user_id,
                    label: t.full_name || "(no name)",
                    sublabel: t.phone || "",
                  }))}
                  value={selectedTeacher}
                  onChange={setSelectedTeacher}
                  placeholder="Search teacher by name or phone..."
                  emptyMessage="No teachers found"
                />
              </div>

              {selectedTeacher && (
                <>
                  {renderCheckboxes(teacherRow, setTeacherRow)}
                  <div className="flex gap-2">
                    <Button onClick={saveTeacher} disabled={saving} className="gradient-primary text-primary-foreground">
                      <Save className="mr-2 h-4 w-4" />Save Overrides
                    </Button>
                    <Button variant="outline" onClick={resetTeacherToGlobal}>Reset to Global</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherPermissions;
