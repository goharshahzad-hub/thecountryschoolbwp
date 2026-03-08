import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { full_name, email, phone } = await req.json();

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #16213e; padding-bottom: 10px;">
          🔔 New Admin Access Request
        </h2>
        <p>A new admin access request has been submitted for <strong>The Country School — Fahad Campus</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Name</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${full_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Email</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Phone</td>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${phone || "Not provided"}</td>
          </tr>
        </table>
        <p>Please log in to the <a href="https://thecountryschoolbwp.lovable.app/dashboard/admin-requests" style="color: #16213e; font-weight: bold;">Admin Dashboard</a> to review and approve/reject this request.</p>
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
        subject: `New Admin Request: ${full_name}`,
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
    console.error("Error sending notification:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
