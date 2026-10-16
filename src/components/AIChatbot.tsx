import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, GraduationCap, CalendarCheck, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Ui =
  | { type: "seats"; class_name: string; capacity: number; available: number; status: string }
  | { type: "slots"; days: { date: string; slots: string[] }[] }
  | { type: "lead"; lead_id: string; prefill: Record<string, string> }
  | { type: "visit"; visit_date: string; time_slot: string };

interface Msg { role: "user" | "assistant"; content: string; ui?: Ui[] }

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });

const AIChatbot = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Assalam o Alaikum! I'm the Admissions Officer of The Country School. I can check seats, register your child and book a campus visit. Which class are you looking for?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, busy]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admissions-officer", {
        body: { messages: next.slice(-30).map(({ role, content }) => ({ role, content })) },
      });
      const d = data as { reply?: string; error?: string; ui?: Ui[] } | null;
      if (error && !d?.error) throw error;
      setMessages([...next, { role: "assistant", content: d?.reply || d?.error || "Please try again.", ui: d?.ui }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I'm briefly unavailable. Please try again, or call 0322-6107000." }]);
    } finally {
      setBusy(false);
    }
  };

  const renderUi = (u: Ui, k: number) => {
    if (u.type === "seats") {
      const tone = u.status === "open" ? "text-primary" : u.status === "limited" ? "text-secondary-foreground" : "text-destructive";
      return (
        <div key={k} className="mt-2 rounded-xl border border-border bg-card p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> {u.class_name}</div>
          <p className={`mt-1 font-medium ${tone}`}>
            {u.status === "waitlist" ? "Waitlist only" : `${u.available} seat${u.available === 1 ? "" : "s"} available`}
            {u.status === "limited" && " · filling fast"}
          </p>
        </div>
      );
    }
    if (u.type === "slots") {
      return (
        <div key={k} className="mt-2 space-y-2 rounded-xl border border-border bg-card p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold"><CalendarCheck className="h-4 w-4" /> Pick a visit slot</div>
          {u.days.slice(0, 4).map(d => (
            <div key={d.date}>
              <p className="mb-1 text-muted-foreground">{fmtDate(d.date)}</p>
              <div className="flex flex-wrap gap-1">
                {d.slots.map(s => (
                  <button key={s} disabled={busy} onClick={() => send(`Please book ${fmtDate(d.date)} (${d.date}) at ${s}`)}
                    className="rounded-full border border-primary/40 px-2 py-0.5 text-primary hover:bg-primary hover:text-primary-foreground">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (u.type === "lead") {
      return (
        <div key={k} className="mt-2 rounded-xl border border-border bg-card p-3 text-xs">
          <p className="font-semibold">✅ Enquiry registered</p>
          <Button size="sm" variant="outline" className="mt-2 h-7 w-full text-xs"
            onClick={() => navigate(`/admission-query?${new URLSearchParams(u.prefill).toString()}`)}>
            <FileText className="mr-1 h-3 w-3" /> Complete full form (photo, Form-B)
          </Button>
        </div>
      );
    }
    if (u.type === "visit") {
      return (
        <div key={k} className="mt-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs">
          <p className="flex items-center gap-2 font-semibold"><CalendarCheck className="h-4 w-4" /> Visit booked</p>
          <p className="mt-1">{fmtDate(u.visit_date)} · {u.time_slot}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open admissions officer"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:scale-105 transition-transform">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[580px] max-h-[85vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">Admissions Officer</p>
                <p className="text-[10px] opacity-80">Seats · Registration · Campus visits</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-primary-foreground/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%]">
                  <div className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.content.replace(/\*\*(.+?)\*\*/g, "$1")}
                  </div>
                  {m.ui?.map(renderUi)}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1">
                {["Seats in Class-1?", "Admission for Nursery", "Book a campus visit"].map(q => (
                  <button key={q} onClick={() => send(q)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">{q}</button>
                ))}
              </div>
            )}
            {busy && <div className="w-fit rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">Typing…</div>}
          </div>
          <div className="border-t border-border p-2">
            <div className="flex items-center gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }}
                placeholder="Type in English or Roman Urdu…" disabled={busy} />
              <Button size="icon" onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
