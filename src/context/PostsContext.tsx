import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Post, PostCategory, PostIntent, PostTone } from "@/data/posts";

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

interface PostRowWithProfile {
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
  profiles?: { display_name: string | null } | null;
}

function rowToPost(r: PostRowWithProfile): Post {
  const owner = r.profiles?.display_name ?? "Neighbor";
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

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles:owner_id(display_name)")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPosts(data.map((row) => rowToPost(row as unknown as PostRowWithProfile)));
    }
  }, []);

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
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const getById = useCallback((id: string) => posts.find((p) => p.id === id), [posts]);

  const createPost = useCallback(
    async (draft: PostDraft): Promise<Post | null> => {
      if (!user) return null;

      let imageUrl: string | null = null;
      if (draft.imageFile) {
        const ext = draft.imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, draft.imageFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
          imageUrl = pub.publicUrl;
        }
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
        .select("*, profiles:owner_id(display_name)")
        .single();

      if (error || !data) return null;
      const post = rowToPost(data as unknown as PostRowWithProfile);
      setPosts((prev) => [post, ...prev]);
      return post;
    },
    [user],
  );

  const updatePost = useCallback(
    async (id: string, patch: Partial<Pick<Post, "title" | "description" | "location" | "resolved">>) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.location !== undefined) dbPatch.location = patch.location;
      if (patch.resolved !== undefined) dbPatch.resolved = patch.resolved;
      const { error } = await supabase.from("posts").update(dbPatch).eq("id", id);
      if (!error) {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, details: patch.description ?? p.details } : p)));
      }
    },
    [],
  );

  const deletePost = useCallback(async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setFavorites((prev) => prev.filter((f) => f !== id));
    }
  }, []);

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!user) return;
      const isFav = favorites.includes(id);
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("post_id", id);
        setFavorites((prev) => prev.filter((f) => f !== id));
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, post_id: id });
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
