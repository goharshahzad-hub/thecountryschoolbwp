import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWebsiteContent, StatItem, FeatureItem, GalleryItem, SocialLinks, BannerSettings } from "@/hooks/useWebsiteContent";
import { Pencil, Plus, Trash2 } from "lucide-react";
import GalleryManager from "@/components/GalleryManager";
import logo from "@/assets/logo.jpg";

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({
    school_name: "", campus: "", city: "", phone: "", email: "", address: "", motto: "",
  });

  const { content, updateSection, loading: contentLoading } = useWebsiteContent();
  const [heroTagline, setHeroTagline] = useState("");
  const [aboutHeading, setAboutHeading] = useState("");
  const [aboutSubheading, setAboutSubheading] = useState("");
  const [stats, setStats] = useState<StatItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [banner, setBanner] = useState<BannerSettings>({ text: "", enabled: true });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: { url: "", handle: "" },
    instagram: { url: "", handle: "" },
    youtube: { url: "", handle: "" },
    tiktok: { url: "", handle: "" },
  });
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    if (!contentLoading) {
      setHeroTagline(content.hero.tagline);
      setAboutHeading(content.about.heading);
      setAboutSubheading(content.about.subheading);
      setStats([...content.stats]);
      setFeatures([...content.features]);
      setGallery([...content.gallery]);
      setBanner(content.banner ? { ...content.banner } : { text: "", enabled: true });
      setSocialLinks({ ...content.social_links });
    }
  }, [contentLoading, content]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("school_settings").select("*").limit(1).single();
      if (data) {
        setSettingsId(data.id);
        setForm({
          school_name: data.school_name, campus: data.campus, city: data.city,
          phone: data.phone, email: data.email, address: data.address, motto: data.motto,
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase.from("school_settings")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", settingsId);
    setSaving(false);
    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Settings saved!");
  };

  const handleSaveContent = async () => {
    setSavingContent(true);
    const results = await Promise.all([
      updateSection("hero", { tagline: heroTagline }),
      updateSection("about", { heading: aboutHeading, subheading: aboutSubheading }),
      updateSection("stats", stats),
      updateSection("features", features),
      updateSection("gallery", gallery),
      updateSection("social_links", socialLinks),
      updateSection("banner", banner),
    ]);
    setSavingContent(false);
    if (results.some(e => e)) toast.error("Failed to save some content");
    else toast.success("Website content saved!");
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    setStats(updated);
  };

  const updateFeature = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  if (loading) {
    return <DashboardLayout><p className="text-muted-foreground">Loading settings...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage school information & website content</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* School Info */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display">School Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={logo} alt="School logo" className="h-16 w-16 rounded-full object-cover shadow-card" />
              <div>
                <p className="font-medium text-foreground">{form.school_name}</p>
                <p className="text-sm text-muted-foreground">{form.campus}, {form.city}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>School Name</Label><Input value={form.school_name} onChange={e => handleChange("school_name", e.target.value)} /></div>
              <div className="space-y-2"><Label>Campus</Label><Input value={form.campus} onChange={e => handleChange("campus", e.target.value)} /></div>
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={e => handleChange("city", e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => handleChange("phone", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input value={form.email} onChange={e => handleChange("email", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => handleChange("address", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Motto / Tagline</Label><Input value={form.motto} onChange={e => handleChange("motto", e.target.value)} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? "Saving..." : "Save School Info"}
            </Button>
          </CardContent>
        </Card>

        {/* Scrolling Banner */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display">Scrolling Banner</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Enabled</Label>
              <input type="checkbox" checked={banner.enabled} onChange={e => setBanner(prev => ({ ...prev, enabled: e.target.checked }))} className="h-4 w-4 rounded border-input accent-primary" />
            </div>
            <div className="space-y-2">
              <Label>Banner Text</Label>
              <Textarea value={banner.text} onChange={e => setBanner(prev => ({ ...prev, text: e.target.value }))} rows={3} placeholder="Scrolling text that appears at the top of the website" />
            </div>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display">Hero Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hero Tagline</Label>
              <Textarea value={heroTagline} onChange={e => setHeroTagline(e.target.value)} rows={3} placeholder="Shown below school name on homepage" />
            </div>
          </CardContent>
        </Card>

        {/* About / Features Heading */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display">About Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Heading</Label><Input value={aboutHeading} onChange={e => setAboutHeading(e.target.value)} /></div>
              <div className="space-y-2"><Label>Subheading</Label><Input value={aboutSubheading} onChange={e => setAboutSubheading(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Stats (Homepage)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setStats([...stats, { value: "0", label: "New Stat" }])}>
              <Plus className="mr-1 h-4 w-4" />Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.map((s, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input value={s.value} onChange={e => updateStat(i, "value", e.target.value)} placeholder="500+" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input value={s.label} onChange={e => updateStat(i, "label", e.target.value)} placeholder="Students Enrolled" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Features (Homepage)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setFeatures([...features, { title: "New Feature", desc: "Description", icon: "GraduationCap" }])}>
              <Plus className="mr-1 h-4 w-4" />Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="rounded-md border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Feature {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFeatures(features.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={f.title} onChange={e => updateFeature(i, "title", e.target.value)} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Icon</Label>
                    <Input value={f.icon} onChange={e => updateFeature(i, "icon", e.target.value)} placeholder="GraduationCap, Users, BookOpen, Trophy, Shield, Clock" />
                  </div>
                  <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Description</Label><Textarea value={f.desc} onChange={e => updateFeature(i, "desc", e.target.value)} rows={2} /></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gallery */}
        <GalleryManager gallery={gallery} setGallery={setGallery} />

        {/* Social Media Links */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display">Social Media Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(["facebook", "instagram", "youtube", "tiktok"] as const).map((platform) => (
              <div key={platform} className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs capitalize">{platform} URL</Label>
                  <Input
                    value={socialLinks[platform].url}
                    onChange={e => setSocialLinks(prev => ({ ...prev, [platform]: { ...prev[platform], url: e.target.value } }))}
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs capitalize">{platform} Handle</Label>
                  <Input
                    value={socialLinks[platform].handle}
                    onChange={e => setSocialLinks(prev => ({ ...prev, [platform]: { ...prev[platform], handle: e.target.value } }))}
                    placeholder="@yourhandle"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={handleSaveContent} disabled={savingContent} className="w-full gradient-primary text-primary-foreground">
          {savingContent ? "Saving..." : "Save Website Content"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
