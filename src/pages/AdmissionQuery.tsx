import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, GraduationCap, Upload, Camera } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { classOptions } from "@/lib/constants";

const AdmissionQuery = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formBFile, setFormBFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    student_name: "",
    father_name: "",
    mother_name: "",
    phone: "",
    mother_phone: "",
    whatsapp: "",
    email: "",
    applying_for_class: "",
    date_of_birth: "",
    gender: "Male",
    religion: "Islam",
    nationality: "Pakistani",
    cnic_bform: "",
    father_cnic: "",
    father_occupation: "",
    address: "",
    previous_school: "",
    previous_class: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name || !form.father_name || !form.phone || !form.applying_for_class || !form.date_of_birth) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);

    // Upload photo if provided
    let photoUrl = "";
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `admission-photos/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("photos").upload(path, photoFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    // Upload Form B if provided
    let formBUrl = "";
    if (formBFile) {
      const ext = formBFile.name.split(".").pop();
      const path = `form-b/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("photos").upload(path, formBFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
        formBUrl = urlData.publicUrl;
      }
    }

    // Submit as admission query (basic fields)
    const queryPayload = {
      student_name: form.student_name,
      father_name: form.father_name,
      phone: form.phone,
      mother_phone: form.mother_phone,
      whatsapp: form.whatsapp,
      email: form.email,
      applying_for_class: form.applying_for_class,
      message: [
        form.message,
        form.date_of_birth ? `DOB: ${form.date_of_birth}` : "",
        form.gender ? `Gender: ${form.gender}` : "",
        form.mother_name ? `Mother: ${form.mother_name}` : "",
        form.cnic_bform ? `CNIC/B-Form: ${form.cnic_bform}` : "",
        form.father_cnic ? `Father CNIC: ${form.father_cnic}` : "",
        form.father_occupation ? `Occupation: ${form.father_occupation}` : "",
        form.address ? `Address: ${form.address}` : "",
        form.previous_school ? `Prev School: ${form.previous_school}` : "",
        form.previous_class ? `Prev Class: ${form.previous_class}` : "",
        photoUrl ? `Photo: ${photoUrl}` : "",
        formBUrl ? `Form-B: ${formBUrl}` : "",
      ].filter(Boolean).join("\n"),
    };

    const { error } = await supabase.from("admission_queries").insert([queryPayload]);
    if (error) {
      setSubmitting(false);
      toast.error("Failed to submit. Please try again.");
      return;
    }

    // Also create full admission record
    const admPayload = {
      application_no: `ADM-${Date.now().toString().slice(-8)}`,
      student_name: form.student_name,
      father_name: form.father_name,
      mother_name: form.mother_name || "",
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      religion: form.religion,
      nationality: form.nationality,
      cnic_bform: form.cnic_bform,
      father_cnic: form.father_cnic,
      father_occupation: form.father_occupation,
      father_phone: form.phone,
      mother_phone: form.mother_phone,
      whatsapp: form.whatsapp,
      address: form.address,
      previous_school: form.previous_school,
      previous_class: form.previous_class,
      applying_for_class: form.applying_for_class,
      applying_for_section: "A",
      status: "Pending",
      remarks: [
        form.message,
        photoUrl ? `Photo: ${photoUrl}` : "",
        formBUrl ? `Form-B: ${formBUrl}` : "",
      ].filter(Boolean).join("\n"),
    };

    await supabase.from("admissions").insert([admPayload]).catch(() => {});

    // Send notifications
    supabase.functions.invoke("notify-admission-query", { body: queryPayload }).catch(() => {});
    if (form.whatsapp) {
      const cleanPhone = form.whatsapp.replace(/[^0-9]/g, "");
      const fullPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
      const whatsappMsg = encodeURIComponent(
        `Assalam o Alaikum,\n\nDear ${form.father_name},\n\nThank you for submitting the admission form for *${form.student_name}* at *The Country School*.\n\nWe have received your application for *${form.applying_for_class}*. Our team will contact you shortly.\n\nRegards,\nThe Country School\nModel Town Fahad Campus, Bahawalpur`
      );
      window.open(`https://wa.me/${fullPhone}?text=${whatsappMsg}`, "_blank");
    }
    setSubmitting(false);
    setSubmitted(true);
    toast.success("Admission form submitted successfully!");
  };

  const resetForm = () => {
    setSubmitted(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormBFile(null);
    setForm({
      student_name: "", father_name: "", mother_name: "", phone: "", mother_phone: "", whatsapp: "",
      email: "", applying_for_class: "", date_of_birth: "", gender: "Male", religion: "Islam",
      nationality: "Pakistani", cnic_bform: "", father_cnic: "", father_occupation: "", address: "",
      previous_school: "", previous_class: "", message: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="The Country School Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">The Country School</h1>
              <p className="text-xs text-muted-foreground">Model Town Fahad Campus</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Admission Form</h2>
            <p className="mt-2 text-muted-foreground text-sm">Fill the complete form below and we'll process your application</p>
          </div>

          {submitted ? (
            <Card className="shadow-card text-center">
              <CardContent className="py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Application Submitted!</h3>
                <p className="mb-6 text-muted-foreground">Thank you for your interest. Our team will contact you soon.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={resetForm}>Submit Another</Button>
                  <Link to="/"><Button className="gradient-primary text-primary-foreground">Go Home</Button></Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Student Admission Form</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-28 w-28 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">Upload Passport Size Photo</span>
                      <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </Label>
                  </div>

                  {/* Student Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1">Student Information</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Student Name <span className="text-destructive">*</span></Label>
                        <Input value={form.student_name} onChange={(e) => handleChange("student_name", e.target.value)} placeholder="Full name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date of Birth <span className="text-destructive">*</span></Label>
                        <Input type="date" value={form.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Gender</Label>
                        <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Religion</Label>
                        <Input value={form.religion} onChange={(e) => handleChange("religion", e.target.value)} placeholder="Islam" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nationality</Label>
                        <Input value={form.nationality} onChange={(e) => handleChange("nationality", e.target.value)} placeholder="Pakistani" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">CNIC / B-Form No.</Label>
                        <Input value={form.cnic_bform} onChange={(e) => handleChange("cnic_bform", e.target.value)} placeholder="XXXXX-XXXXXXX-X" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Applying for Class <span className="text-destructive">*</span></Label>
                        <Select value={form.applying_for_class} onValueChange={(v) => handleChange("applying_for_class", v)}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1">Parent / Guardian Information</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Father's Name <span className="text-destructive">*</span></Label>
                        <Input value={form.father_name} onChange={(e) => handleChange("father_name", e.target.value)} placeholder="Father's full name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mother's Name</Label>
                        <Input value={form.mother_name} onChange={(e) => handleChange("mother_name", e.target.value)} placeholder="Mother's full name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Father's Phone <span className="text-destructive">*</span></Label>
                        <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mother's Phone</Label>
                        <Input value={form.mother_phone} onChange={(e) => handleChange("mother_phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">WhatsApp Number</Label>
                        <Input value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} placeholder="03XX-XXXXXXX" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email</Label>
                        <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="Optional" type="email" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Father's CNIC</Label>
                        <Input value={form.father_cnic} onChange={(e) => handleChange("father_cnic", e.target.value)} placeholder="XXXXX-XXXXXXX-X" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Father's Occupation</Label>
                        <Input value={form.father_occupation} onChange={(e) => handleChange("father_occupation", e.target.value)} placeholder="Occupation" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Address</Label>
                        <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Full address" />
                      </div>
                    </div>
                  </div>

                  {/* Previous Education */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1">Previous Education</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Previous School</Label>
                        <Input value={form.previous_school} onChange={(e) => handleChange("previous_school", e.target.value)} placeholder="School name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Previous Class</Label>
                        <Input value={form.previous_class} onChange={(e) => handleChange("previous_class", e.target.value)} placeholder="Last class attended" />
                      </div>
                    </div>
                  </div>

                  {/* Form B Upload */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1">Documents</h3>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Upload Form B / Birth Certificate</Label>
                      <div className="flex items-center gap-3">
                        <Label htmlFor="formb-upload" className="cursor-pointer flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted/30 transition-colors w-full">
                          <Upload className="h-4 w-4" />
                          {formBFile ? formBFile.name : "Click to upload Form B (PDF/Image)"}
                        </Label>
                        <Input id="formb-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFormBFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Additional Message / Question</Label>
                    <Textarea value={form.message} onChange={(e) => handleChange("message", e.target.value)} placeholder="Any questions about admission?" rows={3} />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                    {submitting ? "Submitting..." : "Submit Admission Form"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdmissionQuery;