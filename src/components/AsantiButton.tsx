import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { celebrateAsante } from "@/lib/feedback";
import { sendPush } from "@/lib/push";

interface AsantiButtonProps {
  threadId: string;
  receiverId: string;
  receiverName: string;
}

export function AsantiButton({ threadId, receiverId, receiverName }: AsantiButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [given, setGiven] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("asanti")
        .select("id")
        .eq("giver_id", user.id)
        .eq("receiver_id", receiverId)
        .eq("thread_id", threadId)
        .maybeSingle();
      if (!cancelled) setGiven(Boolean(data));
    })();
    return () => { cancelled = true; };
  }, [user, receiverId, threadId]);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("asanti").insert({
      giver_id: user.id,
      receiver_id: receiverId,
      thread_id: threadId,
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send asante", description: error.message, variant: "destructive" });
      return;
    }
    setGiven(true);
    setOpen(false);
    setMessage("");
    celebrateAsante();
    const giverName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "A neighbour";
    sendPush(receiverId, `${giverName} sent you asante 💛`, message.trim() || "Tap to see their thank-you.", { url: `/inbox?thread=${threadId}`, tag: `asanti-${threadId}` });
    toast({ title: `Asante sent to ${receiverName.split(" ")[0]}`, description: "It boosts their community standing." });
  };

  if (given) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        <Heart className="size-3.5 fill-current" /> Asante sent
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition">
          <Heart className="size-3.5" /> Send Asante
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asante {receiverName.split(" ")[0]}</DialogTitle>
          <DialogDescription>
            A public thank-you that boosts their community standing. You can only send one per conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">A short note <span className="text-muted-foreground font-normal">(optional)</span></span>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Thanks for the lift to school!"
              className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
            />
          </label>
          <button onClick={submit} disabled={submitting} className="pill-button disabled:opacity-50">
            {submitting ? "Sending…" : "Send Asante"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
