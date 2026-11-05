import { useEffect, useMemo, useState } from "react";
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
import { voiceManager } from "@/lib/voice/voiceManager";

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
  const { tr, lang, play } = useSettings();
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

  const required = requiredChange(scenario);
  const total = trayTotal(tray);
  const steps = useMemo(() => countUpSteps(scenario.payable, scenario.paid), [scenario]);

  useEffect(() => {
    return () => {
      voiceManager.stop();
    };
  }, []);

  useEffect(() => {
    setTimeLeft(scenario.timeLimit);
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
    play("tap");
    setTray((t) => ({ ...t, [id]: (t[id] ?? 0) + 1 }));
  };
  const remove = (id: DenomId) => setTray((t) => ({ ...t, [id]: Math.max(0, (t[id] ?? 0) - 1) }));

  const submit = () => {
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
          <div className="flex items-center gap-2">
            <p className="text-center font-display font-extrabold text-xs sm:text-sm leading-tight text-wood-dark">
              {level.icon} {tr("level")} {level.number}: {level.title[lang]}
            </p>
            {timeLeft !== null && (
              <span className="rounded-full bg-paper px-2 py-0.2 text-[11px] font-extrabold border border-orange text-orange">
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
          {/* Left Column: 3D Store View + Customer Bubble */}
          <div className="flex flex-col justify-between gap-2">
            <KiranaStore3D
              scenario={scenario}
              tray={tray}
              mood={result?.kind === "correct" ? "happy" : result ? "thinking" : "speaking"}
              isCorrect={result?.kind === "correct"}
              result={result}
              roundIndex={index}
            />
            <CustomerBubble
              scenario={scenario}
              mood={result?.kind === "correct" ? "happy" : result ? "thinking" : "speaking"}
            />
          </div>

          {/* Right Column: Countertop with Shopping Bill & Change Tray */}
          <div className="rounded-2xl border-3 border-wood-dark bg-wood-light/40 p-2 sm:p-2.5 shadow-wood flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 items-stretch flex-1">
              <ShoppingBill
                scenario={scenario}
                calculatedTotal={calculatedTotal}
                onChangeTotal={setCalculatedTotal}
                disabled={busy}
              />

              <div className="flex flex-col justify-between gap-2 h-full">
                <ChangeTray
                  tray={tray}
                  denominations={DENOMINATIONS}
                  onDrop={add}
                  onRemove={remove}
                  onClear={() => setTray({})}
                  disabled={busy}
                />
                <RunningTotal total={total} state={trayState(tray, required)} />
                <div className="grid grid-cols-[1fr_auto] gap-2 items-stretch">
                  <button
                    onClick={submit}
                    disabled={busy || calculatedTotal !== scenario.payable}
                    className="btn-press rounded-xl bg-leaf py-2 px-3 font-display text-base sm:text-lg font-extrabold text-primary-foreground shadow-chunky disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sun text-center cursor-pointer flex items-center justify-center min-h-[44px]"
                  >
                    {total === 0 ? tr("noChange") : tr("give")}
                  </button>
                  <button
                    onClick={openHint}
                    disabled={busy}
                    className="rounded-xl border-2 border-sky bg-paper py-2 px-3.5 font-extrabold text-xs sm:text-sm text-teal hover:bg-mint cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5 shadow-soft min-h-[44px]"
                  >
                    <span>💡</span>
                    <span>{tr("hint")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lower Section: Cash Drawer (positioned directly beneath the counter with cohesive spacing) */}
        <CashDrawer denominations={DENOMINATIONS} onAdd={add} disabled={busy} />
      </main>

      {/* Modal Dialogs */}
      {showHint && (
        <HintPanel
          key={scenario.id}
          price={scenario.payable}
          paid={scenario.paid}
          steps={steps}
          onShowPieces={() => setTray(stepsToTray(steps))}
          onClose={() => setShowHint(false)}
        />
      )}

      {result && <Feedback result={result} onContinue={next} onRetry={retry} />}
    </div>
  );
}
