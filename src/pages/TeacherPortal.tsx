import { useEffect, useState } from "react";
import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, BarChart3, FileBarChart, User, Phone, Mail, GraduationCap, BookOpen, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const cards = [
  { to: "/teacher-portal/profile", icon: User, label: "My Profile", desc: "View and update your biodata", color: "from-purple-500 to-pink-500" },
  { to: "/teacher-portal/attendance", icon: ClipboardCheck, label: "Mark Attendance", desc: "Daily attendance for your classes", color: "from-blue-500 to-cyan-500" },
  { to: "/teacher-portal/results", icon: BarChart3, label: "Enter Results", desc: "Monthly, term and annual results", color: "from-emerald-500 to-teal-500" },
  { to: "/teacher-portal/diary", icon: FileBarChart, label: "Diary / Homework", desc: "Add homework entries", color: "from-amber-500 to-orange-500" },
  { to: "/teacher-portal/attendance-report", icon: FileBarChart, label: "Attendance Report", desc: "Monthly attendance percentages", color: "from-rose-500 to-red-500" },
];

const TeacherPortal = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState({ students: 0, todayPresent: 0, todayAbsent: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const [{ data: prof }, { data: studentsCount }, { data: att }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("students").select("id", { count: "exact" }),
        supabase.from("attendance_records").select("status").eq("date", today),
      ]);
      setProfile(prof);
      const { data: t } = await supabase
        .from("teachers")
        .select("*")
        .ilike("name", `%${prof?.full_name || ""}%`)
        .maybeSingle();
      setTeacher(t);
      const present = (att || []).filter((a: any) => a.status === "present").length;
      const absent = (att || []).filter((a: any) => a.status === "absent").length;
      setStats({ students: (studentsCount as any)?.length || 0, todayPresent: present, todayAbsent: absent });
    })();
  }, [user]);

  return (
    <TeacherLayout>
      {/* Hero / Profile banner */}
      <div className="relative mb-6 overflow-hidden rounded-xl gradient-primary p-6 text-primary-foreground shadow-elevated">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <Sparkles className="h-full w-full" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border-4 border-white/30">
            <AvatarImage src={teacher?.photo_url} />
            <AvatarFallback className="bg-white/20 text-2xl font-bold">
              {(profile?.full_name || "T").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm opacity-90">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{profile?.full_name || "Teacher"}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {teacher?.teacher_id && <Badge className="bg-white/20 hover:bg-white/30 border-0">{teacher.teacher_id}</Badge>}
              {teacher?.subject && <Badge className="bg-white/20 hover:bg-white/30 border-0"><BookOpen className="mr-1 h-3 w-3" />{teacher.subject}</Badge>}
              {teacher?.classes && <Badge className="bg-white/20 hover:bg-white/30 border-0"><GraduationCap className="mr-1 h-3 w-3" />{teacher.classes}</Badge>}
              {profile?.phone && <Badge className="bg-white/20 hover:bg-white/30 border-0"><Phone className="mr-1 h-3 w-3" />{profile.phone}</Badge>}
              {user?.email && <Badge className="bg-white/20 hover:bg-white/30 border-0"><Mail className="mr-1 h-3 w-3" />{user.email}</Badge>}
            </div>
          </div>
          <Link to="/teacher-portal/profile">
            <Button variant="secondary" size="sm" className="bg-white/95 text-primary hover:bg-white">
              View Full Profile <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Students</p>
              <p className="font-display text-3xl font-bold text-foreground">{stats.students || "—"}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><User className="h-6 w-6 text-primary" /></div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-success">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Present Today</p>
              <p className="font-display text-3xl font-bold text-success">{stats.todayPresent}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><ClipboardCheck className="h-6 w-6 text-success" /></div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-destructive">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Absent Today</p>
              <p className="font-display text-3xl font-bold text-destructive">{stats.todayAbsent}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"><Calendar className="h-6 w-6 text-destructive" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Action cards with gradient accents */}
      <h2 className="mb-3 font-display text-lg font-bold text-foreground">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="group shadow-card transition-all hover:shadow-elevated hover:-translate-y-1 cursor-pointer overflow-hidden">
              <CardContent className="relative p-0">
                <div className={`bg-gradient-to-br ${c.color} p-4`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <c.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{c.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                  <div className="mt-3 flex items-center text-xs font-medium text-primary">Open <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </TeacherLayout>
  );
};

export default TeacherPortal;
