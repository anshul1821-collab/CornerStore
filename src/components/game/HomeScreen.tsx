import { useEffect } from "react";
import { motion } from "framer-motion";
import shopHero from "@/assets/shop-hero.jpg";
import type { LevelDef, Progress } from "@/game/types";
import { LevelMap } from "./LevelMap";
import { SettingsBar, useSettings } from "./settings";
import { dialogueAudio } from "@/lib/dialogueAudio";

interface Props {
  levels: LevelDef[];
  progress: Progress;
  selected: number;
  onSelect: (i: number) => void;
  onPlay: () => void;
  onOpenGuide?: () => void;
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <span
        className="relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-sun text-2xl shadow-wood shrink-0"
        aria-hidden
      >
        🏪
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-orange text-xs font-black text-wood-dark shadow-xs">
          $
        </span>
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg sm:text-xl font-black text-wood-dark tracking-tight">
          Corner Store
        </span>
        <span className="font-display text-[11px] sm:text-xs font-extrabold text-leaf-dark uppercase tracking-wider">
          Simulator
        </span>
      </div>
    </div>
  );
}

export function HomeScreen({ levels, progress, selected, onSelect, onPlay, onOpenGuide }: Props) {
  const { tr, lang, openGuide, openVoiceLab, play } = useSettings();

  useEffect(() => {
    dialogueAudio.prewarmAudio([
      "/audio/characters/shopkeeper/check_bill_instruction.mp3",
      "/audio/characters/aunty/004e9c8faf553351ab558f58883c5c29.mp3",
    ]);
  }, []);

  const handleOpenGuide = () => {
    dialogueAudio.unlockAudio();
    play("tap");
    if (onOpenGuide) onOpenGuide();
    else openGuide();
  };

  const handleStartPlay = () => {
    // Prime the audio system synchronously from user gesture to satisfy browser autoplay policy
    dialogueAudio.unlockAudio();
    onPlay();
  };

  const handleSelectLevel = (idx: number) => {
    dialogueAudio.unlockAudio();
    onSelect(idx);
  };

  return (
    <div className="min-h-screen flex flex-col justify-start overflow-x-hidden">
      <div className="bg-awning h-3.5 sm:h-5 rounded-b-2xl shadow-soft shrink-0" aria-hidden />

      {/* Header - Clean isolated bar with zero overlap */}
      <header className="mx-auto flex w-full max-w-6xl xl:max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 shrink-0 relative z-10 border-b border-wood-light/20">
        <Logo />
        <SettingsBar />
      </header>

      {/* Main Container - Clean top-down flow with zero header collision */}
      <main className="mx-auto flex flex-1 flex-col justify-start w-full max-w-6xl xl:max-w-7xl px-4 sm:px-6 py-3 sm:py-5 gap-3 sm:gap-4 lg:gap-5">
        {/* Hero Section */}
        <section className="grid items-center gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1.1fr_1fr] shrink-0 pt-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 text-center lg:order-1 lg:text-left flex flex-col items-center lg:items-start justify-center"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-none tracking-tight text-wood-dark">
              {tr("title")}
            </h1>
            <p className="mt-1.5 sm:mt-2 font-display text-xl sm:text-2xl lg:text-3xl font-bold text-orange">
              {tr("tagline")}
            </p>
            <p className="mt-2 max-w-md lg:max-w-xl text-sm sm:text-base lg:text-lg font-semibold text-muted-foreground">
              {tr("intro")}
            </p>
            <div className="mt-3.5 sm:mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-3.5">
              <button
                onClick={handleStartPlay}
                className="btn-press rounded-2xl sm:rounded-3xl bg-leaf px-7 sm:px-9 py-3 sm:py-3.5 font-display text-2xl sm:text-3xl font-extrabold text-primary-foreground shadow-chunky hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun cursor-pointer flex items-center gap-2"
              >
                <span>{tr("play")}</span>
                <span>▶</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGuide}
                className="btn-press flex items-center gap-2 rounded-2xl sm:rounded-3xl border-3 border-amber-400 bg-amber-100 hover:bg-amber-200 px-5 sm:px-6 py-3 sm:py-3.5 font-display text-lg sm:text-xl font-black text-amber-950 shadow-wood cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Learn how to play with step-by-step tutorial"
                aria-label="How to Play"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sun text-wood-dark font-black text-base shadow-xs">
                  ❓
                </span>
                <span>{tr("howToPlay")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  play("tap");
                  openVoiceLab();
                }}
                className="btn-press flex items-center gap-2 rounded-2xl sm:rounded-3xl border-3 border-emerald-400 bg-emerald-100 hover:bg-emerald-200 px-5 sm:px-6 py-3 sm:py-3.5 font-display text-lg sm:text-xl font-black text-emerald-950 shadow-wood cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Audition characters in the Voice Studio & Lab"
                aria-label="Character Voice Studio"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400 text-emerald-950 font-black text-base shadow-xs">
                  🎙️
                </span>
                <span>Voice Studio</span>
              </button>

              <div className="rounded-xl border-2 border-sun/60 bg-paper/90 px-3.5 py-2 shadow-wood flex items-center gap-1.5">
                <span className="text-base" aria-hidden>{levels[selected]?.icon}</span>
                <p className="font-bold text-xs sm:text-sm text-wood-dark">
                  {tr("level")} {levels[selected]?.number}: {levels[selected]?.title[lang]}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative inline-block">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 -rotate-2 rounded-xl border-3 border-wood-dark bg-sun px-3.5 py-0.5 font-display text-sm sm:text-base font-extrabold text-wood-dark shadow-wood">
                🏪 Corner Store Simulator 🏪
              </div>
              <img
                src={shopHero}
                alt="A friendly shopkeeper waving from a colourful corner store"
                width={1536}
                height={1024}
                className="max-h-[160px] sm:max-h-[190px] lg:max-h-[220px] xl:max-h-[260px] w-auto rounded-2xl lg:rounded-3xl border-4 lg:border-6 border-wood shadow-soft object-cover"
              />
            </div>
          </motion.div>
        </section>

        {/* Level Map Section */}
        <section className="shrink-0 w-full flex flex-col gap-2">
          {/* Active Level Mission Briefing Card */}
          {levels[selected] && (
            <motion.div
              key={levels[selected].number}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-3 border-wood-light/80 bg-paper/95 p-3 sm:p-4 shadow-wood flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-3xl sm:text-4xl filter drop-shadow-xs shrink-0 mt-0.5" aria-hidden>
                  {levels[selected].icon}
                </span>
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base sm:text-lg font-black text-wood-dark">
                      Level {levels[selected].number}: {levels[selected].title[lang]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-black uppercase tracking-wider border ${
                        levels[selected].difficulty === "Easy"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : levels[selected].difficulty === "Medium"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : levels[selected].difficulty === "Hard"
                              ? "bg-orange-100 text-orange-800 border-orange-300"
                              : "bg-purple-100 text-purple-800 border-purple-300"
                      }`}
                    >
                      {levels[selected].difficulty}
                    </span>
                    <span className="rounded-full bg-sun/25 border border-sun px-2 py-0.2 text-[11px] font-bold text-wood-dark">
                      💡 {levels[selected].concept[lang]}
                    </span>
                    {levels[selected].timeLimit ? (
                      <span className="rounded-full bg-orange/15 border border-orange/40 px-2 py-0.2 text-[11px] font-extrabold text-orange-800">
                        ⏱️ {levels[selected].timeLimit}s Timer
                      </span>
                    ) : (
                      <span className="rounded-full bg-leaf/15 border border-leaf/40 px-2 py-0.2 text-[11px] font-extrabold text-leaf-dark">
                        ✨ Relaxed Pace
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-wood font-medium line-clamp-2 mt-0.5">
                    {levels[selected].description[lang]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartPlay}
                className="btn-press self-stretch sm:self-center shrink-0 rounded-xl bg-leaf px-5 py-2 font-display text-base font-black text-white shadow-soft hover:brightness-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Play Level {levels[selected].number}</span>
                <span>▶</span>
              </button>
            </motion.div>
          )}

          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-base sm:text-lg lg:text-xl font-extrabold text-wood-dark flex items-center gap-2">
              <span>🗺️</span>
              <span>{tr("levels")}</span>
            </h2>
            <span className="text-xs sm:text-sm font-bold text-wood">
              Select any level to preview mission details
            </span>
          </div>
          <div className="rounded-2xl lg:rounded-3xl bg-wood-grain border-3 lg:border-4 border-wood-dark p-2 sm:p-2.5 lg:p-3 shadow-wood">
            <LevelMap levels={levels} progress={progress} selected={selected} onSelect={handleSelectLevel} />
          </div>
        </section>
      </main>
    </div>
  );
}
