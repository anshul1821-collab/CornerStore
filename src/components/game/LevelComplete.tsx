import { motion } from "framer-motion";
import { Stars } from "./Feedback";
import { useSettings } from "./settings";

interface Props {
  levelNumber: number;
  levelTitle: string;
  stars: number;
  served: number;
  mistakes: number;
  hints: number;
  hasNext: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
}

export function LevelComplete(p: Props) {
  const { tr } = useSettings();
  const headline = p.stars === 3 ? tr("done3") : p.stars === 2 ? tr("done1") : tr("done2");

  return (
    <div className="grid min-h-screen place-items-center p-3 sm:p-4">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-wood-dark bg-paper text-center shadow-wood"
      >
        <div className="bg-awning h-4 sm:h-5" aria-hidden />
        <div className="p-4 sm:p-5">
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
          <div className="my-2.5">
            <Stars count={p.stars} size="text-4xl sm:text-5xl" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              [tr("served"), p.served, "🧑‍🤝‍🧑"],
              [tr("mistakes"), p.mistakes, "🔁"],
              [tr("hintsUsed"), p.hints, "💡"],
            ].map(([l, v, e]) => (
              <div key={String(l)} className="rounded-xl bg-cream p-1.5 sm:p-2">
                <div className="text-xl" aria-hidden>
                  {e}
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold">{v}</div>
                <div className="text-xs font-bold text-muted-foreground">{l}</div>
              </div>
            ))}
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
            className="mt-2 text-xs sm:text-sm font-bold text-wood hover:underline cursor-pointer"
          >
            ← {tr("home")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
