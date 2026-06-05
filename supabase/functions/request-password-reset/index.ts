// Public endpoint: an admin or teacher can request a password reset.
// Instead of sending the user a reset link directly, we email the master
// owner (goharshahzad@gmail.com) an "approve" link. Only when the master
// owner clicks approve does the user receive the real reset link.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTER_EMAIL = "goharshahzad@gmail.com";
const esc = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const role = body?.role === "teacher" ? "teacher" : "admin";
    const siteUrl = String(body?.site_url || "https://thecountryschoolbwp.lovable.app");
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Valid email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate-limit: at most one pending request per email in the last 5 minutes
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await adminClient.from("password_reset_requests")
      .select("id").eq("email", email).eq("status", "pending").gte("requested_at", since).limit(1);
    if (recent && recent.length > 0) {
      // Respond success regardless to prevent email enumeration
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    const ipAddress = req.headers.get("x-forwarded-for") || null;
    const { data: inserted, error: insErr } = await adminClient.from("password_reset_requests").insert({
      email, user_role: role, approval_token: token, ip_address: ipAddress,
    }).select("id").single();
    if (insErr) throw insErr;

    const approveUrl = `${supabaseUrl}/functions/v1/approve-password-reset?token=${token}&site=${encodeURIComponent(siteUrl)}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a2e;border-bottom:2px solid #b91c1c;padding-bottom:10px;">🔑 Password Reset Approval Needed</h2>
        <p>A password reset has been requested for the following account on <strong>The Country School Admin Panel</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Email</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(email)}</td></tr>
          <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Account type</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(role)}</td></tr>
          <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Requested at</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(new Date().toLocaleString("en-PK"))}</td></tr>
          ${ipAddress ? `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">IP</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(ipAddress)}</td></tr>` : ""}
        </table>
        <p>If you recognise this request, click the button below to send the user a password reset link. Otherwise, simply ignore this email.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${esc(approveUrl)}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;">Approve &amp; send reset link</a>
        </p>
        <p style="font-size:12px;color:#666;">This approval link expires in 1 hour.</p>
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "The Country School <onboarding@resend.dev>",
        to: [MASTER_EMAIL],
        subject: `🔑 Approve password reset — ${email}`,
        html,
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      console.error("Resend error", r.status, d);
    }

    return new Response(JSON.stringify({ success: true, request_id: inserted.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    console.error("request-password-reset error:", msg);
    // Return success even on error to prevent enumeration
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
