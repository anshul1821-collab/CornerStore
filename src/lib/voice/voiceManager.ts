import { sanitizeTextForSpeech } from "./sanitize";
import type { CharacterType, TTSResponse } from "./types";
import { ambienceEngine } from "./ambience";

export type { CharacterType };

export interface SpeakOptions {
  text: string;
  character: CharacterType;
  customerId?: string;
  voiceId?: string;
  dialogueType?: "fixed" | "dynamic";
  priority?: "normal" | "high";
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export interface VoiceState {
  isSpeaking: boolean;
  activeCharacter: CharacterType | null;
  activeText: string | null;
  isEnabled: boolean;
  volume: number;
  isLoading: boolean;
}

class VoiceManager {
  private isEnabled: boolean = true;
  private volume: number = 1.0;
  private isSpeaking: boolean = false;
  private isLoading: boolean = false;
  private activeCharacter: CharacterType | null = null;
  private activeText: string | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private lastDialogue: SpeakOptions | null = null;
  private listeners: Set<(state: VoiceState) => void> = new Set();

  // In-memory audio cache: Key is `${character}:${customerId || ""}:${text}` -> audio Data URI
  private clientAudioCache = new Map<string, string>();
  private clientInFlight = new Map<string, Promise<TTSResponse | null>>();
  private speechCounter: number = 0;
  private abortController: AbortController | null = null;
  private audioUnlocked: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("kc-sound");
      if (savedSound === "off") {
        this.isEnabled = false;
        ambienceEngine.setMuted(true);
      }

      // Pre-unlock audio on first user gesture
      const unlockAudio = () => {
        if (this.audioUnlocked) return;
        this.audioUnlocked = true;
        const dummy = new Audio();
        dummy.src =
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        dummy.play().catch(() => {});
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };

      window.addEventListener("pointerdown", unlockAudio, { passive: true });
      window.addEventListener("keydown", unlockAudio, { passive: true });
    }
  }

  public getState(): VoiceState {
    return {
      isSpeaking: this.isSpeaking,
      activeCharacter: this.activeCharacter,
      activeText: this.activeText,
      isEnabled: this.isEnabled,
      volume: this.volume,
      isLoading: this.isLoading,
    };
  }

  public subscribe(listener: (state: VoiceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(s);
      } catch (err) {
        console.error("VoiceManager listener error:", err);
      }
    });
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    ambienceEngine.setMuted(!enabled);
    if (!enabled) {
      this.stop();
      this.stopAmbience();
    }
    this.notify();
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.setEnabled(enabled);
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    this.notify();
  }

  /**
   * Play shop arrival brass door chime
   */
  public playDoorChime(): void {
    if (!this.isEnabled) return;
    ambienceEngine.playDoorChime();
  }

  /**
   * Play gentle transaction coin chime
   */
  public playCoinChime(): void {
    if (!this.isEnabled) return;
    ambienceEngine.playCoinChime();
  }

  /**
   * Play generic sound effect
   */
  public playSoundEffect(kind: "chime" | "coin" | "success" | "oops" | "tap"): void {
    if (!this.isEnabled) return;
    if (kind === "chime") this.playDoorChime();
    else if (kind === "coin") this.playCoinChime();
  }

  /**
   * Start soft shop ambience tone
   */
  public startAmbience(): void {
    if (!this.isEnabled) return;
    ambienceEngine.startAmbience();
  }

  /**
   * Stop shop ambience tone
   */
  public stopAmbience(): void {
    ambienceEngine.stopAmbience();
  }

  public setAmbienceVolume(vol: number): void {
    ambienceEngine.setAmbienceVolume(vol);
  }

  /**
   * Stop any ongoing speech playback or speech synthesis immediately
   */
  public stop(): void {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {
        // Ignored: already aborted
      }
      this.abortController = null;
    }
    this.speechCounter++;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Ignored: audio element cleanup
      }
      this.currentAudio = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored: synthesis cancel
      }
    }

    this.isSpeaking = false;
    this.isLoading = false;
    this.activeCharacter = null;
    this.activeText = null;
    this.notify();
  }

  /**
   * Replay the most recent dialogue
   */
  public replay(): void {
    if (!this.lastDialogue) return;
    this.speak({ ...this.lastDialogue });
  }

  public replayLastDialogue(): void {
    this.replay();
  }

  /**
   * Speak using ElevenLabs TTS via backend with automatic browser fallback,
   * race-condition elimination, in-flight de-duplication, and zero audio overlap.
   */
  public async speak(options: SpeakOptions): Promise<void> {
    const { text, character, customerId, dialogueType, onStart, onEnd, onError } = options;

    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText) return;

    // Save as last dialogue for replay
    this.lastDialogue = options;

    if (!this.isEnabled) return;

    // Stop previous voice immediately to prevent overlapping audio
    this.stop();

    const currentSessionId = this.speechCounter;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.activeCharacter = character;
    this.activeText = cleanText;
    this.isLoading = true;
    this.notify();

    const cacheKey = `${character}:${customerId || ""}:${dialogueType || "dynamic"}:${options.voiceId || ""}:${cleanText.toLowerCase()}`;

    try {
      // 1. Check local client cache first
      let audioUri = this.clientAudioCache.get(cacheKey);

      if (!audioUri) {
        // 2. Fetch from secure backend TTS endpoint (ElevenLabs API) with in-flight de-duplication
        let fetchPromise = this.clientInFlight.get(cacheKey);
        if (!fetchPromise) {
          fetchPromise = fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: cleanText,
              character,
              customerId,
              dialogueType,
              voiceId: options.voiceId,
            }),
            signal,
          })
            .then(async (res) => {
              if (res.ok) {
                const contentType = res.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                  return (await res.json()) as TTSResponse;
                }
                console.warn(
                  `[VoiceManager Diagnostic] /api/tts returned non-JSON content-type (${contentType}). Check server route deployment.`,
                );
                return null;
              }
              const errorText = await res.text().catch(() => "");
              console.warn(
                `[VoiceManager Diagnostic] /api/tts HTTP ${res.status}: ${errorText.slice(0, 150)}`,
              );
              return null;
            })
            .catch((err) => {
              if (err?.name === "AbortError") return null;
              console.warn("[VoiceManager Diagnostic] Network fetch error:", err);
              return null;
            });

          this.clientInFlight.set(cacheKey, fetchPromise);
        }

        let response: TTSResponse | null = null;
        try {
          response = await fetchPromise;
        } finally {
          this.clientInFlight.delete(cacheKey);
        }

        // Cancel if a newer speech request has taken over while we were fetching
        if (this.speechCounter !== currentSessionId) {
          return;
        }

        if (response?.success && response.audioBase64) {
          audioUri = `data:${response.mimeType || "audio/mpeg"};base64,${response.audioBase64}`;
          this.clientAudioCache.set(cacheKey, audioUri);
        }
      }

      // Check again if superseded before playback
      if (this.speechCounter !== currentSessionId) {
        return;
      }

      this.isLoading = false;

      // 3. If ElevenLabs audio is available, play via HTMLAudioElement
      if (audioUri) {
        await this.playAudioUri(audioUri, onStart, onEnd);
        return;
      }

      // 4. Fallback to Browser SpeechSynthesis (natural English, strip bracket tags)
      if (this.speechCounter === currentSessionId) {
        this.playBrowserTTS(cleanText, character, customerId, onStart, onEnd);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      console.warn("[VoiceManager] Audio synthesis error, falling back to browser speech:", err);
      this.isLoading = false;
      if (this.speechCounter === currentSessionId) {
        this.playBrowserTTS(cleanText, character, customerId, onStart, onEnd);
      }
      onError?.(err);
    }
  }

  private playAudioUri(uri: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(uri);
      audio.volume = this.volume;
      this.currentAudio = audio;

      audio.onplay = () => {
        this.isSpeaking = true;
        this.notify();
        onStart?.();
      };

      const cleanup = () => {
        if (this.currentAudio === audio) {
          this.isSpeaking = false;
          this.activeCharacter = null;
          this.activeText = null;
          this.currentAudio = null;
          this.notify();
        }
        onEnd?.();
        resolve();
      };

      audio.onended = cleanup;
      audio.onerror = () => {
        cleanup();
      };

      audio.play().catch((playErr) => {
        console.warn("[VoiceManager] HTMLAudioElement play() prevented:", playErr);
        cleanup();
      });
    });
  }

  private playBrowserTTS(
    text: string,
    character: CharacterType,
    customerId?: string,
    onStart?: () => void,
    onEnd?: () => void,
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Ensure bracket audio tags like [friendly] are never spoken by browser speech synthesis
      const speechReadyText = sanitizeTextForSpeech(text, { stripTags: true });
      const utterance = new SpeechSynthesisUtterance(speechReadyText);
      utterance.lang = "en-US";
      utterance.volume = this.volume;

      // Tailor voice pitch and rate to character
      if (character === "shopkeeper") {
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
      } else if (customerId === "student") {
        utterance.pitch = 1.25;
        utterance.rate = 1.05;
      } else if (customerId === "dadi") {
        utterance.pitch = 0.9;
        utterance.rate = 0.95;
      } else if (customerId === "aunty" || customerId === "parent") {
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }

      // Pick matching English voice from available system voices if possible
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const enVoices = voices.filter((v) => v.lang.startsWith("en"));
        if (enVoices.length > 0) {
          if (character === "shopkeeper") {
            const maleVoice = enVoices.find((v) => /david|george|male|guy/i.test(v.name));
            if (maleVoice) utterance.voice = maleVoice;
          } else if (customerId === "aunty" || customerId === "dadi" || customerId === "parent") {
            const femaleVoice = enVoices.find((v) => /zira|samantha|female|karen/i.test(v.name));
            if (femaleVoice) utterance.voice = femaleVoice;
          }
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.notify();
        onStart?.();
      };

      const finish = () => {
        this.isSpeaking = false;
        this.activeCharacter = null;
        this.activeText = null;
        this.notify();
        onEnd?.();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }
}

// Global voiceManager singleton
export const voiceManager = new VoiceManager();
