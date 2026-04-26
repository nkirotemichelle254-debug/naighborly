import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { AD_SLOTS, type Post } from "@/data/posts";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";

const AD_INTERVAL = 5;

function FeedCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className={`feed-card feed-card--${post.tone} ${post.urgent ? "is-urgent" : ""} animate-fade-in`}
    >
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

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPosts;
    return allPosts.filter((p) =>
      [p.title, p.description, p.category, p.intent, p.location].join(" ").toLowerCase().includes(q),
    );
  }, [query, allPosts]);

  const items: Array<{ kind: "post"; post: Post } | { kind: "ad"; index: number }> = [];
  posts.forEach((post, i) => {
    items.push({ kind: "post", post });
    if ((i + 1) % AD_INTERVAL === 0 && i !== posts.length - 1) {
      items.push({ kind: "ad", index: Math.floor(i / AD_INTERVAL) });
    }
  });

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

      <main className="px-5 py-5 grid gap-4">
        {items.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <strong className="block font-display">No matching posts yet</strong>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search phrase or create a new community post.
            </p>
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
