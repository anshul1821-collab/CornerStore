import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import type { DenomId, Denomination, TotalState, Tray } from "@/game/types";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";
import { formatUSD } from "@/lib/currency";

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
  const { tr, play } = useSettings();
  const [over, setOver] = useState(false);
  const entries = denominations
    .filter((d) => (tray[d.id] ?? 0) > 0)
    .sort((a, b) => b.value - a.value);

  const handleRemove = (id: DenomId) => {
    if (disabled) return;
    play("tap");
    onRemove(id);
  };

  const handleClear = () => {
    if (disabled) return;
    play("tap");
    onClear();
  };

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
      className={`relative rounded-3xl border-4 border-dashed p-3 transition-colors flex-1 flex flex-col justify-between shadow-inner ${
        over
          ? "border-emerald-500 bg-emerald-50/90 ring-4 ring-emerald-200"
          : "border-wood/40 bg-amber-50/80"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base" aria-hidden>
            🛍️
          </span>
          <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-wood-dark">
            {tr("tray")}
          </h2>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-xs font-bold text-coral-dark border-2 border-coral/30 hover:bg-rose-50 hover:border-coral active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Clear all money from tray"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{tr("clear")}</span>
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-20 sm:min-h-24 flex-wrap items-center justify-center gap-2.5 py-2">
        {entries.length === 0 && (
          <div className="w-full text-center py-2 flex flex-col items-center justify-center">
            <span
              className="text-3xl sm:text-4xl animate-bounce [animation-duration:2.5s]"
              aria-hidden
            >
              🪙
            </span>
            <p className="mt-1 text-xs sm:text-sm font-extrabold text-wood-dark/80">
              {tr("trayEmpty")}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Tap bills and coins from the drawer below
            </p>
          </div>
        )}

        <AnimatePresence>
          {entries.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ scale: 0.2, y: 25, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              className="relative group cursor-pointer"
              onClick={() => handleRemove(d.id)}
              title={`Tap to remove one ${formatUSD(d.value)}`}
            >
              <CurrencyPiece denom={d} size="sm" />

              {/* Quantity Tag */}
              <motion.span
                key={tray[d.id]}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -left-2 grid h-5.5 min-w-5.5 place-items-center rounded-full bg-sun px-1 text-xs font-black text-wood-dark border-2 border-paper shadow-md"
              >
                ×{tray[d.id]}
              </motion.span>

              {/* Quick Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(d.id);
                }}
                disabled={disabled}
                aria-label={`${tr("remove")} ${formatUSD(d.value)}`}
                className="absolute -top-2 -right-2 grid h-5.5 w-5.5 place-items-center rounded-full bg-coral text-white border-2 border-paper shadow-md hover:scale-115 active:scale-95 transition-transform cursor-pointer"
              >
                <X className="h-3.5 w-3.5 stroke-[3]" />
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
  const exact = state === "exact";
  const above = state === "above";

  let statusMsg = tr("st_empty");
  let statusBadgeClass = "bg-stone-100 text-stone-600 border-stone-200";

  if (exact) {
    statusMsg = "✨ Exact change ready to give!";
    statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-black";
  } else if (above) {
    statusMsg = "⚠️ Too much change! Tap some to remove.";
    statusBadgeClass = "bg-rose-100 text-rose-800 border-rose-300 font-extrabold";
  } else if (!empty) {
    statusMsg = "Keep adding change from the drawer!";
    statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-300 font-extrabold";
  }

  return (
    <div
      className={`rounded-2xl border-3 p-2 text-center shadow-soft transition-all ${
        exact
          ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-200"
          : above
            ? "bg-rose-50/90 border-rose-400"
            : empty
              ? "bg-paper border-wood-light"
              : "bg-paper border-sky"
      }`}
      aria-live="polite"
    >
      <p className="text-[10px] sm:text-xs font-black tracking-widest text-wood-dark/70 uppercase">
        {tr("giving")}
      </p>

      {/* Animated Prominent USD Total */}
      <motion.p
        key={total}
        initial={{ scale: 1.25, y: -2 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 20 }}
        className={`font-display text-2xl sm:text-3xl font-black leading-tight ${
          exact ? "text-emerald-700" : above ? "text-rose-700" : "text-wood-dark"
        }`}
      >
        {formatUSD(total)}
      </motion.p>

      {/* Friendly visual status pill for children */}
      <div
        className={`mt-1 inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs transition-colors ${statusBadgeClass}`}
      >
        <span>{statusMsg}</span>
      </div>
    </div>
  );
}
