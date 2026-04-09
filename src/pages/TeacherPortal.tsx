import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, BarChart3, FileBarChart } from "lucide-react";
import { Link } from "react-router-dom";

import { User } from "lucide-react";

const cards = [
  { to: "/teacher-portal/profile", icon: User, label: "My Profile", desc: "View and update your profile & biodata" },
  { to: "/teacher-portal/attendance", icon: ClipboardCheck, label: "Mark Attendance", desc: "Record daily attendance for your classes" },
  { to: "/teacher-portal/results", icon: BarChart3, label: "Enter Results", desc: "Add monthly, term and annual results" },
  { to: "/teacher-portal/diary", icon: FileBarChart, label: "Diary / Homework", desc: "Add homework entries for your classes" },
  { to: "/teacher-portal/attendance-report", icon: FileBarChart, label: "Attendance Report", desc: "View monthly attendance percentages" },
];

const TeacherPortal = () => (
  <TeacherLayout>
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Teacher Portal</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome! Select a task below.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(c => (
        <Link key={c.to} to={c.to}>
          <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <c.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  </TeacherLayout>
);

export default TeacherPortal;
