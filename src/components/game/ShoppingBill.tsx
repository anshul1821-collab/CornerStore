import { useState } from "react";
import type { LineItem, Scenario } from "@/game/types";
import { getItemMultiplicationHint } from "@/game/engine";
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
  solvedItemIds: propSolvedItemIds,
  onSolveItem,
  onMultiplicationMistake,
}: {
  scenario: Scenario;
  calculatedTotal: number | "";
  onChangeTotal: (v: number | "") => void;
  onCheckTotal?: () => void;
  isTotalVerified?: boolean;
  totalError?: string | null;
  disabled?: boolean;
  solvedItemIds?: Record<string, boolean>;
  onSolveItem?: (productId: string) => void;
  onMultiplicationMistake?: (productId: string) => void;
}) {
  const { lang, tr, play } = useSettings();
  const [activeCalcId, setActiveCalcId] = useState<string | null>(null);
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [itemAttempts, setItemAttempts] = useState<Record<string, number>>({});
  const [lastSubmittedValues, setLastSubmittedValues] = useState<Record<string, string>>({});
  const [localSolved, setLocalSolved] = useState<Record<string, boolean>>({});

  const isItemSolved = (productId: string) => {
    if (isTotalVerified) return true;
    if (propSolvedItemIds) return Boolean(propSolvedItemIds[productId]);
    return Boolean(localSolved[productId]);
  };

  const handleToggleCalc = (productId: string) => {
    if (disabled || isTotalVerified) return;
    setActiveCalcId((prev) => (prev === productId ? null : productId));
  };

  const handleInputChange = (productId: string, val: string) => {
    setItemInputs((prev) => ({ ...prev, [productId]: val }));
    if (itemErrors[productId]) {
      setItemErrors((prev) => ({ ...prev, [productId]: "" }));
    }
  };

  const handleSubmitItem = (item: LineItem) => {
    const rawVal = itemInputs[item.productId];
    if (rawVal === undefined || rawVal === "") return;

    const entered = Number(rawVal);
    const expected = item.unitPrice * item.qty;

    if (Math.abs(entered - expected) < 0.005) {
      // Correct!
      play("success");
      setLocalSolved((prev) => ({ ...prev, [item.productId]: true }));
      onSolveItem?.(item.productId);
      setActiveCalcId(null);
      setItemErrors((prev) => ({ ...prev, [item.productId]: "" }));
    } else {
      // Incorrect attempt
      play("oops");
      const prevSub = lastSubmittedValues[item.productId];
      if (prevSub !== rawVal) {
        onMultiplicationMistake?.(item.productId);
        setLastSubmittedValues((prev) => ({ ...prev, [item.productId]: rawVal }));
      }

      const nextAttempt = (itemAttempts[item.productId] ?? 0) + 1;
      setItemAttempts((prev) => ({ ...prev, [item.productId]: nextAttempt }));
      const hint = getItemMultiplicationHint(item.qty, item.unitPrice, nextAttempt);
      setItemErrors((prev) => ({
        ...prev,
        [item.productId]: `Not quite! ${hint}`,
      }));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: LineItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitItem(item);
    } else if (e.key === "Escape") {
      setActiveCalcId(null);
    }
  };

  const handleTotalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onCheckTotal && !isTotalVerified && calculatedTotal !== "") {
      e.preventDefault();
      onCheckTotal();
    }
  };

  const solvedCount = scenario.items.filter((i) => isItemSolved(i.productId)).length;
  const allSolved = solvedCount === scenario.items.length;

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
                {allSolved ? "Step 1: Total to Pay" : "Step 1: Multiply Items"}
              </span>
            )}
          </div>

          <div className="my-1 sm:my-1.5 border-t-2 border-dashed border-border" />

          {/* Child-Friendly Progress Banner */}
          {!isTotalVerified && (
            <div
              className={`my-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center justify-between border transition-all ${
                allSolved
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-amber-50/90 border-amber-300 text-amber-900"
              }`}
            >
              <span>{allSolved ? "✓ All items multiplied!" : "Click [ ? ] to solve each item:"}</span>
              <span className="font-black tabular-nums">
                {allSolved ? "Now enter Total to Pay" : `${solvedCount} / ${scenario.items.length} solved`}
              </span>
            </div>
          )}

          {/* Shopping basket items with product name, quantity, unit price, and interactive calculator */}
          <ul className="space-y-1.5 max-h-[140px] lg:max-h-[165px] overflow-y-auto pr-1">
            {scenario.items.map((i) => {
              const solved = isItemSolved(i.productId);
              const isActive = activeCalcId === i.productId && !solved && !isTotalVerified;

              return (
                <li key={i.productId} className="flex flex-col gap-1 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 font-bold truncate flex items-center gap-1">
                      <span>{i.emoji}</span>
                      <span className="truncate">{i.name[lang]}</span>
                      <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                        ({i.qty} × {formatUSD(i.unitPrice)})
                      </span>
                    </div>

                    {/* Subtotal State: Solved badge OR interactive [ ? ] button */}
                    <div className="shrink-0 flex items-center">
                      {solved ? (
                        <span className="font-extrabold tabular-nums text-emerald-800 flex items-center gap-1 animate-scale-in">
                          <span className="rounded-full bg-emerald-100 text-emerald-700 px-1 text-[10px] font-black border border-emerald-300">
                            ✓
                          </span>
                          <span>{formatUSD(i.unitPrice * i.qty)}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleCalc(i.productId)}
                          disabled={disabled || isTotalVerified}
                          className={`rounded-lg px-2 py-0.5 text-xs font-display font-black border-2 transition-all cursor-pointer flex items-center justify-center gap-0.5 shadow-xs ${
                            isActive
                              ? "border-orange bg-orange text-white ring-2 ring-orange/30 scale-105"
                              : "border-sun/90 bg-amber-100/90 hover:bg-amber-200 text-wood-dark hover:scale-105 active:scale-95"
                          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                          title="Click to calculate item subtotal"
                          aria-label={`Calculate ${i.qty} × ${formatUSD(i.unitPrice)}`}
                        >
                          <span>?</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Compact Inline Multiplication Calculator */}
                  {isActive && (
                    <div
                      className="mt-0.5 mb-1 rounded-xl bg-amber-50/95 border-2 border-sun p-2 flex flex-col gap-1.5 shadow-xs"
                      data-testid={`calc-${i.productId}`}
                    >
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="font-display font-extrabold text-xs sm:text-sm text-wood-dark">
                          {i.qty} × {formatUSD(i.unitPrice)} =
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-display font-bold text-xs sm:text-sm text-wood-dark">$</span>
                          <input
                            type="number"
                            step="any"
                            value={itemInputs[i.productId] ?? ""}
                            onChange={(e) => handleInputChange(i.productId, e.target.value)}
                            onKeyDown={(e) => handleInputKeyDown(e, i)}
                            disabled={disabled || isTotalVerified}
                            placeholder="?"
                            autoFocus
                            className="w-16 sm:w-20 rounded-lg border-2 border-wood-dark/40 bg-white px-1.5 py-0.5 text-right font-display text-sm sm:text-base font-extrabold tabular-nums outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
                            aria-label={`Enter answer for ${i.qty} × ${formatUSD(i.unitPrice)}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitItem(i)}
                            disabled={
                              disabled ||
                              itemInputs[i.productId] === undefined ||
                              itemInputs[i.productId] === ""
                            }
                            aria-label={`Check subtotal for ${i.name[lang]}`}
                            className="btn-press rounded-lg bg-orange hover:bg-orange-dark active:scale-95 text-white text-xs font-black px-2.5 py-1 shadow-xs transition-all cursor-pointer disabled:opacity-40 shrink-0"
                          >
                            Check
                          </button>
                        </div>
                      </div>

                      {/* Friendly Hint / Message on Incorrect Attempt */}
                      {itemErrors[i.productId] && (
                        <div className="rounded-lg bg-rose-50 border border-rose-300 px-2 py-1 text-[11px] font-bold text-rose-900 flex items-start gap-1">
                          <span className="text-xs shrink-0">💡</span>
                          <span className="flex-1 leading-tight">{itemErrors[i.productId]}</span>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
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
                {allSolved ? "Add items and enter total" : "Multiply each item first"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-display text-lg sm:text-xl font-extrabold text-wood-dark">$</span>
            <input
              type="number"
              value={calculatedTotal}
              onChange={(e) => onChangeTotal(e.target.value ? Number(e.target.value) : "")}
              onKeyDown={handleTotalKeyDown}
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

