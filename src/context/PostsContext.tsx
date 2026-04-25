import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SEED_POSTS, type Post, type PostCategory, type PostIntent, type PostTone } from "@/data/posts";

const POSTS_KEY = "naighborly-user-posts";
const FAVORITES_KEY = "naighborly-favorite-posts";
const DELETED_KEY = "naighborly-deleted-posts";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function toneFor(category: PostCategory): PostTone {
  if (category === "Service") return "blue";
  if (category === "Swap") return "gold";
  return "charcoal";
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
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
  owner?: string;
}

interface PostsContextValue {
  posts: Post[];
  favorites: string[];
  getById: (id: string) => Post | undefined;
  createPost: (draft: PostDraft) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  deletePost: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [userPosts, setUserPosts] = useState<Post[]>(() => readJson<Post[]>(POSTS_KEY, []));
  const [deletedIds, setDeletedIds] = useState<string[]>(() => readJson<string[]>(DELETED_KEY, []));
  const [favorites, setFavorites] = useState<string[]>(() => readJson<string[]>(FAVORITES_KEY, []));

  useEffect(() => { localStorage.setItem(POSTS_KEY, JSON.stringify(userPosts)); }, [userPosts]);
  useEffect(() => { localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds)); }, [deletedIds]);
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);

  const posts = useMemo<Post[]>(() => {
    const deleted = new Set(deletedIds);
    const userIds = new Set(userPosts.map((p) => p.id));
    const seedFiltered = SEED_POSTS.filter((p) => !deleted.has(p.id) && !userIds.has(p.id));
    return [...userPosts, ...seedFiltered];
  }, [userPosts, deletedIds]);

  const getById = useCallback((id: string) => posts.find((p) => p.id === id), [posts]);

  const createPost = useCallback((draft: PostDraft): Post => {
    const owner = draft.owner ?? "Michael Heri";
    const id = `${slugify(draft.title)}-${Date.now().toString(36)}`;
    const post: Post = {
      id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      details: draft.description.trim(),
      category: draft.category,
      intent: draft.intent,
      location: draft.location.trim() || "Nairobi",
      tone: toneFor(draft.category),
      owner,
      ownerInitials: getInitials(owner),
      time: "Just now",
      allowCalls: draft.allowCalls,
      phone: draft.phone.trim(),
      note: "Confirm the exact item, service, or swap terms before meeting in person.",
      urgent: draft.urgent,
    };
    setUserPosts((prev) => [post, ...prev]);
    return post;
  }, []);

  const updatePost = useCallback((id: string, patch: Partial<Post>) => {
    setUserPosts((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (exists) return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const seed = SEED_POSTS.find((p) => p.id === id);
      if (!seed) return prev;
      return [{ ...seed, ...patch }, ...prev];
    });
  }, []);

  const deletePost = useCallback((id: string) => {
    setUserPosts((prev) => prev.filter((p) => p.id !== id));
    setDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setFavorites((prev) => prev.filter((f) => f !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [id, ...prev]));
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const value = useMemo<PostsContextValue>(
    () => ({ posts, favorites, getById, createPost, updatePost, deletePost, toggleFavorite, isFavorite }),
    [posts, favorites, getById, createPost, updatePost, deletePost, toggleFavorite, isFavorite],
  );

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
