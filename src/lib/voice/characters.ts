/**
 * ElevenLabs 3-Voice Architecture for Kirana Change:
 *
 * Exactly 3 voices used throughout the entire game:
 * 1. Boy Voice: One consistent, natural male voice used by ALL male customers (uncle, student, delivery).
 *    Default: "Antoni" (ErXwobaYiN019PkySvjV) - tested & verified on Free tier.
 * 2. Girl Voice: One consistent, natural female voice used by ALL female customers (aunty, parent, dadi).
 *    Default: "Sarah" (EXAVITQu4vr4xnSDxMaL) - tested & verified on Free tier.
 * 3. Shopkeeper Voice: One consistent, mature male voice used exclusively by the shopkeeper.
 *    Default: "George" (JBFqnCBsd6RMkjVDRZzb) - tested & verified on Free tier.
 */

export type VoiceRole = "boy" | "girl" | "shopkeeper";

export interface VoiceConfig {
  role: VoiceRole;
  voiceId: string;
  name: string;
  personality: string;
  settings: {
    stability: number;
    similarity_boost: number;
    speed: number;
    use_speaker_boost: boolean;
    style?: number;
  };
}

export const BOY_VOICE: VoiceConfig = {
  role: "boy",
  voiceId: "9gKJk2fZsPLQCuOnaVLS", // Boy Voice: friendly, conversational young male
  name: "Boy Voice",
  personality: "Natural, friendly, conversational male customer",
  settings: {
    stability: 0.4,
    similarity_boost: 0.75,
    speed: 1.0,
    use_speaker_boost: true,
    style: 0.2,
  },
};

export const GIRL_VOICE: VoiceConfig = {
  role: "girl",
  voiceId: "7vLdoQUU3acmEiAVXlaN", // Girl Voice: clear, friendly, conversational young female
  name: "Girl Voice",
  personality: "Natural, clear, conversational female customer",
  settings: {
    stability: 0.4,
    similarity_boost: 0.75,
    speed: 1.0,
    use_speaker_boost: true,
    style: 0.2,
  },
};

export const SHOPKEEPER_VOICE: VoiceConfig = {
  role: "shopkeeper",
  voiceId: "bbGyqGAEIg7zLT7U2n9A", // Shopkeeper Voice: warm, mature, experienced store owner
  name: "Shopkeeper Voice",
  personality: "Warm, welcoming, experienced store owner",
  settings: {
    stability: 0.4,
    similarity_boost: 0.75,
    speed: 1.0,
    use_speaker_boost: true,
    style: 0.2,
  },
};

// Customer gender mappings:
// All male customers -> Boy Voice
// All female customers -> Girl Voice
export const MALE_CUSTOMERS = new Set(["uncle", "student", "delivery"]);
export const FEMALE_CUSTOMERS = new Set(["aunty", "parent", "dadi"]);

export function isMaleCustomer(customerId?: string): boolean {
  if (!customerId) return true;
  return MALE_CUSTOMERS.has(customerId);
}

export function isFemaleCustomer(customerId?: string): boolean {
  if (!customerId) return false;
  return FEMALE_CUSTOMERS.has(customerId);
}

// Backward-compatible exports for any tests or helpers
export const CUSTOMER_ARCHETYPES = {
  customer1: BOY_VOICE,
  customer2: GIRL_VOICE,
  customer3: BOY_VOICE,
  customer4: GIRL_VOICE,
} as const;

export const CUSTOMER_VOICES: Record<string, VoiceConfig> = {
  uncle: BOY_VOICE,
  aunty: GIRL_VOICE,
  student: BOY_VOICE,
  parent: GIRL_VOICE,
  delivery: BOY_VOICE,
  dadi: GIRL_VOICE,
};

export const DEFAULT_CUSTOMER_VOICE: VoiceConfig = BOY_VOICE;

function applySettingOverrides(settings: VoiceConfig["settings"]): VoiceConfig["settings"] {
  if (typeof process === "undefined") return settings;
  const stab = process.env.ELEVENLABS_STABILITY
    ? parseFloat(process.env.ELEVENLABS_STABILITY)
    : undefined;
  const sim = process.env.ELEVENLABS_SIMILARITY_BOOST
    ? parseFloat(process.env.ELEVENLABS_SIMILARITY_BOOST)
    : undefined;
  const style = process.env.ELEVENLABS_STYLE ? parseFloat(process.env.ELEVENLABS_STYLE) : undefined;
  const speed = process.env.ELEVENLABS_SPEED ? parseFloat(process.env.ELEVENLABS_SPEED) : undefined;
  const boost =
    process.env.ELEVENLABS_SPEAKER_BOOST !== undefined
      ? process.env.ELEVENLABS_SPEAKER_BOOST.toLowerCase() === "true"
      : undefined;

  return {
    stability: stab !== undefined && !isNaN(stab) ? stab : settings.stability,
    similarity_boost: sim !== undefined && !isNaN(sim) ? sim : settings.similarity_boost,
    speed: speed !== undefined && !isNaN(speed) ? speed : settings.speed,
    use_speaker_boost: boost !== undefined ? boost : settings.use_speaker_boost,
    style: style !== undefined && !isNaN(style) ? style : settings.style,
  };
}

/**
 * Determine the active voice config for a speaker based strictly on:
 * - Shopkeeper -> Shopkeeper Voice (ELEVENLABS_SHOPKEEPER_VOICE_ID)
 * - Male Customer -> Boy Voice (ELEVENLABS_BOY_VOICE_ID)
 * - Female Customer -> Girl Voice (ELEVENLABS_GIRL_VOICE_ID)
 */
export function getVoiceForSpeaker(
  speaker: "shopkeeper" | "customer",
  customerId?: string,
): VoiceConfig {
  let baseConfig: VoiceConfig;

  if (speaker === "shopkeeper") {
    const override =
      typeof process !== "undefined" ? process.env.ELEVENLABS_SHOPKEEPER_VOICE_ID : undefined;
    baseConfig = override ? { ...SHOPKEEPER_VOICE, voiceId: override } : SHOPKEEPER_VOICE;
  } else {
    // All female customers share exactly the Girl Voice
    if (isFemaleCustomer(customerId)) {
      const override =
        typeof process !== "undefined" ? process.env.ELEVENLABS_GIRL_VOICE_ID : undefined;
      baseConfig = override ? { ...GIRL_VOICE, voiceId: override } : GIRL_VOICE;
    } else {
      // All male customers share exactly the Boy Voice
      const override =
        typeof process !== "undefined" ? process.env.ELEVENLABS_BOY_VOICE_ID : undefined;
      baseConfig = override ? { ...BOY_VOICE, voiceId: override } : BOY_VOICE;
    }
  }

  return {
    ...baseConfig,
    settings: applySettingOverrides(baseConfig.settings),
  };
}
