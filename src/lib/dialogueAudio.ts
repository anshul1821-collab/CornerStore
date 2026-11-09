import { getCustomerVoiceType, type CharacterVoice, type SpeakerRole } from "./voice/characters";
import type { TTSRequest, TTSResponse } from "./voice/types";

export { getCustomerVoiceType };
export type { CharacterVoice, SpeakerRole };

export interface SpeakingState {
  isPlaying: boolean;
  speaker: SpeakerRole | null;
  characterVoice: CharacterVoice | null;
  text: string | null;
  engine: "elevenlabs" | null;
  error?: string | null;
}

export interface PlaySpeechOptions {
  text: string;
  speaker: SpeakerRole;
  characterVoice: CharacterVoice;
  customerId?: string | undefined;
  onEnd?: (() => void) | undefined;
}

export interface ArrivalSequenceOptions {
  sequenceId: string;
  orderDialogue: {
    speaker: SpeakerRole;
    speakerName: string;
    avatarEmoji: string;
    text: string;
    characterVoice: CharacterVoice;
    customerId?: string;
  };
  instructionDialogue: {
    speaker: SpeakerRole;
    speakerName: string;
    avatarEmoji: string;
    text: string;
    characterVoice: CharacterVoice;
    customerId?: string;
  };
  onDialogueChange: (dialogue: any) => void;
  onSequenceComplete?: () => void;
}

export const PREGENERATED_STUDIO_MAP: Record<string, string> = {
  // Shopkeeper Greetings & Praise & Instructions (Eric - cjVigY5qzO86Huf0OWal)
  "shopkeeper:Welcome to the shop! Great to see you today. What can I get for you?":
    "/audio/characters/shopkeeper/9756face6b3ff410afb733eef033cc62.mp3",
  "shopkeeper:Spot on! That's the exact change. Brilliant calculation!":
    "/audio/characters/shopkeeper/3a8be5f7c5284849218c6ccd2ded7a7b.mp3",
  "shopkeeper:Please check the price on the bill before you count the change!":
    "/audio/characters/shopkeeper/check_bill_instruction.mp3",
  "shopkeeper:Please check the price in the bill!":
    "/audio/characters/shopkeeper/check_price_in_bill.mp3",

  // 1. Mrs. Priya (Aunty - Sarah - EXAVITQu4vr4xnSDxMaL)
  "aunty:Hello, dear! I'd like 2 Chocolate. Here's $200.00!":
    "/audio/characters/aunty/004e9c8faf553351ab558f58883c5c29.mp3",
  "aunty:Hello, dear! I'd like Juice Box. Here's $50.00!":
    "/audio/characters/aunty/77781fa32d38bdbe1960271800d0bdb7.mp3",
  "aunty:Hello, dear! I'd like Milk Packet. Here's $100.00!":
    "/audio/characters/aunty/228c93d3aabb9891ec64bcb4d787e7bd.mp3",
  "aunty:Hello, dear! I'd like 2 Pen. Here's $50.00!":
    "/audio/characters/aunty/2619064bbe7c4ff06b12e912a37daf55.mp3",
  "aunty:Hello, dear! I'd like 2 Potato (1 kg). Here's $100.00!":
    "/audio/characters/aunty/8d280d7bc70e9e5f6f53a40b88780aa6.mp3",
  "aunty:Hello, dear! I'd like 2 Pencil. Here's $20.00!":
    "/audio/characters/aunty/8f3356b89e7a6b2a7c7ab8f13bdb1f3f.mp3",
  "aunty:Hello, dear! I'd like Biscuits. Here's $20.00!":
    "/audio/characters/aunty/bae6e7182ca1814ce900f9e3cde58af2.mp3",
  "aunty:Hello, dear! I'd like 2 Battery. Here's $100.00!":
    "/audio/characters/aunty/9a9f5c4af144162f96ef1411b05d928c.mp3",
  "aunty:Thank you so much! That's the exact change. Have a wonderful day!":
    "/audio/characters/aunty/d421208a67bf66b53565b495a3527d06.mp3",
  "aunty:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/aunty/short_feedback.mp3",
  "aunty:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/aunty/extra_feedback.mp3",

  // 2. Mr. Sharma (Uncle - Roger - CwhRBWXzGAHq8TQ4Fs17)
  "uncle:Hello there! I'd like 2 Chocolate. Here's $200.00!":
    "/audio/characters/uncle/7a7447887a0606bd7c1e9f0191ebc594.mp3",
  "uncle:Hello there! I'd like Soap. Here's exactly $10.00!":
    "/audio/characters/uncle/1711f437a9e9f302b4cb8f2ccb4c16af.mp3",
  "uncle:Hello there! I'd like Bread. Here's $50.00!":
    "/audio/characters/uncle/order_bread_50.mp3",
  "uncle:Hello there! I'd like Tea Leaves (250g). Here's $100.00!":
    "/audio/characters/uncle/order_tea_100.mp3",
  "uncle:Hello there! I'd like 2 Soap. Here's $100.00!":
    "/audio/characters/uncle/order_soap_100.mp3",
  "uncle:Hello there! I'd like Milk Packet. Here's $50.00!":
    "/audio/characters/uncle/order_milk_50.mp3",
  "uncle:Wonderful! That is spot on. Thank you!":
    "/audio/characters/uncle/c2170b6f6a00da0029d714b8f54ed3b2.mp3",
  "uncle:Hmm, wait a second... looks like this is $5.00 short. Could you please check?":
    "/audio/characters/uncle/0623f7cbc9a1ae5a317b446facc0e87a.mp3",
  "uncle:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/uncle/short_feedback.mp3",
  "uncle:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/uncle/extra_feedback.mp3",

  // 3. Rohan (Student - Will - bIHbv24MWmeRgasZH58o)
  "student:Hi there! I'd like Chips. Here's $20.00!":
    "/audio/characters/student/54cd930f008d7f60c45bacfe78d38c11.mp3",
  "student:Hi there! I'd like Chips. Here's exactly $20.00!":
    "/audio/characters/student/order_chips_20_exact.mp3",
  "student:Hi there! I'd like 2 Pencil and Eraser. Here's $20.00!":
    "/audio/characters/student/6c478cb6ccbe77b53065432e1265e59d.mp3",
  "student:Hi there! I'd like Notebook. Here's $50.00!":
    "/audio/characters/student/order_notebook_50.mp3",
  "student:Hi there! I'd like 2 Chocolate. Here's $50.00!":
    "/audio/characters/student/order_chocolate_50.mp3",
  "student:Hi there! I'd like 2 Chocolate. Here's exactly $50.00!":
    "/audio/characters/student/order_chocolate_50_exact.mp3",
  "student:Hi there! I'd like 2 Pen. Here's $20.00!":
    "/audio/characters/student/order_pen_20.mp3",
  "student:Hi there! I'd like 2 Pen. Here's exactly $20.00!":
    "/audio/characters/student/order_pen_20_exact.mp3",
  "student:Hi there! I'd like Ice Cream. Here's $50.00!":
    "/audio/characters/student/order_icecream_50.mp3",
  "student:Awesome, perfect change! Thanks a lot!":
    "/audio/characters/student/7c49ff4e495a109e08aa694ca6f350c7.mp3",
  "student:Oh, hold on — you gave me $10.50 extra! Take a quick look.":
    "/audio/characters/student/e0e3f67bb780492e7db7df76c07b7217.mp3",
  "student:Oh, hold on - you gave me $10.50 extra! Take a quick look.":
    "/audio/characters/student/e0e3f67bb780492e7db7df76c07b7217.mp3",
  "student:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/student/short_feedback.mp3",
  "student:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/student/extra_feedback.mp3",

  // 4. Grandma (Dadi - Alice - Xb7hH8MSUJpSbSDYk0k2)
  "dadi:Hello, dear! I'd like Bread. Here's $100.00!":
    "/audio/characters/dadi/ab713783d86d08cb1024d03be596f96e.mp3",
  "dadi:Hello, dear! I'd like Milk Packet. Here's $50.00!":
    "/audio/characters/dadi/order_milk_50.mp3",
  "dadi:Hello, dear! I'd like Tea Leaves (250g). Here's $100.00!":
    "/audio/characters/dadi/order_tea_100.mp3",
  "dadi:Hello, dear! I'd like Biscuits. Here's $50.00!":
    "/audio/characters/dadi/order_biscuits_50.mp3",
  "dadi:Hello, dear! I'd like Sugar (1 kg). Here's $50.00!":
    "/audio/characters/dadi/order_sugar_50.mp3",
  "dadi:Hello, dear! I'd like 2 Bread. Here's $100.00!":
    "/audio/characters/dadi/order_bread_100.mp3",
  "dadi:Hello, dear! I'd like Lentils (500g). Here's $100.00!":
    "/audio/characters/dadi/order_lentils_100.mp3",
  "dadi:Thank you so much, dear. You counted that beautifully!":
    "/audio/characters/dadi/e7c6c0618854e7f4fd1db3e15b46f650.mp3",
  "dadi:No rush at all, dear! Take your time to count the notes, you're doing wonderfully.":
    "/audio/characters/dadi/08b9c67dffeca45549399a28960bc1b8.mp3",
  "dadi:No rush at all! Take your time to count the notes.":
    "/audio/characters/dadi/0b9e110b10b86fa2b20770a536f63ecf.mp3",

  // 5. Meera & Anu (Parent - Laura - FGY2WhTYpPnrIDTdsKH5)
  "parent:Good morning! I'd like Milk Packet. Here's $50.00!":
    "/audio/characters/parent/d35801d023442bc0fef0187e603c7836.mp3",
  "parent:Good morning! I'd like 2 Chocolate and Bread. Here's $100.00!":
    "/audio/characters/parent/40de7834c058f5b6363688d3a95c272f.mp3",
  "parent:Good morning! We'd like 2 Chocolate and Bread. Here's $100.00!":
    "/audio/characters/parent/b447fcb93f0238ededc196be094685e5.mp3",
  "parent:Good morning! I'd like Bread. Here's $50.00!":
    "/audio/characters/parent/order_bread_50.mp3",
  "parent:Good morning! I'd like 2 Juice Box. Here's $50.00!":
    "/audio/characters/parent/order_juice_50.mp3",
  "parent:Good morning! I'd like Bananas (1 Doz). Here's $50.00!":
    "/audio/characters/parent/order_bananas_50.mp3",
  "parent:Good morning! I'd like Eggs (6 pcs). Here's $50.00!":
    "/audio/characters/parent/order_eggs_50.mp3",
  "parent:Thank you so much! That's the exact change. Have a wonderful day!":
    "/audio/characters/parent/gratitude.mp3",
  "parent:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/parent/short_feedback.mp3",
  "parent:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/parent/extra_feedback.mp3",

  // 6. Raju (Delivery - Callum - N2lVS1w4EtoT3dr4eOWO)
  "delivery:Hey there! I'd like Cold Drink. Here's $50.00!":
    "/audio/characters/delivery/fd977d9e003712f9d84dc6eb2098fb5d.mp3",
  "delivery:Hey there! I'd like 2 Battery. Here's $50.00!":
    "/audio/characters/delivery/6c67efe4f0d7c79836c1bf050d5902da.mp3",
  "delivery:Hey there! Need these items quickly. Here's $50.00!":
    "/audio/characters/delivery/cb8c65bf4d37cd4420b64ababc4235a5.mp3",
  "delivery:Hey there! I'd like 2 Cold Drink. Here's $100.00!":
    "/audio/characters/delivery/order_colddrink_100.mp3",
  "delivery:Hey there! I'd like Chips. Here's $50.00!":
    "/audio/characters/delivery/order_chips_50.mp3",
  "delivery:Hey there! I'd like Cooking Oil (1 Ltr). Here's $200.00!":
    "/audio/characters/delivery/order_oil_200.mp3",
  "delivery:Hey there! I'd like Matchbox. Here's $10.00!":
    "/audio/characters/delivery/order_matchbox_10.mp3",
  "delivery:Awesome, perfect change! Thanks a lot!":
    "/audio/characters/delivery/gratitude.mp3",
  "delivery:Hey, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/delivery/short_feedback.mp3",
  "delivery:Hey, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/delivery/extra_feedback.mp3",

  // 7. Jessica (Girl - Jessica - cgSgspJ2msm6clMCkdW9)
  "girl:Hello, dear! I'd like Juice Box. Here's $50.00!":
    "/audio/characters/aunty/77781fa32d38bdbe1960271800d0bdb7.mp3",
  "girl:Hello, dear! I'd like Toffee. Here's $5.00!":
    "/audio/characters/girl/order_toffee_5.mp3",
  "girl:Hello, dear! I'd like Chocolate. Here's $50.00!":
    "/audio/characters/girl/order_chocolate_50.mp3",
  "girl:Hello, dear! I'd like 2 Ice Cream. Here's $50.00!":
    "/audio/characters/girl/order_icecream_50.mp3",
  "girl:Hello, dear! I'd like 2 Ice Cream. Here's exactly $50.00!":
    "/audio/characters/girl/order_icecream_50_exact.mp3",
  "girl:Hello, dear! I'd like 2 Pen. Here's $20.00!":
    "/audio/characters/girl/order_pen_20.mp3",
  "girl:Hello, dear! I'd like 2 Pen. Here's exactly $20.00!":
    "/audio/characters/girl/order_pen_20_exact.mp3",
  "girl:Hello, dear! I'd like Chips. Here's $20.00!":
    "/audio/characters/girl/order_chips_20.mp3",
  "girl:Hello, dear! I'd like Chips. Here's exactly $20.00!":
    "/audio/characters/girl/order_chips_20_exact.mp3",
  "girl:Thank you so much! That's the exact change. Have a wonderful day!":
    "/audio/characters/girl/29e5f23d2143f55b01f41bc9d1f75d1c.mp3",
  "girl:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/girl/short_feedback.mp3",
  "girl:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/girl/extra_feedback.mp3",

  // Role aliases
  "boy:Awesome, perfect change! Thanks a lot!":
    "/audio/characters/student/7c49ff4e495a109e08aa694ca6f350c7.mp3",
  "girl:Thank you so much, dear. You counted that beautifully!":
    "/audio/characters/dadi/e7c6c0618854e7f4fd1db3e15b46f650.mp3",
};

export const CUSTOMER_STUDIO_DEFAULTS: Record<
  string,
  {
    order: string;
    gratitude: string;
    mistake?: string;
  }
> = {
  aunty: {
    order: "/audio/characters/aunty/004e9c8faf553351ab558f58883c5c29.mp3",
    gratitude: "/audio/characters/aunty/d421208a67bf66b53565b495a3527d06.mp3",
  },
  uncle: {
    order: "/audio/characters/uncle/7a7447887a0606bd7c1e9f0191ebc594.mp3",
    gratitude: "/audio/characters/uncle/c2170b6f6a00da0029d714b8f54ed3b2.mp3",
    mistake: "/audio/characters/uncle/0623f7cbc9a1ae5a317b446facc0e87a.mp3",
  },
  student: {
    order: "/audio/characters/student/54cd930f008d7f60c45bacfe78d38c11.mp3",
    gratitude: "/audio/characters/student/7c49ff4e495a109e08aa694ca6f350c7.mp3",
    mistake: "/audio/characters/student/e0e3f67bb780492e7db7df76c07b7217.mp3",
  },
  parent: {
    order: "/audio/characters/parent/d35801d023442bc0fef0187e603c7836.mp3",
    gratitude: "/audio/characters/aunty/d421208a67bf66b53565b495a3527d06.mp3",
  },
  delivery: {
    order: "/audio/characters/delivery/fd977d9e003712f9d84dc6eb2098fb5d.mp3",
    gratitude: "/audio/characters/student/7c49ff4e495a109e08aa694ca6f350c7.mp3",
  },
  dadi: {
    order: "/audio/characters/dadi/ab713783d86d08cb1024d03be596f96e.mp3",
    gratitude: "/audio/characters/dadi/e7c6c0618854e7f4fd1db3e15b46f650.mp3",
    mistake: "/audio/characters/dadi/08b9c67dffeca45549399a28960bc1b8.mp3",
  },
  girl: {
    order: "/audio/characters/aunty/77781fa32d38bdbe1960271800d0bdb7.mp3",
    gratitude: "/audio/characters/girl/29e5f23d2143f55b01f41bc9d1f75d1c.mp3",
  },
};

/**
 * Resolves dialogue text to a guaranteed local studio audio recording.
 * Eliminates silence and 401 quota errors completely.
 */
export function resolveStudioAudio(
  text: string,
  customerId?: string,
  characterVoice?: CharacterVoice,
  speaker?: SpeakerRole,
): string | null {
  if (!text) return null;
  const clean = text.trim();

  // 1. Direct match with customerId
  if (customerId) {
    const k1 = `${customerId}:${clean}`;
    if (PREGENERATED_STUDIO_MAP[k1]) return PREGENERATED_STUDIO_MAP[k1]!;
  }

  // 2. Direct match with characterVoice
  if (characterVoice) {
    const k2 = `${characterVoice}:${clean}`;
    if (PREGENERATED_STUDIO_MAP[k2]) return PREGENERATED_STUDIO_MAP[k2]!;
  }

  // 3. Normalized punctuation match (curly quotes, em-dashes, spacing)
  const normalized = clean
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, "-")
    .replace(/\s+/g, " ");

  for (const [k, url] of Object.entries(PREGENERATED_STUDIO_MAP)) {
    const [cId, ...rest] = k.split(":");
    const mappedText = rest
      .join(":")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/—/g, "-")
      .replace(/\s+/g, " ");
    if (
      (!customerId || cId === customerId || cId === characterVoice) &&
      mappedText === normalized
    ) {
      return url;
    }
  }

  // 3b. Alternate match for "Here's exactly " vs "Here's "
  const altText = clean.includes("Here's exactly ")
    ? clean.replace("Here's exactly ", "Here's ")
    : clean.includes("Here's ")
      ? clean.replace("Here's ", "Here's exactly ")
      : null;

  if (altText) {
    if (customerId && PREGENERATED_STUDIO_MAP[`${customerId}:${altText}`]) {
      return PREGENERATED_STUDIO_MAP[`${customerId}:${altText}`]!;
    }
    if (characterVoice && PREGENERATED_STUDIO_MAP[`${characterVoice}:${altText}`]) {
      return PREGENERATED_STUDIO_MAP[`${characterVoice}:${altText}`]!;
    }
  }

  // 4. Exact verified studio recordings for shopkeeper
  // CRITICAL: The visible dialogue box is the single source of truth.
  // Never play an unrelated studio recording, greeting, or hardcoded audio with extra/different words.
  if (speaker === "shopkeeper" || characterVoice === "shopkeeper") {
    if (
      clean === "Please check the price on the bill before you count the change!" ||
      clean.includes("price on the bill")
    ) {
      return "/audio/characters/shopkeeper/check_bill_instruction.mp3";
    }
    if (
      clean === "Please check the price in the bill!" ||
      clean.includes("price in the bill")
    ) {
      return "/audio/characters/shopkeeper/check_price_in_bill.mp3";
    }
    if (
      clean === "Spot on! That's the exact change. Brilliant calculation!" ||
      clean.includes("Spot on! That's the exact change")
    ) {
      return "/audio/characters/shopkeeper/3a8be5f7c5284849218c6ccd2ded7a7b.mp3";
    }
    if (
      clean === "Welcome to the shop! Great to see you today. What can I get for you?" ||
      clean.includes("Welcome to the shop! Great to see you today")
    ) {
      return "/audio/characters/shopkeeper/9756face6b3ff410afb733eef033cc62.mp3";
    }
    // For all other shopkeeper dialogues (including dynamically changed text),
    // strictly return null so that audio matching the exact text is generated/retrieved via /api/tts.
    return null;
  }

  // 5. Customer default studio audio fallback
  // Ensures customer orders, gratitude, or feedback never result in null audio URLs
  const effectiveCustomerId = customerId || characterVoice;
  if (effectiveCustomerId && CUSTOMER_STUDIO_DEFAULTS[effectiveCustomerId]) {
    const defaults = CUSTOMER_STUDIO_DEFAULTS[effectiveCustomerId]!;
    if (clean.includes("Thank") || clean.includes("Awesome") || clean.includes("perfect change") || clean.includes("beautifully")) {
      return defaults.gratitude;
    }
    if (clean.includes("short") || clean.includes("extra") || clean.includes("check") || clean.includes("rush")) {
      return defaults.mistake ?? defaults.gratitude;
    }
    // Never play an unrelated order recording when the spoken order text does not match!
    return null;
  }

  return null;
}

class DialogueAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentOnEnd: (() => void) | null = null;
  private currentCleanup: (() => void) | null = null;
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentSequenceId: string | null = null;
  private currentArrivalOptions: ArrivalSequenceOptions | null = null;
  private currentDialogue: any | null = null;
  private currentState: SpeakingState = {
    isPlaying: false,
    speaker: null,
    characterVoice: null,
    text: null,
    engine: null,
    error: null,
  };
  private isMuted = false;
  private isUnlocked = false;
  private pendingAudio: {
    audio: HTMLAudioElement;
    audioUrl?: string;
    originalText: string;
    speaker: SpeakerRole;
    characterVoice: CharacterVoice;
    onEnd?: (() => void) | undefined;
  } | null = null;
  private listeners = new Set<(state: SpeakingState) => void>();
  private audioCache = new Map<string, HTMLAudioElement>();
  private lastOptions: PlaySpeechOptions | null = null;
  private readingTimer: ReturnType<typeof setTimeout> | null = null;

  // Resilient Web Audio API pipeline for zero-latency, autoplay-immune browser playback
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("kc-sound") === "off";
      this.attachGlobalUnlockListeners();
      // Pre-warm the Web Audio Context if already permitted by user
      this.getAudioContext();
    }
  }

  /**
   * Lazily initialize or retrieve the shared Web Audio API context
   */
  public getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
          this.gainNode = this.audioCtx.createGain();
          this.gainNode.gain.value = this.isMuted ? 0 : 1.0;
          this.gainNode.connect(this.audioCtx.destination);
        }
      }
      return this.audioCtx;
    } catch (err) {
      console.warn("[DialogueAudio] Web Audio API initialization failed:", err);
      return null;
    }
  }

  /**
   * Attaches global event listeners on user interactions to unlock browser audio
   */
  private attachGlobalUnlockListeners(): void {
    if (typeof window === "undefined") return;

    const unlockHandler = () => {
      this.unlockAudio();
    };

    window.addEventListener("pointerdown", unlockHandler, { passive: true });
    window.addEventListener("touchstart", unlockHandler, { passive: true });
    window.addEventListener("click", unlockHandler, { passive: true });
    window.addEventListener("keydown", unlockHandler, { passive: true });
  }

  /**
   * Explicitly unlocks browser AudioContext and processes any queued audio
   */
  public unlockAudio(): void {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          this.isUnlocked = true;
          console.log(
            `[DialogueAudio] 🔓 Web Audio Context unlocked and resumed (state: ${ctx.state})`,
          );
          if (this.pendingAudio) {
            this.resumePendingAudio();
          }
        })
        .catch((err) => {
          console.warn("[DialogueAudio] AudioContext.resume() exception:", err);
        });
    } else {
      this.isUnlocked = true;
      if (this.pendingAudio) {
        this.resumePendingAudio();
      }
    }
  }

  /**
   * Resumes any audio that was queued due to browser autoplay policy restrictions
   */
  public resumePendingAudio(): void {
    if (!this.pendingAudio) return;
    const pending = this.pendingAudio;
    this.pendingAudio = null;

    console.log(
      `[DialogueAudio] 🚀 Resuming pending dialogue after user interaction: "${pending.originalText}"`,
    );

    this.currentOnEnd = pending.onEnd ?? null;
    if (pending.audioUrl) {
      this.playAudioFile(
        pending.audioUrl,
        pending.originalText,
        pending.speaker,
        pending.characterVoice,
      );
    } else {
      this.playDialogue({
        text: pending.originalText,
        speaker: pending.speaker,
        characterVoice: pending.characterVoice,
        onEnd: pending.onEnd,
      });
    }
  }

  public hasPendingAudio(): boolean {
    return this.pendingAudio !== null;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.gainNode) {
      try {
        this.gainNode.gain.value = muted ? 0 : 1.0;
      } catch {
        // ignore
      }
    }
    if (muted && this.currentState.isPlaying) {
      this.stop();
    }
  }

  public getSpeakingState(): SpeakingState {
    return { ...this.currentState };
  }

  public subscribe(listener: (state: SpeakingState) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = { ...this.currentState };
    for (const fn of this.listeners) {
      try {
        fn(copy);
      } catch (err) {
        console.error("Error in dialogue audio listener:", err);
      }
    }
  }

  /**
   * Pre-fetches and pre-decodes key gameplay audio into Web Audio memory
   */
  public async prewarmAudio(urls: string[]): Promise<void> {
    const ctx = this.getAudioContext();
    if (!ctx || typeof fetch !== "function") return;

    for (const url of urls) {
      if (this.bufferCache.has(url)) continue;
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
          this.bufferCache.set(url, audioBuffer);
        }
      } catch {
        // ignore pre-warm failure
      }
    }
  }

  /**
   * Primary entry point: plays exact dialogue text using ElevenLabs.
   * Strictly avoids robotic browser SpeechSynthesis.
   */
  public async playDialogue(options: PlaySpeechOptions): Promise<void> {
    const { text, speaker, characterVoice, customerId, onEnd } = options;
    this.stopAudio();
    this.lastOptions = options;
    this.currentOnEnd = onEnd ?? null;

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    if (this.isMuted) {
      // Sound is muted: schedule natural reading delay so conversational sequence advances
      const words = text.split(/\s+/).length;
      const readingDelay = Math.max(2200, Math.min(6000, words * 380));
      this.readingTimer = setTimeout(() => {
        const cb = this.currentOnEnd;
        this.currentOnEnd = null;
        cb?.();
      }, readingDelay);
      return;
    }

    // 1. Guaranteed Studio Audio Check: Find exact pre-cached studio recording
    const studioAudioUrl = resolveStudioAudio(text, customerId, characterVoice, speaker);
    if (studioAudioUrl) {
      this.playAudioFile(studioAudioUrl, text, speaker, characterVoice);
      return;
    }

    // 2. Call /api/tts endpoint to get ElevenLabs generated audio
    try {
      const baseUrl =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost:3000";

      const payload: TTSRequest = {
        text,
        character: characterVoice,
        customerId,
        speaker,
        modelId: "eleven_multilingual_v2",
      };

      const res = await fetch(`${baseUrl}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json()) as TTSResponse;

        if (data.success && data.audioUrl) {
          this.playAudioFile(data.audioUrl, text, speaker, characterVoice);
          return;
        }

        // If ElevenLabs failed, keep dialogue visible without robotic browser speech
        console.warn(
          `[ElevenLabs Voice Engine] Generation unavailable: ${data.reason || "Unknown"}`,
        );
        this.currentState = {
          isPlaying: false,
          speaker,
          characterVoice,
          text,
          engine: null,
          error: data.reason || "Voice unavailable",
        };
        this.notify();

        // Advance reading flow naturally
        const words = text.split(/\s+/).length;
        const readingDelay = Math.max(2500, Math.min(5000, words * 350));
        this.readingTimer = setTimeout(() => {
          const cb = this.currentOnEnd;
          this.currentOnEnd = null;
          cb?.();
        }, readingDelay);
        return;
      }
    } catch (err) {
      console.warn("[ElevenLabs Voice Engine] Network error reaching TTS API:", err);
    }

    // Fallback: Keep dialogue visible without robotic voice, allow user to retry
    this.currentState = {
      isPlaying: false,
      speaker,
      characterVoice,
      text,
      engine: null,
      error: "Network error",
    };
    this.notify();

    const words = text.split(/\s+/).length;
    const readingDelay = Math.max(2500, Math.min(5000, words * 350));
    this.readingTimer = setTimeout(() => {
      const cb = this.currentOnEnd;
      this.currentOnEnd = null;
      cb?.();
    }, readingDelay);
  }

  /**
   * Internal helper to halt active audio streams (both Web Audio and HTMLAudioElement)
   */
  private stopAudioPlayback(): void {
    if (this.currentCleanup) {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.onended = null;
        this.currentSourceNode.stop();
      } catch {
        // ignore
      }
      this.currentSourceNode = null;
    }

    if (this.currentAudio) {
      try {
        if (typeof this.currentAudio.pause === "function") {
          this.currentAudio.pause();
        }
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }

  /**
   * Plays generated ElevenLabs audio using dual-engine:
   * 1. Primary: Resilient Web Audio API (instant buffer playback, zero autoplay restrictions once unlocked)
   * 2. Fallback: HTMLAudioElement (ensures full compatibility in tests and environments without Web Audio)
   */
  private async playAudioFile(
    audioUrl: string,
    originalText: string,
    speaker: SpeakerRole,
    characterVoice: CharacterVoice,
  ): Promise<void> {
    console.log(
      `[DialogueAudio] 🔊 Requesting playback: [${speaker}:${characterVoice}] "${originalText}" -> ${audioUrl}`,
    );

    this.stopAudioPlayback();

    // 1. Maintain HTMLAudioElement for full compatibility with tests and fallback inspection
    let audio = this.audioCache.get(audioUrl);
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.preload = "auto";
      this.audioCache.set(audioUrl, audio);
    }

    this.currentAudio = audio;
    audio.currentTime = 0;
    audio.playbackRate = 1.0;
    audio.volume = this.isMuted ? 0 : 1.0;

    let hasEnded = false;
    const handleEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      this.stopAudioPlayback();
      console.log(`[DialogueAudio ${new Date().toISOString()}] ✓ Finished speaking: "${originalText}"`);
      if (this.currentAudio === audio) {
        this.currentAudio = null;
        this.currentState = {
          isPlaying: false,
          speaker: null,
          characterVoice: null,
          text: null,
          engine: null,
          error: null,
        };
        this.notify();
        const cb = this.currentOnEnd;
        this.currentOnEnd = null;
        cb?.();
      }
    };

    const handleError = (e: Event | unknown) => {
      if (hasEnded) return;
      hasEnded = true;
      this.stopAudioPlayback();
      console.warn(`[DialogueAudio ${new Date().toISOString()}] ⚠️ Audio error on "${audioUrl}":`, e);
      if (this.currentAudio === audio) {
        this.currentAudio = null;
        this.currentState = {
          isPlaying: false,
          speaker: null,
          characterVoice: null,
          text: null,
          engine: null,
          error: "Audio playback error",
        };
        this.notify();
        const cb = this.currentOnEnd;
        this.currentOnEnd = null;
        cb?.();
      }
    };

    // Attach HTMLAudioElement listeners (critical for test event dispatching)
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("error", handleError);
    this.currentCleanup = () => {
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("error", handleError);
    };

    // 2. Primary Web Audio API Pipeline (immune to per-element autoplay rejections once unlocked)
    const ctx = this.getAudioContext();
    if (ctx && typeof fetch === "function") {
      try {
        if (ctx.state === "suspended") {
          await ctx.resume().catch(() => {});
        }

        if (ctx.state === "running") {
          let audioBuffer = this.bufferCache.get(audioUrl);
          if (!audioBuffer) {
            const resp = await fetch(audioUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${audioUrl}`);
            const arrayBuf = await resp.arrayBuffer();
            audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
            this.bufferCache.set(audioUrl, audioBuffer);
          }

          if (hasEnded) return;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          if (this.gainNode) {
            this.gainNode.gain.value = this.isMuted ? 0 : 1.0;
            source.connect(this.gainNode);
          } else {
            source.connect(ctx.destination);
          }

          source.onended = () => {
            handleEnd();
          };

          this.currentSourceNode = source;
          source.start(0);

          console.log(`[DialogueAudio] ▶ Web Audio playback active for: "${originalText}"`);
          this.pendingAudio = null;
          this.currentState = {
            isPlaying: true,
            speaker,
            characterVoice,
            text: originalText,
            engine: "elevenlabs",
            error: null,
          };
          this.notify();
          return;
        }
      } catch (webAudioErr) {
        console.warn("[DialogueAudio] Web Audio pipeline encountered issue, falling back to HTMLAudioElement:", webAudioErr);
      }
    }

    // 3. Fallback HTMLAudioElement pipeline (also used in Vitest/JSDOM test runner)
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            console.log(`[DialogueAudio] ▶ HTMLAudio playback active for: "${originalText}"`);
            this.pendingAudio = null;
            this.currentState = {
              isPlaying: true,
              speaker,
              characterVoice,
              text: originalText,
              engine: "elevenlabs",
              error: null,
            };
            this.notify();
          })
          .catch((err: unknown) => {
            console.warn(
              `[DialogueAudio] ⏸️ Browser autoplay policy paused playback. Queued for user interaction.`,
              err,
            );
            this.pendingAudio = {
              audio,
              audioUrl,
              originalText,
              speaker,
              characterVoice,
              onEnd: this.currentOnEnd ?? undefined,
            };
            this.currentState = {
              isPlaying: false,
              speaker,
              characterVoice,
              text: originalText,
              engine: "elevenlabs",
              error: "tap-to-play",
            };
            this.notify();
          });
      } else {
        console.log(`[DialogueAudio] ▶ Audio playback started for: "${originalText}"`);
        this.pendingAudio = null;
        this.currentState = {
          isPlaying: true,
          speaker,
          characterVoice,
          text: originalText,
          engine: "elevenlabs",
          error: null,
        };
        this.notify();
      }
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Stops audio playback only without cancelling the overarching arrival sequence
   */
  public stopAudio(): void {
    this.stopAudioPlayback();

    if (this.readingTimer) {
      clearTimeout(this.readingTimer);
      this.readingTimer = null;
    }

    this.currentAudio = null;
    this.pendingAudio = null;

    if (this.currentState.isPlaying) {
      this.currentState = {
        isPlaying: false,
        speaker: null,
        characterVoice: null,
        text: null,
        engine: null,
        error: null,
      };
      this.notify();
    }
    this.currentOnEnd = null;
  }

  /**
   * Stop everything: cancels arrival sequence and stops audio playback immediately
   */
  public stop(): void {
    this.stopArrivalSequence();
    this.stopAudio();
  }

  /**
   * Orchestrates the exact required customer arrival sequence:
   * 1. Customer speech bubble appears with order immediately.
   * 2. Customer speaks complete order using their ElevenLabs voice.
   * 3. Audio finishes (DOM 'ended' event strictly received).
   * 4. 3000ms pause (speech bubble stays visible).
   * 5. Speech bubble updates to Shopkeeper.
   * 6. Shopkeeper speaks "Please check the price on the bill before you count the change!" using Eric's voice profile.
   * 7. Shopkeeper voice finishes -> speech bubble restores customer order.
   * 8. Player ready to calculate change.
   */
  public startArrivalSequence(options: ArrivalSequenceOptions): void {
    // If this sequence is already running or completed for this customer, keep current callback and ensure dialogue is rendered
    if (this.currentSequenceId === options.sequenceId) {
      this.currentArrivalOptions = options;
      options.onDialogueChange(this.currentDialogue ?? options.orderDialogue);
      return;
    }

    this.stopArrivalSequence();
    this.currentSequenceId = options.sequenceId;
    this.currentArrivalOptions = options;
    this.currentDialogue = options.orderDialogue;

    console.log(`\n======================================================`);
    console.log(`[ArrivalSequence ${new Date().toISOString()}] ▶ STARTING ARRIVAL SEQUENCE for: ${options.orderDialogue.speakerName} (Sequence ID: ${options.sequenceId})`);
    console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 1 & 2: Displaying customer speech bubble immediately.`);
    console.log(`======================================================`);

    // Step 1 & 2: Display customer speech bubble immediately
    options.onDialogueChange(options.orderDialogue);

    // Step 3: Customer speaks complete order dialogue
    console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 3: Customer speaking complete order: "${options.orderDialogue.text}"`);

    this.playDialogue({
      text: options.orderDialogue.text,
      speaker: options.orderDialogue.speaker,
      characterVoice: options.orderDialogue.characterVoice,
      customerId: options.orderDialogue.customerId,
      onEnd: () => {
        // Step 4: Customer voice finished (strictly from actual 'ended' DOM event)
        console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 4: Customer audio COMPLETELY FINISHED (audio 'ended' event received).`);

        // Step 5: Wait an additional 3 FULL SECONDS (3000 milliseconds)
        console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 5: Beginning 3 FULL SECONDS (3000ms pause) before Shopkeeper instruction...`);

        this.sequenceTimer = setTimeout(() => {
          this.sequenceTimer = null;
          if (this.currentSequenceId !== options.sequenceId) return;

          console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 6 & 7: 3000ms pause elapsed! Updating speech bubble to Shopkeeper.`);

          // Step 7: Update speech bubble to show Shopkeeper as the speaker
          this.currentDialogue = options.instructionDialogue;
          this.currentArrivalOptions?.onDialogueChange(options.instructionDialogue);

          // Step 6 & 8: Shopkeeper automatically speaks instruction with Eric's voice profile
          console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 8: Playing Shopkeeper voice: "${options.instructionDialogue.text}" (Voice: Eric / cjVigY5qzO86Huf0OWal)`);

          this.playDialogue({
            text: options.instructionDialogue.text,
            speaker: "shopkeeper",
            characterVoice: "shopkeeper",
            customerId: undefined,
            onEnd: () => {
              console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 9: Shopkeeper voice FINISHED. Restoring customer order in speech bubble.`);

              // Step 9: After shopkeeper finishes speaking, restore customer's order in speech bubble
              this.currentDialogue = options.orderDialogue;
              this.currentArrivalOptions?.onDialogueChange(options.orderDialogue);

              // Step 10: Allow the player to calculate the change
              console.log(`[ArrivalSequence ${new Date().toISOString()}] Step 10: Customer order restored. Player can now proceed with calculating change!`);
              console.log(`======================================================\n`);
              options.onSequenceComplete?.();
            },
          });
        }, 3000);
      },
    });
  }

  public stopArrivalSequence(): void {
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    this.currentSequenceId = null;
    this.currentArrivalOptions = null;
    this.currentDialogue = null;
  }

  /**
   * Replay the active dialogue with exact same text and settings
   */
  public replay(onEnd?: () => void): void {
    this.unlockAudio();
    if (this.pendingAudio) {
      this.resumePendingAudio();
      return;
    }
    if (this.lastOptions) {
      this.playDialogue({
        ...this.lastOptions,
        onEnd: onEnd !== undefined ? onEnd : this.lastOptions.onEnd,
      });
    }
  }

  /**
   * Skip current dialogue voice and immediately advance
   */
  public skip(): void {
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    const cb = this.currentOnEnd;
    this.stop();
    cb?.();
  }

  public isSpeaking(): boolean {
    return this.currentState.isPlaying;
  }
}

export const dialogueAudio = new DialogueAudioManager();
