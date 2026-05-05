import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin, MessageSquare, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_PREFIX = "naighborly:safety-ack:";

interface Props {
  /** ID of the other neighbor in the conversation */
  otherUserId: string;
  otherName: string;
  /** Should we show the screen? (e.g. only on threads with 0 messages so far) */
  enabled: boolean;
}

export function SafetyScreen({ otherUserId, otherName, enabled }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || !otherUserId) return;
    const acked = localStorage.getItem(STORAGE_PREFIX + otherUserId);
    if (!acked) setOpen(true);
  }, [enabled, otherUserId]);

  const acknowledge = () => {
    localStorage.setItem(STORAGE_PREFIX + otherUserId, new Date().toISOString());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && acknowledge()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              <DialogHeader>
                <div className="mx-auto size-12 rounded-full bg-accent/30 inline-flex items-center justify-center mb-2">
                  <Shield className="size-6 text-accent-foreground" />
                </div>
                <DialogTitle className="text-center font-display">
                  Before you message {otherName.split(" ")[0]}
                </DialogTitle>
                <DialogDescription className="text-center">
                  A few simple habits keep our community safe.
                </DialogDescription>
              </DialogHeader>

              <ul className="grid gap-3 mt-4">
                <li className="flex gap-3 items-start">
                  <MessageSquare className="size-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Confirm details in chat — item, price, time, place.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Meet in a public, busy spot during daylight.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Wallet className="size-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Never send money before meeting in person.</span>
                </li>
              </ul>

              <DialogFooter className="mt-5">
                <Button onClick={acknowledge} className="w-full rounded-full h-12 font-semibold">
                  Got it — start chatting
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
