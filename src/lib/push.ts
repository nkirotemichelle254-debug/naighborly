import { supabase } from "@/integrations/supabase/client";

const SW_PATH = "/push-sw.js";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH);
}

async function fetchPublicKey(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("send-push", {
    body: {},
    method: "GET",
  } as { body: unknown; method: "GET" });
  if (error) return null;
  return (data as { publicKey?: string })?.publicKey ?? null;
}

export async function enablePush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: perm };

  // Direct GET to function for public key (supabase.functions.invoke uses POST)
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push?action=public-key`;
  const keyRes = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string } });
  const { publicKey } = (await keyRes.json()) as { publicKey: string | null };
  if (!publicKey) return { ok: false, reason: "no-key" };

  const reg = await getOrRegisterSW();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = sub.toJSON();
  const endpoint = json.endpoint!;
  const p256dh = json.keys?.p256dh!;
  const auth = json.keys?.auth!;

  // Upsert by endpoint
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  await supabase.from("push_subscriptions").insert({
    user_id: userId,
    endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
  });
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

export async function sendPush(recipientId: string, title: string, body: string, opts?: { url?: string; tag?: string }) {
  try {
    await supabase.functions.invoke("send-push", {
      body: { recipientId, title, body, url: opts?.url, tag: opts?.tag },
    });
  } catch {
    // best-effort
  }
}
