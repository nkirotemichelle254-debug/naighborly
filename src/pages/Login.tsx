import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/home";
  const reason = params.get("reason");
  const initialEmail = params.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password (6+ characters).");
      return;
    }
    setBusy(true);
    const { error: err } = await signInWithEmail(email, password);
    setBusy(false);
    if (err) setError(err);
    else navigate(next, { replace: true });
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    const { error: err } = await signInWithGoogle(next);
    if (err) {
      setBusy(false);
      setError(err);
    }
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="auth-hero">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Naighborly</h1>
          <p className="mt-2 text-sm opacity-90">Your hood, in your pocket.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-6 py-8 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {initialEmail
            ? "We sent a confirmation link. After confirming your email, sign in here."
            : reason
              ? `Sign in to ${reason}.`
              : "Browse freely, then sign in when you want to post, save, or message."}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-semibold transition hover:bg-muted/50 disabled:opacity-60"
        >
          <svg className="size-5" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.4 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.7 13-4.6l-6-5c-2 1.4-4.4 2.1-7 2.1-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6 5c-.4.4 6.7-4.9 6.7-14.4 0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="block mt-4">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={busy} className="pill-button mt-6 w-full disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/signup" className="font-semibold text-foreground underline-offset-4 hover:underline">Sign up</Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/home" className="text-muted-foreground hover:text-foreground">Continue as guest</Link>
        </p>
      </form>
    </div>
  );
}
