import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Palette, Calculator, Globe, Microscope, Dumbbell, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

const levels = [
  {
    name: "Reception (Playgroup)",
    age: "3–4 years",
    description: "Our Reception program introduces children to a structured learning environment through play-based activities. Focus areas include early literacy, numeracy, social skills, and creative expression.",
    subjects: ["Phonics & Early Reading", "Number Recognition", "Arts & Crafts", "Rhymes & Songs", "Motor Skills Development", "Social Interaction"],
    color: "bg-accent/10 text-accent",
  },
  {
    name: "Foundation",
    age: "4–5 years",
    description: "Foundation builds on Reception with more structured learning. Students begin formal letter recognition, basic counting, and develop listening and speaking skills in both English and Urdu.",
    subjects: ["English Language", "Urdu", "Mathematics", "General Knowledge", "Islamic Studies", "Art & Drawing"],
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Pre-1",
    age: "5–6 years",
    description: "Pre-1 prepares students for primary school with a focus on reading fluency, basic writing, and number operations. Students develop critical thinking through guided exploration.",
    subjects: ["English (Reading & Writing)", "Urdu", "Mathematics", "General Knowledge", "Islamic Studies", "Computer Awareness", "Art"],
    color: "bg-secondary/10 text-secondary",
  },
  {
    name: "Class 1 – Class 3 (Junior Primary)",
    age: "6–9 years",
    description: "Junior primary focuses on building strong foundations in core subjects. Students develop reading comprehension, creative writing, mathematical reasoning, and scientific inquiry skills.",
    subjects: ["English Language & Literature", "Urdu", "Mathematics", "General Science", "Social Studies", "Islamic Studies", "Computer Science", "Art & Craft", "Physical Education"],
    color: "bg-accent/10 text-accent",
  },
  {
    name: "Class 4 – Class 5 (Senior Primary)",
    age: "9–11 years",
    description: "Senior primary deepens academic skills with more complex concepts. Students are prepared for middle school with emphasis on independent learning, research skills, and analytical thinking.",
    subjects: ["English Language & Literature", "Urdu", "Mathematics", "General Science", "Social Studies / Pakistan Studies", "Islamic Studies / Islamiat", "Computer Science", "Art", "Physical Education"],
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Class 6 – Class 8 (Middle School)",
    age: "11–14 years",
    description: "Middle school offers a comprehensive curriculum preparing students for board examinations. Focus shifts to subject specialization, exam techniques, and developing a strong academic foundation for higher education.",
    subjects: ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Pakistan Studies", "Islamic Studies / Islamiat", "Computer Science", "Physical Education"],
    color: "bg-secondary/10 text-secondary",
  },
];

const highlights = [
  { icon: BookOpen, title: "Bloomfield Hall Curriculum", desc: "Modeled after Bloomfield Hall's proven academic framework with regular quality audits" },
  { icon: Globe, title: "English Medium Instruction", desc: "All core subjects taught in English with bilingual Urdu support" },
  { icon: Calculator, title: "STEM Focus", desc: "Strong emphasis on Science, Technology, Engineering, and Mathematics from early grades" },
  { icon: Palette, title: "Creative Arts", desc: "Art, music, and creative expression integrated throughout all levels" },
  { icon: Microscope, title: "Practical Learning", desc: "Hands-on experiments, projects, and activity-based learning approach" },
  { icon: Dumbbell, title: "Physical Education", desc: "Regular sports and physical activities for healthy development" },
];

const Curriculum = () => {
  const { settings } = useSchoolSettings();

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
            <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
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
            Curriculum & Academic Programs
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/70">
            A comprehensive education from Reception (Playgroup) to Class 8, modeled after Bloomfield Hall's proven academic standards
          </p>
        </div>
      </section>

      {/* Curriculum Highlights */}
      <section className="py-16">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Our Academic Approach</h2>
            <p className="mt-3 text-muted-foreground">What makes our curriculum stand out</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-4 rounded-lg border border-border bg-card p-5 shadow-card">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground">{h.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grade Levels */}
      <section className="border-t border-border bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Programs by Level</h2>
            <p className="mt-3 text-muted-foreground">Detailed curriculum for every stage of your child's education</p>
          </div>
          <div className="mx-auto max-w-4xl space-y-6">
            {levels.map((level, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-card md:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-xl font-bold text-foreground">{level.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${level.color}`}>
                    Age: {level.age}
                  </span>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{level.description}</p>
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Subjects Offered:</p>
                  <div className="flex flex-wrap gap-2">
                    {level.subjects.map((sub) => (
                      <span key={sub} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extracurricular */}
      <section className="border-t border-border bg-card py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Extracurricular Activities</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              Beyond academics, we offer a range of activities to develop well-rounded individuals. Our students participate in sports competitions, art exhibitions, science fairs, debates, Quran recitation, Naat competitions, and annual functions that showcase their talents.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {["Sports & Athletics", "Art Competitions", "Science Fair", "Debates", "Quran Recitation", "Naat Competition", "Annual Day", "Parents Day", "Independence Day Celebration"].map((a) => (
                <span key={a} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Enroll Your Child Today</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join The Country School and give your child a strong academic foundation from Reception to Class 8.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/admission-query">
              <Button size="lg" className="gradient-primary border-0 text-primary-foreground">Submit Inquiry</Button>
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
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} {settings.school_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Curriculum;
