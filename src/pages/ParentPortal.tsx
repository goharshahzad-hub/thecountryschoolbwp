import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import logo from "@/assets/logo.jpg";
import { LogOut, User, GraduationCap, ClipboardCheck, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  section: string | null;
  status: string;
  fee_status: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  student_id: string;
}

const ParentPortal = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/parent-login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Fetch profile
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfileName(data.full_name || user.email || "");
        });

      // Fetch children
      supabase
        .from("students")
        .select("*")
        .eq("parent_user_id", user.id)
        .then(({ data }) => {
          if (data) {
            setStudents(data);
            // Fetch attendance for all children
            const studentIds = data.map(s => s.id);
            if (studentIds.length > 0) {
              supabase
                .from("attendance_records")
                .select("*")
                .in("student_id", studentIds)
                .order("date", { ascending: false })
                .limit(30)
                .then(({ data: attData }) => {
                  if (attData) setAttendance(attData);
                });
            }
          }
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-9 w-9 rounded-full object-cover" />
            <div>
              <p className="font-display text-sm font-bold text-foreground">Parent Portal</p>
              <p className="text-[10px] text-muted-foreground">The Country School</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{profileName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome, {profileName || "Parent"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">View your children's academic information</p>
        </div>

        {students.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">No Students Linked</h3>
              <p className="text-center text-sm text-muted-foreground max-w-md">
                Your account hasn't been linked to any students yet. Please contact the school administration to link your children to your account.
              </p>
              <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>📞 +92 322 6107000</p>
                <p>📧 thecountryschoolbwp@gmail.com</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{students.length}</p>
                    <p className="text-xs text-muted-foreground">Children Enrolled</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <ClipboardCheck className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {attendance.filter(a => a.status === "present").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Days Present (Recent)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {[...new Set(students.map(s => s.class))].length}
                    </p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Children List */}
            <Card className="mb-6 shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Your Children</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fee Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.class}-{s.section}</TableCell>
                        <TableCell>
                          <Badge variant="default" className={s.status === "Active" ? "bg-success text-success-foreground" : ""}>{s.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            s.fee_status === "Paid" ? "border-success/30 text-success" :
                            s.fee_status === "Pending" ? "border-warning/30 text-warning" :
                            "border-destructive/30 text-destructive"
                          }>{s.fee_status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            {attendance.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map(a => {
                        const student = students.find(s => s.id === a.student_id);
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{new Date(a.date).toLocaleDateString("en-PK")}</TableCell>
                            <TableCell className="font-medium">{student?.name || "Unknown"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                a.status === "present" ? "border-success/30 text-success" :
                                a.status === "absent" ? "border-destructive/30 text-destructive" :
                                "border-warning/30 text-warning"
                              }>{a.status}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to school website
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ParentPortal;
