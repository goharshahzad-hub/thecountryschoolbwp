import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  title: string;
  desc: string;
  icon: string;
}

export interface WebsiteContent {
  hero: { tagline: string };
  stats: StatItem[];
  features: FeatureItem[];
  about: { heading: string; subheading: string };
}

const defaults: WebsiteContent = {
  hero: { tagline: "Empowering young minds with quality education, strong values, and a nurturing environment since day one." },
  stats: [
    { value: "500+", label: "Students Enrolled" },
    { value: "35+", label: "Expert Teachers" },
    { value: "20+", label: "Years of Excellence" },
    { value: "95%", label: "Success Rate" },
  ],
  features: [
    { title: "Academic Excellence", desc: "Comprehensive curriculum designed for holistic student development", icon: "GraduationCap" },
    { title: "Expert Faculty", desc: "Dedicated and qualified teachers committed to nurturing young minds", icon: "Users" },
    { title: "Modern Learning", desc: "State-of-the-art facilities and innovative teaching methodologies", icon: "BookOpen" },
    { title: "Co-Curricular Activities", desc: "Sports, arts, and extracurricular programs for well-rounded growth", icon: "Trophy" },
    { title: "Safe Environment", desc: "Secure campus with caring staff ensuring student well-being", icon: "Shield" },
    { title: "Structured Schedule", desc: "Well-organized timetables maximizing learning outcomes", icon: "Clock" },
  ],
  about: { heading: "Why Choose Us", subheading: "Building tomorrow's leaders with today's best education" },
};

export const useWebsiteContent = () => {
  const [content, setContent] = useState<WebsiteContent>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    const { data } = await supabase.from("website_content").select("section_key, content");
    if (data) {
      const mapped = { ...defaults };
      data.forEach((row: any) => {
        if (row.section_key in mapped) {
          (mapped as any)[row.section_key] = row.content;
        }
      });
      setContent(mapped);
    }
    setLoading(false);
  };

  const updateSection = async (key: string, value: any) => {
    const { error } = await supabase
      .from("website_content")
      .update({ content: value, updated_at: new Date().toISOString() })
      .eq("section_key", key);
    if (!error) {
      setContent(prev => ({ ...prev, [key]: value }));
    }
    return error;
  };

  useEffect(() => { fetchContent(); }, []);

  return { content, loading, updateSection, refetch: fetchContent };
};
