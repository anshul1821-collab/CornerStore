import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  CHARACTER_VOICE_CONFIGS,
  getVoiceForCharacter,
  type CharacterVoice,
} from "../lib/voice/characters";
import { sanitizeTextForSpeech } from "../lib/voice/sanitize";
import type { TTSRequest, TTSResponse } from "../lib/voice/types";

export { sanitizeTextForSpeech };
export type { TTSRequest, TTSResponse };

// In-memory cache for ultra-fast serving
const memoryCache = new Map<string, { audioBase64: string; audioUrl: string; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<TTSResponse>>();

// Cached .env file content
let envFileCache: Record<string, string> | null = null;
let lastEnvReadTime = 0;

/**
 * Direct environment variable loader with hot-reload from local .env
 */
export function loadKey(keyName: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[keyName]) {
    const val = process.env[keyName]?.trim();
    if (val && val !== '""' && val !== "''") return val;
  }

  const now = Date.now();
  if (!envFileCache || now - lastEnvReadTime > 2000) {
    envFileCache = {};
    lastEnvReadTime = now;
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq > 0) {
            const k = trimmed.slice(0, eq).trim();
            const val = trimmed
              .slice(eq + 1)
              .trim()
              .replace(/^["']|["']$/g, "");
            envFileCache[k] = val;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const cached = envFileCache?.[keyName]?.trim();
  return cached && cached !== '""' && cached !== "''" ? cached : undefined;
}

const CHARACTERS_AUDIO_DIR = path.resolve(process.cwd(), "public", "audio", "characters");
const MANIFEST_FILE = path.join(CHARACTERS_AUDIO_DIR, "manifest.json");

function ensureDir(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {
    // ignore
  }
}

interface ManifestEntry {
  cacheKey: string;
  originalText: string;
  sanitizedText: string;
  character: CharacterVoice;
  customerId?: string | undefined;
  voiceId: string;
  modelId: string;
  audioUrl: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
  };
  createdAt: string;
}

// Direct mapping of verified studio audio tracks from Voice Studio
export const PREGENERATED_AUDIO_MAP: Record<string, string> = {
  // Shopkeeper Welcome & Praise & Instructions
  "shopkeeper:Welcome to the shop! Great to see you today. What can I get for you?":
    "/audio/characters/shopkeeper/1_greetings.mp3",
  "shopkeeper:Spot on! That's the exact change. Brilliant calculation!":
    "/audio/characters/shopkeeper/4_excited_expressions.mp3",
  "shopkeeper:Please check the price on the bill before you count the change!":
    "/audio/characters/shopkeeper/check_bill_instruction.mp3",
  "shopkeeper:Please check the price in the bill!":
    "/audio/characters/shopkeeper/check_price_in_bill.mp3",

  // 1. Mrs. Priya (Aunty)
  "aunty:Hello, dear! I'd like Juice Box. Here's $50.00!":
    "/audio/characters/aunty/2_normal_conversations.mp3",
  "aunty:Hello, dear! I'd like 2 Chocolate. Here's $200.00!":
    "/audio/characters/aunty/004e9c8faf553351ab558f58883c5c29.mp3",
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

  // 2. Mr. Sharma (Uncle)
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
    "/audio/characters/uncle/3_questions.mp3",
  "uncle:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/uncle/short_feedback.mp3",
  "uncle:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/uncle/extra_feedback.mp3",

  // 3. Rohan (Student)
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
    "/audio/characters/student/7_sentences_containing_dollar_amounts.mp3",
  "student:Oh, hold on - you gave me $10.50 extra! Take a quick look.":
    "/audio/characters/student/7_sentences_containing_dollar_amounts.mp3",
  "student:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/student/short_feedback.mp3",
  "student:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/student/extra_feedback.mp3",

  // 4. Grandma (Dadi)
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
    "/audio/characters/dadi/6_longer_sentences.mp3",
  "dadi:No rush at all! Take your time to count the notes.":
    "/audio/characters/dadi/0b9e110b10b86fa2b20770a536f63ecf.mp3",

  // 5. Meera & Anu (Parent)
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

  // 6. Raju (Delivery)
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

  // 7. Jessica (Girl)
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
    "/audio/characters/girl/5_thank_you_messages.mp3",
  "girl:Hmm, wait a second... looks like this is a bit short. Could you please check?":
    "/audio/characters/girl/short_feedback.mp3",
  "girl:Oh, hold on — you gave me a bit too much extra! Take a quick look.":
    "/audio/characters/girl/extra_feedback.mp3",
};

function updateManifest(entry: ManifestEntry): void {
  try {
    ensureDir(CHARACTERS_AUDIO_DIR);
    let manifest: Record<string, ManifestEntry> = {};
    if (fs.existsSync(MANIFEST_FILE)) {
      try {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
      } catch {
        manifest = {};
      }
    }
    manifest[entry.cacheKey] = entry;
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

/**
 * Checks for an existing verified studio audio file either in direct mapping
 * or in the manifest registry.
 */
function findExistingStudioAudio(
  targetFolder: string,
  rawText: string,
  sanitizedText: string,
): { audioUrl: string; diskPath: string } | null {
  // 1. Check direct map
  const directKey = `${targetFolder}:${rawText.trim()}`;
  if (PREGENERATED_AUDIO_MAP[directKey]) {
    const audioUrl = PREGENERATED_AUDIO_MAP[directKey]!;
    const diskPath = path.join(process.cwd(), "public", audioUrl.replace(/^\//, ""));
    if (fs.existsSync(diskPath)) {
      return { audioUrl, diskPath };
    }
  }

  // 2. Check manifest.json
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      const manifest: Record<string, ManifestEntry> = JSON.parse(
        fs.readFileSync(MANIFEST_FILE, "utf-8"),
      );
      for (const entry of Object.values(manifest)) {
        const matchesFolder =
          (entry.customerId && entry.customerId === targetFolder) ||
          entry.character === targetFolder;
        const matchesText =
          entry.originalText.trim() === rawText.trim() ||
          entry.sanitizedText.trim() === sanitizedText.trim();

        if (matchesFolder && matchesText) {
          const entryDiskPath = path.join(
            CHARACTERS_AUDIO_DIR,
            targetFolder,
            `${entry.cacheKey}.mp3`,
          );
          if (fs.existsSync(entryDiskPath)) {
            return { audioUrl: entry.audioUrl, diskPath: entryDiskPath };
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Returns safe diagnostic status without exposing private keys
 */
export function getDiagnosticStatus() {
  const apiKey = (loadKey("ELEVENLABS_API_KEY") || "").trim();
  const isKeyConfigured = Boolean(
    apiKey && apiKey !== "your_elevenlabs_api_key_here" && apiKey.length > 10,
  );

  const maskedKey = isKeyConfigured
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : "not_configured";

  const shopkeeperVoice =
    loadKey("ELEVENLABS_SHOPKEEPER_VOICE_ID") || CHARACTER_VOICE_CONFIGS.shopkeeper.voiceId;
  const boyVoice = loadKey("ELEVENLABS_BOY_VOICE_ID") || CHARACTER_VOICE_CONFIGS.boy.voiceId;
  const girlVoice = loadKey("ELEVENLABS_GIRL_VOICE_ID") || CHARACTER_VOICE_CONFIGS.girl.voiceId;
  const modelId = loadKey("ELEVENLABS_MODEL_ID") || "eleven_multilingual_v2";

  let cachedAudioCount = 0;
  try {
    if (fs.existsSync(CHARACTERS_AUDIO_DIR)) {
      const getFiles = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files: string[] = [];
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) files = files.concat(getFiles(full));
          else if (e.name.endsWith(".mp3")) files.push(full);
        }
        return files;
      };
      cachedAudioCount = getFiles(CHARACTERS_AUDIO_DIR).length;
    }
  } catch {
    // ignore
  }

  return {
    status: isKeyConfigured ? "online" : "ready_for_key",
    service: "ElevenLabs Premium Multilingual v2 Voice Engine",
    timestamp: new Date().toISOString(),
    auth: {
      configured: isKeyConfigured,
      maskedKey,
    },
    voices: {
      shopkeeper: shopkeeperVoice,
      boy: boyVoice,
      girl: girlVoice,
    },
    modelId,
    cachedAudioCount,
  };
}

/**
 * Synthesizes high-fidelity speech using ElevenLabs eleven_multilingual_v2.
 * Strictly prevents robotic browser speech synthesis fallbacks.
 */
export async function synthesizeSpeech(
  req: TTSRequest,
  overrideApiKey?: string,
): Promise<TTSResponse> {
  const rawText = (req.text || "").trim();
  if (!rawText) {
    return { success: false, reason: "EMPTY_TEXT" };
  }

  const sanitizedText = sanitizeTextForSpeech(rawText);
  const character: CharacterVoice = req.character || "shopkeeper";
  const customerId = req.customerId;

  // Resolve voice profile
  const voiceConfig = getVoiceForCharacter(character, customerId);

  // Check specific environment overrides if configured
  const envCustomerKey = customerId ? `ELEVENLABS_${customerId.toUpperCase()}_VOICE_ID` : undefined;
  const envRoleKey =
    character === "shopkeeper"
      ? "ELEVENLABS_SHOPKEEPER_VOICE_ID"
      : character === "boy"
        ? "ELEVENLABS_BOY_VOICE_ID"
        : "ELEVENLABS_GIRL_VOICE_ID";

  const voiceId =
    req.voiceId ||
    (envCustomerKey ? loadKey(envCustomerKey) : undefined) ||
    loadKey(envRoleKey) ||
    voiceConfig.voiceId;

  // Default to premium eleven_multilingual_v2 for human warmth and emotional cadence
  const modelId = req.modelId || loadKey("ELEVENLABS_MODEL_ID") || "eleven_multilingual_v2";

  // Use the verified Voice Studio settings for each specific character
  const stability = voiceConfig.settings.stability;
  const similarityBoost = voiceConfig.settings.similarity_boost;
  const style = voiceConfig.settings.style;
  const speed = voiceConfig.settings.speed;

  const targetFolder = customerId || character;
  const charDir = path.join(CHARACTERS_AUDIO_DIR, targetFolder);

  // 1. Direct check: Is there a verified studio audio recording matching this dialogue?
  const existingStudio = findExistingStudioAudio(targetFolder, rawText, sanitizedText);
  if (existingStudio) {
    try {
      const buffer = fs.readFileSync(existingStudio.diskPath);
      const audioBase64 = buffer.toString("base64");
      return {
        success: true,
        audioUrl: existingStudio.audioUrl,
        audioBase64,
        mimeType: "audio/mpeg",
        cached: true,
        sanitizedText,
      };
    } catch {
      // ignore
    }
  }

  // Deterministic cache key based on text, voice, model, and voice settings
  const cacheKey = crypto
    .createHash("md5")
    .update(`${targetFolder}:${voiceId}:${modelId}:${stability}:${style}:${speed}:${sanitizedText}`)
    .digest("hex");

  const audioFileName = `${cacheKey}.mp3`;
  const diskPath = path.join(charDir, audioFileName);
  const audioUrl = `/audio/characters/${targetFolder}/${audioFileName}`;

  // 2. Check memory cache
  const mem = memoryCache.get(cacheKey);
  if (mem) {
    return {
      success: true,
      audioUrl: mem.audioUrl,
      audioBase64: mem.audioBase64,
      mimeType: "audio/mpeg",
      cached: true,
      sanitizedText,
    };
  }

  // 2. Check local disk cache
  ensureDir(charDir);
  if (fs.existsSync(diskPath)) {
    try {
      const buffer = fs.readFileSync(diskPath);
      const audioBase64 = buffer.toString("base64");
      memoryCache.set(cacheKey, { audioBase64, audioUrl, timestamp: Date.now() });

      return {
        success: true,
        audioUrl,
        audioBase64,
        mimeType: "audio/mpeg",
        cached: true,
        sanitizedText,
      };
    } catch {
      // ignore
    }
  }

  // 3. De-duplicate in-flight requests
  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const executionPromise = (async (): Promise<TTSResponse> => {
    const apiKey = (overrideApiKey || loadKey("ELEVENLABS_API_KEY") || "").trim();
    const isKeyConfigured = Boolean(
      apiKey && apiKey !== "your_elevenlabs_api_key_here" && apiKey.length > 10,
    );

    if (!isKeyConfigured) {
      return {
        success: false,
        reason: "NO_API_KEY",
        fallback: "none",
        sanitizedText,
      };
    }

    interface ElevenVoiceSettings {
      stability: number;
      similarity_boost: number;
      use_speaker_boost: boolean;
      style?: number;
      speed?: number;
    }

    const voiceSettings: ElevenVoiceSettings = {
      stability: isNaN(stability) ? 0.4 : stability,
      similarity_boost: isNaN(similarityBoost) ? 0.75 : similarityBoost,
      use_speaker_boost: true,
    };
    if (!isNaN(style) && style > 0) voiceSettings.style = style;
    if (!isNaN(speed) && speed !== 1.0) voiceSettings.speed = speed;

    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

    try {
      let response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      });

      // If rejected due to optional style/speed parameter on certain models, retry with basic settings
      if (!response.ok && response.status === 400 && (voiceSettings.style || voiceSettings.speed)) {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: sanitizedText,
            model_id: modelId,
            voice_settings: {
              stability: voiceSettings.stability,
              similarity_boost: voiceSettings.similarity_boost,
              use_speaker_boost: true,
            },
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.warn(
          `[ElevenLabs TTS] HTTP ${response.status} (${voiceId}): ${errorText.slice(0, 150)}`,
        );
        return {
          success: false,
          reason: `API_${response.status}`,
          fallback: "none",
          sanitizedText,
          error: errorText,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save locally to public/audio/characters/${targetFolder}
      ensureDir(charDir);
      fs.writeFileSync(diskPath, buffer);

      // Record in manifest
      updateManifest({
        cacheKey,
        originalText: rawText,
        sanitizedText,
        character,
        customerId,
        voiceId,
        modelId,
        audioUrl,
        settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: voiceSettings.style ?? 0,
          speed: voiceSettings.speed ?? 1.0,
        },
        createdAt: new Date().toISOString(),
      });

      const audioBase64 = buffer.toString("base64");
      memoryCache.set(cacheKey, { audioBase64, audioUrl, timestamp: Date.now() });

      return {
        success: true,
        audioUrl,
        audioBase64,
        mimeType: "audio/mpeg",
        cached: false,
        sanitizedText,
      };
    } catch (err) {
      console.warn("[ElevenLabs TTS] Network error communicating with ElevenLabs:", err);
      return {
        success: false,
        reason: "NETWORK_ERROR",
        fallback: "none",
        sanitizedText,
        error: (err as Error)?.message,
      };
    }
  })();

  inFlightRequests.set(cacheKey, executionPromise);
  try {
    return await executionPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
