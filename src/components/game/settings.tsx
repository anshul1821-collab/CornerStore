import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { Lang } from "@/game/types";
import { t, type StringKey } from "@/game/i18n";
import { voiceManager } from "@/lib/voice/voiceManager";

interface SettingsCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  sound: boolean;
  setSound: (s: boolean) => void;
  tr: (k: StringKey, v?: Record<string, string | number>) => string;
  play: (kind: "tap" | "success" | "oops") => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const lang: Lang = "en";
  const [sound, setSoundState] = useState(true);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.removeItem("kc-lang");
    if (localStorage.getItem("kc-sound") === "off") {
      setSoundState(false);
      voiceManager.setEnabled(false);
    }
  }, []);

  const setLang = (_l: Lang) => {
    // English-only application
  };

  const setSound = (s: boolean) => {
    setSoundState(s);
    localStorage.setItem("kc-sound", s ? "on" : "off");
    voiceManager.setEnabled(s);
  };

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
    <Ctx.Provider value={{ lang, setLang, sound, setSound, tr: (k, v) => t(lang, k, v), play }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSettings outside provider");
  return c;
}

export function SettingsBar() {
  const { sound, setSound, tr } = useSettings();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setSound(!sound)}
        aria-label={`${tr("sound")}: ${sound ? "on" : "off"}`}
        aria-pressed={sound}
        className="grid h-10 w-10 place-items-center rounded-full bg-paper text-wood-dark shadow-soft border-2 border-wood-light hover:bg-peach cursor-pointer transition-colors"
      >
        {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
    </div>
  );
}
