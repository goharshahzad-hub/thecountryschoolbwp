// Verifies a 6-digit code (issued by request-admin-action-code) and executes
// the requested action server-side using the service role.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sha256Hex = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const anonClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const { code, action_type, target_user_id, target_email } = body || {};
    if (!code || !action_type) {
      return new Response(JSON.stringify({ error: "code and action_type required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code_hash = await sha256Hex(String(code).trim());
    const nowIso = new Date().toISOString();

    let q = adminClient.from("admin_verification_codes").select("*")
      .eq("code_hash", code_hash).eq("action_type", action_type)
      .is("used_at", null).gt("expires_at", nowIso);
    if (target_user_id) q = q.eq("target_user_id", target_user_id);
    else if (target_email) q = q.eq("target_email", target_email);
    const { data: codeRow } = await q.maybeSingle();
    if (!codeRow) {
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark consumed first to prevent races
    await adminClient.from("admin_verification_codes").update({ used_at: nowIso }).eq("id", codeRow.id);

    // Execute the action
    if (action_type === "approve_admin") {
      if (!target_user_id) throw new Error("target_user_id required");
      // Insert role (ignore unique conflict if already admin)
      await adminClient.from("user_roles").insert({ user_id: target_user_id, role: "admin" }).then(() => {}, () => {});
      await adminClient.from("admin_requests").update({
        status: "approved", reviewed_by: user.id, reviewed_at: nowIso,
      }).eq("user_id", target_user_id).eq("status", "pending");
    } else if (action_type === "revoke_admin") {
      if (!target_user_id) throw new Error("target_user_id required");
      await adminClient.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "admin");
    } else if (action_type === "reset_admin_password") {
      if (!target_email) throw new Error("target_email required");
      // Issue a recovery link the user can use to set a new password
      const { error } = await adminClient.auth.admin.generateLink({
        type: "recovery", email: target_email,
        options: { redirectTo: `${new URL(req.url).origin.replace("functions.", "")}/reset-password` },
      } as any);
      if (error) throw error;
    } else {
      throw new Error("Unknown action_type");
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    console.error("verify-admin-action error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
