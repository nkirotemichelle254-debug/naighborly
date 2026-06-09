import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface BlocksContextValue {
  blockedIds: Set<string>;
  isBlocked: (id: string) => boolean;
  refresh: () => Promise<void>;
}

const BlocksContext = createContext<BlocksContextValue | null>(null);

export function BlocksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setBlockedIds(new Set()); return; }
    const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
    setBlockedIds(new Set((data ?? []).map((r) => r.blocked_id)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`blocks-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "blocks", filter: `blocker_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  const value = useMemo<BlocksContextValue>(() => ({
    blockedIds,
    isBlocked: (id: string) => blockedIds.has(id),
    refresh,
  }), [blockedIds, refresh]);

  return <BlocksContext.Provider value={value}>{children}</BlocksContext.Provider>;
}

export function useBlocks() {
  const ctx = useContext(BlocksContext);
  if (!ctx) throw new Error("useBlocks must be used within BlocksProvider");
  return ctx;
}
