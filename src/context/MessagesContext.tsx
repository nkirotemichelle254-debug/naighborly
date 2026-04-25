import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const THREADS_KEY = "naighborly-message-threads";

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
  messages: Message[];
}

const SEED_THREADS: Thread[] = [
  {
    id: "office-chair-thread",
    postId: "office-chair-available",
    withName: "Sarah Kamau",
    withInitials: "SK",
    preview: "Sure, let's confirm a public pickup point.",
    time: "10m",
    unread: false,
    messages: [
      { id: "1", sender: "received", text: "Hi, is the office chair available?", at: "10:01" },
      { id: "2", sender: "sent", text: "Yes, it is. What condition were you hoping for?", at: "10:02" },
      { id: "3", sender: "received", text: "Good. Can I come by tomorrow?", at: "10:03" },
      { id: "4", sender: "sent", text: "Sure, let's confirm a public pickup point in town.", at: "10:04" },
    ],
  },
  {
    id: "plumbing-thread",
    postId: "plumbing-services-offered",
    withName: "David Otieno",
    withInitials: "DO",
    preview: "Perfect. I will send a photo of the leak first.",
    time: "1h",
    unread: true,
    messages: [
      { id: "1", sender: "received", text: "Can plumbing services work tomorrow?", at: "9:00" },
      { id: "2", sender: "sent", text: "Yes, I have an opening after 10am.", at: "9:05" },
      { id: "3", sender: "received", text: "Perfect. I will send a photo of the leak first.", at: "9:07" },
    ],
  },
  {
    id: "book-swap-thread",
    postId: "book-swap-psychology-novels",
    withName: "Grace Wanjiru",
    withInitials: "GW",
    preview: "Yes, send them through.",
    time: "3pm",
    unread: false,
    messages: [
      { id: "1", sender: "received", text: "I have two clean fiction titles if you're still swapping.", at: "2:50" },
      { id: "2", sender: "sent", text: "Yes, send them through and I can compare with mine.", at: "3:00" },
    ],
  },
  {
    id: "tutor-thread",
    postId: "looking-for-a-tutor",
    withName: "Brian Kimani",
    withInitials: "BK",
    preview: "Yes, still looking for someone nearby.",
    time: "Yesterday",
    unread: false,
    messages: [
      { id: "1", sender: "received", text: "Is your tutor post still open?", at: "Yesterday" },
      { id: "2", sender: "sent", text: "Yes, still looking for someone nearby with weekday availability.", at: "Yesterday" },
    ],
  },
];

interface MessagesContextValue {
  threads: Thread[];
  getThread: (id: string) => Thread | undefined;
  ensureThreadForPost: (postId: string, withName: string, withInitials: string) => Thread;
  sendMessage: (threadId: string, text: string) => void;
  markRead: (threadId: string) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>(() => readJson<Thread[]>(THREADS_KEY, SEED_THREADS));

  useEffect(() => { localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); }, [threads]);

  const getThread = useCallback((id: string) => threads.find((t) => t.id === id), [threads]);

  const ensureThreadForPost = useCallback((postId: string, withName: string, withInitials: string): Thread => {
    const existing = threads.find((t) => t.postId === postId);
    if (existing) return existing;
    const next: Thread = {
      id: `${postId}-thread-${Date.now().toString(36)}`,
      postId,
      withName,
      withInitials,
      preview: "Start a conversation",
      time: "Just now",
      unread: false,
      messages: [],
    };
    setThreads((prev) => [next, ...prev]);
    return next;
  }, [threads]);

  const sendMessage = useCallback((threadId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              preview: trimmed,
              time: "Just now",
              messages: [...t.messages, { id: `m-${Date.now()}`, sender: "sent", text: trimmed, at: "Now" }],
            }
          : t,
      ),
    );
  }, []);

  const markRead = useCallback((threadId: string) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread: false } : t)));
  }, []);

  const value = useMemo<MessagesContextValue>(
    () => ({ threads, getThread, ensureThreadForPost, sendMessage, markRead }),
    [threads, getThread, ensureThreadForPost, sendMessage, markRead],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
}
