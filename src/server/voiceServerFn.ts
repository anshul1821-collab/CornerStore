import { createServerFn } from "@tanstack/react-start";
import {
  synthesizeSpeech,
  getDiagnosticStatus,
  type TTSRequest,
  type TTSResponse,
} from "./ttsService";

/**
 * Native TanStack Start Server Function for ElevenLabs TTS.
 * This runs securely on the server (Local, Vercel, or Cloudflare) via TanStack Start's
 * built-in RPC pipeline. The API key is never exposed to the client.
 */
export const synthesizeSpeechServerFn = createServerFn({ method: "POST" })
  .validator((d: TTSRequest) => d)
  .handler(async ({ data }): Promise<TTSResponse> => {
    return await synthesizeSpeech(data);
  });

/**
 * Diagnostic health check server function
 */
export const getDiagnosticStatusServerFn = createServerFn({ method: "GET" }).handler(async () => {
  return getDiagnosticStatus();
});
