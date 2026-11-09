import { motion } from "framer-motion";
import type { DenomId, Denomination, Tray } from "@/game/types";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";
import { formatUSD } from "@/lib/currency";

interface Props {
  denominations: Denomination[];
  onAdd: (id: DenomId) => void;
  disabled?: boolean;
  tray?: Tray;
}

export function CashDrawer({ denominations, onAdd, disabled, tray = {} }: Props) {
  const { tr, play } = useSettings();
  const coins = denominations.filter((d) => d.kind === "coin");
  const notes = denominations.filter((d) => d.kind === "note");

  const handleAdd = (id: DenomId) => {
    if (disabled) return;
    play("tap");
    onAdd(id);
  };

  const Slot = ({ d }: { d: Denomination }) => {
    const countInTray = tray[d.id] ?? 0;
    const isSelected = countInTray > 0;

    return (
      <motion.button
        type="button"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          const ev = e as unknown as React.DragEvent;
          ev.dataTransfer.setData("text/denom", d.id);
          ev.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => handleAdd(d.id)}
        whileHover={disabled ? {} : { y: -3, scale: 1.04 }}
        whileTap={disabled ? {} : { scale: 0.92 }}
        aria-label={`Add ${formatUSD(d.value)} ${d.kind === "coin" ? "coin" : "bill"}`}
        title={`Tap to add ${formatUSD(d.value)}`}
        className={`group relative flex shrink-0 items-center justify-center rounded-2xl p-1.5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun disabled:opacity-50 disabled:cursor-not-allowed ${
          isSelected
            ? "bg-amber-100/90 ring-3 ring-sun shadow-md"
            : "bg-wood-dark/70 hover:bg-wood-dark/85 shadow-inner"
        }`}
      >
        <CurrencyPiece denom={d} size="md" isHighlighted={isSelected} />

        {/* Selected Count Indicator Badge */}
        {isSelected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-black text-white shadow-md border-2 border-white"
          >
            +{countInTray}
          </motion.span>
        )}

        {/* Helpful tap prompt for children */}
        <span className="sr-only">Tap to add {formatUSD(d.value)}</span>
      </motion.button>
    );
  };

  return (
    <section
      aria-label={tr("drawer")}
      className="bg-wood-grain rounded-3xl border-4 border-wood-dark p-2.5 sm:p-3 shadow-wood shrink-0"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-xl bg-sun text-lg shadow-xs"
            aria-hidden
          >
            🗄️
          </span>
          <div>
            <h2 className="font-display text-base sm:text-lg font-extrabold text-sun leading-none drop-shadow-xs">
              {tr("drawer")}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-cream/90 leading-tight">
              Tap any bill or coin to add to the customer's change tray!
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Banknotes Section */}
        <div className="rounded-2xl bg-black/25 p-2 sm:p-2.5 border border-white/10">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-200 uppercase tracking-wider">
            <span>💵</span>
            <span>Dollar Bills</span>
          </div>
          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {notes.map((d) => (
              <Slot key={d.id} d={d} />
            ))}
          </div>
        </div>

        {/* Coins Section */}
        <div className="rounded-2xl bg-black/25 p-2 sm:p-2.5 border border-white/10">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-200 uppercase tracking-wider">
            <span>🪙</span>
            <span>Dollar Coins</span>
          </div>
          <div className="flex gap-3 sm:gap-3.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {coins.map((d) => (
              <Slot key={d.id} d={d} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
