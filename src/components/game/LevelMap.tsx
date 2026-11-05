import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { LevelDef, Progress } from "@/game/types";
import { isUnlocked } from "@/game/engine";
import { useSettings } from "./settings";

interface Props {
  levels: LevelDef[];
  progress: Progress;
  selected: number;
  onSelect: (index: number) => void;
}

export function LevelMap({ levels, progress, selected, onSelect }: Props) {
  const { lang, tr } = useSettings();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-5">
      {levels.map((lv, i) => {
        const open = isUnlocked(progress, i);
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
              disabled={!open}
              onClick={() => onSelect(i)}
              aria-pressed={isSel}
              aria-label={`${tr("level")} ${lv.number}: ${lv.title[lang]}${open ? "" : ` (${tr("locked")})`}`}
              className={`group relative flex w-full flex-col items-center justify-between gap-1 rounded-2xl border-3 p-2 sm:p-2.5 text-center transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange cursor-pointer min-h-[72px] sm:min-h-[78px] ${
                open ? "bg-paper shadow-wood hover:-translate-y-0.5" : "bg-cream/60 border-dashed"
              } ${isSel ? "border-leaf ring-4 ring-sun" : open ? "border-wood-light" : "border-border"}`}
            >
              <span
                className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.2 text-[11px] font-extrabold ${open ? "bg-wood text-primary-foreground" : "bg-border text-muted-foreground"}`}
              >
                {lv.number}
              </span>
              <span className="text-2xl sm:text-3xl" aria-hidden>
                {lv.icon}
              </span>
              <span
                className={`text-xs sm:text-sm font-extrabold leading-tight text-center line-clamp-1 ${open ? "text-wood-dark" : "text-muted-foreground"}`}
              >
                {lv.title[lang]}
              </span>
              {open ? (
                <span className="text-xs sm:text-sm" aria-hidden>
                  {[0, 1, 2].map((s) => (
                    <span key={s} className={s < stars ? "" : "opacity-25 grayscale"}>
                      ⭐
                    </span>
                  ))}
                </span>
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}
