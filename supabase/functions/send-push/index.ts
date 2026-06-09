// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

let vapidReady = false;
async function ensureVapid() {
  if (vapidReady) return;
  const { data } = await admin.from("web_push_config").select("public_key, private_key, subject").eq("id", true).maybeSingle();
  if (!data) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(data.subject, data.public_key, data.private_key);
  vapidReady = true;
}

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  const { data } = await admin.auth.getUser(token);
  return data.user?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "send";

  try {
    if (action === "public-key") {
      const { data } = await admin.from("web_push_config").select("public_key").eq("id", true).maybeSingle();
      return new Response(JSON.stringify({ publicKey: data?.public_key ?? null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await getUserId(req);
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));

    if (action === "send") {
      await ensureVapid();
      const { recipientId, title, body: text, url: targetUrl, tag } = body as {
        recipientId: string; title: string; body: string; url?: string; tag?: string;
      };
      if (!recipientId || !title || !text) {
        return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: corsHeaders });
      }
      // Don't push to self
      if (recipientId === userId) return new Response(JSON.stringify({ skipped: "self" }), { headers: corsHeaders });

      // Check if recipient blocked sender
      const { data: blockRow } = await admin.from("blocks").select("id").eq("blocker_id", recipientId).eq("blocked_id", userId).maybeSingle();
      if (blockRow) return new Response(JSON.stringify({ skipped: "blocked" }), { headers: corsHeaders });

      const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", recipientId);
      const payload = JSON.stringify({ title, body: text, url: targetUrl ?? "/inbox", tag: tag ?? "naighborly" });

      const results = await Promise.allSettled(
        (subs ?? []).map(async (s: any) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload,
            );
          } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await admin.from("push_subscriptions").delete().eq("id", s.id);
            }
            throw err;
          }
        }),
      );
      return new Response(JSON.stringify({ sent: results.filter(r => r.status === "fulfilled").length, failed: results.filter(r => r.status === "rejected").length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), { status: 500, headers: corsHeaders });
  }
});
