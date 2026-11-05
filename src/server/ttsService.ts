import { getVoiceForSpeaker, isFemaleCustomer, type VoiceConfig } from "../lib/voice/characters";
import type { TTSRequest, TTSResponse } from "../lib/voice/types";
import { sanitizeTextForSpeech } from "../lib/voice/sanitize";

export { sanitizeTextForSpeech };
export type { TTSRequest, TTSResponse };

// In-memory cache for generated audio
const audioCache = new Map<string, { audioBase64: string; timestamp: number }>();
const MAX_CACHE_ENTRIES = 300;

// In-flight request de-duplication to prevent duplicate concurrent API calls
const inFlightRequests = new Map<string, Promise<TTSResponse>>();

// Cached .env file content
let envFileCache: Record<string, string> | null = null;
let lastEnvReadTime = 0;

/**
 * Direct environment variable loader:
 * Reads process.env first (handles trim and empty string checking), then falls back to reading the local .env file.
 * Caches parsed .env content with a short TTL to stay responsive to edits.
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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("node:fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("node:path");
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
    } catch {}
  }

  const cached = envFileCache?.[keyName]?.trim();
  return cached && cached !== '""' && cached !== "''" ? cached : undefined;
}

export interface DiagnosticStatus {
  status: "online" | "degraded";
  service: string;
  timestamp: string;
  environment: string;
  auth: {
    configured: boolean;
    keyLength: number;
    maskedKey: string;
  };
  voices: {
    shopkeeper: string;
    girl: string;
    boy: string;
  };
  models: {
    default: string;
    turbo: string;
    fixed: string;
  };
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
    speaker_boost: boolean;
  };
  cache: {
    cachedAudioEntries: number;
  };
}

/**
 * Returns safe diagnostic status without exposing private API keys
 */
export function getDiagnosticStatus(): DiagnosticStatus {
  const apiKey = (loadKey("ELEVENLABS_API_KEY") || "").trim();
  const isKeyConfigured = Boolean(apiKey && apiKey !== "your_elevenlabs_api_key_here");

  const maskedKey = isKeyConfigured
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : "not_set";

  const boyVoice = loadKey("ELEVENLABS_BOY_VOICE_ID") || "ErXwobaYiN019PkySvjV";
  const girlVoice = loadKey("ELEVENLABS_GIRL_VOICE_ID") || "EXAVITQu4vr4xnSDxMaL";
  const shopkeeperVoice = loadKey("ELEVENLABS_SHOPKEEPER_VOICE_ID") || "JBFqnCBsd6RMkjVDRZzb";

  const defaultModel = loadKey("ELEVENLABS_MODEL_ID") || "eleven_turbo_v2_5";
  const turboModel = loadKey("ELEVENLABS_TURBO_MODEL_ID") || "eleven_turbo_v2_5";
  const fixedModel = loadKey("ELEVENLABS_FIXED_MODEL_ID") || "eleven_multilingual_v2";

  const stability = parseFloat(loadKey("ELEVENLABS_STABILITY") || "0.40");
  const simBoost = parseFloat(loadKey("ELEVENLABS_SIMILARITY_BOOST") || "0.75");
  const style = parseFloat(loadKey("ELEVENLABS_STYLE") || "0.15");
  const speed = parseFloat(loadKey("ELEVENLABS_SPEED") || "1.0");
  const speakerBoost = (loadKey("ELEVENLABS_SPEAKER_BOOST") || "true").toLowerCase() === "true";

  return {
    status: isKeyConfigured ? "online" : "degraded",
    service: "Kirana Change ElevenLabs TTS Service",
    timestamp: new Date().toISOString(),
    environment: typeof process !== "undefined" && process.env.VERCEL ? "vercel-serverless" : "local-or-custom",
    auth: {
      configured: isKeyConfigured,
      keyLength: apiKey.length,
      maskedKey,
    },
    voices: {
      shopkeeper: shopkeeperVoice,
      girl: girlVoice,
      boy: boyVoice,
    },
    models: {
      default: defaultModel,
      turbo: turboModel,
      fixed: fixedModel,
    },
    settings: {
      stability: isNaN(stability) ? 0.40 : stability,
      similarity_boost: isNaN(simBoost) ? 0.75 : simBoost,
      style: isNaN(style) ? 0.15 : style,
      speed: isNaN(speed) ? 1.0 : speed,
      speaker_boost: speakerBoost,
    },
    cache: {
      cachedAudioEntries: audioCache.size,
    },
  };
}

/**
 * Generate a cache key for TTS requests based on model, voice, and sanitized text
 */
function makeCacheKey(modelId: string, voiceId: string, text: string): string {
  return `${modelId}:${voiceId}:${text.trim().toLowerCase()}`;
}

/**
 * Synthesize speech using ElevenLabs API with server caching, in-flight de-duplication,
 * and configurable voice settings.
 */
export async function synthesizeSpeech(
  req: TTSRequest,
  apiKeyOverride?: string,
): Promise<TTSResponse> {
  // Sanitize text: convert numbers/rupees to natural spoken English, strip emojis
  const speechText = sanitizeTextForSpeech(req.text);

  if (!speechText) {
    return { success: false, reason: "EMPTY_TEXT", fallback: "browser-tts" };
  }

  // 1. Determine Voice Configuration & Settings
  const defaultVoice: VoiceConfig = getVoiceForSpeaker(req.character, req.customerId);
  let configuredVoiceId: string | undefined;
  if (req.character === "shopkeeper") {
    configuredVoiceId = loadKey("ELEVENLABS_SHOPKEEPER_VOICE_ID");
  } else if (isFemaleCustomer(req.customerId)) {
    configuredVoiceId = loadKey("ELEVENLABS_GIRL_VOICE_ID");
  } else {
    configuredVoiceId = loadKey("ELEVENLABS_BOY_VOICE_ID");
  }
  const voiceId = req.voiceId || configuredVoiceId || defaultVoice.voiceId;

  // 2. Select ElevenLabs Model:
  // - Supports explicit model override (for side-by-side comparison testing)
  // - High-expressiveness model for fixed celebrations
  // - Low-latency turbo model for dynamic dialogue
  let modelId = req.modelId;
  if (!modelId) {
    if (req.dialogueType === "fixed") {
      modelId = loadKey("ELEVENLABS_FIXED_MODEL_ID") || "eleven_multilingual_v2";
    } else {
      modelId =
        loadKey("ELEVENLABS_MODEL_ID") ||
        loadKey("ELEVENLABS_TURBO_MODEL_ID") ||
        "eleven_turbo_v2_5";
    }
  }

  const cacheKey = makeCacheKey(modelId, voiceId, speechText);

  // 3. Check in-memory cache
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return {
      success: true,
      audioBase64: cached.audioBase64,
      mimeType: "audio/mpeg",
      cached: true,
    };
  }

  // 4. In-flight de-duplication: if this exact request is already in-flight, reuse it
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  // 5. Execute synthesis promise with error handling
  const synthPromise = executeSynthesis(
    modelId,
    voiceId,
    speechText,
    defaultVoice,
    cacheKey,
    apiKeyOverride,
  );

  inFlightRequests.set(cacheKey, synthPromise);

  try {
    const result = await synthPromise;
    return result;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

async function executeSynthesis(
  modelId: string,
  voiceId: string,
  speechText: string,
  defaultVoice: VoiceConfig,
  cacheKey: string,
  apiKeyOverride?: string,
): Promise<TTSResponse> {
  // Check ElevenLabs API Key
  const apiKey =
    apiKeyOverride ||
    loadKey("ELEVENLABS_API_KEY") ||
    (typeof process !== "undefined" ? process.env.ELEVENLABS_API_KEY : undefined) ||
    (typeof globalThis !== "undefined" &&
      ((globalThis as Record<string, unknown>).ELEVENLABS_API_KEY as string));

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_elevenlabs_api_key_here") {
    return {
      success: false,
      reason: "NO_API_KEY",
      fallback: "browser-tts",
    };
  }

  // Resolve configurable voice settings from environment with safe defaults
  const envStability = loadKey("ELEVENLABS_STABILITY");
  const envSimBoost = loadKey("ELEVENLABS_SIMILARITY_BOOST");
  const envStyle = loadKey("ELEVENLABS_STYLE");
  const envSpeed = loadKey("ELEVENLABS_SPEED");
  const envSpeakerBoost = loadKey("ELEVENLABS_SPEAKER_BOOST");

  const stability = envStability ? parseFloat(envStability) : defaultVoice.settings.stability;
  const similarityBoost = envSimBoost ? parseFloat(envSimBoost) : defaultVoice.settings.similarity_boost;
  const speed = envSpeed ? parseFloat(envSpeed) : defaultVoice.settings.speed;
  const speakerBoost = envSpeakerBoost !== undefined
    ? envSpeakerBoost.toLowerCase() === "true"
    : defaultVoice.settings.use_speaker_boost;

  // Style is best supported on v2 models (eleven_multilingual_v2, eleven_turbo_v2_5)
  const defaultStyle = modelId.includes("multilingual") ? 0.20 : 0.15;
  const style = envStyle ? parseFloat(envStyle) : (defaultVoice.settings.style ?? defaultStyle);

  const voiceSettings: Record<string, unknown> = {
    stability: isNaN(stability) ? 0.40 : stability,
    similarity_boost: isNaN(similarityBoost) ? 0.75 : similarityBoost,
    use_speaker_boost: speakerBoost,
  };

  // Only include style and speed if supported/configured
  if (!isNaN(style) && style > 0) {
    voiceSettings.style = style;
  }
  if (!isNaN(speed) && speed !== 1.0) {
    voiceSettings.speed = speed;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const startTime = Date.now();
  console.log(
    `[ElevenLabs TTS Diagnostic] Request: role=${defaultVoice.role}, voiceId=${voiceId}, model=${modelId}, textLength=${speechText.length}, keyLength=${apiKey.trim().length}`,
  );

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey.trim(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: speechText,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    });

    // If API rejected due to unsupported voice settings (e.g. style or speed), retry with basic settings
    if (!response.ok && response.status === 400 && (voiceSettings.style !== undefined || voiceSettings.speed !== undefined)) {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey.trim(),
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: speechText,
          model_id: modelId,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            use_speaker_boost: voiceSettings.use_speaker_boost,
          },
        }),
      });
    }

    // If API returned 402 (paid plan required) or 400 for a restricted voice,
    // automatically retry using the verified free-tier standard voice for this role
    if (!response.ok && (response.status === 402 || response.status === 400)) {
      const errorText = await response.clone().text().catch(() => "");
      if (errorText.includes("paid_plan_required") || errorText.includes("voice_not_found")) {
        const fallbackVoiceId =
          defaultVoice.role === "girl"
            ? "EXAVITQu4vr4xnSDxMaL"
            : defaultVoice.role === "shopkeeper"
            ? "JBFqnCBsd6RMkjVDRZzb"
            : "ErXwobaYiN019PkySvjV";

        if (voiceId !== fallbackVoiceId) {
          console.warn(`[ElevenLabs TTS Diagnostic] Voice ${voiceId} unavailable (HTTP ${response.status}), falling back to verified voice ${fallbackVoiceId}`);
          const fallbackUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(fallbackVoiceId)}?output_format=mp3_44100_128`;
          response = await fetch(fallbackUrl, {
            method: "POST",
            headers: {
              "xi-api-key": apiKey.trim(),
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: speechText,
              model_id: modelId,
              voice_settings: voiceSettings,
            }),
          });
        }
      }
    }

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `[ElevenLabs TTS Diagnostic] API returned status ${response.status} in ${duration}ms: ${errorText.slice(0, 150)}`,
      );
      return {
        success: false,
        reason: `API_${response.status}`,
        fallback: "browser-tts",
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    console.log(
      `[ElevenLabs TTS Diagnostic] Success: HTTP ${response.status} in ${duration}ms (${Math.round(buffer.length / 1024)} KB audio)`,
    );

    // Store in cache (manage size)
    if (audioCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = audioCache.keys().next().value;
      if (oldestKey) audioCache.delete(oldestKey);
    }
    audioCache.set(cacheKey, { audioBase64, timestamp: Date.now() });

    return {
      success: true,
      audioBase64,
      mimeType: "audio/mpeg",
      cached: false,
    };
  } catch (err) {
    console.warn("[ElevenLabs TTS] Network error communicating with ElevenLabs:", err);
    return {
      success: false,
      reason: "NETWORK_ERROR",
      fallback: "browser-tts",
    };
  }
}
