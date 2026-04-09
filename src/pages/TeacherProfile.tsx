import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Camera, Save, BookOpen, GraduationCap } from "lucide-react";

const TeacherProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "", photo_url: "" });
  const [teacherData, setTeacherData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: prof }, { data: teacher }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("teachers").select("*").eq("phone", user.user_metadata?.phone || user.email || "").maybeSingle(),
      ]);

      // Also try matching by name if phone didn't match
      let tData = teacher;
      if (!tData && prof) {
        const { data: t2 } = await supabase.from("teachers").select("*").ilike("name", `%${prof.full_name}%`).maybeSingle();
        tData = t2;
      }

      if (prof) {
        setProfile({ full_name: prof.full_name, phone: prof.phone || "", photo_url: "" });
        setEditForm({ full_name: prof.full_name, phone: prof.phone || "" });
      }
      if (tData) {
        setTeacherData(tData);
        if (tData.photo_url) setProfile(p => ({ ...p, photo_url: tData.photo_url }));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `teacher-photos/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    setProfile(p => ({ ...p, photo_url: urlData.publicUrl }));
    if (teacherData) {
      await supabase.from("teachers").update({ photo_url: urlData.publicUrl }).eq("id", teacherData.id);
    }
    toast({ title: "Photo updated!" });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: editForm.full_name,
      phone: editForm.phone,
    }).eq("user_id", user.id);
    setProfile(p => ({ ...p, full_name: editForm.full_name, phone: editForm.phone }));
    setEditing(false);
    setSaving(false);
    toast({ title: "Profile updated!" });
  };

  if (loading) return <TeacherLayout><p className="text-center py-12 text-muted-foreground">Loading...</p></TeacherLayout>;

  return (
    <TeacherLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and update your profile information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="shadow-card lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6">
            <div className="relative mb-4">
              <Avatar className="h-28 w-28 border-4 border-primary/20">
                <AvatarImage src={profile.photo_url || teacherData?.photo_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {profile.full_name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                <Camera className="h-4 w-4" />
                <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </Label>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile.phone && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{profile.phone}</p>}
            <p className="mt-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Teacher</p>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Profile Details</CardTitle>
            {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>}
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-primary-foreground">
                    <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={User} label="Full Name" value={profile.full_name} />
                <InfoRow icon={Mail} label="Email" value={user?.email || "—"} />
                <InfoRow icon={Phone} label="Phone" value={profile.phone || "—"} />
                {teacherData && (
                  <>
                    <InfoRow icon={GraduationCap} label="Teacher ID" value={teacherData.teacher_id} />
                    <InfoRow icon={BookOpen} label="Subject" value={teacherData.subject} />
                    <InfoRow icon={BookOpen} label="Classes" value={teacherData.classes} />
                    <InfoRow icon={User} label="Qualification" value={teacherData.qualification || "—"} />
                    <InfoRow icon={User} label="CNIC" value={teacherData.cnic || "—"} />
                    <InfoRow icon={User} label="Address" value={teacherData.address || "—"} />
                    <InfoRow icon={User} label="Joining Date" value={teacherData.joining_date || "—"} />
                    <InfoRow icon={User} label="Status" value={teacherData.status} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-md border border-border p-3">
    <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default TeacherProfile;
