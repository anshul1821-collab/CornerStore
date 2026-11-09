import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { SubmissionResult } from "@/game/types";
import { useSettings } from "./settings";
import { formatUSD } from "@/lib/currency";

export function Stars({ count, size = "text-4xl" }: { count: number; size?: string }) {
  return (
    <div className="flex justify-center gap-1.5" aria-label={`${count} / 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.6, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 400, damping: 20 }}
          className={`${size} ${i < count ? "text-sun filter drop-shadow-md" : "opacity-25 grayscale"}`}
          aria-hidden
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

function Confetti() {
  const bits = [
    { emoji: "💵", color: "#22c55e" },
    { emoji: "✨", color: "#facc15" },
    { emoji: "⭐", color: "#eab308" },
    { emoji: "🎉", color: "#ec4899" },
    { emoji: "🪙", color: "#f59e0b" },
    { emoji: "🎊", color: "#3b82f6" },
    { emoji: "💫", color: "#a855f7" },
    { emoji: "🌟", color: "#10b981" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl select-none"
          style={{ left: `${6 + i * 12}%`, top: "60%" }}
          initial={{ y: 0, opacity: 1, scale: 0.6 }}
          animate={{
            y: [-10, -220 - (i % 3) * 45],
            x: [(i % 2 === 0 ? 1 : -1) * 20],
            opacity: [1, 1, 0],
            rotate: [0, 180 * (i % 2 === 0 ? 1 : -1)],
            scale: [0.6, 1.2, 0.8],
          }}
          transition={{ duration: 1.6, delay: i * 0.06, ease: "easeOut" }}
        >
          {b.emoji}
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
  const correct = result.kind === "correct";

  // Prevent lockup: allow pressing Enter, Space, or Escape to advance or retry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        if (correct) onContinue();
        else onRetry();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [correct, onContinue, onRetry]);

  // Gentle safety timer: automatically advance after 5 seconds of celebration if user doesn't tap
  useEffect(() => {
    if (!correct) return;
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);
    return () => clearTimeout(timer);
  }, [correct, onContinue]);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        // Tapping backdrop automatically advances or retries to guarantee no screen freeze
        if (correct) onContinue();
        else onRetry();
      }}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-xs select-none cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-4 p-6 sm:p-7 text-center shadow-wood cursor-default ${
          correct
            ? "border-emerald-500 bg-gradient-to-b from-emerald-50 to-emerald-100"
            : "border-orange bg-gradient-to-b from-amber-50 to-orange-100"
        }`}
      >
        {correct && <Confetti />}

        {/* Dynamic Big Icon */}
        <motion.div
          initial={{ scale: 0.7, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="text-6xl sm:text-7xl filter drop-shadow-md"
          aria-hidden
        >
          {correct ? "🥳" : result.kind === "timeout" ? "⏰" : "🤔"}
        </motion.div>

        {correct ? (
          <>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-black text-emerald-800 drop-shadow-xs">
              {tr("correct")}
            </h2>
            <p className="font-bold text-sm sm:text-base text-emerald-700 mt-1">
              {tr("correctSub")}
            </p>
            <div className="my-4">
              <Stars count={result.stars} size="text-4xl sm:text-5xl" />
            </div>
            <button
              autoFocus
              onClick={onContinue}
              className="btn-press w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 py-3.5 font-display text-xl sm:text-2xl font-black text-white shadow-chunky transition-transform cursor-pointer"
            >
              {tr("continue")} ▶
            </button>
            <p className="mt-2 text-[11px] font-bold text-emerald-800/70">
              💡 Tap anywhere or press Enter to continue
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-black text-wood-dark">
              {result.kind === "too-little"
                ? `Almost there! Customer needs ${formatUSD(result.difference)} more.`
                : result.kind === "too-much"
                  ? `Oops! That's ${formatUSD(result.difference)} too much.`
                  : tr("timeout")}
            </h2>
            <p className="mt-1 font-bold text-sm sm:text-base text-wood">
              {result.kind === "too-little"
                ? "Add more money from the drawer to reach exact change."
                : result.kind === "too-much"
                  ? "Tap the extra money in the tray to take it back."
                  : "Let's try serving this customer again!"}
            </p>
            <button
              autoFocus
              onClick={onRetry}
              className="btn-press mt-5 w-full rounded-2xl bg-sun hover:bg-amber-300 active:bg-amber-500 py-3.5 font-display text-xl sm:text-2xl font-black text-wood-dark shadow-wood transition-transform cursor-pointer"
            >
              🔄 {tr("tryAgain")}
            </button>
            <p className="mt-2 text-[11px] font-bold text-wood-dark/70">
              💡 Tap anywhere or press Enter to try again
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
