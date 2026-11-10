import { motion } from "framer-motion";
import type { LevelStats } from "@/game/types";
import { calculateLevelSummary } from "@/game/engine";
import { Stars } from "./Feedback";
import { useSettings } from "./settings";

interface Props {
  levelNumber: number;
  levelTitle: string;
  stars: number;
  served: number;
  mistakes: number;
  hints: number;
  stats?: LevelStats;
  hasNext: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
}

export function LevelComplete(p: Props) {
  const { tr } = useSettings();
  const headline = p.stars === 3 ? tr("done3") : p.stars === 2 ? tr("done1") : tr("done2");

  const summary = p.stats?.transactions?.length
    ? calculateLevelSummary(p.stats.transactions)
    : {
        totalCustomers: p.served,
        correctBillFirstTry: p.stats?.correctBillFirstTry ?? p.served,
        correctChangeFirstTry: p.stats?.correctChangeFirstTry ?? p.served,
        totalMistakes: p.mistakes,
        totalHints: p.hints,
        totalStars: p.stats?.stars?.reduce((a, b) => a + b, 0) ?? p.stars * p.served,
        avgTime: p.stats?.totalTime ? Math.round(p.stats.totalTime / Math.max(1, p.served)) : 0,
      };

  return (
    <div className="grid min-h-screen place-items-center p-3 sm:p-4">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border-4 border-wood-dark bg-paper text-center shadow-wood"
      >
        <div className="bg-awning h-4 sm:h-5" aria-hidden />
        <div className="p-4 sm:p-6">
          <div className="text-5xl" aria-hidden>
            🏪🎉
          </div>
          <p className="mt-1 text-xs sm:text-sm font-bold text-muted-foreground">
            {tr("level")} {p.levelNumber} · {p.levelTitle}
          </p>
          <div className="mt-0.5 flex items-center justify-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-wood-dark">
              {headline}
            </h1>
          </div>
          <div className="my-3">
            <Stars count={p.stars} size="text-4xl sm:text-5xl" />
          </div>

          {/* Overall Performance Summary Grid: 6 Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-4">
            <div className="rounded-2xl bg-cream/90 border border-wood-dark/10 p-2 sm:p-2.5">
              <div className="text-xl" aria-hidden>🧑‍🤝‍🧑</div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-wood-dark">
                {summary.totalCustomers}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">Served</div>
            </div>

            <div className="rounded-2xl bg-cream/90 border border-wood-dark/10 p-2 sm:p-2.5">
              <div className="text-xl" aria-hidden>🧾</div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-emerald-800">
                {summary.correctBillFirstTry}/{summary.totalCustomers}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">Bill Accuracy</div>
            </div>

            <div className="rounded-2xl bg-cream/90 border border-wood-dark/10 p-2 sm:p-2.5">
              <div className="text-xl" aria-hidden>💰</div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-emerald-800">
                {summary.correctChangeFirstTry}/{summary.totalCustomers}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">Change Accuracy</div>
            </div>

            <div className="rounded-2xl bg-cream/90 border border-wood-dark/10 p-2 sm:p-2.5">
              <div className="text-xl" aria-hidden>🔁</div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-wood-dark">
                {summary.totalMistakes}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">Total Mistakes</div>
            </div>

            <div className="rounded-2xl bg-cream/90 border border-wood-dark/10 p-2 sm:p-2.5">
              <div className="text-xl" aria-hidden>⏱️</div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-wood-dark">
                {summary.avgTime > 0 ? `${summary.avgTime}s` : "Untimed"}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">Avg Time / Sale</div>
            </div>

            <div className="rounded-2xl bg-cream/90 border border-wood-dark/10 p-2 sm:p-2.5">
              <div className="text-xl" aria-hidden>⭐</div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-wood-dark">
                {summary.totalStars}/{summary.totalCustomers * 3}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">Total Stars</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={p.onReplay}
              className="btn-press flex-1 rounded-2xl bg-sun py-2.5 font-display text-lg sm:text-xl font-extrabold text-wood-dark shadow-wood cursor-pointer"
            >
              {tr("replay")}
            </button>
            {p.hasNext && (
              <button
                autoFocus
                onClick={p.onNext}
                className="btn-press flex-1 rounded-2xl bg-leaf py-2.5 font-display text-lg sm:text-xl font-extrabold text-primary-foreground shadow-chunky cursor-pointer"
              >
                {tr("nextLevel")} ▶
              </button>
            )}
          </div>
          <button
            onClick={p.onHome}
            className="mt-3 text-xs sm:text-sm font-bold text-wood hover:underline cursor-pointer"
          >
            ← {tr("home")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
