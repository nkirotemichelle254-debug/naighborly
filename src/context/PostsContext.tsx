import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { SEED_POSTS, type Post, type PostCategory, type PostIntent, type PostTone } from "@/data/posts";

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

function toneFor(category: PostCategory): PostTone {
  if (category === "Service") return "blue";
  if (category === "Swap") return "gold";
  return "charcoal";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

interface PostRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: PostCategory;
  intent: PostIntent;
  location: string;
  phone: string | null;
  allow_calls: boolean;
  urgent: boolean;
  image_url: string | null;
  resolved: boolean;
  note: string | null;
  created_at: string;
}

function rowToPost(r: PostRow, ownerNames = new Map<string, string>()): Post {
  const owner = ownerNames.get(r.owner_id) ?? "Neighbor";
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    details: r.description,
    category: r.category,
    intent: r.intent,
    location: r.location,
    tone: toneFor(r.category),
    owner,
    ownerInitials: getInitials(owner),
    time: timeAgo(r.created_at),
    allowCalls: r.allow_calls,
    phone: r.phone ?? "",
    note: r.note ?? "Confirm the exact item, service, or swap terms before meeting in person.",
    urgent: r.urgent,
    resolved: r.resolved,
    ownerId: r.owner_id,
    imageUrl: r.image_url,
  };
}

export interface PostDraft {
  title: string;
  description: string;
  category: PostCategory;
  intent: PostIntent;
  location: string;
  allowCalls: boolean;
  phone: string;
  urgent: boolean;
  imageFile?: File | null;
}

interface PostsContextValue {
  posts: Post[];
  favorites: string[];
  loading: boolean;
  pendingCount: number;
  applyPending: () => Promise<void>;
  getById: (id: string) => Post | undefined;
  refresh: () => Promise<void>;
  createPost: (draft: PostDraft) => Promise<Post | null>;
  updatePost: (id: string, patch: Partial<Pick<Post, "title" | "description" | "location" | "resolved">>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchAndSet = useCallback(async () => {
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({
        title: "Couldn't load the feed",
        description: error.message,
        variant: "destructive",
      });
      setPosts(SEED_POSTS.map((p) => ({ ...p, isDemo: true })));
      return;
    }
    if (!data || data.length === 0) {
      setPosts(SEED_POSTS.map((p) => ({ ...p, isDemo: true })));
      return;
    }

    const rows = data as PostRow[];
    const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id)));
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ownerIds);
    const ownerNames = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "Neighbor"]));
    setPosts(rows.map((row) => rowToPost(row, ownerNames)));
  }, []);

  const refresh = useCallback(async () => {
    await fetchAndSet();
    setPendingCount(0);
  }, [fetchAndSet]);

  const applyPending = refresh;

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const { data } = await supabase.from("favorites").select("post_id").eq("user_id", user.id);
    setFavorites(data?.map((d) => d.post_id) ?? []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchAndSet().finally(() => setLoading(false));
  }, [fetchAndSet]);

  // Realtime: queue inserts as "pending" so user can opt-in via pill; apply updates/deletes immediately
  useEffect(() => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const row = payload.new as PostRow | undefined;
          // Don't count own posts — they are already inserted optimistically
          if (row && user && row.owner_id === user.id) return;
          setPendingCount((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        () => { fetchAndSet(); },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        () => { fetchAndSet(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAndSet, user]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const getById = useCallback((id: string) => posts.find((p) => p.id === id), [posts]);

  const createPost = useCallback(
    async (draft: PostDraft): Promise<Post | null> => {
      if (!user) {
        toast({ title: "Sign in required", description: "Please log in to create a post.", variant: "destructive" });
        return null;
      }

      let imageUrl: string | null = null;
      if (draft.imageFile) {
        const ext = draft.imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, draft.imageFile);
        if (upErr) {
          toast({
            title: "Image upload failed",
            description: upErr.message,
            variant: "destructive",
          });
          return null;
        }
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          owner_id: user.id,
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category,
          intent: draft.intent,
          location: draft.location.trim() || "Nairobi",
          phone: draft.phone.trim(),
          allow_calls: draft.allowCalls,
          urgent: draft.urgent,
          image_url: imageUrl,
        })
        .select("*")
        .single();

      if (error || !data) {
        toast({
          title: "Couldn't publish post",
          description: error?.message ?? "Please try again.",
          variant: "destructive",
        });
        return null;
      }
      const ownerName = user.user_metadata?.full_name ?? user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Neighbor";
      const post = rowToPost(data as PostRow, new Map([[user.id, ownerName]]));
      setPosts((prev) => [post, ...prev.filter((p) => !SEED_POSTS.some((seed) => seed.id === p.id))]);
      return post;
    },
    [user],
  );

  const updatePost = useCallback(
    async (id: string, patch: Partial<Pick<Post, "title" | "description" | "location" | "resolved">>) => {
      const dbPatch: { title?: string; description?: string; location?: string; resolved?: boolean } = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.location !== undefined) dbPatch.location = patch.location;
      if (patch.resolved !== undefined) dbPatch.resolved = patch.resolved;
      const { error } = await supabase.from("posts").update(dbPatch).eq("id", id);
      if (error) {
        toast({
          title: "Couldn't update post",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, details: patch.description ?? p.details } : p)));
    },
    [],
  );

  const deletePost = useCallback(async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      toast({
        title: "Couldn't delete post",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setFavorites((prev) => prev.filter((f) => f !== id));
  }, []);

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!user) {
        toast({ title: "Sign in required", description: "Log in to save posts.", variant: "destructive" });
        return;
      }
      const isFav = favorites.includes(id);
      if (isFav) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("post_id", id);
        if (error) {
          toast({ title: "Couldn't remove favorite", description: error.message, variant: "destructive" });
          return;
        }
        setFavorites((prev) => prev.filter((f) => f !== id));
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, post_id: id });
        if (error) {
          toast({ title: "Couldn't save favorite", description: error.message, variant: "destructive" });
          return;
        }
        setFavorites((prev) => [id, ...prev]);
      }
    },
    [user, favorites],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const value = useMemo<PostsContextValue>(
    () => ({ posts, favorites, loading, getById, refresh, createPost, updatePost, deletePost, toggleFavorite, isFavorite }),
    [posts, favorites, loading, getById, refresh, createPost, updatePost, deletePost, toggleFavorite, isFavorite],
  );

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
