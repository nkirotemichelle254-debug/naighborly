import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data?: any; error?: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data?: any; error?: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data?: any; error?: { message: string } | null }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}&reason=${encodeURIComponent("connect an app to Naighborly")}`;
        return;
      }
      const { data, error: err } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 animate-fade-in">
      <main className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Connect to Naighborly</h1>

        {error ? (
          <>
            <p className="mt-3 text-sm text-destructive">Could not complete this request: {error}</p>
            <a href="/home" className="mt-6 inline-block text-sm underline">
              Back to Naighborly
            </a>
          </>
        ) : !details ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading authorization request…</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{clientName}</span> wants to use Naighborly as you. It
              will be able to search neighborhood posts, read your profile and standing, create posts on your behalf,
              and resolve your own posts.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Working…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                Deny
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
