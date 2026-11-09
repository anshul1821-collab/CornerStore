import { useState } from "react";
import { motion } from "framer-motion";
import type { HintStep } from "@/game/types";
import { denomById } from "@/game/engine";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";
import { formatUSD } from "@/lib/currency";

interface Props {
  price: number;
  paid: number;
  steps: HintStep[];
  onShowPieces: () => void;
  onClose: () => void;
}

export function HintPanel({ price, paid, steps, onShowPieces, onClose }: Props) {
  const { tr } = useSettings();
  const [cur, setCur] = useState(0);
  const points = [price, ...steps.map((s) => s.to)];
  const step = steps[cur]!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-wood-dark/55 p-3 sm:p-4 backdrop-blur-xs select-none cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 1, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border-4 border-sky bg-paper p-3.5 sm:p-5 shadow-soft cursor-default"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-teal">
              💡 {tr("hintTitle")}
            </h3>
          </div>
          <p className="font-bold text-xs sm:text-sm">
            {tr("price")}: {formatUSD(price)} · {tr("paid")}: {formatUSD(paid)}
          </p>
        </div>
        <p className="text-muted-foreground font-semibold text-xs sm:text-sm mt-0.5">
          {tr("hintIntro")}
        </p>

        <div className="my-2.5 flex flex-wrap items-center gap-1 text-base sm:text-lg font-extrabold">
          {points.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-wood-light text-sm">→</span>}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs sm:text-sm transition-colors ${
                  i <= cur + 1 && i > 0
                    ? "bg-sun text-wood-dark"
                    : i === 0
                      ? "bg-peach text-wood-dark"
                      : "bg-cream text-muted-foreground"
                }`}
              >
                {formatUSD(p)}
              </span>
            </span>
          ))}
        </div>

        {steps.length > 0 && (
          <motion.div
            key={cur}
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl bg-mint p-2.5 sm:p-3"
          >
            <CurrencyPiece denom={denomById(step.denom)} size="sm" />
            <div>
              <p className="text-xs font-extrabold tracking-widest text-leaf-dark">
                {tr("step")} {cur + 1} / {steps.length}
              </p>
              <p className="text-sm sm:text-base font-bold text-wood-dark">
                {tr("give")} {formatUSD(denomById(step.denom).value)}{" "}
                {denomById(step.denom).kind === "coin" ? "coin" : "bill"} → {formatUSD(step.to)}
              </p>
            </div>
          </motion.div>
        )}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              disabled={cur === 0}
              onClick={() => setCur((c) => Math.max(0, c - 1))}
              className="rounded-xl border-2 border-wood-light px-3 py-1.5 text-xs font-bold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              ◀ {tr("prev")}
            </button>
            <button
              disabled={cur >= steps.length - 1}
              onClick={() => setCur((c) => Math.min(steps.length - 1, c + 1))}
              className="rounded-xl border-2 border-wood-light px-3 py-1.5 text-xs font-bold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              {tr("next")} ▶
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onShowPieces();
                onClose();
              }}
              className="rounded-xl bg-orange px-3 py-1.5 font-bold text-xs text-primary-foreground shadow-soft hover:brightness-105 cursor-pointer"
            >
              {tr("showPieces")}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-leaf px-3.5 py-1.5 font-bold text-xs text-primary-foreground shadow-soft hover:brightness-105 cursor-pointer"
            >
              {tr("close")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
