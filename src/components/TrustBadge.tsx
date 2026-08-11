import type { Database } from "@/integrations/supabase/types";
import { ShieldCheck, Sparkles, Sprout, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustTier = Database["public"]["Enums"]["trust_tier"];

interface TierMeta {
  label: string;
  Icon: typeof ShieldCheck | null;
  className: string;
  description: string;
}

const TIERS: Record<TrustTier, TierMeta> = {
  new: {
    label: "New neighbour",
    Icon: null,
    className: "bg-muted text-muted-foreground",
    description: "Just joined the community.",
  },
  verified: {
    label: "Verified",
    Icon: ShieldCheck,
    className: "bg-accent/30 text-accent-foreground",
    description: "Confirmed email, photo, bio and neighbourhood.",
  },
  active: {
    label: "Active neighbour",
    Icon: Sprout,
    className: "bg-primary/15 text-primary",
    description: "Regularly posting or chatting in the community.",
  },
  trusted: {
    label: "Trusted",
    Icon: Star,
    className: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    description: "Thanked by 5+ different neighbours with a clean record.",
  },
  pillar: {
    label: "Community pillar",
    Icon: Sparkles,
    className: "bg-gradient-to-r from-primary/25 to-amber-500/25 text-primary",
    description: "20+ thank-yous, 60+ days active. A cornerstone of the neighbourhood.",
  },
};

export function getTierMeta(tier: TrustTier) {
  return TIERS[tier];
}

interface TrustBadgeProps {
  tier: TrustTier;
  size?: "sm" | "md";
  showNew?: boolean;
  className?: string;
}

export function TrustBadge({ tier, size = "sm", showNew = false, className }: TrustBadgeProps) {
  if (tier === "new" && !showNew) return null;
  const meta = TIERS[tier];
  const Icon = meta.Icon;
  const sizing = size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        sizing,
        meta.className,
        className,
      )}
      title={meta.description}
    >
      {Icon && <Icon className={size === "md" ? "size-3.5" : "size-3"} />}
      {meta.label}
    </span>
  );
}
