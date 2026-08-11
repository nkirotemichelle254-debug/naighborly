import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Phone, MessageCircle, Trash2, ShieldAlert, Share2, Heart } from "lucide-react";
import { usePosts } from "@/context/PostsContext";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge, type TrustTier } from "@/components/TrustBadge";
import { ReportDialog } from "@/components/ReportDialog";
import { AsantiButton } from "@/components/AsantiButton";
import { celebrate } from "@/lib/celebrate";
import { celebrateResolved } from "@/lib/feedback";

export default function Details() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { getById, deletePost, updatePost, toggleFavorite, isFavorite } = usePosts();
  const { profile, isSignedIn } = useAuth();
  const { ensureThreadForPost, threads } = useMessages();

  const post = getById(id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [location, setLocation] = useState(post?.location ?? "");
  const [ownerTier, setOwnerTier] = useState<TrustTier>("new");
  const [ownerAsanti, setOwnerAsanti] = useState(0);
  const [justResolved, setJustResolved] = useState(false);

  useEffect(() => {
    if (!post?.ownerId || post?.isDemo) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("trust_tier, asanti_received")
        .eq("id", post.ownerId)
        .maybeSingle();
      if (!cancelled && data) {
        setOwnerTier((data.trust_tier ?? "new") as TrustTier);
        setOwnerAsanti(data.asanti_received ?? 0);
      }
    })();
    return () => { cancelled = true; };
  }, [post?.ownerId, post?.isDemo]);

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
        title: "This is a sample listing",
        description: "Real neighbours are joining soon. Sign up and post something first — then you can message others!",
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
        title: "Can't save sample listings",
        description: "Once real neighbours start posting, you'll be able to save their listings here.",
      });
      return;
    }
    if (!isSignedIn) return navigate(`/login?next=/post/${post.id}`);
    toggleFavorite(post.id);
  };

  const handleCall = (e: MouseEvent) => {
    if (isDemo) {
      e.preventDefault();
      toast({
        title: "Sample number",
        description: "This is a demo contact. Real numbers appear once neighbours post.",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: post.title, text: post.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied — share it with your neighbours" });
    } catch {
      /* user cancelled the share sheet */
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

        {post.ownerId && !isDemo ? (
          <Link
            to={`/user/${post.ownerId}`}
            className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 transition-colors hover:bg-accent/10"
          >
            <div className="size-12 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display font-bold">
              {post.ownerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="truncate">{post.owner}</strong>
                <TrustBadge tier={ownerTier} />
              </div>
              <p className="text-sm text-muted-foreground">
                {ownerAsanti > 0 ? `${ownerAsanti} asante${ownerAsanti === 1 ? "" : "s"} from neighbours` : "View neighbour profile"}
              </p>
            </div>
          </Link>
        ) : (
          <article className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-display font-bold">
              {post.ownerInitials}
            </div>
            <div className="flex-1">
              <strong className="block">{post.owner}</strong>
              <p className="text-sm text-muted-foreground">Sample neighbour in {post.location}</p>
            </div>
          </article>
        )}

        <article className="rounded-2xl border border-border bg-card p-5 grid grid-cols-2 gap-4">
          <div><span className="text-xs text-muted-foreground">Category</span><strong className="block">{post.category}</strong></div>
          <div><span className="text-xs text-muted-foreground">Intent</span><strong className="block">{post.intent}</strong></div>
          <div><span className="text-xs text-muted-foreground">Posted</span><strong className="block">{post.time}</strong></div>
          <div><span className="text-xs text-muted-foreground">Neighbourhood</span><strong className="block">{post.location}</strong></div>
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
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="grid gap-1">
                {(() => {
                  const firstName = post.owner.split(" ")[0];
                  const trusted = ownerTier === "trusted" || ownerTier === "pillar";
                  const known = ownerTier === "active" || ownerTier === "verified";
                  const heading = trusted
                    ? `${firstName} is well-known here`
                    : known
                    ? "Meet in a public spot"
                    : "New neighbour — go slow";

                  let body = "";
                  if (post.category === "Service") {
                    body = trusted
                      ? `Thanked by ${ownerAsanti} neighbours. Still agree on scope and price in chat before any work or payment.`
                      : known
                      ? "Confirm scope, price and timing in messages. Pay only after the job is done — never upfront in full."
                      : "New neighbour offering a service. Get clear scope and price in writing, never pay upfront, and ask for references.";
                  } else if (post.category === "Swap") {
                    body = trusted
                      ? `Trusted swapper (${ownerAsanti} asantes). Confirm both items match the description before swapping.`
                      : known
                      ? "Agree on both items, condition and meeting point in messages. Inspect each item in person before swapping."
                      : "New neighbour — confirm both items in detail, meet in daylight in a busy place, and bring a friend.";
                  } else {
                    // Item
                    if (post.intent === "Request") {
                      body = trusted
                        ? `${firstName} is asking for help. Coordinate handover safely in chat first.`
                        : "Confirm exactly what's needed and when. Meet at a public point and never share extra payment info.";
                    } else {
                      body = trusted
                        ? `Thanked by ${ownerAsanti} neighbours. Still inspect the item before paying.`
                        : known
                        ? "Confirm the item, price and pickup point in messages first. Inspect before paying — meet in daylight."
                        : "New neighbour — chat first, never send payment before pickup, and meet in a busy public place.";
                    }
                  }

                  return (
                    <>
                      <h2 className="font-display text-lg font-bold leading-tight">{heading}</h2>
                      <p className="text-sm text-muted-foreground">{body}</p>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleMessage} className="pill-button flex-1 gap-2">
                <MessageCircle className="size-4" /> Message
              </button>
              <button onClick={handleShare} className="pill-button gap-2" data-variant="ghost" aria-label="Share this listing">
                <Share2 className="size-4" /> Share
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
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleSave}
                className="pill-button gap-2"
                data-variant="ghost"
              >
                <Bookmark className={`size-4 ${fav ? "fill-current" : ""}`} /> {fav ? "Saved" : "Save post"}
              </button>
              {!isDemo && post.ownerId && (
                <ReportDialog reportedUserId={post.ownerId} postId={post.id} />
              )}
            </div>
          </article>
        )}

        {isOwner && (
          <article className="rounded-2xl border border-border bg-card p-5 grid gap-3">
            <h2 className="font-display text-lg font-bold">Manage your post</h2>
            {!editing ? (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEditing(true)} className="pill-button" data-variant="ghost">Edit</button>
                <button
                  onClick={async () => {
                    const wasResolved = post.resolved;
                    await updatePost(post.id, { resolved: !post.resolved });
                    if (!wasResolved) {
                      celebrate();
                      celebrateResolved();
                      setJustResolved(true);
                      toast({
                        title: "Sorted! 🎉",
                        description: `${post.title} is resolved. Great neighbourly work.`,
                      });
                    } else {
                      setJustResolved(false);
                      toast({ title: "Marked as active again" });
                    }
                  }}
                  className="pill-button"
                  data-variant="ghost"
                >
                  {post.resolved ? "Mark active" : "Mark resolved"}
                </button>
                <button onClick={handleDelete} className="pill-button col-span-2 gap-2" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>
                  <Trash2 className="size-4" /> Delete post
                </button>
              </div>
            )}
            {justResolved && post.resolved && (() => {
              const thread = threads.find((t) => t.postId === post.id);
              if (!thread) return null;
              return (
                <div className="rounded-xl border border-accent/50 bg-accent/15 p-4 flex items-center justify-between gap-3">
                  <span className="text-sm">
                    <strong className="font-display block">Who came through for you?</strong>
                    <span className="text-muted-foreground">Send {thread.withName.split(" ")[0]} an Asante — it builds their standing.</span>
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1">
                    <Heart className="size-4 text-primary" />
                    <AsantiButton threadId={thread.id} receiverId={thread.withId} receiverName={thread.withName} />
                  </span>
                </div>
              );
            })()}
            {editing && (

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
