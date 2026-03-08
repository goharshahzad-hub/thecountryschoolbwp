import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({
    school_name: "",
    campus: "",
    city: "",
    phone: "",
    email: "",
    address: "",
    motto: "",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("school_settings").select("*").limit(1).single();
      if (data) {
        setSettingsId(data.id);
        setForm({
          school_name: data.school_name,
          campus: data.campus,
          city: data.city,
          phone: data.phone,
          email: data.email,
          address: data.address,
          motto: data.motto,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase
      .from("school_settings")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", settingsId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading settings...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage school information</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={logo} alt="School logo" className="h-16 w-16 rounded-full object-cover shadow-card" />
              <div>
                <p className="font-medium text-foreground">{form.school_name}</p>
                <p className="text-sm text-muted-foreground">{form.campus}, {form.city}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input value={form.school_name} onChange={(e) => handleChange("school_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Campus</Label>
                <Input value={form.campus} onChange={(e) => handleChange("campus", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Motto / Tagline</Label>
                <Input value={form.motto} onChange={(e) => handleChange("motto", e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
