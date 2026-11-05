import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { SubmissionResult } from "@/game/types";
import { useSettings } from "./settings";
import { useVoice } from "@/lib/voice/useVoice";

export function Stars({ count, size = "text-4xl" }: { count: number; size?: string }) {
  return (
    <div className="flex justify-center gap-1" aria-label={`${count} / 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15 + i * 0.15, type: "spring" }}
          className={`${size} ${i < count ? "" : "opacity-25 grayscale"}`}
          aria-hidden
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

function Confetti() {
  const bits = ["🪙", "✨", "⭐", "🎉", "🪙", "✨", "⭐", "🎊"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl"
          style={{ left: `${8 + i * 12}%`, top: "60%" }}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -220 - (i % 3) * 40, opacity: 0, rotate: 180 }}
          transition={{ duration: 1.4, delay: i * 0.05 }}
        >
          {b}
        </motion.span>
      ))}
    </div>
  );
}

interface Props {
  result: SubmissionResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function Feedback({ result, onContinue, onRetry }: Props) {
  const { tr } = useSettings();
  const { isSpeaking, replay } = useVoice();
  const correct = result.kind === "correct";
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-wood-dark/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border-4 p-6 text-center shadow-soft ${correct ? "border-leaf bg-mint" : "border-orange bg-paper"}`}
      >
        <button
          onClick={() => replay()}
          type="button"
          aria-label="Replay voice dialogue"
          title="Replay voice feedback"
          className={`absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full transition-colors cursor-pointer ${
            isSpeaking
              ? "bg-leaf text-white ring-2 ring-sun"
              : "bg-paper/80 text-wood-dark hover:bg-paper"
          }`}
        >
          <Volume2 className="h-4 w-4" />
        </button>
        {correct && <Confetti />}
        <div className="text-6xl" aria-hidden>
          {correct ? "🥳" : result.kind === "timeout" ? "⏰" : "🤗"}
        </div>
        {correct ? (
          <>
            <h2 className="mt-2 font-display text-2xl font-extrabold">{tr("correct")}</h2>
            <p className="font-semibold text-muted-foreground">{tr("correctSub")}</p>
            <div className="my-3">
              <Stars count={result.stars} />
            </div>
            <button
              autoFocus
              onClick={onContinue}
              className="btn-press w-full rounded-2xl bg-leaf py-3 font-display text-xl font-extrabold text-primary-foreground shadow-chunky"
            >
              {tr("continue")}
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {result.kind === "too-little"
                ? tr("tooLittle", { x: result.difference })
                : result.kind === "too-much"
                  ? tr("tooMuch", { x: result.difference })
                  : tr("timeout")}
            </h2>
            <button
              autoFocus
              onClick={onRetry}
              className="btn-press mt-4 w-full rounded-2xl bg-sun py-3 font-display text-xl font-extrabold text-wood-dark shadow-wood"
            >
              {tr("tryAgain")}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
