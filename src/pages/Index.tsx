import logo from "@/assets/logo.jpg";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, GraduationCap, Users, BookOpen, Trophy, Clock, Shield, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, LucideIcon> = {
  GraduationCap, Users, BookOpen, Trophy, Shield, Clock,
};

const Index = () => {
  const { settings } = useSchoolSettings();
  const { content } = useWebsiteContent();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt={`${settings.school_name} Logo`} className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">{settings.school_name}</h1>
              <p className="text-xs text-muted-foreground">{settings.campus}</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">About</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Features</a>
            <Link to="/admission-query" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Admission Inquiry</Link>
            <a href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/parent-login">
              <Button variant="outline" size="sm">Parent Login</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground">Admin Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(356_72%_48%/0.12),transparent_60%)]" />
        <div className="container relative z-10 text-center">
          <img src={logo} alt={settings.school_name} className="mx-auto mb-8 h-28 w-28 rounded-full border-4 border-primary/30 object-cover shadow-elevated" />
          <h2 className="mb-4 font-display text-4xl font-extrabold tracking-tight text-primary-foreground md:text-6xl">
            {settings.school_name}
          </h2>
          <p className="mb-2 text-lg font-medium text-primary-foreground/80 md:text-xl">
            {settings.campus}, {settings.city}
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-base text-primary-foreground/60">
            {settings.motto} — {content.hero.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="gradient-primary border-0 px-8 text-primary-foreground shadow-elevated">Access Dashboard</Button>
            </Link>
            <a href="#contact">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">Contact Us</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          {content.stats.map((stat, i) => (
            <div key={i} className="text-center animate-count-up" style={{ animationDelay: `${i * 100}ms` }}>
              <p className="font-display text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h3 className="font-display text-3xl font-bold text-foreground md:text-4xl">{content.about.heading}</h3>
            <p className="mt-3 text-muted-foreground">{content.about.subheading}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.features.map((f, i) => {
              const Icon = iconMap[f.icon] || GraduationCap;
              return (
                <div key={i} className="group rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 font-display text-lg font-semibold text-foreground">{f.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border bg-card py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h3 className="font-display text-3xl font-bold text-foreground">Get In Touch</h3>
            <p className="mt-3 text-muted-foreground">We'd love to hear from you</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
            {[
              { icon: Phone, label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
              { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
              { icon: MapPin, label: "Address", value: `${settings.campus}, ${settings.city}`, href: "#" },
            ].map((c, i) => (
              <a key={i} href={c.href} className="flex flex-col items-center rounded-lg border border-border p-6 text-center shadow-card transition-all hover:shadow-elevated">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <c.icon className="h-5 w-5 text-secondary" />
                </div>
                <p className="mb-1 text-sm font-semibold text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground break-all">{c.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-hero py-8">
        <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-display text-sm font-semibold text-primary-foreground">{settings.school_name}</span>
          </div>
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} {settings.school_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
