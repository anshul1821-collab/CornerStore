import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Scenario } from "@/game/types";
import { useSettings } from "./settings";
import { useVoice } from "@/lib/voice/useVoice";
import { getCustomerOrderDialogue } from "./3d/dialogue";

export type Mood = "speaking" | "thinking" | "happy";

export function CustomerBubble({ scenario, mood }: { scenario: Scenario; mood: Mood }) {
  const { lang, tr } = useSettings();
  const { isSpeaking, activeCharacter, speak: speakVoice } = useVoice();
  const speakingCustomer = isSpeaking && activeCharacter === "customer";

  const names = scenario.items.map((i) => (i.qty > 1 ? `${i.qty} ${i.name[lang]}` : i.name[lang]));
  const list =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} ${tr("and")} ${names[names.length - 1]}`
      : (names[0] ?? "");
  const exact = scenario.paid === scenario.payable;
  const text = `${scenario.customer.greeting[lang]} ${tr(exact ? "wantsExact" : "wants", { items: list, total: scenario.payable, paid: scenario.paid })}`;

  const speak = () => {
    const orderDialogue = getCustomerOrderDialogue(scenario, lang);
    speakVoice({
      text: orderDialogue.text,
      character: "customer",
      customerId: scenario.customer.id,
      dialogueType: "dynamic",
    });
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <motion.div
        key={scenario.id + mood}
        initial={{ y: 12, opacity: 0 }}
        animate={mood === "happy" ? { y: [0, -8, 0], opacity: 1 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex shrink-0 flex-col items-center"
      >
        <div
          className={`grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-sky/40 border-3 text-3xl sm:text-4xl shadow-soft transition-colors ${
            speakingCustomer ? "border-leaf ring-3 ring-leaf/40" : "border-paper"
          }`}
          aria-hidden
        >
          {scenario.customer.emoji}
        </div>
        <span className="absolute -right-1 -top-1 text-xl" aria-hidden>
          {mood === "happy" ? "👍" : mood === "thinking" ? "🤔" : ""}
        </span>
        <div className="mt-0.5 flex items-center gap-1 rounded-full bg-wood px-2 py-0.2 text-[11px] sm:text-xs font-extrabold text-primary-foreground max-w-[95px] truncate text-center">
          <span className="truncate">{scenario.customer.name[lang]}</span>
          {speakingCustomer && (
            <span className="flex items-center gap-0.5" aria-label="Speaking">
              <span className="h-2 w-0.5 rounded-full bg-sun animate-bounce [animation-delay:-0.3s]" />
              <span className="h-3 w-0.5 rounded-full bg-sun animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-0.5 rounded-full bg-sun animate-bounce" />
            </span>
          )}
        </div>
      </motion.div>
      <motion.div
        key={scenario.id + lang}
        initial={{ scale: 0.9, opacity: 0, x: -6 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative flex-1 rounded-2xl rounded-tl-sm border-3 border-wood-light bg-paper p-2 sm:p-2.5 shadow-soft"
      >
        <span
          className="absolute -left-2.5 top-4 h-4 w-4 rotate-45 border-b-3 border-l-3 border-wood-light bg-paper"
          aria-hidden
        />
        <p className="text-xs sm:text-sm font-bold leading-snug text-wood-dark">{text}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {scenario.items.map((i) => (
            <span
              key={i.productId}
              className="rounded-full bg-cream px-1.5 py-0.2 text-sm sm:text-base"
              aria-hidden
            >
              {i.emoji}
              {i.qty > 1 && <span className="ml-0.5 text-xs font-extrabold">×{i.qty}</span>}
            </span>
          ))}
          <button
            onClick={speak}
            aria-label={`${tr("speak")} (${scenario.customer.name[lang]})`}
            title="Replay customer voice"
            className={`ml-auto grid h-7 w-7 place-items-center rounded-full transition-colors cursor-pointer ${
              speakingCustomer
                ? "bg-leaf text-white ring-2 ring-sun"
                : "bg-sky/50 text-wood-dark hover:bg-sky"
            }`}
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
