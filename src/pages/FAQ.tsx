import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logo from "@/assets/logo.jpg";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

const faqs = [
  {
    category: "Admissions",
    questions: [
      {
        q: "What classes does The Country School offer?",
        a: "We offer classes from Reception (Playgroup) through Class 8. Our grade structure includes Reception, Foundation, Pre-1, and Class 1 to Class 8.",
      },
      {
        q: "What is the admission process?",
        a: "The admission process is simple: 1) Submit an online inquiry or visit our campus, 2) Fill out the admission form with required documents, 3) Attend an assessment (for applicable classes), 4) Receive admission confirmation. Required documents include B-Form/birth certificate, previous school records, passport-size photographs, and parent's CNIC copies.",
      },
      {
        q: "When are admissions open?",
        a: "Admissions are open throughout the year, subject to seat availability. We encourage early applications to secure a spot for your child.",
      },
      {
        q: "What is the minimum age for admission to Reception (Playgroup)?",
        a: "Children must be at least 3 years old to be admitted to our Reception (Playgroup) program.",
      },
    ],
  },
  {
    category: "Fees & Payments",
    questions: [
      {
        q: "What is the fee structure?",
        a: "The Country School offers one of the most affordable fee structures in Bahawalpur for the quality of education provided. Our fee structure is transparent with no hidden charges. Please contact us at 0322-6107000 or visit our campus for detailed fee information.",
      },
      {
        q: "Are there any fee concessions or scholarships?",
        a: "Yes, we offer fee concessions for deserving students and siblings. Please speak with our administration for eligibility details.",
      },
      {
        q: "What payment methods are accepted?",
        a: "Fees can be paid via bank transfer, cash at the school office, or through our fee voucher system. Monthly, quarterly, and annual payment options are available.",
      },
    ],
  },
  {
    category: "Academics & Curriculum",
    questions: [
      {
        q: "Is The Country School an English medium school?",
        a: "Yes, The Country School is an English medium institution. All core subjects are taught in English, with Urdu as a separate subject. We also provide bilingual support for students transitioning from Urdu medium schools.",
      },
      {
        q: "What curriculum does the school follow?",
        a: "Our curriculum is modeled after Bloomfield Hall's proven academic framework. It combines local educational requirements with modern teaching methodologies, covering English, Urdu, Mathematics, Science, Social Studies, Islamic Studies, Computer Science, and more.",
      },
      {
        q: "What is the student-to-teacher ratio?",
        a: "We maintain small class sizes with an optimal student-to-teacher ratio to ensure personalized attention for every student.",
      },
      {
        q: "Does the school prepare students for board exams?",
        a: "Yes, our middle school curriculum (Class 6–8) is designed to prepare students for board examinations with a focus on exam techniques, subject mastery, and analytical thinking.",
      },
    ],
  },
  {
    category: "School Policies & Safety",
    questions: [
      {
        q: "What safety measures are in place?",
        a: "Student safety is our top priority. Our campus features CCTV surveillance, controlled access gates, trained security personnel, anti-bullying programs, and regular safety drills. We follow a strict safeguarding policy with zero tolerance for any form of harassment.",
      },
      {
        q: "What are the school timings?",
        a: "School timings vary by season. Generally, summer timings are 7:30 AM to 1:00 PM and winter timings are 8:00 AM to 2:00 PM. Please contact the school office for current timings.",
      },
      {
        q: "Is there a uniform requirement?",
        a: "Yes, all students are required to wear the school uniform. Details about the uniform are provided at the time of admission.",
      },
      {
        q: "How can parents communicate with teachers?",
        a: "We maintain regular parent-teacher communication through parent-teacher meetings, school diary, WhatsApp groups, and our parent portal. Parents can also schedule individual meetings with teachers through the school office.",
      },
    ],
  },
  {
    category: "About The School",
    questions: [
      {
        q: "What is the relationship between The Country School and Bloomfield Hall?",
        a: "The Country School is a project of Bloomfield Hall, one of Pakistan's most respected educational institutions established in 1984. We follow Bloomfield Hall's academic standards, teaching methodologies, and undergo regular quality audits to maintain excellence.",
      },
      {
        q: "Where is the school located?",
        a: "The Country School Fahad Campus is located at 41-A, Street #2, Near Telenor Franchise, Model Town-B, Bahawalpur. Our central location makes us easily accessible from all parts of the city.",
      },
      {
        q: "How can I visit the campus?",
        a: "We welcome campus visits! You can walk in during school hours or schedule a visit by calling 0322-6107000 or 0305-7457171. Our team will be happy to show you around and answer all your questions.",
      },
    ],
  },
];

const FAQ = () => {
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
            <Link to="/curriculum" className="text-sm text-muted-foreground hover:text-primary transition-colors">Curriculum</Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link>
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
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/70">
            Find answers to common questions about admissions, fees, curriculum, and more at The Country School Bahawalpur
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl space-y-10">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="mb-4 font-display text-2xl font-bold text-foreground">{section.category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {section.questions.map((faq, i) => (
                    <AccordionItem key={i} value={`${section.category}-${i}`} className="rounded-lg border border-border bg-card px-5 shadow-sm">
                      <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Still Have Questions?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Contact us directly and our team will be happy to help you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a href="tel:03226107000">
              <Button size="lg" className="gradient-primary border-0 text-primary-foreground">Call 0322-6107000</Button>
            </a>
            <Link to="/admission-query">
              <Button size="lg" variant="outline">Submit Inquiry</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.flatMap((s) =>
              s.questions.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              }))
            ),
          }),
        }}
      />

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

export default FAQ;
