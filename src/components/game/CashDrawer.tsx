import { motion } from "framer-motion";
import type { DenomId, Denomination } from "@/game/types";
import { CurrencyPiece } from "./Currency";
import { useSettings } from "./settings";

interface Props {
  denominations: Denomination[];
  onAdd: (id: DenomId) => void;
  disabled?: boolean;
}

/** Unlimited supply drawer: tap or drag a piece to add a copy to the tray. */
export function CashDrawer({ denominations, onAdd, disabled }: Props) {
  const { tr } = useSettings();
  const coins = denominations.filter((d) => d.kind === "coin");
  const notes = denominations.filter((d) => d.kind === "note");
  const Slot = ({ d }: { d: Denomination }) => (
    <motion.button
      type="button"
      disabled={disabled}
      draggable={!disabled}
      onDragStart={(e) => {
        const ev = e as unknown as React.DragEvent;
        ev.dataTransfer.setData("text/denom", d.id);
        ev.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => onAdd(d.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Add ₹${d.value} ${d.kind}`}
      className="grid min-h-13 sm:min-h-14 shrink-0 cursor-grab place-items-center rounded-xl bg-wood-dark/60 px-1.5 py-1 shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--wood-dark)_70%,transparent)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sun disabled:opacity-50 active:cursor-grabbing"
    >
      <CurrencyPiece denom={d} size="sm" />
    </motion.button>
  );
  return (
    <section
      aria-label={tr("drawer")}
      className="bg-wood-grain rounded-2xl border-3 border-wood-dark p-2 sm:p-2.5 shadow-wood shrink-0"
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-1.5 px-1">
        <h2 className="font-display text-sm sm:text-base font-extrabold text-sun leading-none">
          🗄️ {tr("drawer")}
        </h2>
        <p className="text-xs sm:text-sm font-bold text-cream leading-none">{tr("drawerHint")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {notes.map((d) => (
            <Slot key={d.id} d={d} />
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {coins.map((d) => (
            <Slot key={d.id} d={d} />
          ))}
        </div>
      </div>
    </section>
  );
}
