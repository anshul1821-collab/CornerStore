import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Sparkles, X } from "lucide-react";
import { CurrencyPiece } from "./Currency";
import { DENOMINATIONS } from "@/game/engine";
import { formatUSD } from "@/lib/currency";
import { useSettings } from "./settings";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartPlay?: () => void;
}

export function GameGuideModal({ isOpen, onClose, onStartPlay }: Props) {
  const { play } = useSettings();
  const [step, setStep] = useState(0);

  // Interactive sandbox state for Step 3
  const [demoTray, setDemoTray] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const demoNotes = DENOMINATIONS.filter((d) => d.id === "n10" || d.id === "n20");
  const demoCoins = DENOMINATIONS.filter((d) => d.id === "c1" || d.id === "c5");

  const addDemoPiece = (id: string) => {
    play("tap");
    setDemoTray((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const removeDemoPiece = (id: string) => {
    play("tap");
    setDemoTray((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));
  };

  const demoTotal = Object.entries(demoTray).reduce((acc, [id, count]) => {
    const d = DENOMINATIONS.find((x) => x.id === id);
    return acc + (d ? d.value * count : 0);
  }, 0);

  const totalSteps = 6;

  const nextStep = () => {
    play("tap");
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onClose();
      onStartPlay?.();
    }
  };

  const prevStep = () => {
    play("tap");
    if (step > 0) setStep(step - 1);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-2xl rounded-3xl border-4 border-wood-dark bg-paper shadow-wood overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-wood-grain border-b-3 border-wood-dark px-4 py-3 sm:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-sun text-xl sm:text-2xl shadow-xs border-2 border-wood-dark">
                ❓
              </span>
              <div>
                <h2
                  id="guide-title"
                  className="font-display text-lg sm:text-xl font-extrabold text-sun leading-none drop-shadow-xs"
                >
                  How to Play
                </h2>
                <p className="text-xs sm:text-sm font-bold text-cream/90 leading-tight">
                  Corner Store Simulator Guide
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                play("tap");
                onClose();
              }}
              type="button"
              aria-label="Close Guide"
              className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-paper text-wood-dark hover:bg-peach border-2 border-wood-light cursor-pointer shadow-soft transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Progress Bar & Step Indicators */}
          <div className="bg-wood-light/30 px-4 py-2 border-b-2 border-wood-light/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="rounded-full bg-wood-dark px-2.5 py-0.5 text-xs font-black text-sun">
                Step {step + 1} of {totalSteps}
              </span>
              <span className="text-xs font-bold text-wood-dark hidden sm:inline">
                {step === 0 && "Welcome!"}
                {step === 1 && "Understand the Counter"}
                {step === 2 && "Pick Notes & Coins"}
                {step === 3 && "Complete a Payment"}
                {step === 4 && "Calculate Change"}
                {step === 5 && "Complete the Level"}
              </span>
            </div>

            {/* Step Dots */}
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    play("tap");
                    setStep(idx);
                  }}
                  title={`Go to Step ${idx + 1}`}
                  className={`h-2.5 sm:h-3 rounded-full transition-all cursor-pointer ${
                    idx === step
                      ? "w-6 sm:w-7 bg-sun border-2 border-wood-dark"
                      : idx < step
                        ? "w-2.5 sm:w-3 bg-leaf"
                        : "w-2.5 sm:w-3 bg-wood-light/60 hover:bg-wood-light"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Body (Scrollable if height constrained) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-amber-50 p-4 border-2 border-amber-200">
                    <span className="text-5xl sm:text-6xl animate-bounce [animation-duration:3s]">
                      🏪
                    </span>
                    <div className="text-center sm:text-left">
                      <h3 className="font-display text-xl sm:text-2xl font-black text-wood-dark">
                        Welcome to Your Corner Store!
                      </h3>
                      <p className="mt-1 text-sm sm:text-base font-semibold text-wood-dark/85">
                        You are the neighborhood shopkeeper! Customers will visit your counter to
                        buy groceries, snacks, and treats.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 text-center">
                      <span className="text-3xl">💵</span>
                      <h4 className="mt-1 font-display text-sm font-extrabold text-wood-dark">
                        Real US Dollars
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        Learn to use real dollar bills ($10 to $500) and coins ($1 to $10).
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 text-center">
                      <span className="text-3xl">🧮</span>
                      <h4 className="mt-1 font-display text-sm font-extrabold text-wood-dark">
                        Count & Give Change
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        Count up the price and return the exact change to happy customers!
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 text-center">
                      <span className="text-3xl">⭐</span>
                      <h4 className="mt-1 font-display text-sm font-extrabold text-wood-dark">
                        Earn Gold Stars
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        Master all 10 unlocked levels and become a true math hero!
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-sun/20 p-3 border border-sun text-center">
                    <p className="font-extrabold text-xs sm:text-sm text-wood-dark">
                      💡 Tip: Tap <strong>"Next Step ▶"</strong> below to take a tour of your cash
                      counter!
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-xl sm:text-2xl font-black text-wood-dark">
                      Understand the Cash Counter
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      Everything you need is organized cleanly into 3 main areas:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Area 1: 3D Store */}
                    <div className="flex items-start gap-3 rounded-2xl border-2 border-wood-light bg-cream p-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky/30 text-2xl border border-sky/50">
                        🏪
                      </span>
                      <div>
                        <h4 className="font-display text-sm sm:text-base font-extrabold text-wood-dark">
                          1. 3D Store View & Customer
                        </h4>
                        <p className="text-xs sm:text-sm font-semibold text-wood-dark/80">
                          Look at the customer standing at your counter. The customer's speech
                          bubble tells you what they want to buy and how much money they gave you!
                        </p>
                      </div>
                    </div>

                    {/* Area 2: Receipt & Tray */}
                    <div className="flex items-start gap-3 rounded-2xl border-2 border-wood-light bg-cream p-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-2xl border border-amber-300">
                        🧾
                      </span>
                      <div>
                        <h4 className="font-display text-sm sm:text-base font-extrabold text-wood-dark">
                          2. Shopping Bill & Change Tray
                        </h4>
                        <p className="text-xs sm:text-sm font-semibold text-wood-dark/80">
                          The receipt shows each item's price. Enter the total, then place customer
                          change into the change tray.
                        </p>
                      </div>
                    </div>

                    {/* Area 3: Cash Drawer */}
                    <div className="flex items-start gap-3 rounded-2xl border-2 border-wood-light bg-cream p-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf/20 text-2xl border border-leaf/40">
                        🗄️
                      </span>
                      <div>
                        <h4 className="font-display text-sm sm:text-base font-extrabold text-wood-dark">
                          3. Cash Drawer (Dollar Bills & Coins)
                        </h4>
                        <p className="text-xs sm:text-sm font-semibold text-wood-dark/80">
                          Your cash drawer holds dollar notes on top ($10 to $500) and shiny dollar
                          coins on the bottom ($1 to $10).
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-xl sm:text-2xl font-black text-wood-dark">
                      Select Money from the Drawer
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      Tap any note or coin to add it to the tray. Try it right now!
                    </p>
                  </div>

                  {/* Interactive Sandbox */}
                  <div className="rounded-2xl border-3 border-sun/80 bg-wood-grain p-3 sm:p-4 text-white shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-xs sm:text-sm font-extrabold text-sun uppercase tracking-wider flex items-center gap-1.5">
                        <span>👉</span>
                        <span>Interactive Demo: Tap Money Below</span>
                      </span>
                      <span className="text-xs font-black text-amber-200">
                        Tray Total: {formatUSD(demoTotal)}
                      </span>
                    </div>

                    {/* Sample Bills & Coins to Tap */}
                    <div className="space-y-2">
                      <div className="rounded-xl bg-black/30 p-2 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-amber-200 w-full sm:w-auto mr-1">
                          Bills:
                        </span>
                        {demoNotes.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => addDemoPiece(d.id)}
                            className="hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                            title={`Tap to add ${formatUSD(d.value)}`}
                          >
                            <CurrencyPiece denom={d} size="sm" />
                          </button>
                        ))}
                      </div>

                      <div className="rounded-xl bg-black/30 p-2 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-amber-200 w-full sm:w-auto mr-1">
                          Coins:
                        </span>
                        {demoCoins.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => addDemoPiece(d.id)}
                            className="hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                            title={`Tap to add ${formatUSD(d.value)}`}
                          >
                            <CurrencyPiece denom={d} size="sm" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mini Tray Display */}
                    <div className="mt-3 rounded-xl border-2 border-dashed border-sun/50 bg-black/20 p-2.5 text-center">
                      <p className="text-xs font-bold text-cream/90 mb-1.5">
                        Selected in Tray (tap to remove):
                      </p>
                      {Object.keys(demoTray).filter((k) => (demoTray[k] ?? 0) > 0).length === 0 ? (
                        <p className="text-xs font-semibold text-sun/80 italic py-1">
                          Tray is empty. Tap a note or coin above to add!
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {Object.entries(demoTray)
                            .filter(([_, count]) => count > 0)
                            .map(([id, count]) => {
                              const d = DENOMINATIONS.find((x) => x.id === id);
                              if (!d) return null;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => removeDemoPiece(id)}
                                  className="relative group cursor-pointer hover:scale-105 transition-transform"
                                  title="Tap to remove"
                                >
                                  <CurrencyPiece denom={d} size="sm" />
                                  <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral text-[10px] font-black text-white shadow-xs">
                                    ×{count}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-wood-dark text-center">
                    ✨ Every time you tap a note or coin, the running total updates immediately!
                  </p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-xl sm:text-2xl font-black text-wood-dark">
                      Complete a Payment
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      Check the customer's bill and give the right change.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                    {/* Bill Checklist */}
                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-display text-sm font-extrabold text-wood-dark">
                          <span>1.</span>
                          <span>Receipt Total</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-wood-dark/85">
                          Add the items on the receipt and type the Total to Pay into the box.
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl bg-sun/30 p-2 border border-sun flex justify-between items-center text-xs font-bold text-wood-dark">
                        <span>Total to Pay:</span>
                        <span className="font-display text-sm font-extrabold">$15.00</span>
                      </div>
                    </div>

                    {/* Customer Paid Checklist */}
                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-display text-sm font-extrabold text-wood-dark">
                          <span>2.</span>
                          <span>Customer Gave</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-wood-dark/85">
                          Look at what the customer handed you.
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl bg-mint p-2 border border-leaf/30 flex justify-between items-center text-xs font-bold text-leaf-dark">
                        <span>Customer Gave:</span>
                        <span className="font-display text-sm font-extrabold">$20.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Give Change Button Demo */}
                  <div className="rounded-2xl border-2 border-leaf-dark bg-leaf/10 p-3.5 text-center">
                    <p className="text-xs sm:text-sm font-extrabold text-leaf-dark mb-2">
                      When your tray change matches ($5.00), tap the Give Change button!
                    </p>
                    <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-display text-base font-black text-white shadow-chunky">
                      <span>GIVE CHANGE ($5.00)</span>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-xl sm:text-2xl font-black text-wood-dark">
                      How to Calculate Change
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      Change is the extra money you give back when a customer pays more than the
                      price.
                    </p>
                  </div>

                  {/* Simple Math Breakdown Example */}
                  <div className="rounded-2xl border-3 border-wood-dark bg-cream p-4 shadow-soft">
                    <p className="text-xs font-black text-wood-dark uppercase tracking-wider mb-2 text-center">
                      🌟 Simple Example
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center items-center">
                      <div className="rounded-xl bg-paper p-2.5 border-2 border-wood-light">
                        <span className="text-2xl">🧃</span>
                        <p className="text-[11px] font-bold text-muted-foreground">Item Price</p>
                        <p className="font-display text-lg font-black text-wood-dark">$7.00</p>
                      </div>

                      <div className="font-display text-2xl font-black text-wood-dark">➖</div>

                      <div className="rounded-xl bg-paper p-2.5 border-2 border-wood-light">
                        <span className="text-2xl">💵</span>
                        <p className="text-[11px] font-bold text-muted-foreground">Customer Paid</p>
                        <p className="font-display text-lg font-black text-wood-dark">$10.00</p>
                      </div>
                    </div>

                    <div className="mt-3 my-2 border-t-2 border-dashed border-wood-light" />

                    <div className="rounded-xl bg-sun/40 p-3 text-center border-2 border-sun">
                      <p className="text-xs font-bold text-wood-dark">
                        Customer gave $10.00 for a $7.00 item:
                      </p>
                      <p className="font-display text-xl font-black text-wood-dark mt-0.5">
                        $10.00 − $7.00 = <span className="text-leaf-dark">$3.00 Change!</span>
                      </p>
                    </div>

                    {/* Visual coins for $3 */}
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-wood-dark">
                        Make $3.00 with coins:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {DENOMINATIONS.find((d) => d.id === "c2") && (
                          <CurrencyPiece
                            denom={DENOMINATIONS.find((d) => d.id === "c2")!}
                            size="sm"
                          />
                        )}
                        <span className="font-black text-wood-dark">+</span>
                        {DENOMINATIONS.find((d) => d.id === "c1") && (
                          <CurrencyPiece
                            denom={DENOMINATIONS.find((d) => d.id === "c1")!}
                            size="sm"
                          />
                        )}
                        <span className="font-black text-leaf-dark">= $3.00 🎉</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-mint p-2.5 text-center border border-leaf/30">
                    <p className="text-xs font-bold text-leaf-dark">
                      💡 Pro Trick: Start at $7 and count up: $8, $9, $10 → that is 3 dollars!
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center sm:text-left"
                >
                  <div className="rounded-2xl bg-amber-50 p-4 border-2 border-amber-200 text-center">
                    <span className="text-5xl animate-bounce [animation-duration:2s]">🎉</span>
                    <h3 className="mt-1 font-display text-2xl font-black text-wood-dark">
                      Complete Levels & Earn Stars!
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-wood-dark/80 max-w-md mx-auto">
                      Each level has friendly neighborhood customers waiting for your service.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 text-center">
                      <span className="text-3xl">⭐⭐⭐</span>
                      <h4 className="mt-1 font-display text-sm font-extrabold text-wood-dark">
                        3 Gold Stars
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        Answer accurately on your first try to earn maximum stars!
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 text-center">
                      <span className="text-3xl">💡</span>
                      <h4 className="mt-1 font-display text-sm font-extrabold text-wood-dark">
                        Helpful Hints
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        Never get stuck! Tap the Hint button for step-by-step guidance.
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-wood-light bg-cream p-3 text-center">
                      <span className="text-3xl">🔓</span>
                      <h4 className="mt-1 font-display text-sm font-extrabold text-wood-dark">
                        All 10 Levels Open
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        Practice coins, small bills, or grand $500 transactions anytime!
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-leaf/15 p-3.5 border-2 border-leaf-dark/30 text-center">
                    <p className="font-display text-base font-black text-leaf-dark">
                      You're ready to be an amazing storekeeper! 🛒
                    </p>
                    <p className="text-xs font-bold text-wood-dark mt-0.5">
                      Tap the green button below to start running your shop!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="bg-wood-grain border-t-3 border-wood-dark px-4 py-3 sm:px-6 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => {
                play("tap");
                onClose();
              }}
              type="button"
              className="text-xs sm:text-sm font-extrabold text-cream/90 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-black/20 transition-colors cursor-pointer"
            >
              Skip Tutorial
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prevStep}
                  type="button"
                  className="flex items-center gap-1 rounded-xl bg-paper px-3 py-2 text-xs sm:text-sm font-extrabold text-wood-dark border-2 border-wood-light hover:bg-peach shadow-soft cursor-pointer transition-transform active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={nextStep}
                type="button"
                className={`flex items-center gap-1.5 rounded-xl px-4 sm:px-5 py-2 font-display text-sm sm:text-base font-black shadow-chunky cursor-pointer transition-transform active:scale-95 ${
                  step === totalSteps - 1
                    ? "bg-leaf hover:bg-leaf-dark text-white ring-2 ring-sun"
                    : "bg-sun hover:bg-sun/90 text-wood-dark"
                }`}
              >
                <span>{step === totalSteps - 1 ? "Let's Play!" : "Next Step"}</span>
                {step === totalSteps - 1 ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
