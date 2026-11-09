import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LEVELS, emptyProgress, levelStars } from "@/game/engine";
import type { Progress } from "@/game/types";
import { SettingsProvider, useSettings } from "@/components/game/settings";
import { HomeScreen } from "@/components/game/HomeScreen";
import { GameScreen, type LevelStats } from "@/components/game/GameScreen";
import { LevelComplete } from "@/components/game/LevelComplete";
import { GameGuideModal } from "@/components/game/GameGuideModal";
import { VoiceTestingLabModal } from "@/components/game/VoiceTestingLabModal";
import { dialogueAudio } from "@/lib/dialogueAudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Corner Store Simulator — Every Dollar Counts!" },
      {
        name: "description",
        content:
          "A colourful corner store simulator where players learn to add bills and give correct change in US Dollars.",
      },
      { property: "og:title", content: "Corner Store Simulator — Every Dollar Counts!" },
      {
        property: "og:description",
        content: "Run your own corner store and become a money master.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SettingsProvider>
      <App />
    </SettingsProvider>
  ),
});

type Screen =
  | { name: "home" }
  | { name: "play"; level: number; run: number }
  | { name: "done"; level: number; stats: LevelStats };

function App() {
  const { lang, guideOpen, openGuide, closeGuide, voiceLabOpen, closeVoiceLab } = useSettings();
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [selected, setSelected] = useState(0);
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("kc-progress") ?? "null");
      if (p?.stars?.length === LEVELS.length) {
        setProgress(p);
        const firstOpen = p.stars.findIndex((s: number) => s === 0);
        setSelected(firstOpen === -1 ? LEVELS.length - 1 : firstOpen);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const complete = (level: number, stats: LevelStats) => {
    const stars = levelStars(stats.stars);
    setProgress((p) => {
      const next = { stars: p.stars.map((s, i) => (i === level ? Math.max(s, stars) : s)) };
      localStorage.setItem("kc-progress", JSON.stringify(next));
      return next;
    });
    setScreen({ name: "done", level, stats });
  };

  const start = (level: number) => {
    dialogueAudio.unlockAudio();
    setScreen({ name: "play", level, run: Date.now() });
  };

  return (
    <>
      {screen.name === "play" && (
        <GameScreen
          key={screen.run}
          level={LEVELS[screen.level]!}
          onExit={() => setScreen({ name: "home" })}
          onComplete={(s) => complete(screen.level, s)}
        />
      )}

      {screen.name === "done" && (
        <LevelComplete
          levelNumber={LEVELS[screen.level]!.number}
          levelTitle={LEVELS[screen.level]!.title[lang]}
          stars={levelStars(screen.stats.stars)}
          served={screen.stats.stars.length}
          mistakes={screen.stats.mistakes}
          hints={screen.stats.hints}
          hasNext={screen.level + 1 < LEVELS.length}
          onReplay={() => start(screen.level)}
          onNext={() => {
            setSelected(screen.level + 1);
            start(screen.level + 1);
          }}
          onHome={() => setScreen({ name: "home" })}
        />
      )}

      {screen.name === "home" && (
        <HomeScreen
          levels={LEVELS}
          progress={progress}
          selected={selected}
          onSelect={setSelected}
          onPlay={() => start(selected)}
          onOpenGuide={openGuide}
        />
      )}

      <GameGuideModal
        isOpen={guideOpen}
        onClose={closeGuide}
        onStartPlay={() => {
          closeGuide();
          if (screen.name !== "play") start(selected);
        }}
      />

      <VoiceTestingLabModal isOpen={voiceLabOpen} onClose={closeVoiceLab} />
    </>
  );
}
