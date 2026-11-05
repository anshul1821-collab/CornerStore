import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Customer, DenomId, Scenario, SubmissionResult, Tray } from "@/game/types";
import { setupKiranaStoreScene, type StoreSceneManager } from "./storeScene";
import type { CharacterMood } from "./characters";
import {
  getCustomerOrderDialogue,
  getFeedbackDialogue,
  getShopkeeperPraise,
  getShopkeeperWelcome,
  type DialogueContent,
} from "./dialogue";
import { SpeechBubble3D } from "./SpeechBubble3D";
import { useSettings } from "../settings";
import { voiceManager } from "@/lib/voice/voiceManager";

interface Props {
  scenario: Scenario;
  tray: Tray;
  mood: CharacterMood;
  isCorrect?: boolean;
  result?: SubmissionResult | null;
  roundIndex?: number;
}

export function KiranaStore3D({ scenario, tray, mood, isCorrect, result, roundIndex = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<StoreSceneManager | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const { lang } = useSettings();

  // Active dialogue content
  const [activeDialogue, setActiveDialogue] = useState<DialogueContent | null>(null);
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeDoneRef = useRef(false);

  // Initialize Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      setWebglSupported(false);
      return undefined;
    }

    let manager: StoreSceneManager | null = null;
    let ro: ResizeObserver | null = null;

    try {
      manager = setupKiranaStoreScene(canvas, scenario.customer);
      managerRef.current = manager;

      ro = new ResizeObserver(() => {
        manager?.resize();
      });
      ro.observe(canvas);
    } catch (err) {
      console.warn("Could not initialize 3D Kirana shop scene:", err);
      setWebglSupported(false);
    }

    return () => {
      ro?.disconnect();
      manager?.dispose();
      managerRef.current = null;
    };
  }, []);

  // Update Customer in 3D
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setCustomer(scenario.customer);
      managerRef.current.setPaidAmount(scenario.paid, scenario.paidPieces);
    }
  }, [scenario]);

  // Update Tray in 3D
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setTray(tray);
    }
  }, [tray]);

  // Update Mood in 3D
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setMood(mood);
      if (isCorrect) {
        managerRef.current.celebrate();
      }
    }
  }, [mood, isCorrect]);

  // Handle Dialogue Sequence (Welcome -> Customer Order -> Submission Feedback)
  useEffect(() => {
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);

    // 1. If result exists, show submission feedback
    if (result) {
      voiceManager.playCoinChime();
      if (result.kind === "correct") {
        // Customer says thank you first
        setActiveDialogue(getFeedbackDialogue(scenario, result, lang));
        // After 1.8 seconds, shopkeeper praises player
        dialogueTimerRef.current = setTimeout(() => {
          setActiveDialogue(getShopkeeperPraise(lang));
          dialogueTimerRef.current = setTimeout(() => {
            setActiveDialogue(null);
          }, 2500);
        }, 1800);
      } else {
        // Mistake feedback from customer (auto-dismiss after 4.5s)
        setActiveDialogue(getFeedbackDialogue(scenario, result, lang));
        dialogueTimerRef.current = setTimeout(() => {
          setActiveDialogue(null);
        }, 4500);
      }
      return;
    }

    // 2. On first customer of session, show shopkeeper welcome message
    if (roundIndex === 0 && !welcomeDoneRef.current) {
      voiceManager.startAmbience();
      setActiveDialogue(getShopkeeperWelcome(lang));
      dialogueTimerRef.current = setTimeout(() => {
        welcomeDoneRef.current = true;
        voiceManager.playDoorChime();
        dialogueTimerRef.current = setTimeout(() => {
          setActiveDialogue(getCustomerOrderDialogue(scenario, lang));
          // Auto-dismiss order bubble after 6s to keep the 3D shop clear
          dialogueTimerRef.current = setTimeout(() => {
            setActiveDialogue(null);
          }, 6000);
        }, 250);
      }, 4200);
      return;
    }

    // 3. Normal customer arrival order dialogue (play door chime, brief natural pause, then speak)
    voiceManager.startAmbience();
    voiceManager.playDoorChime();
    dialogueTimerRef.current = setTimeout(() => {
      setActiveDialogue(getCustomerOrderDialogue(scenario, lang));
      dialogueTimerRef.current = setTimeout(() => {
        setActiveDialogue(null);
      }, 5500);
    }, 250);

    return () => {
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    };
  }, [scenario, result, roundIndex, lang]);

  // Synchronize voice playback with active dialogue
  useEffect(() => {
    if (activeDialogue) {
      voiceManager.speak({
        text: activeDialogue.text,
        character: activeDialogue.speaker,
        customerId: activeDialogue.speaker === "customer" ? scenario.customer.id : undefined,
        dialogueType: activeDialogue.dialogueType,
      });
    }
  }, [activeDialogue, scenario.customer.id]);

  if (!webglSupported) {
    return (
      <div className="relative flex h-64 w-full items-center justify-center rounded-3xl border-4 border-wood-dark bg-peach/40 p-4 text-center">
        <p className="font-display text-lg font-bold text-wood-dark">
          🏪 3D Grocery Store (2D Fallback Mode Active)
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-4 border-wood-dark bg-stone-900 shadow-wood">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="block h-[190px] sm:h-[220px] lg:h-[240px] xl:h-[270px] w-full cursor-grab active:cursor-grabbing"
      />

      {/* Animated 3D Speech Bubble Overlay */}
      <AnimatePresence mode="wait">
        {activeDialogue && (
          <SpeechBubble3D
            dialogue={activeDialogue}
            lang={lang}
            customerId={scenario.customer.id}
            onDismiss={() => {
              if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
              setActiveDialogue(null);
              voiceManager.stop();
            }}
          />
        )}
      </AnimatePresence>

      {/* Store Sign Banner Badge */}
      <div className="pointer-events-none absolute top-3 left-4 flex items-center gap-2 rounded-2xl border-2 border-sun/80 bg-wood-dark/85 px-3 py-1 text-white shadow-soft backdrop-blur-xs">
        <span className="text-xl">🏪</span>
        <div>
          <p className="font-display text-sm font-extrabold leading-none text-sun">
            Corner Grocery Store
          </p>
          <p className="text-[10px] font-bold text-cream/90 uppercase tracking-wider">
            Neighborhood Market
          </p>
        </div>
      </div>

      {/* Customer Tag Badge (Click to re-open dialogue) */}
      <button
        type="button"
        onClick={() => {
          if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
          setActiveDialogue(getCustomerOrderDialogue(scenario, lang));
          dialogueTimerRef.current = setTimeout(() => {
            setActiveDialogue(null);
          }, 5500);
        }}
        title="Click to view customer dialogue"
        className="pointer-events-auto absolute bottom-3 left-4 flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/65 hover:bg-black/85 active:scale-95 transition-all px-3 py-1 text-xs font-bold text-white backdrop-blur-xs select-none cursor-pointer"
      >
        <span className="text-base">{scenario.customer.emoji}</span>
        <span>Customer: {scenario.customer.name.en}</span>
        <span className="ml-1 text-[11px] text-amber-300 opacity-90">💬</span>
      </button>

      {/* Interactive Shop Tip */}
      <div className="pointer-events-none absolute top-3 right-4 hidden sm:flex items-center gap-1 rounded-xl bg-wood-dark/70 px-2.5 py-1 text-[11px] font-semibold text-cream/80 backdrop-blur-xs">
        <span>✨ Move cursor to look around</span>
      </div>
    </div>
  );
}
