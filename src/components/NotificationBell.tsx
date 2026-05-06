import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { supabase } from "@/integrations/supabase/client";

export function NotificationBell() {
  const { isSignedIn, user } = useAuth();
  const { threads } = useMessages();
  const [recentAsanti, setRecentAsanti] = useState(0);

  const unreadThreads = threads.filter((t) => t.unread).length;

  useEffect(() => {
    if (!user) return;
    const seenKey = `naighborly:asanti-seen:${user.id}`;
    let cancelled = false;

    const refresh = async () => {
      const since = localStorage.getItem(seenKey) ?? new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await supabase
        .from("asanti")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .gt("created_at", since);
      if (!cancelled) setRecentAsanti(count ?? 0);
    };
    refresh();

    const channel = supabase
      .channel(`asanti-bell-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "asanti", filter: `receiver_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!isSignedIn) return null;

  const total = unreadThreads + recentAsanti;
  const handleClick = () => {
    if (user && recentAsanti > 0) {
      localStorage.setItem(`naighborly:asanti-seen:${user.id}`, new Date().toISOString());
      setRecentAsanti(0);
    }
  };

  return (
    <Link
      to="/inbox"
      onClick={handleClick}
      className="relative size-10 inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-muted/50 transition"
      aria-label={`Notifications${total ? `, ${total} new` : ""}`}
    >
      <Bell className="size-4" />
      {total > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold inline-flex items-center justify-center"
        >
          {total > 9 ? "9+" : total}
        </motion.span>
      )}
    </Link>
  );
}
