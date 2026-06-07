import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { AdminGuard } from "@/components/AdminGuard";
import { Construction, Hammer, Wrench, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const upcomingFeatures = [
  { title: "Online Fee Payment Gateway", desc: "Allow parents to pay fees directly through the portal using debit/credit cards or bank transfer.", status: "Planning" },
  { title: "Mobile App (Android & iOS)", desc: "Native mobile apps for parents and teachers with push notifications.", status: "Planning" },
  { title: "Library Management Module", desc: "Track book inventory, issue/return records, and reading history per student.", status: "Coming Soon" },
  { title: "Transport / Bus Tracking", desc: "Live bus tracking and route management for parents.", status: "Coming Soon" },
  { title: "Examination & Grading System", desc: "Comprehensive exam scheduling, grade books and automated report cards.", status: "In Progress" },
  { title: "Inventory & Asset Management", desc: "Track school assets, stationery, and lab equipment.", status: "Planning" },
  { title: "SMS Gateway Integration", desc: "Send fee reminders, attendance alerts, and announcements via SMS.", status: "Planning" },
  { title: "Parent–Teacher Chat", desc: "Secure in-app messaging between parents and teachers.", status: "In Progress" },
];

const statusColor = (s: string) =>
  s === "In Progress" ? "bg-primary/10 text-primary border-primary/30"
  : s === "Coming Soon" ? "bg-warning/10 text-warning border-warning/30"
  : "bg-muted text-muted-foreground border-border";

const UnderConstruction = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="md:ml-64">
          <DashboardHeader title="App Under Construction" onMenuClick={() => setMobileOpen(true)} />
          <main className="p-4 md:p-8">
            <Card className="p-6 md:p-10 mb-6 bg-gradient-to-br from-primary/5 via-background to-warning/5 border-primary/20">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex gap-3">
                  <Construction className="h-12 w-12 text-primary animate-pulse" />
                  <Hammer className="h-12 w-12 text-warning" />
                  <Wrench className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-display">App Under Construction</h1>
                <p className="text-muted-foreground max-w-2xl">
                  We are continuously improving The Country School management system. Below are the modules and features
                  currently in development or planned for upcoming releases.
                </p>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Clock className="h-3 w-3 mr-1" /> Active development in progress
                </Badge>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {upcomingFeatures.map((f) => (
                <Card key={f.title} className="p-5 hover:shadow-elevated transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-base">{f.title}</h3>
                    <Badge variant="outline" className={statusColor(f.status)}>{f.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </Card>
              ))}
            </div>

            <Card className="p-6 mt-6 bg-muted/30">
              <p className="text-sm text-muted-foreground text-center">
                Have a feature request? Contact the developer or use the Settings page to submit suggestions.
              </p>
            </Card>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
};

export default UnderConstruction;
