import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";

const teachersData = [
  { id: "TCH-001", name: "Mr. Asad Ullah", subject: "Mathematics", classes: "9-A, 10-A, 10-B", phone: "0321-4567890", qualification: "M.Sc Mathematics", status: "Active" },
  { id: "TCH-002", name: "Ms. Sana Fatima", subject: "English", classes: "8-A, 8-B, 9-B", phone: "0333-1234567", qualification: "M.A English", status: "Active" },
  { id: "TCH-003", name: "Mr. Kamran Ali", subject: "Physics", classes: "9-A, 10-A", phone: "0345-9876543", qualification: "M.Sc Physics", status: "Active" },
  { id: "TCH-004", name: "Ms. Hira Naz", subject: "Urdu", classes: "6-A, 7-A, 7-B", phone: "0300-1122334", qualification: "M.A Urdu", status: "On Leave" },
  { id: "TCH-005", name: "Mr. Farooq Ahmed", subject: "Computer Science", classes: "8-A, 9-A, 10-A", phone: "0312-5566778", qualification: "BS Computer Science", status: "Active" },
  { id: "TCH-006", name: "Ms. Rabia Kiran", subject: "Biology", classes: "9-B, 10-B", phone: "0322-8899001", qualification: "M.Sc Biology", status: "Active" },
];

const Teachers = () => {
  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage faculty members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachersData.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.classes}</TableCell>
                  <TableCell className="text-muted-foreground">{t.phone}</TableCell>
                  <TableCell className="text-xs">{t.qualification}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "Active" ? "default" : "secondary"} className={t.status === "Active" ? "bg-success text-success-foreground" : ""}>
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Teachers;
