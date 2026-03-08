import { Link } from "react-router-dom";
import { ArrowLeft, Shield, BookOpen, Users, Heart, Building, Laptop, TreePine, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

const AboutUs = () => {
  const { settings } = useSchoolSettings();

  const facilities = [
    { icon: Shield, title: "Secure Campus", desc: "CCTV surveillance, controlled access gates, and trained security personnel ensure a safe environment for every child." },
    { icon: Building, title: "Modern Classrooms", desc: "Spacious, well-ventilated classrooms equipped with whiteboards and age-appropriate furniture for comfortable learning." },
    
    { icon: Laptop, title: "Computer Lab", desc: "Equipped with modern computers to provide students hands-on IT education from an early age." },
    { icon: TreePine, title: "Play Areas", desc: "Safe outdoor play areas and sports facilities for physical development and recreational activities." },
    { icon: Users, title: "Small Class Sizes", desc: "Optimal student-to-teacher ratio ensures personalized attention and better learning outcomes." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt={`${settings.school_name} Logo`} className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="font-display text-lg font-bold leading-tight text-foreground">{settings.school_name}</p>
              <p className="text-xs text-muted-foreground">{settings.campus}, Bahawalpur</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/curriculum" className="text-sm text-muted-foreground hover:text-primary transition-colors">Curriculum</Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
          </nav>
          <Link to="/admission-query">
            <Button size="sm" className="gradient-primary border-0 text-primary-foreground">Apply Now</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero py-16 md:py-20">
        <div className="container text-center">
          <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary-foreground md:text-5xl">
            About The Country School
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/70">
            A project of Bloomfield Hall — Providing quality education with affordable fees in Bahawalpur since inception
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Our Story</h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
            </div>
            <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                The Country School Fahad Campus is a proud project of <strong className="text-foreground">Bloomfield Hall</strong>, one of Pakistan's most respected names in education. Established in Bahawalpur, our school was founded with a singular mission: to bring the Bloomfield Hall standard of academic excellence to the families of South Punjab at an affordable cost.
              </p>
              <p>
                Bloomfield Hall was established in 1984 by educationists from the UK and Pakistan, with the aim of providing British-style education leading to international qualifications. As a project under this esteemed institution, The Country School inherits decades of educational expertise, proven teaching methodologies, and a commitment to nurturing well-rounded individuals.
              </p>
              <p>
                Located at 41-A, Street #2, Near Telenor Franchise, Model Town-B, Bahawalpur, our campus serves as a beacon of quality education in the region. We offer classes from Reception (Playgroup) to Class 8, providing a strong foundation for students to excel in their academic journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="border-t border-border bg-card py-16 md:py-20">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-border p-8 shadow-card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 font-display text-2xl font-bold text-foreground">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To be the leading educational institution in Bahawalpur that provides world-class education accessible to every family, producing confident, ethical, and intellectually curious individuals who contribute positively to society.
              </p>
            </div>
            <div className="rounded-lg border border-border p-8 shadow-card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary/10">
                <BookOpen className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="mb-3 font-display text-2xl font-bold text-foreground">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To deliver quality education through experienced faculty, modern teaching methods, and a nurturing environment. We are committed to developing each student's academic potential, moral character, and social skills while keeping education affordable for all families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Director's Message */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Director's Message</h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
            </div>
            <div className="rounded-lg border border-border bg-card p-8 shadow-card md:p-10">
              <blockquote className="space-y-4 text-base leading-relaxed text-muted-foreground italic">
                <p>
                  "A school is much more than a medium through which academic training takes place. A good school provides opportunities that a single household cannot. It enables students to socially interact, teaching them the rules of interaction when they venture out in the real world."
                </p>
                <p>
                  "At The Country School, we are committed to creating an environment where children not only learn academics but also develop critical life skills — discipline, tolerance, teamwork, and the courage to face challenges. Our students are prepared not just for exams, but for life."
                </p>
                <p>
                  "We take pride in being a project of Bloomfield Hall, and we carry forward the legacy of quality education that Bloomfield Hall has championed across Pakistan for over four decades. Every child who walks through our gates becomes part of this proud tradition."
                </p>
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                <img src={logo} alt="Director" className="h-14 w-14 rounded-full object-cover border-2 border-primary/20" />
                <div>
                  <p className="font-display font-semibold text-foreground">The Country School Management</p>
                  <p className="text-sm text-muted-foreground">Fahad Campus, Bahawalpur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Facilities */}
      <section className="border-t border-border bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Campus Facilities</h2>
            <p className="mt-3 text-muted-foreground">Everything your child needs for a complete learning experience</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 font-display text-lg font-semibold text-foreground">{f.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Protection */}
      <section className="border-t border-border bg-card py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">Student Protection & Safeguarding</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              The safety and well-being of our students is our highest priority. We maintain a strict safeguarding policy that includes background checks for all staff, CCTV monitoring across campus, anti-bullying programs, and regular safety drills. Our school follows a zero-tolerance policy against any form of harassment or misconduct.
            </p>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="border-t border-border py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Find Us</h2>
            <p className="mt-3 text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" /> 41-A, Street #2, Near Telenor Franchise, Model Town-B, Bahawalpur
            </p>
          </div>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-border shadow-card">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.789!2d71.6833!3d29.3956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDIzJzQ0LjIiTiA3McKwNDEnMDAuMCJF!5e0!3m2!1sen!2spk!4v1234567890"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="The Country School Location"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Ready to Join Our Family?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Admissions are open for Reception (Playgroup) to Class 8. Visit us or submit an inquiry online.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/admission-query">
              <Button size="lg" className="gradient-primary border-0 text-primary-foreground">Submit Admission Inquiry</Button>
            </Link>
            <a href="tel:03226107000">
              <Button size="lg" variant="outline">Call 0322-6107000</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-hero py-8">
        <div className="container flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-display text-sm font-semibold text-primary-foreground">{settings.school_name}</span>
          </div>
          <p className="text-sm text-primary-foreground/80 text-center">41-A, Street #2, Near Telenor Franchise, Model Town-B, Bahawalpur.</p>
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} {settings.school_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
