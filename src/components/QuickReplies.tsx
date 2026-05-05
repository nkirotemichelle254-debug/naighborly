import { motion } from "framer-motion";

interface Props {
  hasReceived: boolean;
  onPick: (text: string) => void;
}

const STARTERS = [
  "Hi! Is this still available?",
  "Karibu — I'm interested 🙌",
  "What's the best time to come by?",
];

const REPLIES = [
  "Asante! Sounds good.",
  "Could you share a photo?",
  "What's your location?",
  "I can come today.",
];

export function QuickReplies({ hasReceived, onPick }: Props) {
  const options = hasReceived ? REPLIES : STARTERS;
  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-2 -mx-5 no-scrollbar">
      {options.map((text, i) => (
        <motion.button
          key={text}
          type="button"
          onClick={() => onPick(text)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 22 }}
          whileTap={{ scale: 0.96 }}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/60 transition"
        >
          {text}
        </motion.button>
      ))}
    </div>
  );
}
