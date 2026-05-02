import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sortClasses } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Wand2, Save, AlertTriangle, CheckCircle, Eye, Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { printA4, downloadA4Pdf, schoolHeader, schoolFooter } from "@/lib/printUtils";

interface TeacherAssignment {
  id: string;
  teacherName: string;
  subject: string;
  periodsPerWeek: number;
  className: string;
  section: string;
}

interface GeneratedSlot {
  day: string;
  timeSlot: string;
  subject: string;
  teacherName: string;
  className: string;
  section: string;
}

interface Config {
  periodsPerDay: number;
  periodDuration: number;
  startTime: string;
  breakAfterPeriod: number;
  breakDuration: number;
  days: string[];
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const defaultConfig: Config = {
  periodsPerDay: 7,
  periodDuration: 40,
  startTime: "08:00",
  breakAfterPeriod: 3,
  breakDuration: 30,
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const generateTimeSlots = (config: Config): string[] => {
  const slots: string[] = [];
  const [startH, startM] = config.startTime.split(":").map(Number);
  let minutes = startH * 60 + startM;

  for (let i = 0; i < config.periodsPerDay; i++) {
    if (i === config.breakAfterPeriod) {
      minutes += config.breakDuration;
    }
    const startStr = `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
    minutes += config.periodDuration;
    const endStr = `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
    slots.push(`${startStr} - ${endStr}`);
  }
  return slots;
};

const autoGenerate = (assignments: TeacherAssignment[], config: Config): { slots: GeneratedSlot[]; conflicts: string[] } => {
  const timeSlots = generateTimeSlots(config);
  const days = config.days;
  const slots: GeneratedSlot[] = [];
  const conflicts: string[] = [];

  // Track teacher schedule: teacher -> day -> Set<timeSlot>
  const teacherSchedule: Record<string, Record<string, Set<string>>> = {};
  // Track class schedule: class-section -> day -> Set<timeSlot>
  const classSchedule: Record<string, Record<string, Set<string>>> = {};

  const getTeacherSched = (t: string) => {
    if (!teacherSchedule[t]) teacherSchedule[t] = {};
    return teacherSchedule[t];
  };

  const getClassSched = (cls: string) => {
    if (!classSchedule[cls]) classSchedule[cls] = {};
    return classSchedule[cls];
  };

  // Group assignments by class
  const byClass: Record<string, TeacherAssignment[]> = {};
  assignments.forEach(a => {
    const key = `${a.className}-${a.section}`;
    if (!byClass[key]) byClass[key] = [];
    byClass[key].push(a);
  });

  // For each class, distribute periods across the week
  for (const [classKey, classAssignments] of Object.entries(byClass)) {
    // Build a pool of (subject, teacher) repeated periodsPerWeek times
    const pool: { subject: string; teacher: string; assignment: TeacherAssignment }[] = [];
    classAssignments.forEach(a => {
      for (let i = 0; i < a.periodsPerWeek; i++) {
        pool.push({ subject: a.subject, teacher: a.teacherName, assignment: a });
      }
    });

    // Shuffle pool for randomness
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Try to place each period
    let poolIdx = 0;
    // Track how many times a subject appears per day for this class
    const subjectPerDay: Record<string, Record<string, number>> = {};

    for (const day of days) {
      if (!getClassSched(classKey)[day]) getClassSched(classKey)[day] = new Set();

      for (const timeSlot of timeSlots) {
        if (getClassSched(classKey)[day].has(timeSlot)) continue; // already filled
        if (poolIdx >= pool.length) break;

        // Try to find a suitable assignment from remaining pool
        let placed = false;
        for (let attempt = 0; attempt < pool.length - poolIdx; attempt++) {
          const idx = poolIdx + attempt;
          if (idx >= pool.length) break;
          const item = pool[idx];

          // Check teacher conflict
          const tSched = getTeacherSched(item.teacher);
          if (!tSched[day]) tSched[day] = new Set();
          if (tSched[day].has(timeSlot)) continue; // teacher busy

          // Check max 2 consecutive same subject per day
          if (!subjectPerDay[day]) subjectPerDay[day] = {};
          const subjectCount = subjectPerDay[day][item.subject] || 0;
          if (subjectCount >= 2) continue; // limit same subject per day

          // Place it
          slots.push({
            day,
            timeSlot,
            subject: item.subject,
            teacherName: item.teacher,
            className: item.assignment.className,
            section: item.assignment.section,
          });

          tSched[day].add(timeSlot);
          getClassSched(classKey)[day].add(timeSlot);
          subjectPerDay[day][item.subject] = subjectCount + 1;

          // Swap placed item to poolIdx position and advance
          [pool[poolIdx], pool[idx]] = [pool[idx], pool[poolIdx]];
          poolIdx++;
          placed = true;
          break;
        }

        if (!placed && poolIdx < pool.length) {
          // Force place even with conflict
          const item = pool[poolIdx];
          const tSched = getTeacherSched(item.teacher);
          if (!tSched[day]) tSched[day] = new Set();
          
          if (tSched[day].has(timeSlot)) {
            conflicts.push(`${item.teacher} double-booked on ${day} at ${timeSlot}`);
          }

          slots.push({
            day,
            timeSlot,
            subject: item.subject,
            teacherName: item.teacher,
            className: item.assignment.className,
            section: item.assignment.section,
          });

          tSched[day].add(timeSlot);
          getClassSched(classKey)[day].add(timeSlot);
          poolIdx++;
        }
      }
    }

    // If there are remaining unplaced periods
    if (poolIdx < pool.length) {
      conflicts.push(`${pool.length - poolIdx} periods for ${classKey} could not be scheduled (not enough slots)`);
    }
  }

  return { slots, conflicts };
};

const TimetableGenerator = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [generated, setGenerated] = useState<GeneratedSlot[]>([]);
  const [genConflicts, setGenConflicts] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"class" | "teacher">("class");
  const [selectedView, setSelectedView] = useState("");
  const [form, setForm] = useState({ teacherName: "", subject: "", periodsPerWeek: "4", className: "", section: "A" });

  // Fetch existing teachers and subjects for suggestions
  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("teachers").select("name").eq("status", "Active"),
      supabase.from("subjects").select("name"),
      supabase.from("classes").select("name, section"),
    ]).then(([t, s, c]) => {
      if (t.data) setTeacherNames([...new Set(t.data.map(x => x.name))]);
      if (s.data) setSubjectNames([...new Set(s.data.map(x => x.name))]);
      if (c.data) setClassNames([...new Set(c.data.map(x => x.name))].sort());
    });
  }, []);

  const addAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherName || !form.subject || !form.className) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    setAssignments(prev => [...prev, {
      id: crypto.randomUUID(),
      teacherName: form.teacherName,
      subject: form.subject,
      periodsPerWeek: parseInt(form.periodsPerWeek) || 4,
      className: form.className,
      section: form.section,
    }]);
    setForm({ ...form, subject: "", periodsPerWeek: "4" });
  };

  const removeAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleGenerate = () => {
    if (assignments.length === 0) {
      toast({ title: "No Assignments", description: "Add teacher-subject assignments first", variant: "destructive" });
      return;
    }
    const { slots, conflicts } = autoGenerate(assignments, config);
    setGenerated(slots);
    setGenConflicts(conflicts);
    if (conflicts.length > 0) {
      toast({ title: "Generated with Warnings", description: `${conflicts.length} conflict(s) auto-resolved`, variant: "destructive" });
    } else {
      toast({ title: "Timetable Generated!", description: `${slots.length} periods scheduled across ${[...new Set(assignments.map(a => `${a.className}-${a.section}`))].length} class(es)` });
    }
    // Auto-select first class/teacher view
    const classes = sortClasses([...new Set(slots.map(s => `${s.className}-${s.section}`))]);
    if (classes.length > 0) setSelectedView(classes[0]);
  };

  const handleSaveToDb = async () => {
    if (generated.length === 0) return;
    if (!confirm("This will REPLACE all existing timetable entries for the generated classes. Continue?")) return;
    setSaving(true);

    // Delete existing entries for generated classes
    const classKeys = [...new Set(generated.map(s => `${s.className}|||${s.section}`))];
    for (const key of classKeys) {
      const [cls, sec] = key.split("|||");
      await supabase.from("timetable_entries").delete().eq("class_name", cls).eq("section", sec);
    }

    // Insert new entries
    const rows = generated.map(s => ({
      class_name: s.className,
      section: s.section,
      day_of_week: s.day,
      time_slot: s.timeSlot,
      subject: s.subject,
      teacher_name: s.teacherName,
    }));

    const { error } = await supabase.from("timetable_entries").insert(rows);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved!", description: `${rows.length} timetable entries saved to database` });
  };

  const timeSlots = useMemo(() => generateTimeSlots(config), [config]);

  const viewOptions = useMemo(() => {
    if (viewMode === "class") {
      return sortClasses([...new Set(generated.map(s => `${s.className}-${s.section}`))]);
    }
    return [...new Set(generated.map(s => s.teacherName))].sort();
  }, [generated, viewMode]);

  const filteredSlots = useMemo(() => {
    if (!selectedView) return [];
    if (viewMode === "class") {
      return generated.filter(s => `${s.className}-${s.section}` === selectedView);
    }
    return generated.filter(s => s.teacherName === selectedView);
  }, [generated, selectedView, viewMode]);

  const getSlot = (time: string, day: string) => filteredSlots.find(s => s.timeSlot === time && s.day === day);

  const printTimetable = () => {
    if (!selectedView || filteredSlots.length === 0) return;
    const label = viewMode === "class" ? `Class ${selectedView}` : `Teacher: ${selectedView}`;
    const rows = timeSlots.map(time => {
      const cells = config.days.map(day => {
        const slot = getSlot(time, day);
        if (!slot) return `<td style="padding:6px;border:1px solid #333;text-align:center;color:#ccc;">—</td>`;
        return `<td style="padding:6px;border:1px solid #333;text-align:center;">
          <strong>${slot.subject}</strong>
          <br><span style="font-size:9px;color:#666;">${viewMode === "class" ? slot.teacherName : `${slot.className}-${slot.section}`}</span>
        </td>`;
      }).join("");
      return `<tr><td style="padding:6px;border:1px solid #333;font-weight:bold;white-space:nowrap;">${time}</td>${cells}</tr>`;
    }).join("");

    const html = `<div class="print-page">
      ${schoolHeader(`${label} — WEEKLY TIMETABLE`)}
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:6px;border:1px solid #333;">Time</th>
          ${config.days.map(d => `<th style="padding:6px;border:1px solid #333;">${d}</th>`).join("")}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${schoolFooter()}
    </div>`;
    printA4(html, `Timetable — ${label}`);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Smart Timetable Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure schedule parameters, add teacher assignments, and auto-generate conflict-free timetables</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Config Panel */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">⚙️ Schedule Config</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Periods/Day</Label>
                <Input type="number" min={1} max={12} value={config.periodsPerDay} onChange={e => setConfig({ ...config, periodsPerDay: parseInt(e.target.value) || 7 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" min={20} max={90} value={config.periodDuration} onChange={e => setConfig({ ...config, periodDuration: parseInt(e.target.value) || 40 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={config.startTime} onChange={e => setConfig({ ...config, startTime: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Break After</Label>
                <Input type="number" min={1} max={config.periodsPerDay} value={config.breakAfterPeriod} onChange={e => setConfig({ ...config, breakAfterPeriod: parseInt(e.target.value) || 3 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Break (min)</Label>
                <Input type="number" min={5} max={60} value={config.breakDuration} onChange={e => setConfig({ ...config, breakDuration: parseInt(e.target.value) || 30 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">School Days</Label>
              <div className="flex flex-wrap gap-1">
                {ALL_DAYS.map(day => (
                  <Badge
                    key={day}
                    variant={config.days.includes(day) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setConfig(c => ({
                        ...c,
                        days: c.days.includes(day)
                          ? c.days.filter(d => d !== day)
                          : [...c.days, day].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)),
                      }));
                    }}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              <p>📊 Time slots: {timeSlots.length} per day</p>
              <p>📅 Days: {config.days.length}</p>
              <p>⏰ {timeSlots[0]} → {timeSlots[timeSlots.length - 1]?.split(" - ")[1]}</p>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Panel */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">📝 Teacher-Subject Assignments ({assignments.length})</CardTitle>
            <div className="flex gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" />Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Add Assignment</DialogTitle></DialogHeader>
                  <form onSubmit={addAssignment} className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Teacher *</Label>
                      <Input list="teacher-list" placeholder="Teacher name" value={form.teacherName} onChange={e => setForm({ ...form, teacherName: e.target.value })} required />
                      <datalist id="teacher-list">{teacherNames.map(n => <option key={n} value={n} />)}</datalist>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subject *</Label>
                      <Input list="subject-list" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                      <datalist id="subject-list">{subjectNames.map(n => <option key={n} value={n} />)}</datalist>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Periods/Week</Label>
                      <Input type="number" min={1} max={config.periodsPerDay * config.days.length} value={form.periodsPerWeek} onChange={e => setForm({ ...form, periodsPerWeek: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Class *</Label>
                      <Input list="class-list" placeholder="e.g. 10" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} required />
                      <datalist id="class-list">{classNames.map(n => <option key={n} value={n} />)}</datalist>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Section</Label>
                      <Select value={form.section} onValueChange={v => setForm({ ...form, section: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Assignment</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleGenerate} disabled={assignments.length === 0}>
                <Wand2 className="mr-1 h-4 w-4" />Generate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            {assignments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Add teacher-subject assignments to generate a timetable</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Teacher</th>
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-left">Class</th>
                    <th className="p-2 text-center">Periods/Week</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr key={a.id} className="border-b border-border">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 font-medium">{a.teacherName}</td>
                      <td className="p-2">{a.subject}</td>
                      <td className="p-2">{a.className}-{a.section}</td>
                      <td className="p-2 text-center"><Badge variant="outline">{a.periodsPerWeek}</Badge></td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAssignment(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated Timetable */}
      {generated.length > 0 && (
        <div className="mt-6">
          {genConflicts.length > 0 && (
            <Card className="mb-4 border-warning/50 shadow-card">
              <CardContent className="flex items-start gap-2 p-4">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning">Auto-Resolved Conflicts</p>
                  <ul className="mt-1 text-xs text-muted-foreground">
                    {genConflicts.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Generated Timetable ({generated.length} periods)
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Tabs value={viewMode} onValueChange={v => { setViewMode(v as "class" | "teacher"); setSelectedView(""); }}>
                  <TabsList className="h-8">
                    <TabsTrigger value="class" className="text-xs">Class View</TabsTrigger>
                    <TabsTrigger value="teacher" className="text-xs">Teacher View</TabsTrigger>
                  </TabsList>
                </Tabs>
                {viewOptions.length > 0 && (
                  <Select value={selectedView} onValueChange={setSelectedView}>
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder={`Select ${viewMode}`} /></SelectTrigger>
                    <SelectContent>
                      {viewOptions.map(o => (
                        <SelectItem key={o} value={o}>{viewMode === "class" ? `Class ${o}` : o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" onClick={printTimetable} disabled={!selectedView}>
                  <Printer className="mr-1 h-3.5 w-3.5" />Print
                </Button>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleSaveToDb} disabled={saving}>
                  <Save className="mr-1 h-3.5 w-3.5" />{saving ? "Saving..." : "Save to Database"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {!selectedView ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Select a {viewMode} to view the timetable</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="p-3 text-left font-semibold">Time</th>
                      {config.days.map(d => (
                        <th key={d} className="p-3 text-center font-semibold">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-3 font-medium text-muted-foreground whitespace-nowrap text-xs">{time}</td>
                        {config.days.map(day => {
                          const slot = getSlot(time, day);
                          return (
                            <td key={day} className="p-2 text-center">
                              {slot ? (
                                <div className="rounded bg-primary/10 p-1.5">
                                  <p className="text-xs font-semibold text-foreground">{slot.subject}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {viewMode === "class" ? slot.teacherName : `${slot.className}-${slot.section}`}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TimetableGenerator;
