import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import type { PostCategory, PostIntent } from "@/data/posts";
import { toast } from "@/hooks/use-toast";

const CATEGORIES: { value: PostCategory; emoji: string; label: string; description: string; tone: string }[] = [
  { value: "Item", emoji: "📦", label: "Item", description: "Physical goods or products", tone: "charcoal" },
  { value: "Service", emoji: "🛠️", label: "Service", description: "Skills or services offered", tone: "blue" },
  { value: "Swap", emoji: "🤝", label: "Swap", description: "Exchange one thing for another", tone: "gold" },
];

const INTENTS: { value: PostIntent; eyebrow: string; title: string; description: string }[] = [
  { value: "Offer", eyebrow: "Share with the community", title: "Offer", description: "You have something useful to give, lend, or do." },
  { value: "Request", eyebrow: "Ask for support", title: "Request", description: "Let trusted neighbors know what you need." },
];

export default function Create() {
  const navigate = useNavigate();
  const { isSignedIn, loading, profile } = useAuth();
  const { createPost } = usePosts();

  useEffect(() => {
    if (!loading && !isSignedIn) navigate("/login?next=/create", { replace: true });
  }, [isSignedIn, loading, navigate]);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [intent, setIntent] = useState<PostIntent | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(profile.location ?? "");
  const [allowCalls, setAllowCalls] = useState(false);
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate("/home");
  };

  const goNext = () => {
    setError("");
    if (step === 1 && !category) return setError("Choose a category");
    if (step === 2 && !intent) return setError("Choose offer or request");
    if (step === 3) return submit();
    setStep(step + 1);
  };

  const submit = async () => {
    if (title.trim().length < 4) return setError("Title needs at least 4 characters");
    if (description.trim().length < 12) return setError("Add at least 12 characters of description");
    if (location.trim().length < 2) return setError("Add a neighborhood");
    if (allowCalls && !/^\+?[0-9\s-]{7,18}$/.test(phone.trim()))
      return setError("Enter a reachable phone or switch calls off");

    setBusy(true);
    const post = await createPost({
      title,
      description,
      category: category!,
      intent: intent!,
      location,
      allowCalls,
      phone,
      urgent,
      imageFile,
    });
    setBusy(false);
    if (!post) {
      setError("Could not publish. Please try again.");
      return;
    }
    toast({ title: "Post created", description: "Your post is live in the feed." });
    navigate(`/post/${post.id}`);
  };

  return (
    <div className="min-h-screen animate-fade-in pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 backdrop-blur px-5 py-4 border-b border-border">
        <button onClick={goBack} className="size-9 inline-flex items-center justify-center rounded-full border border-border" aria-label="Back">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="font-display text-xl font-bold">Create Post</h1>
      </header>

      <div className="px-5 pt-4 flex gap-2" aria-label="Progress">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: s <= step ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
          />
        ))}
      </div>

      <main className="px-5 py-6 grid gap-5">
        {step === 1 && (
          <>
            <div>
              <h2 className="font-display text-2xl font-bold">What is this?</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose the category that best describes your post</p>
            </div>
            <div className="grid gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`feed-card feed-card--${c.tone} text-left ${category === c.value ? "ring-4 ring-accent" : ""}`}
                >
                  <span className="text-3xl" aria-hidden>{c.emoji}</span>
                  <h3 className="feed-card__title">{c.label}</h3>
                  <p className="feed-card__description">{c.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="font-display text-2xl font-bold">What do you want to do?</h2>
              <p className="text-sm text-muted-foreground mt-1">Tell your neighbors if you are offering help or asking for it</p>
            </div>
            <div className="grid gap-3">
              {INTENTS.map((i) => (
                <button
                  key={i.value}
                  onClick={() => setIntent(i.value)}
                  className={`rounded-2xl border p-5 text-left bg-card transition-all ${
                    intent === i.value ? "ring-4 ring-accent border-accent" : "border-border"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{i.eyebrow}</span>
                  <h3 className="font-display text-2xl font-bold mt-1">{i.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{i.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="font-display text-2xl font-bold">Post details</h2>
              <p className="text-sm text-muted-foreground mt-1">Add information about your post</p>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Title</span>
                <input
                  className="rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="E.g., Office chair available"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  rows={4}
                  className="rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Provide more details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Location</span>
                <input
                  className="rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="E.g., Westlands"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Photo (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:font-semibold"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded-xl object-cover" />
                )}
              </label>

              <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div>
                  <strong className="block">Allow phone calls</strong>
                  <p className="text-sm text-muted-foreground">Only switch this on if you want a Call button on your post.</p>
                </div>
                <input
                  type="checkbox"
                  className="size-5 mt-1 accent-primary"
                  checked={allowCalls}
                  onChange={(e) => setAllowCalls(e.target.checked)}
                />
              </label>

              {allowCalls && (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Phone number</span>
                  <input
                    type="tel"
                    className="rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+254700123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              )}

              <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div>
                  <strong className="block">Mark as Urgent</strong>
                  <p className="text-sm text-muted-foreground">Your post will stand out with a red border and alert icon.</p>
                </div>
                <input
                  type="checkbox"
                  className="size-5 mt-1 accent-destructive"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                />
              </label>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="pill-button" data-variant="ghost">
              Back
            </button>
          )}
          <button onClick={goNext} disabled={busy} className="pill-button flex-1 disabled:opacity-60">
            {busy ? "Publishing…" : step === 3 ? "Publish post" : "Continue"}
          </button>
        </div>
      </main>
    </div>
  );
}
