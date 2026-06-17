import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Search, Check, CheckCheck, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { usePosts } from "@/context/PostsContext";
import { useBlocks } from "@/context/BlocksContext";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge, type TrustTier } from "@/components/TrustBadge";
import { AsantiButton } from "@/components/AsantiButton";
import { ReportDialog } from "@/components/ReportDialog";
import { SafetyScreen } from "@/components/SafetyScreen";
import { QuickReplies } from "@/components/QuickReplies";
import { BlockButton } from "@/components/BlockButton";

export default function Inbox() {
  const navigate = useNavigate();
  const { isSignedIn, loading, user } = useAuth();
  const { threads: allThreads, sendMessage, markRead } = useMessages();
  const { isBlocked } = useBlocks();
  const threads = useMemo(() => allThreads.filter((t) => !isBlocked(t.withId)), [allThreads, isBlocked]);
  const { getById } = usePosts();
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

  // Asanti prompt: has the current user already sent asante for this thread?
  const [hasGivenAsanti, setHasGivenAsanti] = useState(false);
  useEffect(() => {
    if (!active || !user) { setHasGivenAsanti(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("asanti")
        .select("id")
        .eq("giver_id", user.id)
        .eq("thread_id", active.id)
        .maybeSingle();
      if (!cancelled) setHasGivenAsanti(Boolean(data));
    })();
    return () => { cancelled = true; };
  }, [active?.id, user]);

  // Typing indicator via Supabase broadcast
  const [otherTyping, setOtherTyping] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!active || !user) return;
    const ch = supabase.channel(`typing-${active.id}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload?.userId === user.id) return;
      setOtherTyping(true);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setOtherTyping(false), 3000);
    }).subscribe();
    typingChannelRef.current = ch;
    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
      setOtherTyping(false);
    };
  }, [active?.id, user]);

  const broadcastTyping = () => {
    if (!user || !typingChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  };

  // Asanti prompt trigger: thread is "quiet" (>24h since last activity) OR linked post is resolved
  const linkedPost = active?.postId ? getById(active.postId) : undefined;
  const lastActivityAgeMs = active ? Date.now() - new Date(active.updatedAt).getTime() : 0;
  const isQuiet = lastActivityAgeMs > 24 * 60 * 60 * 1000;
  const showAsantiPrompt = Boolean(active && hasReceived && !hasGivenAsanti && (isQuiet || linkedPost?.resolved));

  // Read receipt: last sent message; if other side has read all (otherUnread=false), show double check
  const lastSentId = active ? [...active.messages].reverse().find((m) => m.sender === "sent")?.id : undefined;
  const lastSentRead = active ? !active.otherUnread : false;

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
            <button
              onClick={() => navigate(`/user/${active.withId}`)}
              className="size-10 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display font-bold shrink-0"
              aria-label={`View ${active.withName}'s profile`}
            >
              {active.withInitials}
            </button>
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/user/${active.withId}`)}
                className="font-display text-lg font-bold truncate block text-left"
              >
                {active.withName}
              </button>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <TrustBadge tier={otherTier} />
                {hasReceived && (
                  <AsantiButton threadId={active.id} receiverId={active.withId} receiverName={active.withName} />
                )}
                <ReportDialog reportedUserId={active.withId} />
                <BlockButton targetUserId={active.withId} targetName={active.withName} />

              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-4 flex flex-col gap-2 overflow-y-auto">
            {active.messages.length === 0 && (
              <div className="text-center py-10 grid gap-2">
                <div className="text-3xl" aria-hidden>👋</div>
                <p className="text-sm text-muted-foreground">
                  Say hi to {active.withName.split(" ")[0]} — a warm opener goes a long way.
                </p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {active.messages.map((m) => {
                const isLastSent = m.id === lastSentId;
                return (
                  <div key={m.id} className={`flex flex-col ${m.sender === "sent" ? "items-end" : "items-start"}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.sender === "sent"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </motion.div>
                    {isLastSent && (
                      <span className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-0.5">
                        {lastSentRead ? (
                          <><CheckCheck className="size-3 text-primary" /> Seen</>
                        ) : (
                          <><Check className="size-3" /> Sent</>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
            {otherTyping && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-start bg-muted text-foreground rounded-2xl rounded-bl-md px-4 py-2 inline-flex items-center gap-1"
                aria-label={`${active.withName} is typing`}
              >
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </main>

          <SafetyScreen
            otherUserId={active.withId}
            otherName={active.withName}
            enabled={active.messages.length === 0 && !hasReceived}
            category={linkedPost?.category}
            intent={linkedPost?.intent}
            urgent={linkedPost?.urgent}
          />

          <div className="sticky bottom-24 px-5 pb-2 grid gap-2">
            {showAsantiPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3"
              >
                <Heart className="size-5 text-primary fill-current shrink-0" />
                <div className="flex-1 min-w-0 text-sm">
                  <strong className="block">Did {active.withName.split(" ")[0]} help you?</strong>
                  <span className="text-muted-foreground text-xs">
                    {linkedPost?.resolved ? "You marked this resolved — share the love." : "It's been quiet for a day — a thank-you boosts their standing."}
                  </span>
                </div>
                <AsantiButton threadId={active.id} receiverId={active.withId} receiverName={active.withName} />
              </motion.div>
            )}
            <QuickReplies hasReceived={hasReceived} onPick={(text) => setDraft(text)} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
            >
              <input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); broadcastTyping(); }}
                placeholder="Type a message…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                className="size-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-label="Send"
              >
                <Send className="size-4" />
              </motion.button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
