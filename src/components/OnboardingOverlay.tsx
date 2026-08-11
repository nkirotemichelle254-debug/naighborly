import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const storageKey = (userId: string) => `naighborly:onboarding-done:${userId}`;

interface OnboardingOverlayProps {
  /** Only render when the user just signed up (e.g. ?welcome=1) */
  active: boolean;
  onDone: () => void;
}

export function OnboardingOverlay({ active, onDone }: OnboardingOverlayProps) {
  const { profile, user, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active || !isSignedIn || !user) return;
    let done = false;
    try {
      done = localStorage.getItem(storageKey(user.id)) === "1";
    } catch { /* ignore */ }
    if (!done) setOpen(true);
  }, [active, isSignedIn, user]);

  const finish = (to?: string) => {
    if (user) {
      try { localStorage.setItem(storageKey(user.id), "1"); } catch { /* ignore */ }
    }
    setOpen(false);
    onDone();
    if (to) navigate(to);
  };

  const firstName = profile.name.split(" ")[0];

  const steps = [
    {
      heading: `Karibu, ${firstName}! 🏘️`,
      body: `You just joined ${profile.location || "your neighbourhood"}. This is where your neighbours swap, sell, borrow and offer — all within your hood. No strangers. Just people who share your gate.`,
      cta: "Show me how it works →",
    },
    {
      heading: "Meet the Asante 🤍",
      body: "When a neighbour comes through for you — a borrowed drill, a great swap, a trusted fundi — you give them an Asante. It's how trust is built here. The more Asantes you earn, the higher your Community Standing grows: New Neighbour → Verified → Active → Trusted → Pillar.",
      cta: "Got it →",
    },
    {
      heading: "What can you offer? 🌿",
      body: "Your first post is the easiest. It can be anything — a skill, something you want to swap, an item you're selling, or something you need. Your neighbours are waiting.",
      cta: "Post something now",
    },
  ];

  const current = steps[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-foreground/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Naighborly"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl grid gap-4"
          >
            <div className="flex gap-1.5" aria-hidden>
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight">{current.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
            {step < 2 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="pill-button w-full">
                {current.cta}
              </button>
            ) : (
              <div className="grid gap-2">
                <button type="button" onClick={() => finish("/create")} className="pill-button w-full">
                  Post something now
                </button>
                <button
                  type="button"
                  onClick={() => finish()}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground min-h-[44px]"
                >
                  Browse the feed first
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
