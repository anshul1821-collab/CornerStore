export type CharacterType = "shopkeeper" | "customer";

export interface TTSRequest {
  text: string;
  character: CharacterType;
  customerId?: string;
  voiceId?: string;
  dialogueType?: "fixed" | "dynamic";
  modelId?: string;
}

export interface TTSResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  cached?: boolean;
  reason?: string;
  fallback?: "browser-tts";
}
