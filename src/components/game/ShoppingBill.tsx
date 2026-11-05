import type { Scenario } from "@/game/types";
import { useSettings } from "./settings";

export function ShoppingBill({
  scenario,
  calculatedTotal,
  onChangeTotal,
  disabled,
}: {
  scenario: Scenario;
  calculatedTotal: number | "";
  onChangeTotal: (v: number | "") => void;
  disabled?: boolean;
}) {
  const { lang, tr } = useSettings();
  return (
    <div className="paper-receipt relative rounded-2xl border-2 border-border p-2.5 sm:p-3 shadow-soft flex flex-col justify-between h-full">
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div>
          <p className="text-center font-display text-base sm:text-lg font-extrabold tracking-[0.25em] text-wood">
            🧾 {tr("bill")}
          </p>
          <div className="my-1 sm:my-1.5 border-t-2 border-dashed border-border" />
          <ul className="space-y-1 max-h-[95px] lg:max-h-[115px] overflow-y-auto pr-1">
            {scenario.items.map((i) => (
              <li
                key={i.productId}
                className="flex items-start justify-between gap-2 text-xs sm:text-sm"
              >
                <span className="min-w-0 font-bold truncate">
                  {i.emoji} {i.name[lang]}
                  {i.qty > 1 && (
                    <span className="inline-block ml-1 text-xs text-muted-foreground">
                      ({i.qty} × ₹{i.unitPrice})
                    </span>
                  )}
                </span>
                <span className="font-extrabold tabular-nums shrink-0">₹{i.unitPrice * i.qty}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-1">
          <div className="my-1 sm:my-1.5 border-t-2 border-dashed border-border" />
          <div className="flex justify-between font-bold text-xs sm:text-sm">
            <span>{tr("subtotal")}</span>
            <span className="tabular-nums">
              {calculatedTotal === scenario.payable ? `₹${scenario.subtotal}` : "???"}
            </span>
          </div>
          {scenario.discount && (
            <div className="flex justify-between gap-2 font-bold text-leaf-dark text-xs sm:text-sm mt-0.5">
              <span className="truncate">🏷️ {scenario.discount.label[lang]}</span>
              <span className="tabular-nums shrink-0">−₹{scenario.discount.amount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg bg-sun/60 px-2.5 py-1">
          <span className="font-extrabold text-xs sm:text-sm">{tr("totalToPay")}</span>
          <div className="flex items-center gap-0.5">
            <span className="font-display text-lg sm:text-xl font-extrabold tabular-nums">₹</span>
            <input
              type="number"
              value={calculatedTotal}
              onChange={(e) => onChangeTotal(e.target.value ? Number(e.target.value) : "")}
              disabled={disabled || calculatedTotal === scenario.payable}
              className={`w-14 rounded-md border-2 px-1 text-right font-display text-lg sm:text-xl font-extrabold tabular-nums outline-none transition-colors ${
                calculatedTotal === scenario.payable
                  ? "border-leaf-dark bg-leaf/20 text-leaf-dark"
                  : "border-wood-dark/30 bg-white focus:border-orange"
              } ${disabled ? "opacity-75" : ""}`}
              placeholder="?"
              aria-label={tr("totalToPay")}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-mint px-2.5 py-1">
          <span className="font-extrabold text-xs sm:text-sm">{tr("customerGave")}</span>
          <span className="font-display text-lg sm:text-xl font-extrabold tabular-nums">
            ₹{scenario.paid}
          </span>
        </div>
      </div>
    </div>
  );
}
