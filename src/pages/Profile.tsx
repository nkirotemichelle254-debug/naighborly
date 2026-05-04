import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TrustBadge, getTierMeta } from "@/components/TrustBadge";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4MB

export default function Profile() {
  const navigate = useNavigate();
  const { isSignedIn, loading, profile, user, signOut, updateProfile } = useAuth();
  const { posts, favorites } = usePosts();

  useEffect(() => {
    if (!loading && !isSignedIn) navigate("/login?next=/profile", { replace: true });
  }, [isSignedIn, loading, navigate]);

  const myPosts = useMemo(() => posts.filter((p) => p.ownerId === profile.id), [posts, profile.id]);
  const liveCount = myPosts.filter((p) => !p.resolved).length;
  const urgentCount = myPosts.filter((p) => p.urgent).length;
  const savedPosts = useMemo(() => posts.filter((p) => favorites.includes(p.id)), [posts, favorites]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasAvatar = Boolean(profile.avatarUrl);

  const handleAvatarPick = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      return toast({ title: "Pick an image file", variant: "destructive" });
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return toast({ title: "Image too large", description: "Please choose an image under 4MB.", variant: "destructive" });
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setUploading(false);
      return toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error } = await updateProfile({ avatarUrl: data.publicUrl });
    setUploading(false);
    if (error) return toast({ title: "Could not save photo", description: error, variant: "destructive" });
    toast({ title: "Profile photo updated" });
  };

  const saveProfile = async () => {
    if (!hasAvatar) {
      return toast({
        title: "Add a profile photo first",
        description: "Neighbors trust real faces. Tap your avatar to upload one.",
        variant: "destructive",
      });
    }
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
          <button
            type="button"
            onClick={handleAvatarPick}
            disabled={uploading}
            className="relative size-20 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-2xl font-bold overflow-hidden ring-2 ring-card/30 hover:ring-card/60 transition disabled:opacity-60"
            aria-label={hasAvatar ? "Change profile photo" : "Add profile photo"}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="absolute inset-0 size-full object-cover" />
            ) : (
              <span>{profile.initials}</span>
            )}
            <span className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center border-2 border-card">
              <Camera className="size-3.5" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          {!hasAvatar && (
            <p className="text-xs opacity-90 max-w-xs text-center bg-card/20 px-3 py-1.5 rounded-full">
              Add a photo to edit your profile and build trust with neighbors
            </p>
          )}
          <h1 className="font-display text-3xl font-bold">{profile.name}</h1>
          <p className="text-sm opacity-90 max-w-sm">{profile.bio}</p>
          <div className="flex gap-2 text-xs flex-wrap justify-center">
            <span className="bg-card/20 px-3 py-1 rounded-full">{profile.location}</span>
            <TrustBadge tier={profile.trustTier} showNew />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setEditing((v) => !v)} className="pill-button" style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={handleSignOut}
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
            <strong className="font-display text-2xl inline-flex items-center gap-1">
              <Heart className="size-4 text-primary fill-current" />
              {profile.asantiReceived}
            </strong>
            <span className="block text-xs text-muted-foreground">Asantes</span>
          </div>
        </section>

        {editing && (
          <section className="rounded-2xl border border-border bg-card p-5 grid gap-3">
            <h2 className="font-display text-lg font-bold">Edit profile</h2>
            {!hasAvatar && (
              <div className="rounded-xl bg-destructive-soft border border-destructive/30 text-destructive px-4 py-3 text-sm">
                Upload a profile photo above before saving changes to your name, neighborhood, or bio.
              </div>
            )}
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
            <button onClick={saveProfile} disabled={!hasAvatar} className="pill-button disabled:opacity-50 disabled:cursor-not-allowed">
              Save profile
            </button>
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
