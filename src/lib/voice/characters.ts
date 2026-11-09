export type SpeakerRole = "shopkeeper" | "customer";
export type CharacterVoice = "shopkeeper" | "boy" | "girl";

export interface VoiceConfig {
  role: CharacterVoice;
  voiceId: string;
  name: string;
  gender: "male" | "female";
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
    use_speaker_boost: boolean;
  };
  browserFallback?: {
    pitch: number;
    rate: number;
    gender: "male" | "female";
  };
}

/**
 * Premium ElevenLabs voice profiles tuned for natural human acting with eleven_multilingual_v2
 * High style (0.35-0.45) provides rich emotional cadence and conversational prosody.
 */
export const CHARACTER_VOICE_CONFIGS: Record<CharacterVoice, VoiceConfig> = {
  shopkeeper: {
    role: "shopkeeper",
    name: "Eric (Warm Shopkeeper)",
    voiceId: "cjVigY5qzO86Huf0OWal", // Eric: warm, trustworthy, conversational adult male
    gender: "male",
    settings: {
      stability: 0.4,
      similarity_boost: 0.75,
      style: 0.4,
      speed: 0.98,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 0.92,
      rate: 0.96,
      gender: "male",
    },
  },
  boy: {
    role: "boy",
    name: "Will (Cheerful Boy)",
    voiceId: "bIHbv24MWmeRgasZH58o", // Will: relaxed, playful, friendly young male
    gender: "male",
    settings: {
      stability: 0.38,
      similarity_boost: 0.75,
      style: 0.42,
      speed: 1.0,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 1.15,
      rate: 1.02,
      gender: "male",
    },
  },
  girl: {
    role: "girl",
    name: "Jessica (Sweet & Lively Girl)",
    voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica: playful, bright, warm young female
    gender: "female",
    settings: {
      stability: 0.4,
      similarity_boost: 0.75,
      style: 0.45,
      speed: 0.98,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 1.08,
      rate: 1.0,
      gender: "female",
    },
  },
};

/**
 * Distinct customer voice identities giving each character their own recognizable voice.
 * Every customer has a unique voice ID that stays strictly consistent.
 */
export const CUSTOMER_VOICE_PROFILES: Record<string, VoiceConfig> = {
  uncle: {
    role: "boy",
    name: "Roger (Mr. Sharma)",
    voiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger: laid-back, classy, resonant mature gentleman
    gender: "male",
    settings: {
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.35,
      speed: 0.96,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 0.88,
      rate: 0.94,
      gender: "male",
    },
  },
  aunty: {
    role: "girl",
    name: "Sarah (Mrs. Priya)",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah: mature, reassuring, warm confident woman
    gender: "female",
    settings: {
      stability: 0.42,
      similarity_boost: 0.75,
      style: 0.4,
      speed: 0.98,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 1.05,
      rate: 0.98,
      gender: "female",
    },
  },
  student: {
    role: "boy",
    name: "Will (Rohan)",
    voiceId: "bIHbv24MWmeRgasZH58o", // Will: relaxed optimist, cheerful young male
    gender: "male",
    settings: {
      stability: 0.38,
      similarity_boost: 0.75,
      style: 0.45,
      speed: 1.0,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 1.2,
      rate: 1.04,
      gender: "male",
    },
  },
  parent: {
    role: "girl",
    name: "Laura (Meera & Anu)",
    voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura: enthusiast, quirky, upbeat friendly mom
    gender: "female",
    settings: {
      stability: 0.4,
      similarity_boost: 0.75,
      style: 0.4,
      speed: 0.98,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 1.1,
      rate: 1.0,
      gender: "female",
    },
  },
  delivery: {
    role: "boy",
    name: "Callum (Raju)",
    voiceId: "N2lVS1w4EtoT3dr4eOWO", // Callum: husky, energetic young delivery specialist
    gender: "male",
    settings: {
      stability: 0.38,
      similarity_boost: 0.75,
      style: 0.42,
      speed: 1.02,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 0.98,
      rate: 1.05,
      gender: "male",
    },
  },
  dadi: {
    role: "girl",
    name: "Alice (Grandma)",
    voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice: clear, warm, gentle mature lady
    gender: "female",
    settings: {
      stability: 0.45,
      similarity_boost: 0.8,
      style: 0.35,
      speed: 0.94,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 0.92,
      rate: 0.92,
      gender: "female",
    },
  },
  girl: {
    role: "girl",
    name: "Jessica (Jessica)",
    voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica: playful, bright, warm young female
    gender: "female",
    settings: {
      stability: 0.4,
      similarity_boost: 0.75,
      style: 0.45,
      speed: 0.98,
      use_speaker_boost: true,
    },
    browserFallback: {
      pitch: 1.08,
      rate: 1.0,
      gender: "female",
    },
  },
};

/**
 * Returns the character voice type ("boy" or "girl") for high-level grouping.
 */
export function getCustomerVoiceType(customerId: string): CharacterVoice {
  if (
    customerId === "aunty" ||
    customerId === "parent" ||
    customerId === "dadi" ||
    customerId === "girl"
  ) {
    return "girl";
  }
  return "boy";
}

/**
 * Resolves the precise VoiceConfig for any character or customer ID.
 */
export function getVoiceForCharacter(character: CharacterVoice, customerId?: string): VoiceConfig {
  if (customerId && CUSTOMER_VOICE_PROFILES[customerId]) {
    return CUSTOMER_VOICE_PROFILES[customerId]!;
  }
  return CHARACTER_VOICE_CONFIGS[character] || CHARACTER_VOICE_CONFIGS.shopkeeper;
}

export function isFemaleCustomer(customerId: string): boolean {
  return getCustomerVoiceType(customerId) === "girl";
}
