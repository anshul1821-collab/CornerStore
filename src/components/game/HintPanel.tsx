import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { HintStep } from "@/game/types";
import { denomById } from "@/game/engine";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";
import { useVoice } from "@/lib/voice/useVoice";

interface Props {
  price: number;
  paid: number;
  steps: HintStep[];
  onShowPieces: () => void;
  onClose: () => void;
}

export function HintPanel({ price, paid, steps, onShowPieces, onClose }: Props) {
  const { tr } = useSettings();
  const { isSpeaking, activeCharacter, speak, stop } = useVoice();
  const speakingShopkeeper = isSpeaking && activeCharacter === "shopkeeper";
  const [cur, setCur] = useState(0);
  const points = [price, ...steps.map((s) => s.to)];
  const step = steps[cur]!;

  const handleSpeakHint = () => {
    speak({
      text: `Here's a handy trick! The bill is ₹${price}, and the customer gave ₹${paid}. Try counting up from ₹${price} to make the change!`,
      character: "shopkeeper",
      dialogueType: "fixed",
    });
  };

  useEffect(() => {
    handleSpeakHint();
    return () => {
      stop();
    };
  }, [price, paid]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-wood-dark/50 p-3 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl border-4 border-sky bg-paper p-3.5 sm:p-5 shadow-soft"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-teal">
              💡 {tr("hintTitle")}
            </h3>
            <button
              onClick={handleSpeakHint}
              type="button"
              aria-label="Hear hint voice"
              title="Hear Shopkeeper hint"
              className={`grid h-6 w-6 place-items-center rounded-full transition-colors cursor-pointer ${
                speakingShopkeeper
                  ? "bg-emerald-200 text-emerald-800 ring-2 ring-emerald-400"
                  : "bg-sky/50 text-teal hover:bg-sky"
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="font-bold text-xs sm:text-sm">
            {tr("price")}: ₹{price} · {tr("paid")}: ₹{paid}
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
                className={`rounded-full px-2.5 py-0.5 text-xs sm:text-sm transition-colors ${i <= cur + 1 && i > 0 ? "bg-sun" : i === 0 ? "bg-peach" : "bg-cream text-muted-foreground"}`}
              >
                ₹{p}
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
              <p className="font-display text-lg sm:text-xl font-extrabold">
                ₹{step.from} + ₹{denomById(step.denom).value} = ₹{step.to}
              </p>
            </div>
          </motion.div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            disabled={cur === 0}
            onClick={() => setCur(cur - 1)}
            className="rounded-full border-2 border-wood-light bg-cream px-3 py-1.5 text-xs sm:text-sm font-bold disabled:opacity-40 cursor-pointer"
          >
            {tr("prev")}
          </button>
          <button
            disabled={cur >= steps.length - 1}
            onClick={() => setCur(cur + 1)}
            className="rounded-full bg-sky px-3 py-1.5 text-xs sm:text-sm font-extrabold disabled:opacity-40 cursor-pointer"
          >
            {tr("next")}
          </button>
          <button
            onClick={() => {
              onShowPieces();
              onClose();
            }}
            className="rounded-full bg-sun px-3.5 py-1.5 text-xs sm:text-sm font-extrabold cursor-pointer"
          >
            {tr("showPieces")}
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-full bg-leaf px-4 py-1.5 text-xs sm:text-sm font-extrabold text-primary-foreground cursor-pointer"
          >
            {tr("close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
