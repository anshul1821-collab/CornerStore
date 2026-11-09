import type { Scenario } from "@/game/types";
import { useSettings } from "./settings";
import { formatUSD } from "@/lib/currency";

export function ShoppingBill({
  scenario,
  calculatedTotal,
  onChangeTotal,
  onCheckTotal,
  isTotalVerified = false,
  totalError = null,
  disabled = false,
}: {
  scenario: Scenario;
  calculatedTotal: number | "";
  onChangeTotal: (v: number | "") => void;
  onCheckTotal?: () => void;
  isTotalVerified?: boolean;
  totalError?: string | null;
  disabled?: boolean;
}) {
  const { lang, tr } = useSettings();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onCheckTotal && !isTotalVerified && calculatedTotal !== "") {
      e.preventDefault();
      onCheckTotal();
    }
  };

  return (
    <div className="paper-receipt relative rounded-2xl border-2 border-border p-2.5 sm:p-3 shadow-soft flex flex-col justify-between h-full bg-paper">
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div>
          <div className="flex items-center justify-between">
            <p className="font-display text-base sm:text-lg font-extrabold tracking-[0.2em] text-wood-dark">
              🧾 {tr("bill")}
            </p>
            {isTotalVerified ? (
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.2 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                ✓ {tr("billVerified")}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.2 text-[10px] font-extrabold text-amber-800 uppercase tracking-wider animate-pulse">
                Step 1: Calculate
              </span>
            )}
          </div>

          <div className="my-1 sm:my-1.5 border-t-2 border-dashed border-border" />

          {/* Shopping basket items with product name, quantity, and unit price */}
          <ul className="space-y-1.5 max-h-[105px] lg:max-h-[125px] overflow-y-auto pr-1">
            {scenario.items.map((i) => (
              <li
                key={i.productId}
                className="flex items-center justify-between gap-2 text-xs sm:text-sm"
              >
                <div className="min-w-0 font-bold truncate flex items-center gap-1">
                  <span>{i.emoji}</span>
                  <span className="truncate">{i.name[lang]}</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                    ({i.qty} × {formatUSD(i.unitPrice)})
                  </span>
                </div>

                {/* Subtotal is NEVER shown before the player submits and verifies the bill */}
                <div className="shrink-0">
                  {isTotalVerified ? (
                    <span className="font-extrabold tabular-nums text-emerald-800 flex items-center gap-0.5">
                      {formatUSD(i.unitPrice * i.qty)}
                      <span className="text-emerald-600 text-[10px] font-black">✓</span>
                    </span>
                  ) : (
                    <span
                      className="inline-block rounded border border-dashed border-wood-dark/30 bg-wood-light/10 px-1.5 py-0.2 text-[11px] font-extrabold text-wood-dark/50 tabular-nums"
                      title="Calculate item total"
                    >
                      ?
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-1">
          <div className="my-1 sm:my-1.5 border-t-2 border-dashed border-border" />
          <div className="flex justify-between font-bold text-xs sm:text-sm">
            <span>{tr("subtotal")}</span>
            <span className="tabular-nums">
              {isTotalVerified ? formatUSD(scenario.subtotal) : "???"}
            </span>
          </div>

          {scenario.discount && (
            <div className="flex justify-between gap-2 font-bold text-leaf-dark text-xs sm:text-sm mt-0.5">
              <span className="truncate">🏷️ {scenario.discount.label[lang]}</span>
              <span className="tabular-nums shrink-0">
                −{formatUSD(scenario.discount.amount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Helpful inline feedback hint when user enters incorrect calculation */}
      {totalError && !isTotalVerified && (
        <div className="my-1.5 rounded-xl border border-rose-300 bg-rose-50/95 p-1.5 text-[11px] font-bold text-rose-800 flex items-start gap-1 shadow-xs">
          <span className="text-xs shrink-0">💡</span>
          <span className="flex-1 leading-tight">{totalError}</span>
        </div>
      )}

      {/* Cashier Payable Total Input & Verification Button */}
      <div className="mt-2 space-y-1.5">
        <div
          className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 border transition-all ${
            isTotalVerified
              ? "bg-emerald-50 border-emerald-300"
              : totalError
                ? "bg-rose-50/80 border-rose-300"
                : "bg-sun/60 border-sun"
          }`}
        >
          <div className="flex flex-col">
            <span className="font-extrabold text-xs sm:text-sm text-wood-dark">
              {tr("totalToPay")}
            </span>
            {!isTotalVerified && (
              <span className="text-[9px] sm:text-[10px] font-bold text-wood-dark/70">
                Multiply & add items
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-display text-lg sm:text-xl font-extrabold text-wood-dark">$</span>
            <input
              type="number"
              value={calculatedTotal}
              onChange={(e) => onChangeTotal(e.target.value ? Number(e.target.value) : "")}
              onKeyDown={handleKeyDown}
              disabled={disabled || isTotalVerified}
              className={`w-16 sm:w-20 rounded-lg border-2 px-1 text-right font-display text-lg sm:text-xl font-extrabold tabular-nums outline-none transition-all ${
                isTotalVerified
                  ? "border-emerald-600 bg-white text-emerald-800 shadow-xs"
                  : totalError
                    ? "border-rose-500 bg-white text-rose-900 focus:border-rose-600"
                    : "border-wood-dark/40 bg-white text-wood-dark focus:border-orange focus:ring-2 focus:ring-orange/20"
              } ${disabled ? "opacity-75" : ""}`}
              placeholder="?"
              aria-label={tr("totalToPay")}
            />

            {!isTotalVerified ? (
              <button
                type="button"
                onClick={onCheckTotal}
                disabled={disabled || calculatedTotal === ""}
                aria-label="Check Bill Total"
                className="btn-press rounded-lg bg-orange hover:bg-orange-dark active:scale-95 text-white text-xs font-black px-2.5 py-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {tr("checkBill")}
              </button>
            ) : (
              <span className="text-emerald-700 text-xs font-black flex items-center gap-0.5 px-2 py-1 rounded bg-emerald-100 border border-emerald-300 shrink-0">
                ✓
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-mint px-2.5 py-1.5 border border-mint-dark/20">
          <span className="font-extrabold text-xs sm:text-sm text-leaf-dark">
            {tr("customerGave")}
          </span>
          <span className="font-display text-lg sm:text-xl font-extrabold text-leaf-dark tabular-nums">
            {formatUSD(scenario.paid)}
          </span>
        </div>
      </div>
    </div>
  );
}
