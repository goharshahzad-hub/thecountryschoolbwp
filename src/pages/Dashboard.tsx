import DashboardLayout from "@/components/DashboardLayout";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, TrendingDown, UserPlus, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const stats = [
  { label: "Total Students", value: "487", icon: Users, change: "+12", trend: "up" as const, color: "bg-primary/10 text-primary" },
  { label: "Total Teachers", value: "38", icon: GraduationCap, change: "+3", trend: "up" as const, color: "bg-secondary/10 text-secondary" },
  { label: "Active Classes", value: "24", icon: BookOpen, change: "0", trend: "up" as const, color: "bg-accent/10 text-accent-foreground" },
  { label: "Fee Collection", value: "₨ 2.4M", icon: DollarSign, change: "+8%", trend: "up" as const, color: "bg-success/10 text-success" },
];

const attendanceData = [
  { month: "Jan", present: 92, absent: 8 },
  { month: "Feb", present: 88, absent: 12 },
  { month: "Mar", present: 95, absent: 5 },
  { month: "Apr", present: 90, absent: 10 },
  { month: "May", present: 87, absent: 13 },
  { month: "Jun", present: 93, absent: 7 },
];

const classDistribution = [
  { name: "Pre-School", value: 65 },
  { name: "Primary", value: 180 },
  { name: "Middle", value: 142 },
  { name: "High", value: 100 },
];

const COLORS = ["hsl(356, 72%, 48%)", "hsl(220, 65%, 42%)", "hsl(38, 92%, 55%)", "hsl(152, 60%, 42%)"];

const recentActivities = [
  { icon: UserPlus, text: "New student Ahmed Khan enrolled in Class 5", time: "2 hours ago" },
  { icon: ClipboardCheck, text: "Attendance marked for Class 10-A", time: "3 hours ago" },
  { icon: DollarSign, text: "Fee payment received from 15 students", time: "5 hours ago" },
  { icon: GraduationCap, text: "New teacher Ms. Fatima joined Science dept.", time: "1 day ago" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back — here's what's happening at The Country School</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Monthly Attendance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="present" fill="hsl(220, 65%, 42%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="hsl(356, 72%, 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Students by Section</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={classDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {classDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="flex flex-wrap justify-center gap-3 px-4 pb-4">
            {classDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {item.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <activity.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;
