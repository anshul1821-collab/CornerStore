import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import shopHero from "@/assets/shop-hero.jpg";
import type { LevelDef, Progress } from "@/game/types";
import { LevelMap } from "./LevelMap";
import { SettingsBar, useSettings } from "./settings";
import { useVoice } from "@/lib/voice/useVoice";

interface Props {
  levels: LevelDef[];
  progress: Progress;
  selected: number;
  onSelect: (i: number) => void;
  onPlay: () => void;
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span
        className="relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-sun text-2xl shadow-wood"
        aria-hidden
      >
        🏪
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-orange text-xs font-extrabold text-wood-dark">
          ₹
        </span>
      </span>
      <span className="font-display text-xl sm:text-2xl font-extrabold leading-none text-wood-dark">
        Kirana<span className="block text-leaf-dark">Change</span>
      </span>
    </div>
  );
}

export function HomeScreen({ levels, progress, selected, onSelect, onPlay }: Props) {
  const { tr, lang } = useSettings();
  const { isSpeaking, activeCharacter, speak } = useVoice();
  const speakingShopkeeper = isSpeaking && activeCharacter === "shopkeeper";

  const handleWelcomeVoice = () => {
    speak({
      text: "Welcome to Kirana Change! Every rupee counts! Step right up, take your time, and let's help our neighbors!",
      character: "shopkeeper",
      dialogueType: "fixed",
    });
  };
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-start overflow-x-hidden">
      <div className="bg-awning h-3.5 sm:h-5 rounded-b-2xl shadow-soft shrink-0" aria-hidden />

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl xl:max-w-7xl items-center justify-between px-4 sm:px-6 py-1.5 sm:py-2.5 shrink-0">
        <Logo />
        <SettingsBar />
      </header>

      {/* Main Container - Vertically centered, well-filled and balanced */}
      <main className="mx-auto flex flex-1 min-h-0 flex-col justify-center w-full max-w-6xl xl:max-w-7xl px-4 sm:px-6 py-2 gap-3 sm:gap-4 lg:gap-5">
        {/* Hero Section */}
        <section className="grid items-center gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1.1fr_1fr] shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 text-center lg:order-1 lg:text-left flex flex-col items-center lg:items-start justify-center"
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-none tracking-tight text-wood-dark">
              {tr("title")}
            </h1>
            <p className="mt-1.5 sm:mt-2 font-display text-xl sm:text-2xl lg:text-3xl font-bold text-orange">
              {tr("tagline")}
            </p>
            <p className="mt-2 max-w-md lg:max-w-xl text-sm sm:text-base lg:text-lg font-semibold text-muted-foreground">
              {tr("intro")}
            </p>
            <div className="mt-3.5 sm:mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <button
                onClick={onPlay}
                className="btn-press rounded-2xl sm:rounded-3xl bg-leaf px-8 sm:px-10 py-3 sm:py-3.5 font-display text-2xl sm:text-3xl font-extrabold text-primary-foreground shadow-chunky hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun cursor-pointer"
              >
                {tr("play")} ▶
              </button>
              <div className="rounded-xl border-2 border-sun/60 bg-paper/90 px-3.5 py-2 shadow-wood">
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
                🏪 Grocery Store 🏪
              </div>
              <img
                src={shopHero}
                alt="A friendly shopkeeper waving from a colourful kirana shop"
                width={1536}
                height={1024}
                className="max-h-[180px] sm:max-h-[220px] lg:max-h-[260px] xl:max-h-[300px] w-auto rounded-2xl lg:rounded-3xl border-4 lg:border-6 border-wood shadow-soft object-cover"
              />
              <button
                onClick={handleWelcomeVoice}
                type="button"
                aria-label="Listen to shopkeeper welcome"
                title="Hear Shopkeeper voice"
                className={`absolute -bottom-2.5 right-3 z-10 flex items-center gap-1.5 rounded-full border-2 border-sun px-3 py-1 font-display text-xs sm:text-sm font-extrabold shadow-soft cursor-pointer transition-all ${
                  speakingShopkeeper
                    ? "bg-leaf text-white ring-2 ring-sun scale-105"
                    : "bg-wood-dark text-sun hover:bg-wood hover:scale-102"
                }`}
              >
                <span>🏬</span>
                <span>{speakingShopkeeper ? "Shopkeeper Speaking..." : "3D Shopkeeper Voice"}</span>
                <Volume2 className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Level Map Section */}
        <section className="shrink-0 w-full">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h2 className="font-display text-base sm:text-lg lg:text-xl font-extrabold text-wood-dark flex items-center gap-2">
              <span>🗺️</span>
              <span>{tr("levels")}</span>
            </h2>
            <span className="text-xs sm:text-sm font-bold text-wood">
              Select any unlocked level to play
            </span>
          </div>
          <div className="rounded-2xl lg:rounded-3xl bg-wood-grain border-3 lg:border-4 border-wood-dark p-2 sm:p-2.5 lg:p-3 shadow-wood">
            <LevelMap levels={levels} progress={progress} selected={selected} onSelect={onSelect} />
          </div>
        </section>
      </main>
    </div>
  );
}
