// WhatsApp inbound webhook — auto-replies using ai-assistant (chat action).
// Public endpoint (verify_jwt = false). Configure this URL as the "When a message
// comes in" webhook for your WhatsApp provider (Twilio, Meta Cloud API, etc.).
//
// Supports two shapes:
//   1. Twilio WhatsApp: application/x-www-form-urlencoded with `Body`, `From`.
//      Responds with TwiML (<Response><Message>…</Message></Response>).
//   2. Meta WhatsApp Cloud API: application/json webhook events. Handles the
//      GET hub.challenge verification and POST message events, returning JSON.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const META_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "";
const MODEL = "google/gemini-2.5-flash";
const SCHOOL_NAME = "The Country School Fahad Campus";

const SYSTEM_PROMPT = `You are the friendly WhatsApp virtual assistant for ${SCHOOL_NAME} in Bahawalpur, Pakistan. Reply on the school's behalf to parents and prospective parents. Cover admissions, fees, timings, curriculum (Reception, Nursery, Prep, Class 1–8), events and contact details. If a query needs a human (fee dispute, complaint, urgent matter), politely say the school office will follow up and share the contact numbers 0322-6107000 / 0305-7457171. Keep replies under 70 words, warm, respectful and in the sender's language (English or Urdu roman).`;

async function askAi(userText: string): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
    }),
  });
  if (res.status === 429) return "Our assistant is a little busy right now. The school office will get back to you shortly. — " + SCHOOL_NAME;
  if (res.status === 402) return "Thank you for your message. Our office will respond shortly. — " + SCHOOL_NAME;
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error", res.status, t);
    return "Thank you for reaching out. Our office will get back to you soon. — " + SCHOOL_NAME;
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || "").trim() || "Thank you for your message. — " + SCHOOL_NAME;
}

function twimlResponse(text: string): Response {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/xml" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Meta WhatsApp Cloud API webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && token === META_VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // Twilio (form-encoded)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      const body = String(form.get("Body") || "").trim();
      const from = String(form.get("From") || "");
      console.log("WhatsApp inbound (Twilio) from", from, ":", body);
      if (!body) return twimlResponse("Assalam o Alaikum! How can we help you today?");
      const reply = await askAi(body);
      return twimlResponse(reply);
    }

    // Meta Cloud API (JSON)
    const payload = await req.json().catch(() => ({}));
    const change = payload?.entry?.[0]?.changes?.[0]?.value;
    const msg = change?.messages?.[0];
    const text = msg?.text?.body?.trim();
    const from = msg?.from;
    console.log("WhatsApp inbound (Meta) from", from, ":", text);

    if (!text) {
      // Status update or unsupported message type — acknowledge.
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = await askAi(text);
    return new Response(JSON.stringify({ ok: true, reply, to: from }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-webhook error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
