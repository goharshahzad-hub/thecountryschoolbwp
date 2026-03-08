import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download } from "lucide-react";

const studentsData = [
  { id: "TCS-001", name: "Ahmed Khan", class: "10-A", father: "Muhammad Khan", phone: "0322-6107001", status: "Active", fee: "Paid" },
  { id: "TCS-002", name: "Fatima Ali", class: "9-B", father: "Ali Raza", phone: "0322-6107002", status: "Active", fee: "Pending" },
  { id: "TCS-003", name: "Usman Tariq", class: "8-A", father: "Tariq Mahmood", phone: "0322-6107003", status: "Active", fee: "Paid" },
  { id: "TCS-004", name: "Ayesha Noor", class: "7-B", father: "Noor Ahmed", phone: "0322-6107004", status: "Active", fee: "Paid" },
  { id: "TCS-005", name: "Hassan Raza", class: "10-A", father: "Raza Hussain", phone: "0322-6107005", status: "Inactive", fee: "Overdue" },
  { id: "TCS-006", name: "Zainab Bibi", class: "6-A", father: "Bibi Muhammad", phone: "0322-6107006", status: "Active", fee: "Paid" },
  { id: "TCS-007", name: "Bilal Ahmad", class: "5-B", father: "Ahmad Shah", phone: "0322-6107007", status: "Active", fee: "Pending" },
  { id: "TCS-008", name: "Maryam Iqbal", class: "10-B", father: "Iqbal Hussain", phone: "0322-6107008", status: "Active", fee: "Paid" },
];

const Students = () => {
  const [search, setSearch] = useState("");
  const filtered = studentsData.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all enrolled students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Student</Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, ID, or class..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.class}</TableCell>
                  <TableCell>{s.father}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "Active" ? "default" : "secondary"} className={s.status === "Active" ? "bg-success text-success-foreground" : ""}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      s.fee === "Paid" ? "border-success/30 text-success" :
                      s.fee === "Pending" ? "border-warning/30 text-warning" :
                      "border-destructive/30 text-destructive"
                    }>
                      {s.fee}
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

export default Students;
