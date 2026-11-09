import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Scenario, SubmissionResult, Tray } from "@/game/types";
import { setupKiranaStoreScene, type StoreSceneManager } from "./storeScene";
import type { CharacterMood } from "./characters";
import {
  getCustomerOrderDialogue,
  getFeedbackDialogue,
  getShopkeeperPraise,
  getShopkeeperWelcome,
  getShopkeeperCheckBillInstruction,
  type DialogueContent,
} from "./dialogue";
import { SpeechBubble3D } from "./SpeechBubble3D";
import { useSettings } from "../settings";
import { ambienceEngine } from "@/lib/ambience";
import { dialogueAudio, type SpeakingState } from "@/lib/dialogueAudio";

interface Props {
  scenario: Scenario;
  tray: Tray;
  mood: CharacterMood;
  isCorrect?: boolean;
  result?: SubmissionResult | null;
  roundIndex?: number;
  onActiveDialogueChange?: (d: DialogueContent | null) => void;
}

export function KiranaStore3D({
  scenario,
  tray,
  mood,
  isCorrect = false,
  result,
  roundIndex = 0,
  onActiveDialogueChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<StoreSceneManager | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const { lang, sound } = useSettings();

  // Active dialogue content and speaking state: initially displays customer order immediately
  const [activeDialogue, setActiveDialogue] = useState<DialogueContent | null>(() =>
    getCustomerOrderDialogue(scenario, lang),
  );
  const [speakingState, setSpeakingState] = useState<SpeakingState>(
    dialogueAudio.getSpeakingState(),
  );

  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeDoneRef = useRef(false);

  // Sync active dialogue state with parent GameScreen
  useEffect(() => {
    onActiveDialogueChange?.(activeDialogue);
  }, [activeDialogue, onActiveDialogueChange]);

  // Sync audio mute state with game sound setting
  useEffect(() => {
    dialogueAudio.setMuted(!sound);
  }, [sound]);

  // Subscribe to audio speaking events to drive 3D lip-sync and character animation
  useEffect(() => {
    const unsub = dialogueAudio.subscribe((state) => {
      setSpeakingState(state);
      if (managerRef.current) {
        managerRef.current.setSpeaking(state.isPlaying ? (state.speaker ?? "none") : "none");
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Helper to trigger dialogue with exact text speech generation and callback
  const triggerDialogue = useCallback((d: DialogueContent | null, onNaturalEnd?: () => void) => {
    if (dialogueTimerRef.current) {
      clearTimeout(dialogueTimerRef.current);
      dialogueTimerRef.current = null;
    }

    setActiveDialogue(d);
    if (!d) {
      dialogueAudio.stop();
      return;
    }

    // Generate and play exact text-to-speech
    dialogueAudio.playDialogue({
      text: d.text,
      speaker: d.speaker,
      characterVoice: d.characterVoice,
      customerId: d.customerId,
      onEnd: () => {
        onNaturalEnd?.();
      },
    });
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const manager = setupKiranaStoreScene(canvas, scenario.customer);
      managerRef.current = manager;

      const ro = new ResizeObserver(() => {
        manager?.resize();
      });
      ro.observe(canvas);
      if (canvas.parentElement) {
        ro.observe(canvas.parentElement);
      }
    } catch (err) {
      console.warn("Could not initialize 3D shop scene:", err);
      setWebglSupported(false);
    }

    return () => {
      const manager = managerRef.current;
      manager?.dispose();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Customer in 3D
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setCustomer(scenario.customer);
    }
  }, [scenario.customer]);

  // Update Tray coins / notes in 3D
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

  // Handle Dialogue Sequence:
  // Arrival: Customer arrival sequence managed by dialogueAudio (Order -> ended -> 3000ms pause -> Shopkeeper Instruction -> Order restored)
  // Submission: Customer gratitude/mistake -> Shopkeeper praise
  useEffect(() => {
    // 1. If result exists, show submission feedback
    if (result) {
      dialogueAudio.stopArrivalSequence();
      ambienceEngine.playCoinChime();
      const feedback = getFeedbackDialogue(scenario, result, lang);

      if (result.kind === "correct") {
        // Customer expresses gratitude first, then shopkeeper praises player
        triggerDialogue(feedback, () => {
          const praise = getShopkeeperPraise(lang);
          triggerDialogue(praise);
        });
      } else {
        // Mistake feedback from customer
        triggerDialogue(feedback);
      }
      return;
    }

    // 2. Customer arrival order sequence
    ambienceEngine.startAmbience();
    ambienceEngine.playDoorChime();

    const order = getCustomerOrderDialogue(scenario, lang);
    const instruction = getShopkeeperCheckBillInstruction(lang);
    const sequenceId = `${scenario.id}-${scenario.customer.id}-${roundIndex}`;

    // Start arrival sequence managed directly by dialogueAudio
    dialogueAudio.startArrivalSequence({
      sequenceId,
      orderDialogue: order,
      instructionDialogue: instruction,
      onDialogueChange: (d) => {
        setActiveDialogue(d);
      },
    });
  }, [scenario.id, scenario.customer.id, roundIndex, lang, result, triggerDialogue]);

  if (!webglSupported) {
    return (
      <div className="relative flex flex-1 min-h-[190px] sm:min-h-[220px] w-full items-center justify-center rounded-3xl border-4 border-wood-dark bg-peach/40 p-4 text-center shadow-wood">
        <p className="font-display text-lg font-bold text-wood-dark">
          🏪 3D Corner Store (2D Fallback Mode Active)
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex-1 min-h-[190px] sm:min-h-[220px] overflow-hidden rounded-3xl border-4 border-wood-dark bg-stone-900 shadow-wood flex flex-col">
      {/* 3D WebGL Canvas - stretches to fill available flex height without empty gaps */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Animated 3D Speech Bubble Overlay with speaking equalizer and action buttons */}
      <AnimatePresence mode="wait">
        {activeDialogue && (
          <SpeechBubble3D
            dialogue={activeDialogue}
            lang={lang}
            customerId={scenario.customer.id}
            isPlaying={speakingState.isPlaying}
            onDismiss={() => {
              dialogueAudio.skip();
              setActiveDialogue(null);
            }}
            onReplay={() => {
              dialogueAudio.unlockAudio();
              dialogueAudio.replay();
            }}
          />
        )}
      </AnimatePresence>

      {/* Visual Indicator of Scene Status */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-stone-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
        <span className="text-sm">
          {activeDialogue?.speaker === "shopkeeper" ? "👨🏽‍🦳" : scenario.customer.emoji}
        </span>
        <span className="text-[11px] font-extrabold text-amber-100">
          {activeDialogue?.speaker === "shopkeeper"
            ? "Shopkeeper"
            : `Customer: ${scenario.customer.name[lang] || scenario.customer.name.en}`}
        </span>
        {speakingState.isPlaying && (
          <span className="ml-1 flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
              Speaking
            </span>
          </span>
        )}
      </div>

      {/* Camera Guidance Pill */}
      <div className="pointer-events-none absolute top-2 right-2 z-10 hidden sm:flex items-center gap-1 rounded-full bg-stone-950/60 px-2.5 py-1 text-[11px] font-extrabold text-amber-200/90 backdrop-blur-xs">
        <span>✨</span>
        <span>Drag to look around</span>
      </div>
    </div>
  );
}
