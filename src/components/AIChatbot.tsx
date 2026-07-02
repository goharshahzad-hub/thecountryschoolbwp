import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

interface Msg { role: "user" | "assistant"; content: string; }

const AIChatbot = () => {
  const { settings } = useSchoolSettings();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Assalam o Alaikum! I'm the ${settings.school_name} virtual assistant. Ask me about admissions, fees, timings or curriculum.` },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "chat",
          text,
          history: next.slice(-8),
          school_name: settings.school_name,
        },
      });
      if (error) throw error;
      const reply = (data as any)?.reply || "Sorry, I couldn't respond. Please try again or submit an admission query.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: "The assistant is briefly unavailable. Please try again in a moment, or use the Admission form to reach us." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open school assistant"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[520px] w-[92vw] max-w-sm flex-col rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <div>
                <p className="text-sm font-semibold leading-tight">School Assistant</p>
                <p className="text-[10px] opacity-80">AI · Beta</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">Typing…</div>
              </div>
            )}
          </div>
          <div className="border-t border-border p-2">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") send(); }}
                placeholder="Ask about admissions, fees…"
                disabled={busy}
              />
              <Button size="icon" onClick={send} disabled={busy || !input.trim()} className="gradient-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              Responses may be inaccurate. For official info, contact the school.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
