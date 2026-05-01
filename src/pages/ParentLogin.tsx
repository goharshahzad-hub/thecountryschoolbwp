import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";
import { ArrowLeft, Eye, EyeOff, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const ParentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [childrenNames, setChildrenNames] = useState<string[]>([""]);
  const [signupPhone, setSignupPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = loginMethod === "email" ? loginEmail.trim() : loginPhone.trim();
    if (!identifier || !loginPassword.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (loginMethod === "phone") {
      // Phone login: use phone as email lookup approach
      // Supabase doesn't support phone+password natively without phone auth enabled,
      // so we'll try to find the user by phone in profiles and use their email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", loginPhone.trim())
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        toast({ title: "Not Found", description: "No account found with this phone number.", variant: "destructive" });
        return;
      }

      // We can't get email from profile, so try a different approach
      // Let's search students table for parent phone
      toast({ title: "Info", description: "Please use your registered email to login. Phone login requires email lookup.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "Redirecting to your portal..." });
      navigate("/parent-portal");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim() || !signupName.trim() || !signupPhone.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields including WhatsApp number", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    const validChildren = childrenNames.map(n => n.trim()).filter(Boolean);
    if (validChildren.length === 0) {
      toast({ title: "Children Required", description: "Please add at least one child name", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: { full_name: signupName.trim(), phone: signupPhone.trim(), children_names: validChildren },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account Created!", description: "Please check your email to verify your account." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email Sent", description: "Check your inbox for the password reset link." });
      setShowForgot(false);
    }
  };

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="relative z-10 w-full max-w-md">
          <button onClick={() => setShowForgot(false)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </button>
          <Card className="shadow-elevated border-border">
            <CardHeader className="text-center pb-2">
              <img src={logo} alt="The Country School" className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-card" />
              <CardTitle className="font-display text-xl">Reset Password</CardTitle>
              <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" type="email" placeholder="parent@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to website
        </Link>

        <Card className="shadow-elevated border-border">
          <CardHeader className="text-center pb-2">
            <img src={logo} alt="The Country School" className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-card" />
            <CardTitle className="font-display text-xl">Parent Portal</CardTitle>
            <p className="text-sm text-muted-foreground">The Country School, a Project of Bloomfield Hall (Since 1984)</p>
            <p className="text-xs text-muted-foreground">Model Town Fahad Campus, Bahawalpur</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {/* Login method toggle */}
                <div className="mb-4 flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${loginMethod === "email" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${loginMethod === "phone" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Phone className="h-3.5 w-3.5" /> Mobile Number
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {loginMethod === "email" ? (
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" placeholder="parent@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="login-phone">Mobile Number</Label>
                      <Input id="login-phone" type="tel" placeholder="0322-XXXXXXX" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                  <div className="text-center">
                    <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline" onClick={() => setShowForgot(true)}>
                      Forgot password?
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name *</Label>
                    <Input id="signup-name" placeholder="Your full name" value={signupName} onChange={e => setSignupName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input id="signup-email" type="email" placeholder="parent@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">WhatsApp Number <span className="text-destructive">*</span></Label>
                    <Input id="signup-phone" placeholder="+92 3XX XXXXXXX" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Children Names <span className="text-destructive">*</span></Label>
                    {childrenNames.map((name, i) => (
                      <div key={i} className="flex gap-2 mb-1">
                        <Input
                          placeholder={`Child ${i + 1} name`}
                          value={name}
                          onChange={e => {
                            const updated = [...childrenNames];
                            updated[i] = e.target.value;
                            setChildrenNames(updated);
                          }}
                        />
                        {childrenNames.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => setChildrenNames(childrenNames.filter((_, j) => j !== i))}>×</Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setChildrenNames([...childrenNames, ""])}>
                      + Add Another Child
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input id="signup-password" type="password" placeholder="Min. 6 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentLogin;
