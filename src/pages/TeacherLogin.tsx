import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";
import { ArrowLeft, Eye, EyeOff, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const TeacherLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setLoading(false);
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "teacher")
      .maybeSingle();

    setLoading(false);
    if (!roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access Denied", description: "You do not have teacher access. Please contact the school admin.", variant: "destructive" });
      return;
    }

    toast({ title: "Welcome, Teacher!", description: "Redirecting to portal..." });
    navigate("/teacher-portal");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to website
        </Link>
        <Card className="shadow-elevated border-border">
          <CardHeader className="text-center pb-2">
            <img src={logo} alt="The Country School" className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-card" />
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="font-display text-xl">Teacher Portal</CardTitle>
            <p className="text-sm text-muted-foreground">The Country School — Fahad Campus</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-email">Email</Label>
                <Input id="teacher-email" type="email" placeholder="teacher@thecountryschool.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-password">Password</Label>
                <div className="relative">
                  <Input id="teacher-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? "Authenticating..." : "Login to Teacher Portal"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Teacher accounts are created by the school admin. Contact admin if you need access.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherLogin;
