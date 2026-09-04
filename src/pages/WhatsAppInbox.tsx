import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, RefreshCw, ArrowDownLeft, ArrowUpRight, Bot, User, Inbox } from "lucide-react";

type WaMessage = {
  id: string;
  direction: string;
  provider: string | null;
  from_number: string | null;
  to_number: string | null;
  body: string | null;
  ai_reply: string | null;
  status: string | null;
  created_at: string;
};

type RangeKey = "24h" | "7d" | "30d" | "all";

const RANGES: Record<RangeKey, { label: string; since: () => string | null }> = {
  "24h": { label: "Last 24 hours", since: () => new Date(Date.now() - 24 * 3600e3).toISOString() },
  "7d": { label: "Last 7 days", since: () => new Date(Date.now() - 7 * 86400e3).toISOString() },
  "30d": { label: "Last 30 days", since: () => new Date(Date.now() - 30 * 86400e3).toISOString() },
  all: { label: "All time", since: () => null },
};

const chatNumber = (m: WaMessage) =>
  m.direction === "inbound" ? m.from_number : (m.to_number || m.from_number);

const WhatsAppInbox = () => {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeKey>("30d");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("whatsapp_messages")
      .select("id, direction, provider, from_number, to_number, body, ai_reply, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    const since = RANGES[range].since();
    if (since) q = q.gte("created_at", since);
    const { data, error } = await q;
    if (error) {
      setMessages([]);
    } else {
      setMessages((data as WaMessage[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [range]);

  const filtered = useMemo(() => {
    const s = search.replace(/[^0-9+]/g, "");
    if (!s) return messages;
    return messages.filter((m) =>
      (chatNumber(m) || "").replace(/[^0-9+]/g, "").includes(s)
    );
  }, [messages, search]);

  const conversations = useMemo(() => {
    const map = new Map<string, WaMessage[]>();
    for (const m of filtered) {
      const num = chatNumber(m) || "unknown";
      if (!map.has(num)) map.set(num, []);
      map.get(num)!.push(m);
    }
    return [...map.entries()]
      .map(([number, msgs]) => ({ number, msgs, latest: msgs[0] }))
      .sort((a, b) => b.latest.created_at.localeCompare(a.latest.created_at));
  }, [filtered]);

  const activeNumber = selectedNumber ?? conversations[0]?.number ?? null;
  const thread = conversations.find((c) => c.number === activeNumber)?.msgs ?? [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Inbox className="h-6 w-6" /> WhatsApp Inbox
          </h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-56"
                placeholder="Search by number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RANGES) as RangeKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{RANGES[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Conversation list */}
          <Card className="lg:col-span-1">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
              {conversations.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  {loading ? "Loading…" : "No messages in this range."}
                </p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.number}
                  onClick={() => setSelectedNumber(c.number)}
                  className={`w-full rounded-md p-3 text-left transition-colors ${
                    activeNumber === c.number ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-medium">{c.number}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(c.latest.created_at), "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.latest.body || c.latest.ai_reply || ""}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <Badge variant="outline" className="text-[10px]">{c.msgs.length} msg</Badge>
                    {c.latest.provider && (
                      <Badge variant="secondary" className="text-[10px]">{c.latest.provider}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Thread view */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b py-3">
              <CardTitle className="font-mono text-sm">
                {activeNumber || "Select a conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-4">
              {[...thread].reverse().map((m) => (
                <div key={m.id} className="space-y-2">
                  {/* Parent message */}
                  <div className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        m.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="mb-0.5 flex items-center gap-1 text-[10px] opacity-70">
                        {m.direction === "outbound" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {m.direction === "outbound" ? "School (sent)" : "Parent"} · {format(new Date(m.created_at), "dd MMM yyyy, HH:mm")}
                        {m.status && <> · {m.status}</>}
                      </div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  </div>
                  {/* AI reply bubble */}
                  {m.ai_reply && (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                        <div className="mb-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Bot className="h-3 w-3" /> AI auto-reply
                        </div>
                        <p className="whitespace-pre-wrap">{m.ai_reply}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {thread.length === 0 && (
                <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
                  <User className="mr-2 h-5 w-5" /> No conversation selected
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppInbox;
