// Generates a 6-digit verification code for sensitive admin actions
// (approve/revoke admin, reset admin password) and emails it to the master
// owner inbox (goharshahzad@gmail.com). The actor must enter the code in the
// UI; verify-admin-action checks it and performs the action.
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

const sha256Hex = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const ACTION_LABELS: Record<string, string> = {
  approve_admin: "Approve New Admin",
  revoke_admin: "Revoke Admin Access",
  reset_admin_password: "Reset Admin Password",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Caller must be an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const anonClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const { action_type, target_user_id, target_email, target_name } = body || {};
    if (!action_type || !ACTION_LABELS[action_type]) {
      return new Response(JSON.stringify({ error: "Invalid action_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code_hash = await sha256Hex(code);

    const { data: inserted, error: insertErr } = await adminClient.from("admin_verification_codes").insert({
      code_hash,
      action_type,
      target_user_id: target_user_id || null,
      target_email: target_email || null,
      payload: { target_name: target_name || null },
      requested_by: user.id,
    }).select("id, expires_at").single();
    if (insertErr) throw insertErr;

    const label = ACTION_LABELS[action_type];
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a2e;border-bottom:2px solid #b91c1c;padding-bottom:10px;">🔐 Admin Action Verification</h2>
        <p>A verification code is required to complete the following action on <strong>The Country School Admin Panel</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Action</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(label)}</td></tr>
          <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Target</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(target_name || target_email || target_user_id || "—")}</td></tr>
          <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Requested by</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(user.email || user.id)}</td></tr>
        </table>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;text-align:center;margin:20px 0;">
          <p style="margin:0;color:#7f1d1d;font-size:13px;">Your one-time code (valid 15 minutes):</p>
          <p style="margin:8px 0 0;font-size:34px;letter-spacing:8px;font-weight:bold;color:#b91c1c;">${code}</p>
        </div>
        <p style="font-size:12px;color:#666;">If you did not initiate this action, do not share this code. Simply ignore this email and the action will not proceed.</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "The Country School <onboarding@resend.dev>",
        to: [MASTER_EMAIL],
        subject: `🔐 Verification Code: ${label}`,
        html,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(d)}`);
    }

    return new Response(JSON.stringify({ success: true, code_id: inserted.id, expires_at: inserted.expires_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("request-admin-action-code error:", msg);
    return new Response(JSON.stringify({ error: "Failed to send code" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
