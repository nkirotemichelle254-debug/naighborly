import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X, Siren, MapPin, Sparkles, CheckCircle2, Map as MapIcon, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AD_SLOTS, type Post, type PostCategory, type PostIntent } from "@/data/posts";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import { useBlocks } from "@/context/BlocksContext";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge, type TrustTier } from "@/components/TrustBadge";
import { FeedCardSkeleton } from "@/components/FeedCardSkeleton";
import { NotificationBell } from "@/components/NotificationBell";
import { FeedMap } from "@/components/FeedMap";
import { DISTANCE_OPTIONS, distanceMeters, formatDistance } from "@/lib/distance";

const AD_INTERVAL = 5;
const CATEGORY_FILTERS: Array<PostCategory | "All"> = ["All", "Item", "Service", "Swap"];
const INTENT_FILTERS: Array<PostIntent | "All"> = ["All", "Offer", "Request"];

function FeedCard({ post, ownerTier, index, nearby, distanceLabel }: { post: Post; ownerTier?: TrustTier; index: number; nearby?: boolean; distanceLabel?: string }) {
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
              {(distanceLabel || nearby) && (
                <span className="feed-card__pill inline-flex items-center gap-1" style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
                  <MapPin className="size-3" /> {distanceLabel ?? "Near you"}
                </span>
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
              {(distanceLabel || nearby) && (
                <span className="feed-card__pill inline-flex items-center gap-1" style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
                  <MapPin className="size-3" /> {distanceLabel ?? "Near you"}
                </span>
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
  const { posts: rawPosts, loading, pendingCount, applyPending } = usePosts();
  const { isBlocked } = useBlocks();
  const allPosts = useMemo(() => rawPosts.filter((p) => !p.ownerId || !isBlocked(p.ownerId)), [rawPosts, isBlocked]);
  const [params, setParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(params.get("welcome") === "1");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | "All">("All");
  const [intentFilter, setIntentFilter] = useState<PostIntent | "All">("All");
  const [tierMap, setTierMap] = useState<Record<string, TrustTier>>({});
  const [radius, setRadius] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "map">("list");


  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => {
      setShowWelcome(false);
      const next = new URLSearchParams(params);
      next.delete("welcome");
      setParams(next, { replace: true });
    }, 6000);
    return () => clearTimeout(t);
  }, [showWelcome, params, setParams]);

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

  const userHood = (profile.location ?? "").trim().toLowerCase();
  const isNearby = (loc: string) =>
    Boolean(userHood) && loc.trim().toLowerCase() === userHood;

  const hasCoords = typeof profile.latitude === "number" && typeof profile.longitude === "number";
  const me = { latitude: profile.latitude, longitude: profile.longitude };

  // Distance in metres per post (null when either side has no coordinates)
  const distanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!hasCoords) return map;
    allPosts.forEach((p) => {
      const d = distanceMeters(me, { latitude: p.latitude, longitude: p.longitude });
      if (d !== null) map[p.id] = d;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPosts, hasCoords, profile.latitude, profile.longitude]);

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allPosts.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (intentFilter !== "All" && p.intent !== intentFilter) return false;
      if (radius !== null) {
        const d = distanceMap[p.id];
        if (d === undefined || d > radius) return false;
      }
      if (!q) return true;
      return [p.title, p.description, p.category, p.intent, p.location]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    // Sort: closest first when we know coordinates, else same-neighbourhood first
    if (hasCoords) {
      return [...filtered].sort((a, b) => {
        const ad = distanceMap[a.id] ?? Number.POSITIVE_INFINITY;
        const bd = distanceMap[b.id] ?? Number.POSITIVE_INFINITY;
        return ad - bd;
      });
    }
    if (!userHood) return filtered;
    return [...filtered].sort((a, b) => {
      const an = isNearby(a.location) ? 0 : 1;
      const bn = isNearby(b.location) ? 0 : 1;
      return an - bn;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryFilter, intentFilter, allPosts, userHood, radius, distanceMap, hasCoords]);

  // Urgent strip: pull non-resolved urgent posts (after filtering) into a pinned row
  const urgentPosts = useMemo(
    () => posts.filter((p) => p.urgent && !p.resolved).slice(0, 6),
    [posts],
  );
  const urgentIds = new Set(urgentPosts.map((p) => p.id));
  const feedPosts = posts.filter((p) => !urgentIds.has(p.id));

  // Live activity ribbon: count real (non-demo) posts created in the last 24h in user's neighbourhood
  const newTodayCount = useMemo(() => {
    if (!userHood) return 0;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return allPosts.filter((p) => {
      if (p.isDemo) return false;
      if (!isNearby(p.location)) return false;
      // p.time is a relative label; fall back to checking time string
      return /min|hour|Just now/i.test(p.time);
    }).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPosts, userHood]);

  // Resolved social proof: pick one recently resolved nearby post (non-demo, not already in feed prominently)
  const resolvedHighlight = useMemo(() => {
    const candidates = allPosts.filter(
      (p) => p.resolved && !p.isDemo && (!userHood || isNearby(p.location)),
    );
    return candidates[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPosts, userHood]);

  const items: Array<{ kind: "post"; post: Post } | { kind: "ad"; index: number }> = [];
  feedPosts.forEach((post, i) => {
    items.push({ kind: "post", post });
    if ((i + 1) % AD_INTERVAL === 0 && i !== feedPosts.length - 1) {
      items.push({ kind: "ad", index: Math.floor(i / AD_INTERVAL) });
    }
  });

  const hasActiveFilter = categoryFilter !== "All" || intentFilter !== "All" || radius !== null || query.trim().length > 0;

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="sticky top-0 z-30 kitenge-header backdrop-blur px-5 pt-6 pb-4 border-b border-border">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Naighborly</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isSignedIn && profile.location ? `Mambo, ${profile.name.split(" ")[0]} • ${profile.location}` : "Share what you have, find what you need"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to={isSignedIn ? "/profile" : "/login"} className="profile-chip" aria-label="Open profile">
              {isSignedIn ? profile.initials : "?"}
            </Link>
          </div>
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

      <AnimatePresence>
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-2 z-20 flex justify-center pointer-events-none px-5"
          >
            <button
              type="button"
              onClick={() => { applyPending(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="pointer-events-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-lg hover:opacity-90 transition"
            >
              <Sparkles className="size-3.5" />
              {pendingCount} new post{pendingCount === 1 ? "" : "s"} — tap to load
            </button>
          </motion.div>
        )}
      </AnimatePresence>


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
        {hasCoords && (
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label="Filter by distance">
            {DISTANCE_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setRadius(radius === o.meters ? null : o.meters)}
                data-active={radius === o.meters}
                className="filter-chip"
              >
                Within {o.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRadius(null)}
              data-active={radius === null}
              className="filter-chip"
            >
              Everywhere
            </button>
          </div>
        )}
        <div className="flex gap-2 -mx-1 px-1" role="group" aria-label="Feed view">
          <button
            type="button"
            onClick={() => setView("list")}
            data-active={view === "list"}
            className="filter-chip inline-flex items-center gap-1.5"
          >
            <List className="size-3.5" /> List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            data-active={view === "map"}
            className="filter-chip inline-flex items-center gap-1.5"
          >
            <MapIcon className="size-3.5" /> Map
          </button>
        </div>
      </div>



      <main className="px-5 py-5 grid gap-4">
        {isSignedIn && userHood && newTodayCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full bg-primary/10 border border-primary/30 px-4 py-2 text-sm inline-flex items-center gap-2 self-start"
          >
            <Sparkles className="size-4 text-primary" />
            <span><strong className="font-semibold">{newTodayCount} new post{newTodayCount === 1 ? "" : "s"}</strong> in {profile.location} today</span>
          </motion.div>
        )}
        <AnimatePresence>
          {showWelcome && isSignedIn && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="rounded-2xl bg-gradient-to-br from-accent/40 to-accent/10 border border-accent/40 p-5 relative overflow-hidden"
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-3 right-3 size-7 inline-flex items-center justify-center rounded-full bg-card/60"
                aria-label="Dismiss welcome"
              >
                <X className="size-3.5" />
              </button>
              <div className="text-2xl mb-1" aria-hidden>🌿</div>
              <strong className="font-display text-lg block">Karibu, {profile.name.split(" ")[0]}!</strong>
              <p className="text-sm text-muted-foreground mt-1">
                You're now part of {profile.location}. Browse what neighbours are sharing, then post something of your own when you're ready.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {isSignedIn && !profile.avatarUrl && (
          <Link
            to="/profile"
            className="rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 text-sm flex items-center justify-between gap-3 hover:bg-accent/25 transition animate-fade-in"
          >
            <span>
              <strong className="block">Add your profile photo</strong>
              <span className="text-muted-foreground">Helps neighbours trust you when meeting up.</span>
            </span>
            <span className="pill-button shrink-0" data-variant="ghost">Upload</span>
          </Link>
        )}
        {isSignedIn && !hasCoords && (
          <Link
            to="/profile"
            className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm flex items-center justify-between gap-3 hover:bg-primary/20 transition animate-fade-in"
          >
            <span>
              <strong className="block">Pin your neighbourhood on the map</strong>
              <span className="text-muted-foreground">Re-pick your area so we can show you what's actually close by.</span>
            </span>
            <span className="pill-button shrink-0" data-variant="ghost">Set location</span>
          </Link>
        )}
        {view === "map" && <FeedMap posts={posts} center={me} />}
        {view === "list" && (
        <>
        {loading && items.length === 0 && (
          <>
            <FeedCardSkeleton />
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </>
        )}
        {!loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="rounded-2xl border border-border bg-card p-8 text-center"
          >
            <div className="text-4xl mb-2" aria-hidden>🌿</div>
            <strong className="block font-display text-lg">
              {hasActiveFilter ? "No matches yet" : "Your neighbourhood is quiet"}
            </strong>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilter
                ? "Try clearing filters or a different search phrase."
                : "Be the first to share something — neighbours are waiting."}
            </p>
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategoryFilter("All");
                  setIntentFilter("All");
                  setRadius(null);
                }}
                className="pill-button mt-4"
                data-variant="ghost"
              >
                Clear filters
              </button>
            ) : (
              <Link to="/create" className="pill-button mt-4 inline-flex">Share something</Link>
            )}
          </motion.div>
        )}
        {urgentPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            aria-label="Needs help now"
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 grid gap-2"
          >
            <div className="flex items-center justify-between px-1">
              <strong className="font-display text-sm inline-flex items-center gap-1.5 text-destructive">
                <Siren className="size-4" /> Needs help now
              </strong>
              <span className="text-xs text-muted-foreground">{urgentPosts.length} urgent</span>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 snap-x">
              {urgentPosts.map((p) => (
                <Link
                  key={p.id}
                  to={`/post/${p.id}`}
                  className="snap-start shrink-0 w-[78%] max-w-[19rem] rounded-2xl border border-destructive/40 bg-card p-4 grid gap-1.5"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="feed-card__pill" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>Urgent</span>
                    <span className="feed-card__pill feed-card__pill--category">{p.category}</span>
                    {isNearby(p.location) && (
                      <span className="text-[10px] inline-flex items-center gap-0.5 text-accent-foreground bg-accent rounded-full px-2 py-0.5">
                        <MapPin className="size-2.5" /> Near
                      </span>
                    )}
                  </div>
                  <strong className="font-display leading-tight line-clamp-2">{p.title}</strong>
                  <span className="text-xs text-muted-foreground">{p.location} • {p.time}</span>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
        {resolvedHighlight && (
          <Link
            to={`/post/${resolvedHighlight.id}`}
            className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm flex items-center gap-3 hover:bg-muted/50 transition"
          >
            <CheckCircle2 className="size-5 text-primary shrink-0" />
            <span className="min-w-0">
              <strong className="font-semibold">{resolvedHighlight.owner.split(" ")[0]}</strong>
              <span className="text-muted-foreground"> resolved </span>
              <span className="truncate">"{resolvedHighlight.title}"</span>
              <span className="text-muted-foreground"> • {resolvedHighlight.time}</span>
            </span>
          </Link>
        )}
        {items.map((item, i) =>
          item.kind === "post" ? (
            <FeedCard
              key={`p-${item.post.id}`}
              index={i}
              post={item.post}
              ownerTier={item.post.ownerId ? tierMap[item.post.ownerId] : undefined}
              nearby={isNearby(item.post.location)}
              distanceLabel={
                distanceMap[item.post.id] !== undefined ? formatDistance(distanceMap[item.post.id]) : undefined
              }
            />
          ) : (
            <AdCard key={`a-${i}`} index={item.index} />
          ),
        )}
        </>
        )}
      </main>

    </div>
  );
}
