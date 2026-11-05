import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { DenomId, Denomination, TotalState, Tray } from "@/game/types";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";

interface TrayProps {
  tray: Tray;
  denominations: Denomination[];
  onDrop: (id: DenomId) => void;
  onRemove: (id: DenomId) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ChangeTray({
  tray,
  denominations,
  onDrop,
  onRemove,
  onClear,
  disabled,
}: TrayProps) {
  const { tr } = useSettings();
  const [over, setOver] = useState(false);
  const entries = denominations
    .filter((d) => (tray[d.id] ?? 0) > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <section
      aria-label={tr("tray")}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/denom") as DenomId;
        if (id && !disabled) onDrop(id);
      }}
      className={`relative rounded-2xl border-3 border-dashed p-2 sm:p-2.5 transition-colors flex-1 flex flex-col justify-between ${
        over ? "border-leaf bg-mint" : "border-wood-light bg-peach/70"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-wood">
          {tr("tray")}
        </h2>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            disabled={disabled}
            className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-bold text-wood-dark border-2 border-wood-light hover:bg-cream cursor-pointer"
          >
            {tr("clear")}
          </button>
        )}
      </div>
      <div className="flex flex-1 min-h-16 sm:min-h-20 flex-wrap items-center justify-center gap-2 py-1">
        {entries.length === 0 && (
          <p className="w-full text-center text-xs sm:text-sm font-bold text-muted-foreground">
            <span className="mb-0.5 block text-2xl" aria-hidden>
              🪙
            </span>
            {tr("trayEmpty")}
          </p>
        )}
        <AnimatePresence>
          {entries.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ scale: 0.3, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="relative"
            >
              <CurrencyPiece denom={d} size="sm" />
              <motion.span
                key={tray[d.id]}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-sun px-0.5 text-xs font-extrabold text-wood-dark border border-paper"
              >
                ×{tray[d.id]}
              </motion.span>
              <button
                onClick={() => onRemove(d.id)}
                disabled={disabled}
                aria-label={`${tr("remove")} ₹${d.value}`}
                className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-destructive-foreground border border-paper hover:scale-110 transition-transform cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function RunningTotal({ total, state }: { total: number; state: TotalState }) {
  const { tr } = useSettings();
  const empty = state === "empty";
  const msg = empty ? tr("st_empty") : total < 10 ? tr("st_below") : tr("st_ready");
  return (
    <div
      className={`rounded-2xl border-3 p-1.5 sm:p-2 text-center shadow-soft transition-colors ${empty ? "bg-paper border-wood-light" : "bg-paper border-sky"}`}
      aria-live="polite"
    >
      <p className="text-[10px] sm:text-xs font-extrabold tracking-widest text-muted-foreground uppercase">
        {tr("giving")}
      </p>
      <motion.p
        key={total}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="font-display text-2xl sm:text-3xl font-extrabold text-wood-dark leading-tight"
      >
        ₹{total}
      </motion.p>
      <p className="font-bold text-xs sm:text-sm text-wood">{msg}</p>
    </div>
  );
}
