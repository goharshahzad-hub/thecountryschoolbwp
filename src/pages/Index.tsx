import logo from "@/assets/logo.jpg";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, GraduationCap, Users, BookOpen, Trophy, Clock, Shield, LucideIcon, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Lightbox from "@/components/Lightbox";

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
            <a href="#gallery" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Gallery</a>
            <Link to="/admission-query" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Admission Inquiry</Link>
            <a href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/parent-login">
              <Button variant="outline" size="sm">Parent Login</Button>
            </Link>
            {isAdmin && (
              <Link to="/dashboard">
                <Button size="sm" className="gradient-primary border-0 text-primary-foreground">Admin Portal</Button>
              </Link>
            )}
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
            {isAdmin && (
              <Link to="/dashboard">
                <Button size="lg" className="gradient-primary border-0 px-8 text-primary-foreground shadow-elevated">Access Dashboard</Button>
              </Link>
            )}
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

      {/* Photo Gallery */}
      {content.gallery && content.gallery.length > 0 && (
        <section id="gallery" className="border-t border-border bg-muted/30 py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <h3 className="font-display text-3xl font-bold text-foreground md:text-4xl">Photo Gallery</h3>
              <p className="mt-3 text-muted-foreground">Glimpses of life at our school</p>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {content.gallery.map((img, i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg shadow-card transition-all hover:shadow-elevated animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <img src={img.url} alt={img.caption || "Gallery photo"} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-xs font-medium text-white">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* Social Media */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h3 className="font-display text-3xl font-bold text-foreground">Follow Us</h3>
            <p className="mt-3 text-muted-foreground">Stay connected on social media</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Facebook */}
            {content.social_links?.facebook?.url && (
              <a href={content.social_links.facebook.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <p className="font-display text-sm font-semibold text-foreground">Facebook</p>
                <p className="mt-1 text-xs text-muted-foreground">{content.social_links.facebook.handle}</p>
              </a>
            )}
            {/* Instagram */}
            {content.social_links?.instagram?.url && (
              <a href={content.social_links.instagram.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <p className="font-display text-sm font-semibold text-foreground">Instagram</p>
                <p className="mt-1 text-xs text-muted-foreground">{content.social_links.instagram.handle}</p>
              </a>
            )}
            {/* YouTube */}
            {content.social_links?.youtube?.url && (
              <a href={content.social_links.youtube.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <p className="font-display text-sm font-semibold text-foreground">YouTube</p>
                <p className="mt-1 text-xs text-muted-foreground">{content.social_links.youtube.handle}</p>
              </a>
            )}
            {/* TikTok */}
            {content.social_links?.tiktok?.url && (
              <a href={content.social_links.tiktok.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
                </div>
                <p className="font-display text-sm font-semibold text-foreground">TikTok</p>
                <p className="mt-1 text-xs text-muted-foreground">{content.social_links.tiktok.handle}</p>
              </a>
            )}
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

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] shadow-elevated transition-transform hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
};

export default Index;
