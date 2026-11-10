import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { DenomId, LevelDef, LevelStats, SubmissionResult, TransactionRecord, Tray } from "@/game/types";
import {
  DENOMINATIONS,
  calculateTransactionStars,
  countUpSteps,
  evaluate,
  generateScenario,
  getBillHint,
  getChangeHint,
  requiredChange,
  stepsToTray,
  trayState,
  trayTotal,
} from "@/game/engine";
import { CashDrawer } from "./CashDrawer";
import { ChangeTray, RunningTotal } from "./ChangeTray";
import { CustomerBubble } from "./CustomerBubble";
import { Feedback, TransactionSummary } from "./Feedback";
import { HintPanel } from "./HintPanel";
import { ShoppingBill } from "./ShoppingBill";
import { SettingsBar, useSettings } from "./settings";
import { KiranaStore3D } from "./3d/KiranaStore3D";
import { getCustomerOrderDialogue, type DialogueContent } from "./3d/dialogue";
import { formatUSD } from "@/lib/currency";
import { dialogueAudio } from "@/lib/dialogueAudio";

export type TransactionStage = "bill" | "change" | "checkout" | "feedback";

export type { LevelStats };

interface Props {
  level: LevelDef;
  onExit: () => void;
  onComplete: (stats: LevelStats) => void;
}

export function GameScreen({ level, onExit, onComplete }: Props) {
  const { tr, lang, play, hintsEnabled, setHintsEnabled } = useSettings();
  const [index, setIndex] = useState(0);
  const scenario = useMemo(() => generateScenario(level.number, index), [level.number, index]);
  const [stage, setStage] = useState<TransactionStage>("bill");
  const [tray, setTray] = useState<Tray>({});
  const [changeResult, setChangeResult] = useState<SubmissionResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [billMistakes, setBillMistakes] = useState(0);
  const [changeMistakes, setChangeMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stats, setStats] = useState<LevelStats>({
    stars: [],
    mistakes: 0,
    hints: 0,
    transactions: [],
    totalTime: 0,
    correctBillFirstTry: 0,
    correctChangeFirstTry: 0,
  });
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionRecord | null>(null);

  // Unified Transaction Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(scenario.timeLimit);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Bill Calculation State
  const [calculatedTotal, setCalculatedTotal] = useState<number | "">("");
  const [isBillVerified, setIsBillVerified] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  const [activeDialogue, setActiveDialogue] = useState<DialogueContent | null>(() =>
    getCustomerOrderDialogue(scenario, lang),
  );

  const required = requiredChange(scenario);
  const total = trayTotal(tray);
  const steps = useMemo(() => countUpSteps(scenario.payable, scenario.paid), [scenario]);

  useEffect(() => {
    return () => {
      dialogueAudio.stop();
    };
  }, []);

  // Reset per-customer transaction state
  useEffect(() => {
    setTimeLeft(scenario.timeLimit);
    setElapsedSeconds(0);
    setTimedOut(false);
    setIsBillVerified(false);
    setBillError(null);
    setBillMistakes(0);
    setChangeMistakes(0);
    setHintsUsed(0);
    setCalculatedTotal("");
    setTray({});
    setChangeResult(null);
    setCurrentTransaction(null);
    setStage("bill");
  }, [scenario]);

  // Consistent transaction timer: runs across Stage 1 and Stage 2 without resetting
  useEffect(() => {
    if (stage !== "bill" && stage !== "change") return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      if (timeLeft !== null) {
        setTimeLeft((t) => {
          if (t === null) return null;
          if (t <= 1) {
            if (!timedOut) {
              setTimedOut(true);
              play("oops");
            }
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, timeLeft, timedOut, play]);

  // Stage 3 (Checkout): Automatically transition to Stage 4 (Summary) after completion
  useEffect(() => {
    if (stage !== "checkout") return;
    const timer = setTimeout(() => {
      setStage("feedback");
    }, 3200);
    return () => clearTimeout(timer);
  }, [stage]);

  const add = (id: DenomId) => {
    if (!isBillVerified || stage !== "change") return;
    play("tap");
    setTray((t) => ({ ...t, [id]: (t[id] ?? 0) + 1 }));
  };

  const remove = (id: DenomId) => {
    if (!isBillVerified || stage !== "change") return;
    setTray((t) => ({ ...t, [id]: Math.max(0, (t[id] ?? 0) - 1) }));
  };

  const handleTotalChange = (val: number | "") => {
    setCalculatedTotal(val);
    if (billError) setBillError(null);
  };

  // STAGE 1: Check Bill Calculation
  const handleCheckBillTotal = () => {
    if (calculatedTotal === "") {
      setBillError("Please enter your calculated Total to Pay first!");
      return;
    }
    const entered = Number(calculatedTotal);
    if (entered === scenario.payable) {
      setIsBillVerified(true);
      setBillError(null);
      play("success");
      setStage("change");
    } else {
      const nextMistakes = billMistakes + 1;
      setBillMistakes(nextMistakes);
      play("oops");
      const hint = getBillHint(nextMistakes, scenario, entered);
      setBillError(hint);
    }
  };

  // STAGE 2: Submit Change
  const submit = () => {
    if (!isBillVerified || stage !== "change") return;
    const totalMistakesSoFar = billMistakes + changeMistakes;
    const r = evaluate(tray, scenario, totalMistakesSoFar, hintsUsed);

    if (r.kind !== "correct") {
      const nextChangeMistakes = changeMistakes + 1;
      setChangeMistakes(nextChangeMistakes);
      play("oops");
      setChangeResult(r);
    } else {
      play("success");
      const timeTaken = Math.max(1, elapsedSeconds);
      const earnedStars = calculateTransactionStars({
        billMistakes,
        changeMistakes,
        hintsUsed,
        timeTaken,
        timeLimit: scenario.timeLimit,
        level: level.number,
        timedOut,
      });

      const record: TransactionRecord = {
        customerIndex: index,
        customerName: scenario.customer.name[lang] || scenario.customer.name.en,
        billMistakes,
        changeMistakes,
        hintsUsed,
        timeTaken,
        billFirstTry: billMistakes === 0,
        changeFirstTry: changeMistakes === 0,
        stars: earnedStars,
        timedOut,
      };

      setCurrentTransaction(record);
      setChangeResult({ kind: "correct", stars: earnedStars });
      setStage("feedback");
    }
  };

  // Advance to Next Customer or Complete Level
  const handleNextCustomer = () => {
    if (!currentTransaction) return;

    const updatedTransactions = [...transactions, currentTransaction];
    setTransactions(updatedTransactions);

    const updatedStats: LevelStats = {
      stars: [...stats.stars, currentTransaction.stars],
      mistakes: stats.mistakes + currentTransaction.billMistakes + currentTransaction.changeMistakes,
      hints: stats.hints + currentTransaction.hintsUsed,
      transactions: updatedTransactions,
      totalTime: (stats.totalTime ?? 0) + currentTransaction.timeTaken,
      correctBillFirstTry: (stats.correctBillFirstTry ?? 0) + (currentTransaction.billFirstTry ? 1 : 0),
      correctChangeFirstTry: (stats.correctChangeFirstTry ?? 0) + (currentTransaction.changeFirstTry ? 1 : 0),
    };

    setChangeResult(null);
    setCurrentTransaction(null);
    setTray({});
    setCalculatedTotal("");
    setIsBillVerified(false);
    setBillError(null);
    setBillMistakes(0);
    setChangeMistakes(0);
    setHintsUsed(0);
    setElapsedSeconds(0);
    setTimedOut(false);
    setShowHint(false);
    setStage("bill");

    if (index + 1 >= level.customers) {
      onComplete(updatedStats);
    } else {
      setStats(updatedStats);
      setIndex(index + 1);
    }
  };

  const retryChange = () => {
    setChangeResult(null);
  };

  const openHint = () => {
    if (!showHint) setHintsUsed((h) => h + 1);
    setShowHint(true);
  };

  const busy = stage === "checkout" || stage === "feedback";

  // Contextual guidance strip for players
  const getContextualHint = () => {
    if (stage === "checkout") {
      return `Sale completed! ${scenario.customer.name[lang] || scenario.customer.name.en} received their items & change.`;
    }
    if (stage === "feedback") {
      return "Review your transaction summary and tap continue!";
    }

    if (!isBillVerified) {
      if (billError) return billError;
      if (scenario.items.length === 1) {
        return "Step 1: Calculate the item total (Quantity × Unit Price) and enter Total to Pay!";
      }
      if (scenario.discount) {
        return "Step 1: Multiply items, subtract the discount, and enter the Total to Pay!";
      }
      return "Step 1: Multiply item quantities, add them together, and enter the Total to Pay!";
    }

    if (total === 0) {
      if (required === 0) {
        return "Step 2: Bill verified! Customer paid exact money. Tap the green NO CHANGE button.";
      }
      return `Step 2: Customer gave ${formatUSD(scenario.paid)}. Calculate change ($${(scenario.paid - scenario.payable).toFixed(2)}) and tap coins/bills!`;
    }

    if (total < required) {
      return `You have ${formatUSD(total)} in the tray. Keep counting to reach ${formatUSD(required)}!`;
    }

    if (total === required) {
      return `Awesome! That's the exact change (${formatUSD(total)})! Tap GIVE CHANGE!`;
    }

    if (total > required) {
      return `A bit too much change (${formatUSD(total - required)} extra). Tap a piece in the tray to remove it!`;
    }

    return "Can you figure out how much change is needed?";
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-start overflow-x-hidden">
      <div className="bg-awning h-3 sm:h-4 shrink-0" aria-hidden />

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-1.5 shrink-0">
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-xs sm:text-sm font-extrabold border-2 border-wood-light shadow-soft cursor-pointer hover:bg-peach transition-colors"
          aria-label={tr("home")}
        >
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">{tr("home")}</span>
        </button>

        <div className="flex-1 min-w-40 px-2 flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <p className="text-center font-display font-extrabold text-xs sm:text-sm leading-tight text-wood-dark">
              {level.icon} {tr("level")} {level.number}: {level.title[lang]}
            </p>
            {level.difficulty && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${
                  level.difficulty === "Easy"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : level.difficulty === "Medium"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : level.difficulty === "Hard"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : "bg-purple-100 text-purple-800 border-purple-300"
                }`}
              >
                {level.difficulty}
              </span>
            )}
            {level.concept && (
              <span className="hidden md:inline-block rounded-full bg-sun/30 border border-sun px-2 py-0.2 text-[10px] font-bold text-wood-dark">
                {level.concept[lang]}
              </span>
            )}
            {timeLeft !== null && (
              <span
                className={`rounded-full px-2 py-0.2 text-[11px] font-extrabold border ${
                  timedOut
                    ? "bg-rose-100 text-rose-800 border-rose-400 animate-pulse"
                    : timeLeft <= 10
                      ? "bg-amber-100 text-amber-900 border-amber-400 animate-pulse"
                      : "bg-paper text-orange border-orange"
                }`}
              >
                ⏱️ {timedOut ? "Over time" : `${timeLeft}s`}
              </span>
            )}
          </div>
          <div
            className="mt-0.5 flex w-full max-w-xs gap-1"
            aria-label={`${tr("customer")} ${index + 1} ${tr("of")} ${level.customers}`}
          >
            {Array.from({ length: level.customers }).map((_, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full ${i < index ? "bg-leaf" : i === index ? "bg-sun" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        <SettingsBar />
      </header>

      {/* Main Game Stage */}
      <main className="mx-auto flex flex-1 flex-col justify-start lg:justify-center w-full max-w-6xl px-3 py-1 sm:py-2 gap-2 sm:gap-2.5">
        {/* Four-Stage Transaction Tracker Header */}
        <div className="flex items-center justify-between px-3 py-1 rounded-2xl bg-paper/90 border-2 border-wood-light shadow-xs text-xs font-black text-wood-dark overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Stage 1 */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                stage === "bill"
                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                  : isBillVerified
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "text-muted-foreground opacity-60"
              }`}
            >
              <span>{isBillVerified ? "✓" : "1"}</span>
              <span>{tr("stage1")}</span>
            </div>
            <span className="text-muted-foreground/40 text-[10px]">→</span>

            {/* Stage 2 */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                stage === "change"
                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                  : stage === "checkout" || stage === "feedback"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "text-muted-foreground opacity-60"
              }`}
            >
              <span>{stage === "checkout" || stage === "feedback" ? "✓" : "2"}</span>
              <span>{tr("stage2")}</span>
            </div>
            <span className="text-muted-foreground/40 text-[10px]">→</span>

            {/* Stage 3 */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                stage === "checkout"
                  ? "bg-purple-100 text-purple-900 border border-purple-300 shadow-xs font-black"
                  : stage === "feedback"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "text-muted-foreground opacity-60"
              }`}
            >
              <span>{stage === "feedback" ? "✓" : "3"}</span>
              <span>{tr("stage3")}</span>
            </div>
            <span className="text-muted-foreground/40 text-[10px]">→</span>

            {/* Stage 4 */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                stage === "feedback"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs font-black"
                  : "text-muted-foreground opacity-60"
              }`}
            >
              <span>4</span>
              <span>{tr("stage4")}</span>
            </div>
          </div>

          <span className="text-[11px] font-bold text-muted-foreground shrink-0 pl-2">
            Customer {index + 1} of {level.customers}
          </span>
        </div>

        {/* Upper Main Section: 3D Shop & Dialogue on Left, Bill & Tray on Right */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-2 sm:gap-2.5 items-stretch">
          {/* Left Column: 3D Store View + Customer Bubble */}
          <div className="flex flex-col gap-2 h-full min-h-0">
            <KiranaStore3D
              scenario={scenario}
              tray={tray}
              mood={
                stage === "checkout" || stage === "feedback"
                  ? "happy"
                  : changeResult
                    ? "thinking"
                    : "speaking"
              }
              isCorrect={stage === "checkout" || stage === "feedback"}
              result={changeResult}
              roundIndex={index}
              onActiveDialogueChange={setActiveDialogue}
            />
            <CustomerBubble
              scenario={scenario}
              mood={
                stage === "checkout" || stage === "feedback"
                  ? "happy"
                  : changeResult
                    ? "thinking"
                    : "speaking"
              }
              activeDialogue={activeDialogue}
            />
          </div>

          {/* Right Column: Countertop with Shopping Bill & Change Tray / Checkout Card */}
          <div className="rounded-2xl border-3 border-wood-dark bg-wood-light/40 p-2 sm:p-2.5 shadow-wood flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 items-stretch flex-1">
              <ShoppingBill
                scenario={scenario}
                calculatedTotal={calculatedTotal}
                onChangeTotal={handleTotalChange}
                onCheckTotal={handleCheckBillTotal}
                isTotalVerified={isBillVerified}
                totalError={billError}
                disabled={busy}
              />

              {/* Stage 3 (Checkout State Card) or Stage 1 & 2 Change Tray */}
              {stage === "checkout" ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center rounded-2xl bg-gradient-to-b from-white to-emerald-50 border-2 border-emerald-400 shadow-sm animate-fade-in">
                  <motion.div
                    initial={{ scale: 0.8, y: -10 }}
                    animate={{ scale: [0.8, 1.1, 1], y: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="text-5xl"
                  >
                    🛍️
                  </motion.div>
                  <h3 className="mt-2 font-display text-lg sm:text-xl font-black text-emerald-800">
                    {tr("saleCompleted")}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-emerald-700 max-w-xs">
                    {scenario.customer.name[lang] || scenario.customer.name.en} received their items and {formatUSD(required)} change.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
                    <span className="animate-spin text-sm">⏳</span>
                    <span>{tr("packagingItems")}</span>
                  </div>
                  <button
                    onClick={() => setStage("feedback")}
                    className="btn-press mt-3 text-xs font-black px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                  >
                    View Performance Summary ▶
                  </button>
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-2 h-full">
                  <ChangeTray
                    tray={tray}
                    denominations={DENOMINATIONS}
                    onDrop={add}
                    onRemove={remove}
                    onClear={() => setTray({})}
                    disabled={busy || !isBillVerified}
                  />
                  <RunningTotal total={total} state={trayState(tray, required)} />
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-stretch">
                    <button
                      onClick={submit}
                      disabled={busy || !isBillVerified}
                      className={`btn-press rounded-xl py-2 px-3 font-display text-base sm:text-lg font-black text-primary-foreground shadow-chunky disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sun text-center cursor-pointer flex items-center justify-center min-h-[46px] transition-all ${
                        !isBillVerified
                          ? "bg-wood-dark/40 text-cream/70"
                          : trayState(tray, required) === "exact"
                            ? "bg-emerald-600 hover:bg-emerald-500 ring-4 ring-emerald-300"
                            : "bg-leaf hover:bg-leaf-dark"
                      }`}
                    >
                      {!isBillVerified
                        ? tr("confirmBillFirst")
                        : total === 0
                          ? tr("noChange")
                          : `${tr("give")} (${formatUSD(total)})`}
                    </button>
                    <button
                      onClick={openHint}
                      disabled={busy}
                      className="rounded-xl border-2 border-sky bg-paper py-2 px-3.5 font-extrabold text-xs sm:text-sm text-teal hover:bg-mint cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5 shadow-soft min-h-[46px]"
                    >
                      <span>💡</span>
                      <span>{tr("hint")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contextual Guidance Strip */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-amber-50/90 border-2 border-sun/60 text-wood-dark shadow-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base sm:text-lg shrink-0" aria-hidden>
              💡
            </span>
            {hintsEnabled ? (
              <p className="text-xs sm:text-sm font-extrabold truncate text-wood-dark">
                {getContextualHint()}
              </p>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground italic">
                Helpful hints are turned off.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setHintsEnabled(!hintsEnabled)}
            className="text-[10px] sm:text-[11px] font-black text-amber-900 hover:text-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 border border-amber-400 shrink-0 cursor-pointer transition-colors"
          >
            {hintsEnabled ? "Hide Tips" : "Show Tips"}
          </button>
        </div>

        {/* Lower Section: Cash Drawer */}
        <CashDrawer
          denominations={DENOMINATIONS}
          onAdd={add}
          disabled={busy || !isBillVerified || stage !== "change"}
          tray={tray}
        />
      </main>

      {/* Modal Dialogs */}
      <AnimatePresence>
        {showHint && (
          <HintPanel
            key={scenario.id + (isBillVerified ? "-change" : "-bill")}
            mode={isBillVerified ? "change" : "bill"}
            items={scenario.items}
            discount={scenario.discount}
            price={scenario.payable}
            paid={scenario.paid}
            steps={steps}
            onShowPieces={() => setTray(stepsToTray(steps))}
            onClose={() => setShowHint(false)}
          />
        )}
      </AnimatePresence>

      {/* Stage 2 Change Mistake Feedback */}
      <AnimatePresence>
        {changeResult && changeResult.kind !== "correct" && (
          <Feedback
            result={changeResult}
            hint={getChangeHint(changeMistakes, scenario, total)}
            onContinue={() => {}}
            onRetry={retryChange}
          />
        )}
      </AnimatePresence>

      {/* Stage 4 Performance Summary Modal */}
      <AnimatePresence>
        {stage === "feedback" && currentTransaction && (
          <TransactionSummary
            record={currentTransaction}
            customerIndex={index}
            totalCustomers={level.customers}
            onNext={handleNextCustomer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
