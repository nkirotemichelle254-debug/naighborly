import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 4) return setError("Password must be at least 4 characters.");
    if (signIn(email, name)) navigate("/home", { replace: true });
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="auth-hero">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Naighborly</h1>
          <p className="mt-2 text-sm opacity-90">Join trusted exchange across your neighborhood.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-6 py-8 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Create account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse freely, then sign up when you're ready to post, save, or message.
        </p>

        <label className="block mt-6">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            placeholder="Michael Heri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>

        <label className="block mt-4">
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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button type="submit" className="pill-button mt-6 w-full">
          Sign up
        </button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
