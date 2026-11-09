import { useState } from "react";
import { motion } from "framer-motion";
import type { Discount, HintStep, LineItem } from "@/game/types";
import { denomById } from "@/game/engine";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";
import { formatUSD } from "@/lib/currency";

interface Props {
  mode?: "bill" | "change";
  items?: LineItem[];
  discount?: Discount | null;
  price: number;
  paid: number;
  steps: HintStep[];
  onShowPieces: () => void;
  onClose: () => void;
}

export function HintPanel({
  mode = "change",
  items = [],
  discount = null,
  price,
  paid,
  steps,
  onShowPieces,
  onClose,
}: Props) {
  const { tr, lang } = useSettings();
  const [cur, setCur] = useState(0);

  const points = [price, ...steps.map((s) => s.to)];
  const step = steps[cur];

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
        {mode === "bill" ? (
          // Bill Calculation Hint Guide (Never leaks the final answer)
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-teal">
                💡 {tr("billHintTitle") || "How to Calculate the Bill"}
              </h3>
              <span className="rounded-full bg-sun/40 border border-sun px-2.5 py-0.5 text-xs font-black text-wood-dark">
                Math Guide
              </span>
            </div>

            <p className="text-muted-foreground font-semibold text-xs sm:text-sm mt-1">
              Follow these mathematical steps to calculate the exact Total to Pay:
            </p>

            <div className="my-3 space-y-2 text-xs sm:text-sm">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-2.5">
                <p className="font-extrabold text-wood-dark">
                  Step 1: Multiply each item (Quantity × Unit Price)
                </p>
                <ul className="mt-1 space-y-1 text-wood-dark/90 pl-2">
                  {items.map((it) => (
                    <li key={it.productId} className="flex items-center gap-1 font-bold">
                      <span>•</span>
                      <span>{it.emoji} {it.name[lang]}:</span>
                      <span className="font-black text-amber-900">
                        {it.qty} × {formatUSD(it.unitPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {items.length > 1 && (
                <div className="rounded-2xl bg-sky-50 border border-sky-200 p-2.5">
                  <p className="font-extrabold text-sky-950">
                    Step 2: Add up all the item amounts
                  </p>
                  <p className="text-xs text-sky-900/80 mt-0.5">
                    Sum the results from Step 1 together to find your basket subtotal.
                  </p>
                </div>
              )}

              {discount && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5">
                  <p className="font-extrabold text-emerald-950">
                    Step {items.length > 1 ? 3 : 2}: Subtract the discount
                  </p>
                  <p className="text-xs text-emerald-900/80 mt-0.5">
                    🏷️ {discount.label[lang]}: Subtract the discount amount from the subtotal.
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-sun/30 border border-sun p-2.5 font-bold text-wood-dark flex items-center gap-2">
                <span className="text-base">✏️</span>
                <span>Enter your final calculated answer in the <strong>Total to Pay</strong> box and tap <strong>Check</strong>!</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-leaf px-5 py-2 font-black text-xs sm:text-sm text-primary-foreground shadow-soft hover:brightness-105 cursor-pointer"
              >
                {tr("close")}
              </button>
            </div>
          </div>
        ) : (
          // Change Counting Hint Guide (Count-up method from price to paid)
          <div>
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

            {steps.length > 0 && step && (
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
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
