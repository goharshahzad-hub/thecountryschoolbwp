import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

const blogPosts: Record<string, {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  keywords: string[];
  content: string;
}> = {
  "best-school-in-bahawalpur": {
    title: "Best School in Bahawalpur – Why The Country School Stands Out",
    excerpt: "Discover why The Country School Fahad Campus is considered one of the best schools in Bahawalpur.",
    date: "2026-03-01",
    readTime: "5 min",
    category: "Education",
    keywords: ["best school in bahawalpur", "top schools bahawalpur", "quality education bahawalpur"],
    content: `Finding the best school in Bahawalpur can be a challenging task for parents. The Country School, a project of Bloomfield Hall, Model Town, Fahad Campus, has emerged as a leading educational institution in Bahawalpur by combining quality education with an affordable fee structure.

Our school provides a holistic learning environment where students develop academically, socially, and morally. With experienced teachers, modern teaching methodologies, and a focus on character building, The Country School ensures every child reaches their full potential.

What sets us apart from other schools in Bahawalpur is our commitment to providing world-class education without the burden of excessive fees. We believe every child deserves access to quality education regardless of their financial background.

Our campus features well-equipped classrooms, a supportive learning atmosphere, and a curriculum that balances academic excellence with extracurricular activities. Parents trust us because we treat every student as part of our family.

Whether you're looking for the best primary school in Bahawalpur or a reliable secondary school, The Country School Fahad Campus is the right choice for your child's bright future.`
  },
  "affordable-school-fees-bahawalpur": {
    title: "Affordable School Fees in Bahawalpur – Quality Education for All",
    excerpt: "Learn about The Country School's affordable fee structure.",
    date: "2026-02-20",
    readTime: "4 min",
    category: "Admissions",
    keywords: ["affordable school fees bahawalpur", "low fee school bahawalpur", "school fee structure bahawalpur"],
    content: `One of the biggest concerns for parents in Bahawalpur when choosing a school is the fee structure. At The Country School Fahad Campus, we understand this concern and have designed an affordable fee plan that doesn't compromise on the quality of education.

Our fee structure is transparent with no hidden charges. We offer competitive tuition fees that cover comprehensive education including modern teaching resources, experienced faculty, and a well-maintained campus environment.

Many families in Bahawalpur struggle to find schools that offer both quality and affordability. The Country School bridges this gap by providing an education system modeled after Bloomfield Hall's standards at a fraction of the cost.

We also offer flexible payment options and fee concessions for deserving students. Our goal is to ensure that financial constraints never become a barrier to a child's education.

Contact us today to learn about our current fee structure and available discounts. Visit our campus at Model Town, Fahad Campus, Bahawalpur, or call us at 0322-6107000.`
  },
  "school-admissions-bahawalpur-2026": {
    title: "School Admissions Open in Bahawalpur 2026 – Apply Now",
    excerpt: "Admissions are now open at The Country School Fahad Campus.",
    date: "2026-02-15",
    readTime: "4 min",
    category: "Admissions",
    keywords: ["school admissions bahawalpur 2026", "admission open bahawalpur", "school enrollment bahawalpur"],
    content: `The Country School Fahad Campus, Bahawalpur, is now accepting admissions for the academic year 2026. We welcome students from Playgroup to Grade 10 who are eager to learn and grow in a supportive educational environment.

Our admission process is simple and straightforward:
1. Submit an online inquiry through our website or visit the campus
2. Fill out the admission form with required documents
3. Attend an assessment (for applicable classes)
4. Receive admission confirmation

Required documents include the student's B-Form/birth certificate, previous school records (if applicable), passport-size photographs, and parent's CNIC copies.

We encourage parents to visit our campus to experience our facilities firsthand. Our team is available to answer all your questions about the curriculum, fee structure, and school policies.

Don't miss this opportunity to give your child the best start in education. Apply now at The Country School Fahad Campus, Model Town-B, Bahawalpur. For inquiries, call 0322-6107000 or 0305-7457171.`
  },
  "bloomfield-hall-project-bahawalpur": {
    title: "Bloomfield Hall Project in Bahawalpur – The Country School",
    excerpt: "The Country School is a proud project of Bloomfield Hall.",
    date: "2026-02-10",
    readTime: "5 min",
    category: "About Us",
    keywords: ["bloomfield hall bahawalpur", "bloomfield hall project", "country school bloomfield hall"],
    content: `The Country School Fahad Campus is a distinguished project of Bloomfield Hall, one of Pakistan's most respected educational brands. Located in Model Town, Bahawalpur, our school brings the Bloomfield Hall standard of excellence to South Punjab.

Bloomfield Hall has been a pioneer in quality education across Pakistan. The Country School carries forward this legacy by offering the same high standards of teaching, curriculum design, and student development that Bloomfield Hall is known for.

Our affiliation with Bloomfield Hall means that our students benefit from a well-researched and comprehensive curriculum, teacher training programs aligned with international standards, regular academic audits to maintain quality, and access to Bloomfield Hall's educational resources and expertise.

As a project of Bloomfield Hall, we maintain strict quality controls while adapting to the local needs of Bahawalpur's educational landscape. This unique combination makes The Country School the ideal choice for parents who want premium education at accessible rates.

Join us at The Country School and give your child the advantage of a Bloomfield Hall education right here in Bahawalpur.`
  },
  "primary-education-bahawalpur": {
    title: "Best Primary School in Bahawalpur – Early Childhood Education",
    excerpt: "Give your child the best start with quality primary education at The Country School.",
    date: "2026-02-05",
    readTime: "4 min",
    category: "Education",
    keywords: ["primary school bahawalpur", "early childhood education bahawalpur", "playgroup school bahawalpur"],
    content: `The early years of education are the most critical in a child's development. At The Country School Fahad Campus, we provide exceptional primary education that builds strong foundations in literacy, numeracy, and social skills.

Our early childhood education program is designed for children from Playgroup onwards. We use activity-based learning methods that make education fun and engaging for young learners. Our classrooms are bright, safe, and equipped with age-appropriate learning materials.

Key features of our primary education program include small class sizes for personalized attention, trained and caring teachers specialized in early childhood education, play-based learning approach for younger students, gradual introduction to formal academics, focus on developing social skills and emotional intelligence, and regular parent-teacher communication.

Our primary school curriculum covers English, Urdu, Mathematics, General Knowledge, Islamic Studies, and creative arts. We believe in nurturing the whole child, not just academics.

Visit The Country School Fahad Campus in Model Town-B, Bahawalpur, to see our primary section in action. Schedule a campus tour by calling 0322-6107000.`
  },
  "english-medium-school-bahawalpur": {
    title: "Top English Medium School in Bahawalpur – The Country School",
    excerpt: "Looking for an English medium school in Bahawalpur?",
    date: "2026-01-28",
    readTime: "4 min",
    category: "Education",
    keywords: ["english medium school bahawalpur", "english school bahawalpur", "cambridge school bahawalpur"],
    content: `In today's globalized world, English medium education is essential for a child's future success. The Country School Fahad Campus offers one of the finest English medium education programs in Bahawalpur.

Our curriculum is designed to develop strong English language skills while maintaining proficiency in Urdu and other subjects. Students are encouraged to communicate in English within the school premises, creating an immersive learning environment.

Our English medium program includes comprehensive English language instruction from Playgroup, literature and creative writing programs, an English-speaking environment on campus, bilingual support for students transitioning from Urdu medium, regular reading programs and library access, and English debating and public speaking activities.

Our teachers are well-qualified in English language instruction and use modern teaching techniques to make learning effective and enjoyable. We follow a curriculum that prepares students for both local board examinations and future academic pursuits.

The Country School is committed to producing confident English speakers who can compete on national and international platforms. Enroll your child today and give them the gift of quality English medium education in Bahawalpur.`
  },
  "school-model-town-bahawalpur": {
    title: "Best School in Model Town Bahawalpur – The Country School",
    excerpt: "Located in Model Town-B, The Country School Fahad Campus is the preferred choice.",
    date: "2026-01-20",
    readTime: "3 min",
    category: "About Us",
    keywords: ["school model town bahawalpur", "school near model town bahawalpur", "fahad campus bahawalpur"],
    content: `Conveniently located at 41-A, Street #2, Near Telenor Franchise, Model Town-B, Bahawalpur, The Country School Fahad Campus serves families in Model Town and surrounding areas.

Our central location in Model Town makes us easily accessible for families from all parts of Bahawalpur. Parents appreciate the safe and well-connected location of our campus, which features a secure campus with controlled access, clean and well-maintained facilities, adequate parking space for parents, safe drop-off and pick-up zones, and proximity to main roads for easy commute.

The Model Town area of Bahawalpur is known for its residential communities, and families here deserve a school that matches their expectations. The Country School provides exactly that – a premium educational experience without the need to travel far from home.

Our campus is designed to create an optimal learning environment with spacious classrooms, outdoor areas for physical activities, and a welcoming atmosphere that makes students feel at home.

Come visit us at our Model Town-B campus to see why we are the preferred school in the area. Contact us at 0322-6107000 or 0305-7457171 for more information.`
  },
  "importance-of-education-bahawalpur": {
    title: "Importance of Quality Education in Bahawalpur – Building Pakistan's Future",
    excerpt: "Quality education transforms communities.",
    date: "2026-01-15",
    readTime: "6 min",
    category: "Education",
    keywords: ["education in bahawalpur", "schools in bahawalpur pakistan", "quality education pakistan"],
    content: `Education is the cornerstone of any society's development, and Bahawalpur is no exception. As one of the historic cities of Punjab, Pakistan, Bahawalpur has a rich cultural heritage and a growing need for quality educational institutions.

The Country School Fahad Campus is proud to be part of Bahawalpur's educational landscape. We believe that every child in Bahawalpur deserves access to education that prepares them for the challenges of the modern world.

The current state of education in Bahawalpur presents both challenges and opportunities including growing demand for quality English medium education, need for schools that balance academics with character development, importance of affordable education for middle-class families, and requirement for modern teaching methodologies.

At The Country School, we address all these needs through our comprehensive educational approach. Our students are not just academically prepared but are also equipped with critical thinking skills, moral values, and the confidence to succeed in life.

We actively participate in the educational development of Bahawalpur through community engagement, educational workshops, and open events that bring families together. Our vision is to make Bahawalpur known for its educational excellence across Pakistan.

Together, let's build a brighter future for Bahawalpur through the power of quality education. Join The Country School family today.`
  },
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSchoolSettings();
  const post = slug ? blogPosts[slug] : null;

  if (!post) return <Navigate to="/blog" replace />;

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
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            <Link to="/admission-query">
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground">Apply Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.category}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {post.readTime} read
            </span>
          </div>

          <h1 className="mb-8 font-display text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            {post.title}
          </h1>

          <div className="prose prose-lg max-w-none">
            {post.content.split("\n\n").map((para, i) => (
              <p key={i} className="mb-5 text-base leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </div>

          {/* Keywords */}
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {post.keywords.map((kw) => (
              <span key={kw} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {kw}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-lg border border-border bg-card p-8 text-center shadow-card">
            <h2 className="font-display text-xl font-bold text-foreground">Interested in The Country School?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Submit an admission inquiry or call us to learn more.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link to="/admission-query">
                <Button className="gradient-primary border-0 text-primary-foreground">Submit Inquiry</Button>
              </Link>
              <a href="tel:03226107000">
                <Button variant="outline">Call 0322-6107000</Button>
              </a>
            </div>
          </div>
        </div>
      </article>

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

export default BlogPost;
