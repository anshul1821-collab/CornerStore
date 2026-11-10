import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { SubmissionResult, TransactionRecord } from "@/game/types";
import { getEncouragingFeedback } from "@/game/engine";
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

interface FeedbackProps {
  result: SubmissionResult;
  hint?: string | null;
  onContinue: () => void;
  onRetry: () => void;
}

export function Feedback({ result, hint, onContinue, onRetry }: FeedbackProps) {
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

            {/* Progressive Change Hint */}
            {hint && (
              <div className="my-3 rounded-2xl border border-amber-300 bg-amber-50 p-2.5 text-xs font-bold text-amber-950 text-left flex items-start gap-2 shadow-xs">
                <span className="text-base shrink-0">💡</span>
                <span className="flex-1 leading-snug">{hint}</span>
              </div>
            )}

            <button
              autoFocus
              onClick={onRetry}
              className="btn-press mt-4 w-full rounded-2xl bg-sun hover:bg-amber-300 active:bg-amber-500 py-3.5 font-display text-xl sm:text-2xl font-black text-wood-dark shadow-wood transition-transform cursor-pointer"
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

export interface TransactionSummaryProps {
  record: TransactionRecord;
  customerIndex: number;
  totalCustomers: number;
  onNext: () => void;
}

/**
 * STAGE 4 — Performance Feedback Component
 * Compact summary shown after the customer completes checkout and leaves.
 */
export function TransactionSummary({
  record,
  customerIndex,
  totalCustomers,
  onNext,
}: TransactionSummaryProps) {
  const { tr } = useSettings();
  const isFinalCustomer = customerIndex + 1 >= totalCustomers;
  const feedbackMessage = getEncouragingFeedback(record.stars);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext]);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-4 border-emerald-500 bg-gradient-to-b from-white via-emerald-50/50 to-emerald-100/70 p-5 sm:p-6 text-center shadow-wood"
      >
        {record.stars === 3 && <Confetti />}

        <div className="flex items-center justify-between border-b border-wood-dark/15 pb-2">
          <span className="text-[11px] sm:text-xs font-black text-wood-dark uppercase tracking-wider">
            Stage 4: Transaction Summary
          </span>
          <span className="rounded-full bg-sun/40 border border-sun px-2 py-0.5 text-[11px] font-black text-wood-dark">
            Customer {customerIndex + 1} of {totalCustomers}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-4xl sm:text-5xl" aria-hidden>
            {record.stars === 3 ? "🏆" : record.stars === 2 ? "🎉" : "👍"}
          </div>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-emerald-800">
            {feedbackMessage}
          </h2>
          <p className="font-bold text-sm sm:text-base text-emerald-700 mt-0.5">
            {tr("correct")}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-wood-dark/70 mt-0.5">
            🛍️ {record.customerName} received their items & exact change!
          </p>

          <div className="my-3">
            <Stars count={record.stars} size="text-4xl sm:text-5xl" />
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 gap-2 text-left my-3">
          {/* Bill Calculation */}
          <div className="rounded-2xl border border-wood-dark/15 bg-white/90 p-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-wood-dark">🧾 Bill Total</span>
              {record.billFirstTry ? (
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 shrink-0">
                  ✓ 1st Try
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 shrink-0">
                  {record.billMistakes} retry
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground font-semibold leading-tight">
              {record.billFirstTry
                ? "Perfect first-time math!"
                : `Resolved after ${record.billMistakes + 1} attempts.`}
            </p>
          </div>

          {/* Change Calculation */}
          <div className="rounded-2xl border border-wood-dark/15 bg-white/90 p-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-wood-dark">💰 Change</span>
              {record.changeFirstTry ? (
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 shrink-0">
                  ✓ 1st Try
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 shrink-0">
                  {record.changeMistakes} retry
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground font-semibold leading-tight">
              {record.changeFirstTry
                ? "Exact change returned!"
                : `Adjusted after ${record.changeMistakes + 1} counts.`}
            </p>
          </div>

          {/* Time Taken */}
          <div className="rounded-2xl border border-wood-dark/15 bg-white/90 p-2.5 shadow-xs">
            <span className="text-xs font-black text-wood-dark">⏱️ Time Taken</span>
            <p className="mt-0.5 font-display text-lg font-black text-wood-dark">
              {record.timeTaken}s
              {record.timedOut && (
                <span className="ml-1 text-[10px] font-bold text-orange">(Over time)</span>
              )}
            </p>
          </div>

          {/* Mistakes & Hints */}
          <div className="rounded-2xl border border-wood-dark/15 bg-white/90 p-2.5 shadow-xs">
            <span className="text-xs font-black text-wood-dark">🔁 Mistakes / Hints</span>
            <p className="mt-0.5 font-display text-lg font-black text-wood-dark">
              {record.billMistakes + record.changeMistakes} / {record.hintsUsed}
            </p>
          </div>
        </div>

        {/* Continue Action Button */}
        <button
          autoFocus
          onClick={onNext}
          className="btn-press mt-2 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 py-3.5 font-display text-xl sm:text-2xl font-black text-white shadow-chunky transition-transform cursor-pointer"
        >
          {isFinalCustomer ? "View Level Results 🏆" : `${tr("continue")} ▶`}
        </button>
        <p className="mt-2 text-[11px] font-bold text-emerald-800/70">
          💡 Press Enter or Space to continue
        </p>
      </motion.div>
    </motion.div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
