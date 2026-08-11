import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin, MessageSquare, Wallet, Clock, Wrench, Repeat, Package, HandHeart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PostCategory, PostIntent } from "@/data/posts";

const STORAGE_PREFIX = "naighborly:safety-ack:";

export type ExchangeKind = "swap" | "service" | "item-offer" | "item-request" | "urgent" | "default";

interface Props {
  /** ID of the other neighbour in the conversation */
  otherUserId: string;
  otherName: string;
  /** Should we show the screen? (e.g. only on threads with 0 messages so far) */
  enabled: boolean;
  /** Optional context about the post that prompted the chat. */
  category?: PostCategory;
  intent?: PostIntent;
  urgent?: boolean;
}

function deriveKind({ category, intent, urgent }: Pick<Props, "category" | "intent" | "urgent">): ExchangeKind {
  if (urgent) return "urgent";
  if (category === "Service") return "service";
  if (category === "Swap") return "swap";
  if (category === "Item") {
    return intent === "Request" ? "item-request" : "item-offer";
  }
  return "default";
}

interface Variant {
  Icon: typeof Shield;
  title: (first: string) => string;
  blurb: string;
  bullets: { Icon: typeof MessageSquare; text: string }[];
  cta: string;
}

const VARIANTS: Record<ExchangeKind, Variant> = {
  swap: {
    Icon: Repeat,
    title: (n) => `Before you swap with ${n}`,
    blurb: "Swaps work best when both sides see the goods first.",
    bullets: [
      { Icon: MessageSquare, text: "Describe both items — condition, photos, any flaws." },
      { Icon: MapPin, text: "Meet in a public, busy spot during daylight." },
      { Icon: Package, text: "Inspect each item in person before handing yours over." },
    ],
    cta: "Got it — start chatting",
  },
  service: {
    Icon: Wrench,
    title: (n) => `Before you book ${n}`,
    blurb: "Lock in scope and price in writing — protects both of you.",
    bullets: [
      { Icon: MessageSquare, text: "Agree on scope, price and timing in chat." },
      { Icon: Wallet, text: "Pay after the job is done. Never the full amount upfront." },
      { Icon: MapPin, text: "Confirm the address and who'll be present." },
    ],
    cta: "Got it — start chatting",
  },
  "item-offer": {
    Icon: Package,
    title: (n) => `Before you pick up from ${n}`,
    blurb: "A few habits keep handovers smooth.",
    bullets: [
      { Icon: MessageSquare, text: "Confirm item, condition and pickup time in chat." },
      { Icon: MapPin, text: "Meet in a public, busy spot during daylight." },
      { Icon: Wallet, text: "If money's involved, inspect first — never pay before pickup." },
    ],
    cta: "Got it — start chatting",
  },
  "item-request": {
    Icon: HandHeart,
    title: (n) => `Helping ${n}`,
    blurb: "Thanks for stepping up. Keep it simple and safe.",
    bullets: [
      { Icon: MessageSquare, text: "Confirm exactly what's needed and when." },
      { Icon: MapPin, text: "Meet at a public, easy-to-find point." },
      { Icon: Wallet, text: "Never share payment details — neighbours don't ask for that." },
    ],
    cta: "Got it — start chatting",
  },
  urgent: {
    Icon: Clock,
    title: (n) => `Helping ${n} — quickly`,
    blurb: "Urgent posts move fast. Stay calm and stay safe.",
    bullets: [
      { Icon: MessageSquare, text: "Confirm the situation and location in chat first." },
      { Icon: MapPin, text: "Meet in a public, well-lit area — bring a friend if you can." },
      { Icon: Wallet, text: "Don't send money. Real urgent help happens in person." },
    ],
    cta: "I'm ready to help",
  },
  default: {
    Icon: Shield,
    title: (n) => `Before you message ${n}`,
    blurb: "A few simple habits keep our community safe.",
    bullets: [
      { Icon: MessageSquare, text: "Confirm details in chat — item, price, time, place." },
      { Icon: MapPin, text: "Meet in a public, busy spot during daylight." },
      { Icon: Wallet, text: "Never send money before meeting in person." },
    ],
    cta: "Got it — start chatting",
  },
};

export function SafetyScreen({ otherUserId, otherName, enabled, category, intent, urgent }: Props) {
  const [open, setOpen] = useState(false);

  const kind = useMemo(() => deriveKind({ category, intent, urgent }), [category, intent, urgent]);
  const variant = VARIANTS[kind];
  const firstName = otherName.split(" ")[0];

  useEffect(() => {
    if (!enabled || !otherUserId) return;
    // Re-show if context changes (e.g. urgent vs default for the same neighbour).
    const key = `${STORAGE_PREFIX}${otherUserId}:${kind}`;
    const acked = localStorage.getItem(key);
    if (!acked) setOpen(true);
  }, [enabled, otherUserId, kind]);

  const acknowledge = () => {
    localStorage.setItem(`${STORAGE_PREFIX}${otherUserId}:${kind}`, new Date().toISOString());
    setOpen(false);
  };

  const HeadIcon = variant.Icon;

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
                  <HeadIcon className="size-6 text-accent-foreground" />
                </div>
                <DialogTitle className="text-center font-display">
                  {variant.title(firstName)}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {variant.blurb}
                </DialogDescription>
              </DialogHeader>

              <ul className="grid gap-3 mt-4">
                {variant.bullets.map((b, i) => {
                  const BIcon = b.Icon;
                  return (
                    <li key={i} className="flex gap-3 items-start">
                      <BIcon className="size-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{b.text}</span>
                    </li>
                  );
                })}
              </ul>

              <DialogFooter className="mt-5">
                <Button onClick={acknowledge} className="w-full rounded-full h-12 font-semibold">
                  {variant.cta}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
