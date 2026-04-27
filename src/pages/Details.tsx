import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Phone, MessageCircle, Trash2 } from "lucide-react";
import { usePosts } from "@/context/PostsContext";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { toast } from "@/hooks/use-toast";

export default function Details() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { getById, deletePost, updatePost, toggleFavorite, isFavorite } = usePosts();
  const { profile, isSignedIn } = useAuth();
  const { ensureThreadForPost } = useMessages();

  const post = getById(id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [location, setLocation] = useState(post?.location ?? "");

  if (!post) {
    return (
      <div className="min-h-screen px-6 py-10 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Post not found</h1>
        <p className="text-sm text-muted-foreground mt-2">It may have been removed or the link is invalid.</p>
        <Link to="/home" className="pill-button mt-6 inline-flex">Back to feed</Link>
      </div>
    );
  }

  const isOwner = isSignedIn && post.ownerId === profile.id;
  const fav = isFavorite(post.id);
  const isDemo = post.isDemo === true;

  const handleMessage = async () => {
    if (isDemo) {
      toast({
        title: "This is a sample post",
        description: "Create your own post or wait for neighbours to share theirs to start chatting.",
      });
      return;
    }
    if (!isSignedIn) return navigate(`/login?next=/post/${post.id}`);
    if (!post.ownerId) return;
    const thread = await ensureThreadForPost(post.id, post.ownerId, post.owner);
    if (thread) navigate(`/inbox?thread=${thread.id}`);
  };

  const handleSave = async () => {
    if (isDemo) {
      toast({
        title: "Sample posts can't be saved",
        description: "Saving works on real neighbour posts. Try creating one!",
      });
      return;
    }
    if (!isSignedIn) return navigate(`/login?next=/post/${post.id}`);
    toggleFavorite(post.id);
  };

  const handleCall = (e: React.MouseEvent) => {
    if (isDemo) {
      e.preventDefault();
      toast({
        title: "Sample number",
        description: "This is a demo contact. Real numbers appear once neighbours post.",
      });
    }
  };

  const handleSaveEdit = async () => {
    await updatePost(post.id, { title: title.trim(), description: description.trim(), location: location.trim() });
    setEditing(false);
    toast({ title: "Post updated" });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    await deletePost(post.id);
    toast({ title: "Post deleted" });
    navigate("/home");
  };

  return (
    <div className="min-h-screen animate-fade-in pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 backdrop-blur px-5 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="size-9 inline-flex items-center justify-center rounded-full border border-border" aria-label="Back">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="font-display text-xl font-bold">Post Details</h1>
      </header>

      <main className="px-5 py-5 grid gap-4">
        <article className={`feed-card feed-card--${post.tone} ${post.urgent ? "is-urgent" : ""}`}>
          <div className="feed-card__tags">
            <span className="feed-card__pill feed-card__pill--category">{post.category}</span>
            <span className={`feed-card__pill feed-card__pill--intent ${post.intent === "Request" ? "is-request" : ""}`}>
              {post.intent}
            </span>
            {post.urgent && <span className="feed-card__pill" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>Urgent</span>}
            {post.resolved && <span className="feed-card__pill" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>Resolved</span>}
          </div>
          <h2 className="feed-card__title text-2xl">{post.title}</h2>
          <p className="feed-card__description">{post.description}</p>
          <div className="feed-card__location">{post.location}</div>
        </article>

        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full rounded-2xl object-cover max-h-80 border border-border" />
        )}

        <article className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="size-12 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display font-bold">
            {post.ownerInitials}
          </div>
          <div className="flex-1">
            <strong className="block">{post.owner}</strong>
            <p className="text-sm text-muted-foreground">Community member in {post.location}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-accent/30 text-accent-foreground font-semibold">Trusted</span>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 grid grid-cols-2 gap-4">
          <div><span className="text-xs text-muted-foreground">Category</span><strong className="block">{post.category}</strong></div>
          <div><span className="text-xs text-muted-foreground">Intent</span><strong className="block">{post.intent}</strong></div>
          <div><span className="text-xs text-muted-foreground">Posted</span><strong className="block">{post.time}</strong></div>
          <div><span className="text-xs text-muted-foreground">Neighborhood</span><strong className="block">{post.location}</strong></div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 grid gap-3">
          <h2 className="font-display text-lg font-bold">More details</h2>
          <p className="text-sm text-muted-foreground">{post.details}</p>
        </article>

        {isDemo && (
          <article className="rounded-2xl border border-dashed border-accent bg-accent/10 p-4 text-sm">
            <strong className="font-display">Sample post</strong>
            <p className="text-muted-foreground mt-1">
              This post is here to show you how Naighborly looks. Create your own to start real conversations.
            </p>
          </article>
        )}

        {!isOwner && (
          <article className="rounded-2xl border border-border bg-card p-5 grid gap-3">
            <h2 className="font-display text-lg font-bold">Reach out safely</h2>
            <p className="text-sm text-muted-foreground">Start with a message, confirm the item, then agree on a public meetup point.</p>
            <div className="flex gap-3">
              <button onClick={handleMessage} className="pill-button flex-1 gap-2">
                <MessageCircle className="size-4" /> Message
              </button>
              {post.allowCalls && post.phone && (
                <a
                  href={isDemo ? undefined : `tel:${post.phone}`}
                  onClick={handleCall}
                  className="pill-button gap-2"
                  data-variant="ghost"
                >
                  <Phone className="size-4" /> Call
                </a>
              )}
            </div>
            <button
              onClick={handleSave}
              className="pill-button gap-2"
              data-variant="ghost"
            >
              <Bookmark className={`size-4 ${fav ? "fill-current" : ""}`} /> {fav ? "Saved" : "Save post"}
            </button>
          </article>
        )}

        {isOwner && (
          <article className="rounded-2xl border border-border bg-card p-5 grid gap-3">
            <h2 className="font-display text-lg font-bold">Manage your post</h2>
            {!editing ? (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEditing(true)} className="pill-button" data-variant="ghost">Edit</button>
                <button onClick={() => updatePost(post.id, { resolved: !post.resolved })} className="pill-button" data-variant="ghost">
                  {post.resolved ? "Mark active" : "Mark resolved"}
                </button>
                <button onClick={handleDelete} className="pill-button col-span-2 gap-2" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>
                  <Trash2 className="size-4" /> Delete post
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Title</span>
                  <input className="rounded-xl border border-input bg-card px-4 py-3" value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Description</span>
                  <textarea rows={4} className="rounded-xl border border-input bg-card px-4 py-3" value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Location</span>
                  <input className="rounded-xl border border-input bg-card px-4 py-3" value={location} onChange={(e) => setLocation(e.target.value)} />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="pill-button" data-variant="ghost">Cancel</button>
                  <button onClick={handleSaveEdit} className="pill-button flex-1">Save changes</button>
                </div>
              </div>
            )}
          </article>
        )}

        <article className="rounded-2xl border border-dashed border-accent bg-accent/10 p-5">
          <strong className="font-display">Community tip</strong>
          <p className="text-sm text-muted-foreground mt-1">{post.note}</p>
        </article>
      </main>
    </div>
  );
}
