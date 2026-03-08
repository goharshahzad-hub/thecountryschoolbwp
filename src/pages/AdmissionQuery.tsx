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
import { ArrowLeft, Send, GraduationCap } from "lucide-react";
import logo from "@/assets/logo.jpg";

import { classOptions } from "@/lib/constants";

const AdmissionQuery = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    father_name: "",
    phone: "",
    mother_phone: "",
    whatsapp: "",
    email: "",
    applying_for_class: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name || !form.father_name || !form.phone || !form.applying_for_class) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("admission_queries").insert([form]);
    if (error) {
      setSubmitting(false);
      toast.error("Failed to submit query. Please try again.");
      return;
    }
    // Send email notification (fire and forget)
    supabase.functions.invoke("notify-admission-query", { body: form }).catch(() => {});
    setSubmitting(false);
    setSubmitted(true);
    toast.success("Admission query submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">Admission Inquiry</h2>
            <p className="mt-2 text-muted-foreground">Fill the form below and we'll get back to you shortly</p>
          </div>

          {submitted ? (
            <Card className="shadow-card text-center">
              <CardContent className="py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Query Submitted!</h3>
                <p className="mb-6 text-muted-foreground">Thank you for your interest. Our team will contact you soon.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ student_name: "", father_name: "", phone: "", mother_phone: "", whatsapp: "", email: "", applying_for_class: "", message: "" }); }}>
                    Submit Another
                  </Button>
                  <Link to="/"><Button className="gradient-primary text-primary-foreground">Go Home</Button></Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Student & Parent Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Student Name <span className="text-destructive">*</span></Label>
                      <Input value={form.student_name} onChange={(e) => handleChange("student_name", e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Father Name <span className="text-destructive">*</span></Label>
                      <Input value={form.father_name} onChange={(e) => handleChange("father_name", e.target.value)} placeholder="Father's full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Father's Phone <span className="text-destructive">*</span></Label>
                      <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother's Phone</Label>
                      <Input value={form.mother_phone} onChange={(e) => handleChange("mother_phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp Number</Label>
                      <Input value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} placeholder="03XX-XXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="Optional" type="email" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Applying for Class <span className="text-destructive">*</span></Label>
                      <Select value={form.applying_for_class} onValueChange={(v) => handleChange("applying_for_class", v)}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Message / Question</Label>
                      <Textarea value={form.message} onChange={(e) => handleChange("message", e.target.value)} placeholder="Any questions about admission?" rows={4} />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                    {submitting ? "Submitting..." : "Submit Inquiry"}
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
