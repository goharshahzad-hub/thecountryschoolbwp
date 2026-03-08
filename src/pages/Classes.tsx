import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User } from "lucide-react";

const classesData = [
  { name: "Class 5-A", teacher: "Mr. Asad Ullah", students: 32, room: "Room 101", section: "Primary" },
  { name: "Class 5-B", teacher: "Ms. Sana Fatima", students: 30, room: "Room 102", section: "Primary" },
  { name: "Class 6-A", teacher: "Ms. Hira Naz", students: 28, room: "Room 201", section: "Middle" },
  { name: "Class 7-A", teacher: "Mr. Kamran Ali", students: 35, room: "Room 202", section: "Middle" },
  { name: "Class 7-B", teacher: "Ms. Rabia Kiran", students: 33, room: "Room 203", section: "Middle" },
  { name: "Class 8-A", teacher: "Mr. Farooq Ahmed", students: 30, room: "Room 301", section: "Middle" },
  { name: "Class 9-A", teacher: "Mr. Asad Ullah", students: 38, room: "Room 302", section: "High" },
  { name: "Class 9-B", teacher: "Ms. Sana Fatima", students: 36, room: "Room 303", section: "High" },
  { name: "Class 10-A", teacher: "Mr. Kamran Ali", students: 34, room: "Room 401", section: "High" },
  { name: "Class 10-B", teacher: "Ms. Rabia Kiran", students: 32, room: "Room 402", section: "High" },
];

const sectionColors: Record<string, string> = {
  Primary: "bg-accent/10 text-accent-foreground border-accent/30",
  Middle: "bg-secondary/10 text-secondary border-secondary/30",
  High: "bg-primary/10 text-primary border-primary/30",
};

const Classes = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Classes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of all active classes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classesData.map((c, i) => (
          <Card key={i} className="shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground">{c.name}</h3>
                <Badge variant="outline" className={sectionColors[c.section]}>{c.section}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Class Teacher: <span className="text-foreground">{c.teacher}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span><span className="text-foreground font-medium">{c.students}</span> students</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.room}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Classes;
