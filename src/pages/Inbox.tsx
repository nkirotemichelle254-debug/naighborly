import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge, type TrustTier } from "@/components/TrustBadge";
import { AsantiButton } from "@/components/AsantiButton";
import { ReportDialog } from "@/components/ReportDialog";

export default function Inbox() {
  const navigate = useNavigate();
  const { isSignedIn, loading } = useAuth();
  const { threads, sendMessage, markRead } = useMessages();
  const [params, setParams] = useSearchParams();
  const initialThread = params.get("thread");
  const [activeId, setActiveId] = useState<string | null>(initialThread ?? threads[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isSignedIn) navigate("/login?next=/inbox", { replace: true });
  }, [isSignedIn, loading, navigate]);

  useEffect(() => {
    if (activeId) markRead(activeId);
  }, [activeId, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => `${t.withName} ${t.preview}`.toLowerCase().includes(q));
  }, [threads, query]);

  const active = threads.find((t) => t.id === activeId);
  const [otherTier, setOtherTier] = useState<TrustTier>("new");

  useEffect(() => {
    if (!active?.withId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("trust_tier")
        .eq("id", active.withId)
        .maybeSingle();
      if (!cancelled && data) setOtherTier((data.trust_tier ?? "new") as TrustTier);
    })();
    return () => { cancelled = true; };
  }, [active?.withId]);

  const hasReceived = Boolean(active?.messages.some((m) => m.sender === "received"));

  const handleSend = () => {
    if (!active || !draft.trim()) return;
    sendMessage(active.id, draft);
    setDraft("");
  };

  // Mobile two-pane: list view OR thread view
  const showThread = Boolean(active && initialThread);

  return (
    <div className="min-h-screen animate-fade-in flex flex-col">
      {!active || !showThread ? (
        <>
          <header className="sticky top-0 z-30 bg-background/90 backdrop-blur px-5 py-4 border-b border-border">
            <h1 className="font-display text-2xl font-bold">Messages</h1>
            <label className="search-input mt-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search conversations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </header>
          <main className="px-5 py-4 grid gap-2">
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
              </div>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveId(t.id);
                  setParams({ thread: t.id });
                }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/50 transition"
              >
                <div className="size-11 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display font-bold">
                  {t.withInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate">{t.withName}</strong>
                    <span className="text-xs text-muted-foreground shrink-0">{t.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{t.preview}</p>
                </div>
                {t.unread && <span className="size-2.5 rounded-full bg-destructive" aria-label="Unread" />}
              </button>
            ))}
          </main>
        </>
      ) : (
        <>
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 backdrop-blur px-5 py-4 border-b border-border">
            <button
              onClick={() => {
                setParams({});
              }}
              className="size-9 inline-flex items-center justify-center rounded-full border border-border"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="size-10 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display font-bold">
              {active.withInitials}
            </div>
            <strong className="font-display text-lg">{active.withName}</strong>
          </header>

          <main className="flex-1 px-5 py-4 grid gap-2 content-start overflow-y-auto">
            {active.messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">Send the first message.</p>
            )}
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.sender === "sent"
                    ? "self-end bg-primary text-primary-foreground rounded-br-md"
                    : "self-start bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </main>

          <div className="sticky bottom-24 px-5 pb-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                type="submit"
                className="size-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-label="Send"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
