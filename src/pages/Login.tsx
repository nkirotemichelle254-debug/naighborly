import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/home";
  const reason = params.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 4) {
      setError("Enter a valid email and a password (4+ characters).");
      return;
    }
    if (signIn(email)) {
      navigate(next, { replace: true });
    } else {
      setError("Could not sign in. Please try again.");
    }
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="auth-hero">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Naighborly</h1>
          <p className="mt-2 text-sm opacity-90">Share. Connect. Thrive together.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-6 py-8 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {reason
            ? `Sign in to ${reason}.`
            : "Browse freely, then sign in when you want to post, save, or message."}
        </p>

        <label className="block mt-6">
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

        <button type="submit" className="pill-button mt-6 w-full">
          Sign in
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
