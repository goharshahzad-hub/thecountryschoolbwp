// GET endpoint hit when the master owner clicks the approve link from their
// inbox. Validates the token, marks the request approved, then triggers the
// real password reset email to the user via Supabase Auth admin API.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const html = (status: "ok" | "expired" | "invalid" | "error", message: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Password reset approval</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,-apple-system,Arial,sans-serif;background:#f8fafc;margin:0;padding:48px 16px;color:#0f172a;}
.card{max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.05);}
.ok{color:#15803d;} .bad{color:#b91c1c;} .warn{color:#a16207;}
h1{margin:0 0 12px;font-size:22px;} p{margin:8px 0;color:#475569;}
</style></head>
<body><div class="card">
<div style="font-size:48px;line-height:1;margin-bottom:8px;">${status === "ok" ? "✅" : status === "expired" ? "⏰" : "❌"}</div>
<h1 class="${status === "ok" ? "ok" : status === "expired" ? "warn" : "bad"}">${
  status === "ok" ? "Password reset approved" :
  status === "expired" ? "Link expired" :
  status === "invalid" ? "Invalid link" : "Something went wrong"
}</h1>
<p>${message}</p>
</div></body></html>`;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const site = url.searchParams.get("site") || "https://thecountryschoolbwp.lovable.app";
    if (!token) return new Response(html("invalid", "No approval token provided."), { status: 400, headers: { "Content-Type": "text/html" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: row } = await adminClient.from("password_reset_requests")
      .select("*").eq("approval_token", token).maybeSingle();
    if (!row) return new Response(html("invalid", "This approval link is not recognised."), { status: 404, headers: { "Content-Type": "text/html" } });
    if (row.status !== "pending") return new Response(html("ok", `This request was already ${row.status}. No action needed.`), { headers: { "Content-Type": "text/html" } });
    if (new Date(row.expires_at) < new Date()) {
      await adminClient.from("password_reset_requests").update({ status: "expired" }).eq("id", row.id);
      return new Response(html("expired", "This approval link has expired. Please ask the user to submit a new password-reset request."), { status: 410, headers: { "Content-Type": "text/html" } });
    }

    // Send the actual recovery email through Supabase Auth
    const { error: authErr } = await adminClient.auth.resetPasswordForEmail(row.email, {
      redirectTo: `${site}/reset-password`,
    });
    if (authErr) {
      console.error("resetPasswordForEmail error", authErr);
      return new Response(html("error", "Could not send the reset email to the user. Please try again later."), { status: 500, headers: { "Content-Type": "text/html" } });
    }

    await adminClient.from("password_reset_requests").update({
      status: "approved", approved_at: new Date().toISOString(),
    }).eq("id", row.id);

    return new Response(html("ok", `A password reset link has been emailed to ${row.email}. They can click it to choose a new password.`), { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    console.error("approve-password-reset error:", e);
    return new Response(html("error", "Unexpected error. Please try again."), { status: 500, headers: { "Content-Type": "text/html" } });
  }
});
