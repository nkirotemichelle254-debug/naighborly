import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePosts } from "@/context/PostsContext";
import { useAuth } from "@/context/AuthContext";
import { TrustBadge, type TrustTier } from "@/components/TrustBadge";
import { ReportDialog } from "@/components/ReportDialog";

interface PublicProfile {
  id: string;
  display_name: string;
  neighborhood: string | null;
  bio: string | null;
  avatar_url: string | null;
  trust_tier: TrustTier;
  asanti_received: number;
  created_at: string;
}

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

export default function UserProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, loading: authLoading, profile: me } = useAuth();
  const { posts } = usePosts();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      navigate(`/login?next=/user/${id}`, { replace: true });
    }
  }, [authLoading, isSignedIn, navigate, id]);

  useEffect(() => {
    if (!isSignedIn || !id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, neighborhood, bio, avatar_url, trust_tier, asanti_received, created_at")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as PublicProfile);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isSignedIn]);

  const userPosts = posts.filter((p) => p.ownerId === id && !p.isDemo);
  const isMe = me.id === id;

  return (
    <div className="min-h-screen animate-fade-in pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 backdrop-blur px-5 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="size-9 inline-flex items-center justify-center rounded-full border border-border" aria-label="Back">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="font-display text-xl font-bold">Neighbor profile</h1>
      </header>

      <main className="px-5 py-5 grid gap-4">
        {loading && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading neighbor…</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <strong className="block font-display">Neighbor not found</strong>
            <p className="text-sm text-muted-foreground mt-1">This profile may have been removed.</p>
            <Link to="/home" className="pill-button mt-4 inline-flex" data-variant="ghost">Back to feed</Link>
          </div>
        )}

        {!loading && profile && (
          <>
            <article className="rounded-2xl border border-border bg-card p-6 grid gap-4 text-center">
              <div className="mx-auto size-20 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-2xl font-bold overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="size-full object-cover" />
                ) : (
                  getInitials(profile.display_name)
                )}
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">{profile.display_name}</h2>
                {profile.neighborhood && (
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-1">
                    <MapPin className="size-3.5" /> {profile.neighborhood}
                  </p>
                )}
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
              {isMe && (
                <Link to="/profile" className="pill-button mx-auto" data-variant="ghost">
                  Edit your profile
                </Link>
              )}
            </article>

            <section className="grid gap-3">
              <h3 className="font-display text-lg font-bold px-1">
                Posts by {isMe ? "you" : profile.display_name.split(" ")[0]} ({userPosts.length})
              </h3>
              {userPosts.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isMe ? "You haven't posted yet." : "No posts yet."}
                  </p>
                </div>
              ) : (
                userPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className={`feed-card feed-card--${post.tone} ${post.urgent ? "is-urgent" : ""}`}
                  >
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt={post.title} loading="lazy" className="feed-card__thumb" />
                    )}
                    <div className="feed-card__tags">
                      <span className="feed-card__pill feed-card__pill--category">{post.category}</span>
                      <span className={`feed-card__pill feed-card__pill--intent ${post.intent === "Request" ? "is-request" : ""}`}>
                        {post.intent}
                      </span>
                    </div>
                    <h3 className="feed-card__title">{post.title}</h3>
                    <p className="feed-card__description">{post.description}</p>
                    <div className="feed-card__location">{post.location}</div>
                  </Link>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
