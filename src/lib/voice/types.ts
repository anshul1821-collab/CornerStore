import type { CharacterVoice, SpeakerRole } from "./characters";

export interface TTSRequest {
  text: string;
  character: CharacterVoice;
  customerId?: string | undefined;
  speaker?: SpeakerRole | undefined;
  modelId?: string | undefined;
  voiceId?: string | undefined;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string | undefined;
  audioBase64?: string | undefined;
  mimeType?: string | undefined;
  cached?: boolean | undefined;
  sanitizedText?: string | undefined;
  reason?: string | undefined;
  fallback?: "browser-tts" | "cached-file" | "none" | undefined;
  error?: string | undefined;
}
