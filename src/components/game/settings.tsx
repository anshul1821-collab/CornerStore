import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { HelpCircle, Mic, Volume2, VolumeX } from "lucide-react";
import type { Lang } from "@/game/types";
import { t, type StringKey } from "@/game/i18n";
import { ambienceEngine } from "@/lib/ambience";
import { dialogueAudio } from "@/lib/dialogueAudio";

interface SettingsCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  sound: boolean;
  setSound: (s: boolean) => void;
  hintsEnabled: boolean;
  setHintsEnabled: (h: boolean) => void;
  guideOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  voiceLabOpen: boolean;
  openVoiceLab: () => void;
  closeVoiceLab: () => void;
  tr: (k: StringKey, v?: Record<string, string | number>) => string;
  play: (kind: "tap" | "success" | "oops") => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const lang: Lang = "en";
  const [sound, setSoundState] = useState(true);
  const [hintsEnabled, setHintsEnabledState] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [voiceLabOpen, setVoiceLabOpen] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.removeItem("kc-lang");
    if (localStorage.getItem("kc-sound") === "off") {
      setSoundState(false);
      ambienceEngine.setMuted(true);
    }
    if (localStorage.getItem("kc-hints") === "off") {
      setHintsEnabledState(false);
    }
  }, []);

  const setLang = (_l: Lang) => {
    // English-only application
  };

  const setSound = (s: boolean) => {
    setSoundState(s);
    localStorage.setItem("kc-sound", s ? "on" : "off");
    ambienceEngine.setMuted(!s);
    dialogueAudio.setMuted(!s);
  };

  const setHintsEnabled = (h: boolean) => {
    setHintsEnabledState(h);
    localStorage.setItem("kc-hints", h ? "on" : "off");
  };

  const openGuide = () => setGuideOpen(true);
  const closeGuide = () => setGuideOpen(false);

  const openVoiceLab = () => setVoiceLabOpen(true);
  const closeVoiceLab = () => setVoiceLabOpen(false);

  // Sounds only play in response to user actions.
  const play: SettingsCtx["play"] = (kind) => {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      const ac = audio.current;
      const notes =
        kind === "tap" ? [660] : kind === "success" ? [523, 659, 784, 1046] : [392, 330];
      notes.forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = kind === "tap" ? "triangle" : "sine";
        o.frequency.value = f;
        const at = ac.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.15, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + (kind === "tap" ? 0.08 : 0.2));
        o.connect(g).connect(ac.destination);
        o.start(at);
        o.stop(at + 0.25);
      });
    } catch {
      /* audio unavailable */
    }
  };

  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        sound,
        setSound,
        hintsEnabled,
        setHintsEnabled,
        guideOpen,
        openGuide,
        closeGuide,
        voiceLabOpen,
        openVoiceLab,
        closeVoiceLab,
        tr: (k, v) => t(lang, k, v),
        play,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSettings outside provider");
  return c;
}

export function SettingsBar({
  showGuideButton = true,
  showVoiceLabButton = true,
}: {
  showGuideButton?: boolean;
  showVoiceLabButton?: boolean;
}) {
  const { sound, setSound, openGuide, openVoiceLab, tr } = useSettings();

  return (
    <div className="flex items-center gap-2">
      {showVoiceLabButton && (
        <button
          onClick={openVoiceLab}
          aria-label="Character Voice Studio"
          title="Character Voice Studio & Audition Lab"
          className="flex items-center gap-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-950 px-3 py-1.5 text-xs sm:text-sm font-extrabold shadow-soft border-2 border-emerald-400 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <Mic className="h-4 w-4 text-emerald-700" />
          <span className="hidden sm:inline font-display">Voice Studio</span>
        </button>
      )}

      {showGuideButton && (
        <button
          onClick={openGuide}
          aria-label={tr("howToPlay")}
          title="How to Play / Game Guide"
          className="flex items-center gap-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-wood-dark px-3 py-1.5 text-xs sm:text-sm font-extrabold shadow-soft border-2 border-sun/80 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <HelpCircle className="h-4 w-4 text-amber-700" />
          <span className="hidden sm:inline font-display">{tr("howToPlay")}</span>
        </button>
      )}

      <button
        onClick={() => setSound(!sound)}
        aria-label={`${tr("sound")}: ${sound ? "on" : "off"}`}
        aria-pressed={sound}
        title={`Sound: ${sound ? "On" : "Off"}`}
        className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-paper text-wood-dark shadow-soft border-2 border-wood-light hover:bg-peach cursor-pointer transition-colors"
      >
        {sound ? (
          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>
    </div>
  );
}
