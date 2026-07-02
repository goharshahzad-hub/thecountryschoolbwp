// AI assistant edge function — powered by Lovable AI (free monthly allowance).
// Actions: rephrase | result_comment | chat
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MODEL = "google/gemini-2.5-flash";

interface Body {
  action: "rephrase" | "result_comment" | "chat";
  text?: string;
  tone?: string;                          // rephrase
  student_name?: string;                  // result_comment
  class_name?: string;
  subjects?: Array<{ subject: string; obtained: number; total: number }>;
  attendance_percent?: number;
  previous_percent?: number;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  school_name?: string;
}

function buildMessages(b: Body): { system: string; user: string } {
  switch (b.action) {
    case "rephrase": {
      const tone = b.tone || "polite, professional, parent-friendly";
      return {
        system:
          "You are a school communications assistant. Rephrase WhatsApp messages sent to parents in Pakistan. Keep it concise (under 120 words), respectful, culturally appropriate, and preserve every fact, date, amount, and name exactly. Output only the rephrased message — no preamble.",
        user: `Rephrase in a ${tone} tone:\n\n${b.text || ""}`,
      };
    }
    case "result_comment": {
      const total = (b.subjects || []).reduce((s, x) => s + (x.total || 0), 0);
      const got = (b.subjects || []).reduce((s, x) => s + (x.obtained || 0), 0);
      const pct = total ? ((got / total) * 100).toFixed(1) : "0";
      const subjectLines = (b.subjects || [])
        .map((s) => `- ${s.subject}: ${s.obtained}/${s.total}`)
        .join("\n");
      return {
        system:
          "You are a warm, encouraging school teacher writing a short personalised remark (2–3 sentences, max 45 words) for a student's result card. Mention effort, note the strongest subject, and give one specific improvement suggestion. Compare with previous term if given. Never be harsh.",
        user: `Student: ${b.student_name || "the student"} (${b.class_name || ""})
Overall: ${got}/${total} (${pct}%)
Attendance: ${b.attendance_percent ?? "N/A"}%
Previous term: ${b.previous_percent ?? "N/A"}%
Subjects:
${subjectLines}

Write the remark now.`,
      };
    }
    case "chat":
    default: {
      return {
        system: `You are the friendly virtual assistant for ${b.school_name || "The Country School Fahad Campus"} in Bahawalpur, Pakistan. Help visitors with admissions, fees, timings, curriculum (Reception, Nursery, Prep, Class 1–8), and contact info. If you don't know something specific, invite them to submit an admission query or call the school. Keep replies short (under 80 words), warm and professional.`,
        user: b.text || "",
      };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const body = (await req.json()) as Body;
    if (!body?.action) throw new Error("Missing action");

    const { system, user } = buildMessages(body);
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: system },
    ];
    if (body.action === "chat" && Array.isArray(body.history)) {
      for (const m of body.history.slice(-6)) {
        if (m?.role && m?.content) messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: "user", content: user });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages }),
    });

    if (res.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI rate limit reached. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (res.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted for this workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway ${res.status}: ${t}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-assistant error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
