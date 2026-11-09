import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { DenomId, LevelDef, SubmissionResult, Tray } from "@/game/types";
import {
  DENOMINATIONS,
  countUpSteps,
  evaluate,
  generateScenario,
  requiredChange,
  stepsToTray,
  trayState,
  trayTotal,
} from "@/game/engine";
import { CashDrawer } from "./CashDrawer";
import { ChangeTray, RunningTotal } from "./ChangeTray";
import { CustomerBubble } from "./CustomerBubble";
import { Feedback } from "./Feedback";
import { HintPanel } from "./HintPanel";
import { ShoppingBill } from "./ShoppingBill";
import { SettingsBar, useSettings } from "./settings";
import { KiranaStore3D } from "./3d/KiranaStore3D";
import { getCustomerOrderDialogue, type DialogueContent } from "./3d/dialogue";
import { formatUSD } from "@/lib/currency";
import { dialogueAudio } from "@/lib/dialogueAudio";

export interface LevelStats {
  stars: number[];
  mistakes: number;
  hints: number;
}

interface Props {
  level: LevelDef;
  onExit: () => void;
  onComplete: (stats: LevelStats) => void;
}

export function GameScreen({ level, onExit, onComplete }: Props) {
  const { tr, lang, play, hintsEnabled, setHintsEnabled } = useSettings();
  const [index, setIndex] = useState(0);
  const scenario = useMemo(() => generateScenario(level.number, index), [level.number, index]);
  const [tray, setTray] = useState<Tray>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stats, setStats] = useState<LevelStats>({ stars: [], mistakes: 0, hints: 0 });
  const [timeLeft, setTimeLeft] = useState<number | null>(scenario.timeLimit);
  const [calculatedTotal, setCalculatedTotal] = useState<number | "">("");
  const [isBillVerified, setIsBillVerified] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [billMistakes, setBillMistakes] = useState(0);
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

  useEffect(() => {
    setTimeLeft(scenario.timeLimit);
    setIsBillVerified(false);
    setBillError(null);
    setBillMistakes(0);
    setCalculatedTotal("");
  }, [scenario]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      setResult({ kind: "timeout" });
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t === null ? t : t - 1)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, result]);

  const add = (id: DenomId) => {
    if (!isBillVerified) return;
    play("tap");
    setTray((t) => ({ ...t, [id]: (t[id] ?? 0) + 1 }));
  };
  const remove = (id: DenomId) => {
    if (!isBillVerified) return;
    setTray((t) => ({ ...t, [id]: Math.max(0, (t[id] ?? 0) - 1) }));
  };

  const handleTotalChange = (val: number | "") => {
    setCalculatedTotal(val);
    if (billError) setBillError(null);
  };

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
    } else {
      setMistakes((m) => m + 1);
      setBillMistakes((b) => b + 1);
      play("oops");

      if (scenario.discount && entered === scenario.subtotal) {
        setBillError("Almost! Don't forget to subtract the discount from the subtotal.");
      } else if (scenario.items.length > 1 && entered > scenario.payable) {
        setBillError("A bit too high! Check your item multiplication or addition.");
      } else if (scenario.items.length > 1 && entered < scenario.payable) {
        setBillError("A bit too low! Multiply each item's quantity and add them up.");
      } else if (scenario.items.length === 1 && entered !== scenario.payable) {
        setBillError(`Multiply quantity (${scenario.items[0]!.qty}) by unit price (${formatUSD(scenario.items[0]!.unitPrice)}).`);
      } else {
        setBillError("Not quite. Recheck your multiplication and addition, then try again!");
      }
    }
  };

  const submit = () => {
    if (!isBillVerified) return;
    const r = evaluate(tray, scenario, mistakes, hintsUsed);
    if (r.kind !== "correct") setMistakes((m) => m + 1);
    play(r.kind === "correct" ? "success" : "oops");
    setResult(r);
  };

  const next = () => {
    if (result?.kind !== "correct") return;
    const s: LevelStats = {
      stars: [...stats.stars, result.stars],
      mistakes: stats.mistakes + mistakes,
      hints: stats.hints + hintsUsed,
    };
    setResult(null);
    setTray({});
    setCalculatedTotal("");
    setIsBillVerified(false);
    setBillError(null);
    setBillMistakes(0);
    setShowHint(false);
    setMistakes(0);
    setHintsUsed(0);
    if (index + 1 >= level.customers) onComplete(s);
    else {
      setStats(s);
      setIndex(index + 1);
    }
  };

  const retry = () => {
    if (result?.kind === "timeout") {
      setTray({});
      setTimeLeft(scenario.timeLimit);
    }
    setResult(null);
  };

  const openHint = () => {
    if (!showHint) setHintsUsed((h) => h + 1);
    setShowHint(true);
  };

  const busy = result !== null;

  // Helpful contextual guidance message for children (never reveals the answer prematurely)
  const getContextualHint = () => {
    if (result) {
      if (result.kind === "correct") {
        return "Awesome! That's the correct amount!";
      }
      if (result.kind === "too-little") {
        return "Try adding a little more money to reach the exact change!";
      }
      if (result.kind === "too-much") {
        return "That's a bit too much change! Tap a piece in the tray to remove it.";
      }
      return "Take your time! Tap 💡 Hint if you need help.";
    }

    if (!isBillVerified) {
      if (billError) {
        return billError;
      }
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
        return "Bill verified! Customer paid exact money. Tap the green NO CHANGE button.";
      }
      return `Bill verified! Customer gave ${formatUSD(scenario.paid)}. Calculate change and tap coins/notes from drawer!`;
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
              <span className="rounded-full bg-paper px-2 py-0.2 text-[11px] font-extrabold border border-orange text-orange animate-pulse">
                ⏱️ {timeLeft}s
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

      {/* Main Game Stage - Centered with tight, cohesive spacing (no large empty gaps) */}
      <main className="mx-auto flex flex-1 flex-col justify-start lg:justify-center w-full max-w-6xl px-3 py-1 sm:py-2 gap-2 sm:gap-2.5">
        {/* Upper Main Section: 3D Shop & Dialogue on Left, Bill & Tray on Right */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-2 sm:gap-2.5 items-stretch">
          {/* Left Column: 3D Store View + Customer Bubble (tightly fitted with zero awkward gap) */}
          <div className="flex flex-col gap-2 h-full min-h-0">
            <KiranaStore3D
              scenario={scenario}
              tray={tray}
              mood={result?.kind === "correct" ? "happy" : result ? "thinking" : "speaking"}
              isCorrect={result?.kind === "correct"}
              result={result}
              roundIndex={index}
              onActiveDialogueChange={setActiveDialogue}
            />
            <CustomerBubble
              scenario={scenario}
              mood={result?.kind === "correct" ? "happy" : result ? "thinking" : "speaking"}
              activeDialogue={activeDialogue}
            />
          </div>

          {/* Right Column: Countertop with Shopping Bill & Change Tray */}
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
            </div>
          </div>
        </section>

        {/* Helpful Contextual Guidance Strip for Children (can be toggled on/off) */}
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

        {/* Lower Section: Cash Drawer (unlocked after bill total is calculated and verified) */}
        <CashDrawer
          denominations={DENOMINATIONS}
          onAdd={add}
          disabled={busy || !isBillVerified}
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

      <AnimatePresence>
        {result && <Feedback result={result} onContinue={next} onRetry={retry} />}
      </AnimatePresence>
    </div>
  );
}
