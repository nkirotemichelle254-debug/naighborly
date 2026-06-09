import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BlockButtonProps {
  targetUserId: string;
  targetName: string;
  onChange?: (blocked: boolean) => void;
}

export function BlockButton({ targetUserId, targetName, onChange }: BlockButtonProps) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("blocks").select("id")
        .eq("blocker_id", user.id).eq("blocked_id", targetUserId).maybeSingle();
      if (!cancelled) setBlocked(Boolean(data));
    })();
    return () => { cancelled = true; };
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const toggle = async () => {
    setLoading(true);
    if (blocked) {
      const { error } = await supabase.from("blocks").delete()
        .eq("blocker_id", user.id).eq("blocked_id", targetUserId);
      setLoading(false);
      if (error) {
        toast({ title: "Couldn't unblock", description: error.message, variant: "destructive" });
        return;
      }
      setBlocked(false);
      onChange?.(false);
      toast({ title: `${targetName.split(" ")[0]} unblocked` });
    } else {
      const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetUserId });
      setLoading(false);
      if (error) {
        toast({ title: "Couldn't block", description: error.message, variant: "destructive" });
        return;
      }
      setBlocked(true);
      onChange?.(true);
      toast({ title: `${targetName.split(" ")[0]} blocked`, description: "Their posts and messages are hidden from you." });
    }
  };

  if (blocked) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:opacity-80 disabled:opacity-50"
      >
        <Ban className="size-3.5" /> Unblock
      </button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition">
          <Ban className="size-3.5" /> Block
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {targetName.split(" ")[0]}?</AlertDialogTitle>
          <AlertDialogDescription>
            You won't see their posts, messages, or asantes — and they can't start new conversations with you. You can unblock anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={toggle} disabled={loading}>Block</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
