import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { AD_SLOTS, type Post, type PostCategory, type PostIntent } from "@/data/posts";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge, type TrustTier } from "@/components/TrustBadge";
import { FeedCardSkeleton } from "@/components/FeedCardSkeleton";

const AD_INTERVAL = 5;
const CATEGORY_FILTERS: Array<PostCategory | "All"> = ["All", "Item", "Service", "Swap"];
const INTENT_FILTERS: Array<PostIntent | "All"> = ["All", "Offer", "Request"];

function FeedCard({ post, ownerTier, index }: { post: Post; ownerTier?: TrustTier; index: number }) {
  const hasImage = Boolean(post.imageUrl);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2), type: "spring", stiffness: 220, damping: 24 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={`/post/${post.id}`}
        className={`feed-card ${hasImage ? "feed-card--photo" : `feed-card--${post.tone}`} ${post.urgent ? "is-urgent" : ""} block`}
      >
        {hasImage ? (
          <>
            <img src={post.imageUrl!} alt={post.title} loading="lazy" className="feed-card__photo" />
            <div className="feed-card__photo-scrim" />
            <div className="feed-card__photo-tags">
              <span className="feed-card__pill feed-card__pill--category">{post.category}</span>
              <span className={`feed-card__pill feed-card__pill--intent ${post.intent === "Request" ? "is-request" : ""}`}>
                {post.intent}
              </span>
              {post.urgent && (
                <span className="feed-card__pill" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>Urgent</span>
              )}
            </div>
            <div className="feed-card__photo-content">
              <h3 className="feed-card__title text-xl">{post.title}</h3>
              <p className="feed-card__description line-clamp-2">{post.description}</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="feed-card__location">{post.location}</div>
                <div className="flex items-center gap-1.5 text-xs opacity-90 min-w-0">
                  <span className="truncate max-w-[7rem]">{post.owner}</span>
                  {ownerTier && <TrustBadge tier={ownerTier} />}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="feed-card__tags">
              <span className="feed-card__pill feed-card__pill--category">{post.category}</span>
              <span className={`feed-card__pill feed-card__pill--intent ${post.intent === "Request" ? "is-request" : ""}`}>
                {post.intent}
              </span>
              {post.urgent && (
                <span className="feed-card__pill" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>Urgent</span>
              )}
            </div>
            <h3 className="feed-card__title">{post.title}</h3>
            <p className="feed-card__description">{post.description}</p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="feed-card__location">{post.location}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <span className="truncate max-w-[7rem]">{post.owner}</span>
                {ownerTier && <TrustBadge tier={ownerTier} />}
              </div>
            </div>
          </>
        )}
      </Link>
    </motion.div>
  );
}

function AdCard({ index }: { index: number }) {
  const ad = AD_SLOTS[index % AD_SLOTS.length];
  return (
    <aside className="feed-ad-slot animate-fade-in" aria-label="Sponsored">
      <div className="feed-ad-slot__header">
        <span className="feed-ad-slot__tag">{ad.tag}</span>
        <span className="feed-ad-slot__hint">Ad</span>
      </div>
      <h3 className="feed-ad-slot__title">{ad.title}</h3>
      <p className="feed-ad-slot__body">{ad.body}</p>
      <button type="button" className="feed-ad-slot__cta">{ad.cta}</button>
    </aside>
  );
}

export default function Home() {
  const { profile, isSignedIn } = useAuth();
  const { posts: allPosts } = usePosts();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | "All">("All");
  const [intentFilter, setIntentFilter] = useState<PostIntent | "All">("All");
  const [tierMap, setTierMap] = useState<Record<string, TrustTier>>({});

  useEffect(() => {
    const ownerIds = Array.from(
      new Set(allPosts.filter((p) => p.ownerId && !p.isDemo).map((p) => p.ownerId as string)),
    );
    if (ownerIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, trust_tier")
        .in("id", ownerIds);
      if (cancelled || !data) return;
      const map: Record<string, TrustTier> = {};
      data.forEach((p) => { map[p.id] = (p.trust_tier ?? "new") as TrustTier; });
      setTierMap(map);
    })();
    return () => { cancelled = true; };
  }, [allPosts]);

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPosts.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (intentFilter !== "All" && p.intent !== intentFilter) return false;
      if (!q) return true;
      return [p.title, p.description, p.category, p.intent, p.location]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, categoryFilter, intentFilter, allPosts]);

  const items: Array<{ kind: "post"; post: Post } | { kind: "ad"; index: number }> = [];
  posts.forEach((post, i) => {
    items.push({ kind: "post", post });
    if ((i + 1) % AD_INTERVAL === 0 && i !== posts.length - 1) {
      items.push({ kind: "ad", index: Math.floor(i / AD_INTERVAL) });
    }
  });

  const hasActiveFilter = categoryFilter !== "All" || intentFilter !== "All" || query.trim().length > 0;

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="sticky top-0 z-30 kitenge-header backdrop-blur px-5 pt-6 pb-4 border-b border-border">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Naighborly</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Share what you have, find what you need</p>
          </div>
          <Link to={isSignedIn ? "/profile" : "/login"} className="profile-chip" aria-label="Open profile">
            {isSignedIn ? profile.initials : "?"}
          </Link>
        </header>

        <label className="search-input mt-4">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Sema… what are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="px-5 pt-4 grid gap-2">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label="Filter by category">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              data-active={categoryFilter === c}
              className="filter-chip"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label="Filter by intent">
          {INTENT_FILTERS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIntentFilter(i)}
              data-active={intentFilter === i}
              className="filter-chip"
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <main className="px-5 py-5 grid gap-4">
        {isSignedIn && !profile.avatarUrl && (
          <Link
            to="/profile"
            className="rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 text-sm flex items-center justify-between gap-3 hover:bg-accent/25 transition animate-fade-in"
          >
            <span>
              <strong className="block">Add your profile photo</strong>
              <span className="text-muted-foreground">Helps neighbors trust you when meeting up.</span>
            </span>
            <span className="pill-button shrink-0" data-variant="ghost">Upload</span>
          </Link>
        )}
        {items.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <strong className="block font-display">No matching posts yet</strong>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilter
                ? "Try clearing filters or a different search phrase."
                : "Be the first to share something with your neighbors."}
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategoryFilter("All");
                  setIntentFilter("All");
                }}
                className="pill-button mt-4"
                data-variant="ghost"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        {items.map((item, i) =>
          item.kind === "post" ? (
            <FeedCard key={`p-${item.post.id}`} index={i} post={item.post} ownerTier={item.post.ownerId ? tierMap[item.post.ownerId] : undefined} />
          ) : (
            <AdCard key={`a-${i}`} index={item.index} />
          ),
        )}
      </main>
    </div>
  );
}
