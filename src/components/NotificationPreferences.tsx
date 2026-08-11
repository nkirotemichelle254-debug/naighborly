import { useEffect, useState } from "react";
import { Bell, BellOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { enablePush, disablePush, isPushSupported, pushPermission } from "@/lib/push";
import { isSoundEnabled, setSoundEnabled, playKalimba } from "@/lib/feedback";
import { toast } from "@/hooks/use-toast";

export function NotificationPreferences() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(pushPermission());
    setSound(isSoundEnabled());
    if (!isPushSupported() || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration("/push-sw.js").then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setEnabled(Boolean(sub));
    });
  }, []);

  const togglePush = async () => {
    if (!user) return;
    setBusy(true);
    if (enabled) {
      await disablePush();
      setEnabled(false);
      toast({ title: "Push notifications off" });
    } else {
      const res = await enablePush(user.id);
      if (res.ok) {
        setEnabled(true);
        setPermission("granted");
        toast({ title: "You're all set", description: "We'll ping you when neighbours message or thank you." });
      } else if (res.reason === "denied") {
        toast({ title: "Notifications blocked", description: "Enable them in your browser settings to receive pings.", variant: "destructive" });
      } else if (res.reason === "unsupported") {
        toast({ title: "Not supported on this browser", variant: "destructive" });
      } else {
        toast({ title: "Couldn't enable notifications", variant: "destructive" });
      }
    }
    setBusy(false);
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playKalimba("asante");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 grid gap-4">
      <h2 className="font-display text-lg font-bold">Notifications & feedback</h2>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {enabled ? <Bell className="size-5 text-primary mt-0.5 shrink-0" /> : <BellOff className="size-5 text-muted-foreground mt-0.5 shrink-0" />}
          <div className="min-w-0">
            <strong className="block">Push notifications</strong>
            <p className="text-xs text-muted-foreground">
              {!supported ? "Not supported on this browser." :
                permission === "denied" ? "Blocked — change it in your browser settings." :
                  enabled ? "On for this device." : "Get pinged when neighbours message or thank you, even when the app is closed."}
            </p>
          </div>
        </div>
        <button
          onClick={togglePush}
          disabled={!supported || busy || permission === "denied"}
          className="pill-button shrink-0"
          data-variant={enabled ? "ghost" : undefined}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : enabled ? "Turn off" : "Turn on"}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {sound ? <Volume2 className="size-5 text-primary mt-0.5 shrink-0" /> : <VolumeX className="size-5 text-muted-foreground mt-0.5 shrink-0" />}
          <div className="min-w-0">
            <strong className="block">Signature kalimba sound</strong>
            <p className="text-xs text-muted-foreground">Plays a warm pluck when an asante is sent or a post is resolved.</p>
          </div>
        </div>
        <button onClick={toggleSound} className="pill-button shrink-0" data-variant={sound ? "ghost" : undefined}>
          {sound ? "Mute" : "Unmute"}
        </button>
      </div>
    </section>
  );
}
