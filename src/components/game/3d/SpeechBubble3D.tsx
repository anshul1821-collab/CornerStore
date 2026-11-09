import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import type { DialogueContent } from "./dialogue";
import type { Lang } from "@/game/types";
import { dialogueAudio, type SpeakingState } from "@/lib/dialogueAudio";

interface Props {
  dialogue: DialogueContent;
  lang: Lang;
  customerId?: string;
  isPlaying?: boolean;
  onDismiss?: () => void;
  onReplay?: () => void;
}

export function SpeechBubble3D({ dialogue, isPlaying = false, onDismiss, onReplay }: Props) {
  const isShopkeeper = dialogue.speaker === "shopkeeper";
  const [speakingState, setSpeakingState] = useState<SpeakingState>(
    dialogueAudio.getSpeakingState(),
  );

  useEffect(() => {
    return dialogueAudio.subscribe((state) => {
      setSpeakingState(state);
    });
  }, []);

  const hasPending = dialogueAudio.hasPendingAudio() || speakingState.error === "tap-to-play";

  return (
    <motion.div
      key={dialogue.speaker + dialogue.text}
      initial={{ scale: 0.82, opacity: 0, y: 10 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: [0, -3.5, 0],
      }}
      exit={{ scale: 0.85, opacity: 0, y: 6 }}
      transition={{
        scale: { type: "spring", stiffness: 440, damping: 28 },
        opacity: { duration: 0.22 },
        y: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
      }}
      style={{
        top: isShopkeeper ? "clamp(46px, 18%, 80px)" : "clamp(48px, 22%, 92px)",
        ...(isShopkeeper
          ? { right: "clamp(12px, 12%, 180px)" }
          : { left: "clamp(12px, 14%, 180px)" }),
      }}
      className="pointer-events-auto absolute z-20 w-max max-w-[220px] sm:max-w-[275px] select-none"
    >
      {/* Speech Bubble Container */}
      <div
        onClick={() => {
          if (hasPending && onReplay) onReplay();
        }}
        className={`relative rounded-2xl border-2 border-[#8b5a2b]/30 bg-[#fffdf8]/98 px-3.5 py-2.5 sm:px-4 sm:py-3 text-[#3d200e] shadow-[0_10px_28px_rgba(45,20,5,0.2)] backdrop-blur-md transition-transform hover:scale-[1.015] ${
          hasPending ? "cursor-pointer ring-2 ring-amber-400" : ""
        }`}
      >
        {/* Header: Speaker Name Pill + Speaking Indicator + Action Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-[#ebd7be]/60 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 rounded-full bg-[#f4ebd9] px-2.5 py-0.5 text-[11px] font-extrabold text-[#5c3317] border border-[#dfceb4]">
            <span className="text-xs">{dialogue.avatarEmoji}</span>
            <span className="truncate max-w-[95px] sm:max-w-[125px]">{dialogue.speakerName}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Animated Speaking Waveform Indicator */}
            {isPlaying && (
              <div
                className="flex items-center gap-0.5 px-1 py-0.5 bg-emerald-50 rounded-md border border-emerald-200"
                title="Speaking..."
              >
                <motion.span
                  animate={{ height: ["4px", "11px", "4px"] }}
                  transition={{ repeat: Infinity, duration: 0.55, ease: "easeInOut" }}
                  className="w-0.5 rounded-full bg-emerald-600 inline-block h-2"
                />
                <motion.span
                  animate={{ height: ["8px", "14px", "6px"] }}
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

            {/* Replay or Play Voice Button */}
            {onReplay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReplay();
                }}
                type="button"
                title={hasPending ? "Tap to play character voice" : "Replay dialogue voice"}
                aria-label={hasPending ? "Play voice" : "Replay dialogue voice"}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black transition-all cursor-pointer ${
                  hasPending
                    ? "bg-amber-400 hover:bg-amber-300 text-amber-950 animate-bounce ring-2 ring-amber-300 shadow-xs"
                    : "text-[#8b5a2b] hover:text-[#5c3317] hover:bg-amber-100/70 active:scale-95"
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                {hasPending && <span>Play Voice</span>}
              </button>
            )}

            {/* Skip / Dismiss Button */}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                type="button"
                title="Skip dialogue"
                aria-label="Skip dialogue"
                className="grid h-6 w-6 place-items-center rounded-full text-[#8b5a2b]/70 hover:text-[#5c3317] hover:bg-stone-200/50 active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dialogue Text (visual tags stripped for clean display) */}
        <p className="font-display text-xs sm:text-[13px] font-extrabold leading-snug tracking-tight text-[#3d200e]">
          {dialogue.text.replace(/\[[a-zA-Z\s_-]+\]/g, "").trim()}
        </p>

        {/* Directional Speech Pointer */}
        {isShopkeeper ? (
          // Shopkeeper bubble sits on upper-right, pointer angles down-left toward shopkeeper
          <div
            className="absolute -bottom-2 right-6 h-3.5 w-3.5 rotate-45 border-b-2 border-r-2 border-[#8b5a2b]/30 bg-[#fffdf8]"
            aria-hidden
          />
        ) : (
          // Customer bubble sits on left, pointer angles down toward customer counter
          <div
            className="absolute -bottom-2 left-6 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-[#8b5a2b]/30 bg-[#fffdf8]"
            aria-hidden
          />
        )}
      </div>
    </motion.div>
  );
}
