import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const navigate = useNavigate();
  const { isSignedIn, profile, signOut, updateProfile } = useAuth();
  const { posts, favorites } = usePosts();

  useEffect(() => {
    if (!isSignedIn) navigate("/login?next=/profile", { replace: true });
  }, [isSignedIn, navigate]);

  const myPosts = useMemo(() => posts.filter((p) => p.ownerId === profile.id), [posts, profile.id]);
  const liveCount = myPosts.filter((p) => !p.resolved).length;
  const urgentCount = myPosts.filter((p) => p.urgent).length;
  const savedPosts = useMemo(() => posts.filter((p) => favorites.includes(p.id)), [posts, favorites]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);

  const saveProfile = async () => {
    if (name.trim().length < 2) return toast({ title: "Add a name", variant: "destructive" });
    const { error } = await updateProfile({ name: name.trim(), location: location.trim(), bio: bio.trim() });
    if (error) return toast({ title: "Could not save", description: error, variant: "destructive" });
    setEditing(false);
    toast({ title: "Profile updated" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/home");
  };

  return (
    <div className="min-h-screen animate-fade-in pb-8">
      <section className="auth-hero relative">
        <button
          onClick={() => navigate("/home")}
          className="absolute top-4 left-4 size-9 inline-flex items-center justify-center rounded-full bg-card/20 text-primary-foreground"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="grid gap-3 justify-items-center">
          <span className="text-xs font-semibold uppercase tracking-wider bg-card/20 px-3 py-1 rounded-full">
            Neighbor since {profile.memberSince}
          </span>
          <div className="size-20 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-2xl font-bold">
            {profile.initials}
          </div>
          <h1 className="font-display text-3xl font-bold">{profile.name}</h1>
          <p className="text-sm opacity-90 max-w-sm">{profile.bio}</p>
          <div className="flex gap-2 text-xs">
            <span className="bg-card/20 px-3 py-1 rounded-full">{profile.location}</span>
            <span className="bg-card/20 px-3 py-1 rounded-full">Community verified</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setEditing((v) => !v)} className="pill-button" style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={() => {
                signOut();
                navigate("/home");
              }}
              className="pill-button"
              data-variant="ghost"
              style={{ color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary-foreground) / 0.4)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      <main className="px-5 py-5 grid gap-5">
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <strong className="block font-display text-2xl">{myPosts.length}</strong>
            <span className="text-xs text-muted-foreground">Posts shared</span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <strong className="block font-display text-2xl">{liveCount}</strong>
            <span className="text-xs text-muted-foreground">Offers live</span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <strong className="block font-display text-2xl">{urgentCount}</strong>
            <span className="text-xs text-muted-foreground">Urgent needs</span>
          </div>
        </section>

        {editing && (
          <section className="rounded-2xl border border-border bg-card p-5 grid gap-3">
            <h2 className="font-display text-lg font-bold">Edit profile</h2>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <input className="rounded-xl border border-input bg-card px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Neighborhood</span>
              <input className="rounded-xl border border-input bg-card px-4 py-3" value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Bio</span>
              <textarea rows={3} className="rounded-xl border border-input bg-card px-4 py-3" value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
            <button onClick={saveProfile} className="pill-button">Save profile</button>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Recent posts</h2>
            <Link to="/create" className="text-sm font-semibold text-primary">Create new</Link>
          </div>
          {myPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-5 text-center">
              You haven't posted yet. Tap Create new to share something.
            </p>
          ) : (
            <div className="grid gap-3">
              {myPosts.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/post/${p.id}`} className={`feed-card feed-card--${p.tone}`}>
                  <div className="feed-card__tags">
                    <span className="feed-card__pill feed-card__pill--category">{p.category}</span>
                    <span className={`feed-card__pill feed-card__pill--intent ${p.intent === "Request" ? "is-request" : ""}`}>{p.intent}</span>
                  </div>
                  <h3 className="feed-card__title">{p.title}</h3>
                  <div className="feed-card__location">{p.location}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Saved posts</h2>
            <Link to="/home" className="text-sm font-semibold text-primary">Browse</Link>
          </div>
          {savedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-5 text-center">
              Tap Save on a post to keep it here for later.
            </p>
          ) : (
            <div className="grid gap-3">
              {savedPosts.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/post/${p.id}`} className={`feed-card feed-card--${p.tone}`}>
                  <div className="feed-card__tags">
                    <span className="feed-card__pill feed-card__pill--category">{p.category}</span>
                    <span className={`feed-card__pill feed-card__pill--intent ${p.intent === "Request" ? "is-request" : ""}`}>{p.intent}</span>
                  </div>
                  <h3 className="feed-card__title">{p.title}</h3>
                  <div className="feed-card__location">{p.location}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-3">Community standing</h2>
          <ul className="grid gap-3">
            <li><strong>Responsive</strong><p className="text-sm text-muted-foreground">Usually replies within the hour</p></li>
            <li><strong>Reliable meetups</strong><p className="text-sm text-muted-foreground">Prefers public pickup points in Nairobi</p></li>
            <li><strong>Good exchange history</strong><p className="text-sm text-muted-foreground">Known for clean swaps and clear communication</p></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
