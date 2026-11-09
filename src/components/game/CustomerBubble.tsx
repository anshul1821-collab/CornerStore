import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FastForward, Volume2 } from "lucide-react";
import type { Scenario } from "@/game/types";
import { useSettings } from "./settings";
import { formatCustomerOrderText, type DialogueContent } from "./3d/dialogue";
import { dialogueAudio, type SpeakingState } from "@/lib/dialogueAudio";
import { getCustomerVoiceType } from "@/lib/voice/characters";

export type Mood = "speaking" | "thinking" | "happy";

interface Props {
  scenario: Scenario;
  mood: Mood;
  activeDialogue?: DialogueContent | null;
}

export function CustomerBubble({ scenario, mood, activeDialogue }: Props) {
  const { lang } = useSettings();
  const [speakingState, setSpeakingState] = useState<SpeakingState>(
    dialogueAudio.getSpeakingState(),
  );

  useEffect(() => {
    return dialogueAudio.subscribe((state) => {
      setSpeakingState(state);
    });
  }, []);

  // Display active dialogue if currently speaking/transient; otherwise display customer order
  const isShopkeeper = activeDialogue?.speaker === "shopkeeper";
  const speakerName = activeDialogue
    ? activeDialogue.speakerName
    : scenario.customer.name[lang] || scenario.customer.name.en;
  const avatarEmoji = activeDialogue ? activeDialogue.avatarEmoji : scenario.customer.emoji;
  const displayText = activeDialogue
    ? activeDialogue.text
    : formatCustomerOrderText(scenario, lang);

  const isSpeaking = speakingState.isPlaying;

  const handleReplayVoice = () => {
    dialogueAudio.unlockAudio();
    if (activeDialogue) {
      dialogueAudio.replay();
    } else {
      // Replay customer order
      dialogueAudio.playDialogue({
        text: displayText,
        speaker: "customer",
        characterVoice: getCustomerVoiceType(scenario.customer.id),
        customerId: scenario.customer.id,
      });
    }
  };

  const handleSkipVoice = () => {
    dialogueAudio.skip();
  };

  const hasPending = dialogueAudio.hasPendingAudio() || speakingState.error === "tap-to-play";

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      <motion.div
        key={speakerName + avatarEmoji + mood}
        initial={{ y: 8, opacity: 0 }}
        animate={mood === "happy" ? { y: [0, -6, 0], opacity: 1 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex shrink-0 flex-col items-center"
      >
        <div
          className={`grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full border-3 border-paper text-2xl sm:text-3xl shadow-soft ${
            isShopkeeper ? "bg-amber-200/80" : "bg-sky/40"
          }`}
          aria-hidden
        >
          {avatarEmoji}
        </div>
        <span className="absolute -right-1 -top-1 text-lg" aria-hidden>
          {mood === "happy" ? "👍" : mood === "thinking" ? "🤔" : ""}
        </span>
        <div
          className={`mt-0.5 flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] sm:text-xs font-extrabold max-w-[95px] truncate text-center shadow-xs ${
            isShopkeeper ? "bg-amber-800 text-amber-50" : "bg-wood text-primary-foreground"
          }`}
        >
          <span className="truncate">{speakerName}</span>
        </div>
      </motion.div>

      <motion.div
        key={displayText}
        initial={{ scale: 0.95, opacity: 0, x: -4 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative flex-1 rounded-2xl rounded-tl-sm border-3 border-wood-light bg-paper p-2.5 sm:p-3 shadow-soft"
      >
        <span
          className="absolute -left-2.5 top-4 h-4 w-4 rotate-45 border-b-3 border-l-3 border-wood-light bg-paper"
          aria-hidden
        />

        <div className="flex items-start justify-between gap-2">
          {/* Exact dialogue text: The Single Source of Truth */}
          <p className="text-xs sm:text-sm font-bold leading-snug text-wood-dark flex-1">
            {displayText}
          </p>

          {/* Action & Speaking Indicator */}
          <div className="flex items-center gap-1 shrink-0">
            {isSpeaking && (
              <div
                className="flex items-center gap-0.5 px-1 py-0.5 bg-emerald-100/70 rounded-md border border-emerald-300"
                title="Speaking..."
              >
                <motion.span
                  animate={{ height: ["4px", "11px", "4px"] }}
                  transition={{ repeat: Infinity, duration: 0.55, ease: "easeInOut" }}
                  className="w-0.5 rounded-full bg-emerald-600 inline-block h-2"
                />
                <motion.span
                  animate={{ height: ["7px", "13px", "5px"] }}
                  transition={{ repeat: Infinity, duration: 0.45, delay: 0.1, ease: "easeInOut" }}
                  className="w-0.5 rounded-full bg-emerald-600 inline-block h-3"
                />
                <motion.span
                  animate={{ height: ["4px", "10px", "5px"] }}
                  transition={{ repeat: Infinity, duration: 0.65, delay: 0.2, ease: "easeInOut" }}
                  className="w-0.5 rounded-full bg-emerald-600 inline-block h-2"
                />
              </div>
            )}

            {/* Skip button while speaking */}
            {isSpeaking && (
              <button
                onClick={handleSkipVoice}
                type="button"
                title="Skip voice"
                aria-label="Skip voice"
                className="grid h-7 w-7 place-items-center rounded-xl bg-wood/10 text-wood-dark hover:bg-wood/20 active:scale-95 transition-all cursor-pointer"
              >
                <FastForward className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Replay or Play voice button */}
            <button
              onClick={handleReplayVoice}
              type="button"
              title={hasPending ? "Tap to play character voice" : "Hear dialogue voice"}
              aria-label={hasPending ? "Play voice" : "Hear dialogue"}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                hasPending
                  ? "bg-amber-400 text-amber-950 animate-bounce ring-2 ring-amber-300 shadow-md"
                  : "bg-wood/10 text-wood-dark hover:bg-wood/20 active:scale-95"
              }`}
            >
              <Volume2 className="h-4 w-4" />
              <span>{hasPending ? "Tap to Hear Voice" : "Hear Voice"}</span>
            </button>
          </div>
        </div>

        {/* Display Item Emojis for Customer Order */}
        {!isShopkeeper && scenario.items.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {scenario.items.map((i) => (
              <span
                key={i.productId}
                className="rounded-full bg-cream px-1.5 py-0.2 text-sm sm:text-base border border-wood-light/30 shadow-xs"
                aria-hidden
              >
                {i.emoji}
                {i.qty > 1 && <span className="ml-0.5 text-xs font-extrabold">×{i.qty}</span>}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
