import { useState } from "react";
import { Flag } from "lucide-react";
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

const REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Inappropriate content",
  "Misleading post",
  "Safety concern",
  "Other",
];

interface ReportDialogProps {
  reportedUserId?: string;
  postId?: string;
  trigger?: React.ReactNode;
}

export function ReportDialog({ reportedUserId, postId, trigger }: ReportDialogProps) {
  const { user, isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!isSignedIn || !user) {
      toast({ title: "Sign in to report", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId ?? null,
      post_id: postId ?? null,
      reason,
      details: details.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send report", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report received", description: "Asante. Our team will review this privately." });
    setOpen(false);
    setDetails("");
    setReason(REASONS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button type="button" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition">
            <Flag className="size-3.5" /> Report
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report to keep the community safe</DialogTitle>
          <DialogDescription>
            Reports are private. Our team reviews every one. Repeated reports affect a neighbour's standing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Reason</span>
            <select
              className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">What happened? <span className="text-muted-foreground font-normal">(optional)</span></span>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add anything that helps us understand the situation."
              className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
            />
          </label>
          <button
            onClick={submit}
            disabled={submitting}
            className="pill-button mt-2 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send report"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
