import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SchoolSettings {
  school_name: string;
  campus: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  motto: string;
}

const defaults: SchoolSettings = {
  school_name: "The Country School",
  campus: "Model Town Fahad Campus",
  city: "Bahawalpur",
  phone: "+92 322 6107000",
  email: "thecountryschoolbwp@gmail.com",
  address: "Model Town Fahad Campus, Bahawalpur",
  motto: "Towards Academic Excellence",
};

let cached: SchoolSettings | null = null;

export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings>(cached || defaults);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    supabase.from("school_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        const s: SchoolSettings = {
          school_name: data.school_name,
          campus: data.campus,
          city: data.city,
          phone: data.phone,
          email: data.email,
          address: data.address,
          motto: data.motto,
        };
        cached = s;
        setSettings(s);
      }
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}
