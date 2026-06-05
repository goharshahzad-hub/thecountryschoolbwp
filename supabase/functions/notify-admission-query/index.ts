import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const queryId: string | undefined = body?.query_id;
    if (!queryId || typeof queryId !== "string") {
      return new Response(JSON.stringify({ error: "query_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the row actually exists and was created very recently.
    // This prevents attackers from directly invoking this function with
    // arbitrary payloads to flood the admin inbox.
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: row } = await adminClient
      .from("admission_queries")
      .select("student_name, father_name, phone, email, applying_for_class, message, created_at")
      .eq("id", queryId)
      .maybeSingle();

    if (!row) {
      return new Response(JSON.stringify({ error: "Query not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ageMs = Date.now() - new Date(row.created_at as string).getTime();
    if (ageMs > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Query too old" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const student_name = esc(row.student_name);
    const father_name = esc(row.father_name);
    const phone = esc(row.phone);
    const email = esc(row.email || "Not provided");
    const applying_for_class = esc(row.applying_for_class);
    const message = row.message ? esc(row.message) : "";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #b91c1c; padding-bottom: 10px;">
          📋 New Admission Inquiry
        </h2>
        <p>A new admission inquiry has been submitted on <strong>The Country School — Fahad Campus</strong> website.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Student Name</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${student_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Father Name</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${father_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Phone</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Email</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Applying for Class</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${applying_for_class}</td>
          </tr>
          ${message ? `<tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Message</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${message}</td>
          </tr>` : ""}
        </table>
        <p>Please log in to the <a href="https://thecountryschoolbwp.lovable.app/dashboard/admission-queries" style="color: #b91c1c; font-weight: bold;">Admin Dashboard</a> to review this inquiry.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">This is an automated notification from The Country School Management System.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "The Country School <onboarding@resend.dev>",
        to: ["thecountryschoolbwp@gmail.com"],
        subject: `New Admission Inquiry: ${row.student_name} — Class ${row.applying_for_class}`,
        html: htmlBody,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending admission notification:", msg);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
