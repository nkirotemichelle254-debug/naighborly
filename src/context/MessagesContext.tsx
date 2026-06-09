import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { sendPush } from "@/lib/push";

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "N"
  );
}

function timeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export interface Message {
  id: string;
  sender: "sent" | "received";
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  postId?: string;
  withName: string;
  withInitials: string;
  preview: string;
  time: string;
  unread: boolean;
  otherUnread: boolean;
  updatedAt: string;
  messages: Message[];
  withId: string;
}

interface MessagesContextValue {
  threads: Thread[];
  loading: boolean;
  getThread: (id: string) => Thread | undefined;
  ensureThreadForPost: (postId: string, ownerUserId: string, ownerName: string) => Promise<Thread | null>;
  sendMessage: (threadId: string, text: string) => Promise<void>;
  markRead: (threadId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

interface ThreadRow {
  id: string;
  post_id: string | null;
  user_a: string;
  user_b: string;
  preview: string | null;
  unread_for_a: boolean;
  unread_for_b: boolean;
  updated_at: string;
}

interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const buildThreads = useCallback(
    async (rows: ThreadRow[], currentUserId: string): Promise<Thread[]> => {
      if (rows.length === 0) return [];
      const otherIds = Array.from(new Set(rows.map((r) => (r.user_a === currentUserId ? r.user_b : r.user_a))));
      const { data: profilesData } = await supabase.from("profiles").select("id, display_name").in("id", otherIds);
      const nameById = new Map((profilesData ?? []).map((p) => [p.id, p.display_name ?? "Neighbor"]));

      const threadIds = rows.map((r) => r.id);
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true });

      const byThread = new Map<string, MessageRow[]>();
      (messagesData ?? []).forEach((m) => {
        const arr = byThread.get(m.thread_id) ?? [];
        arr.push(m as MessageRow);
        byThread.set(m.thread_id, arr);
      });

      return rows.map((r) => {
        const isA = r.user_a === currentUserId;
        const otherId = isA ? r.user_b : r.user_a;
        const withName = nameById.get(otherId) ?? "Neighbor";
        const msgs = byThread.get(r.id) ?? [];
        return {
          id: r.id,
          postId: r.post_id ?? undefined,
          withId: otherId,
          withName,
          withInitials: getInitials(withName),
          preview: r.preview ?? "Start a conversation",
          time: timeShort(r.updated_at),
          updatedAt: r.updated_at,
          unread: isA ? r.unread_for_a : r.unread_for_b,
          otherUnread: isA ? r.unread_for_b : r.unread_for_a,
          messages: msgs.map((m) => ({
            id: m.id,
            sender: m.sender_id === currentUserId ? "sent" : "received",
            text: m.body,
            at: timeShort(m.created_at),
          })),
        };
      });
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!user) {
      setThreads([]);
      return;
    }
    const { data } = await supabase
      .from("threads")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("updated_at", { ascending: false });
    const built = await buildThreads((data ?? []) as ThreadRow[], user.id);
    setThreads(built);
  }, [user, buildThreads]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Realtime: refresh when messages or threads change
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-and-threads")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, () => {
        refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const getThread = useCallback((id: string) => threads.find((t) => t.id === id), [threads]);

  const ensureThreadForPost = useCallback(
    async (postId: string, ownerUserId: string, _ownerName: string): Promise<Thread | null> => {
      if (!user) return null;
      if (ownerUserId === user.id) return null;
      // Try both ordering combos
      const { data: existing } = await supabase
        .from("threads")
        .select("*")
        .eq("post_id", postId)
        .or(`and(user_a.eq.${user.id},user_b.eq.${ownerUserId}),and(user_a.eq.${ownerUserId},user_b.eq.${user.id})`)
        .maybeSingle();

      let row: ThreadRow | null = (existing as ThreadRow) ?? null;
      if (!row) {
        const { data: created, error } = await supabase
          .from("threads")
          .insert({ post_id: postId, user_a: user.id, user_b: ownerUserId })
          .select("*")
          .single();
        if (error || !created) return null;
        row = created as ThreadRow;
      }
      const built = await buildThreads([row], user.id);
      const t = built[0];
      setThreads((prev) => (prev.some((p) => p.id === t.id) ? prev : [t, ...prev]));
      return t;
    },
    [user, buildThreads],
  );

  const sendMessage = useCallback(
    async (threadId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !user) return;
      await supabase.from("messages").insert({ thread_id: threadId, sender_id: user.id, body: trimmed });
      // Update thread preview + flag unread for the other side
      const t = threads.find((x) => x.id === threadId);
      if (t) {
        const { data: row } = await supabase.from("threads").select("user_a, user_b").eq("id", threadId).single();
        if (row) {
          const otherIsA = row.user_a !== user.id;
          await supabase
            .from("threads")
            .update({
              preview: trimmed,
              unread_for_a: otherIsA ? true : false,
              unread_for_b: otherIsA ? false : true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", threadId);
        }
        // Best-effort web push
        const senderName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "A neighbor";
        sendPush(t.withId, `${senderName}`, trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed, { url: `/inbox?thread=${threadId}`, tag: `thread-${threadId}` });
      }
    },
    [user, threads],
  );

  const markRead = useCallback(
    async (threadId: string) => {
      if (!user) return;
      const { data: row } = await supabase.from("threads").select("user_a").eq("id", threadId).single();
      if (!row) return;
      const isA = row.user_a === user.id;
      await supabase
        .from("threads")
        .update(isA ? { unread_for_a: false } : { unread_for_b: false })
        .eq("id", threadId);
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread: false } : t)));
    },
    [user],
  );

  const value = useMemo<MessagesContextValue>(
    () => ({ threads, loading, getThread, ensureThreadForPost, sendMessage, markRead, refresh }),
    [threads, loading, getThread, ensureThreadForPost, sendMessage, markRead, refresh],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
}
