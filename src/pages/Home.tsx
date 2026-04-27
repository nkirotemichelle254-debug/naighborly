import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { AD_SLOTS, type Post, type PostCategory, type PostIntent } from "@/data/posts";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";

const AD_INTERVAL = 5;
const CATEGORY_FILTERS: Array<PostCategory | "All"> = ["All", "Item", "Service", "Swap"];
const INTENT_FILTERS: Array<PostIntent | "All"> = ["All", "Offer", "Request"];

function FeedCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className={`feed-card feed-card--${post.tone} ${post.urgent ? "is-urgent" : ""} animate-fade-in`}
    >
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
          className="feed-card__thumb"
        />
      )}
      <div className="feed-card__tags">
        <span className="feed-card__pill feed-card__pill--category">{post.category}</span>
        <span className={`feed-card__pill feed-card__pill--intent ${post.intent === "Request" ? "is-request" : ""}`}>
          {post.intent}
        </span>
        {post.urgent && <span className="feed-card__pill" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>Urgent</span>}
      </div>
      <h3 className="feed-card__title">{post.title}</h3>
      <p className="feed-card__description">{post.description}</p>
      <div className="feed-card__location">{post.location}</div>
    </Link>
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
            <FeedCard key={`p-${item.post.id}`} post={item.post} />
          ) : (
            <AdCard key={`a-${i}`} index={item.index} />
          ),
        )}
      </main>
    </div>
  );
}
