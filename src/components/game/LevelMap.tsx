import { motion } from "framer-motion";
import type { LevelDef, Progress } from "@/game/types";
import { useSettings } from "./settings";

interface Props {
  levels: LevelDef[];
  progress: Progress;
  selected: number;
  onSelect: (index: number) => void;
}

export function LevelMap({ levels, progress, selected, onSelect }: Props) {
  const { lang, tr } = useSettings();

  const getDifficultyBadge = (tier?: string) => {
    switch (tier) {
      case "Easy":
        return "bg-emerald-500/15 text-emerald-700 border-emerald-400/50";
      case "Medium":
        return "bg-amber-500/15 text-amber-700 border-amber-400/50";
      case "Hard":
        return "bg-orange-500/15 text-orange-700 border-orange-400/50";
      case "Expert":
        return "bg-purple-500/15 text-purple-700 border-purple-400/50";
      default:
        return "bg-stone-500/15 text-stone-700 border-stone-400/50";
    }
  };

  return (
    <ol className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-5">
      {levels.map((lv, i) => {
        const stars = progress.stars[i] ?? 0;
        const isSel = selected === i;
        return (
          <motion.li
            key={lv.number}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <button
              onClick={() => onSelect(i)}
              aria-pressed={isSel}
              aria-label={`${tr("level")} ${lv.number}: ${lv.title[lang]} - ${lv.difficulty ?? "Normal"}`}
              className={`group relative flex w-full flex-col items-center justify-between gap-1 rounded-2xl border-3 p-2 sm:p-2.5 text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange cursor-pointer min-h-[96px] sm:min-h-[106px] bg-paper shadow-wood hover:-translate-y-0.5 hover:shadow-lg active:scale-98 ${
                isSel
                  ? "border-leaf ring-4 ring-sun bg-amber-50/95"
                  : "border-wood-light hover:border-sun"
              }`}
            >
              {/* Level Number Pill */}
              <span
                className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.2 text-[10px] sm:text-[11px] font-extrabold shadow-xs ${
                  isSel ? "bg-leaf text-white ring-2 ring-sun" : "bg-wood text-primary-foreground"
                }`}
              >
                #{lv.number}
              </span>

              {/* Difficulty Badge */}
              {lv.difficulty && (
                <span
                  className={`absolute -top-2.5 right-2 rounded-full border px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs ${getDifficultyBadge(
                    lv.difficulty,
                  )}`}
                >
                  {lv.difficulty}
                </span>
              )}

              {/* Level Icon */}
              <span className="text-2xl sm:text-3xl filter drop-shadow-xs mt-1" aria-hidden>
                {lv.icon}
              </span>

              {/* Level Title */}
              <span className="text-xs sm:text-sm font-extrabold leading-tight text-center line-clamp-1 text-wood-dark">
                {lv.title[lang]}
              </span>

              {/* Concept Tag */}
              {lv.concept && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-wood leading-tight line-clamp-1 max-w-[95%]">
                  {lv.concept[lang]}
                </span>
              )}

              {/* Star Rating Progress */}
              <span className="text-xs sm:text-sm flex items-center gap-0.5" aria-hidden>
                {[0, 1, 2].map((s) => (
                  <span
                    key={s}
                    className={`transition-all ${
                      s < stars
                        ? "text-sun scale-110 drop-shadow-xs"
                        : "opacity-25 grayscale text-stone-400"
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </span>
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}
