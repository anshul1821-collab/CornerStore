import {
  CHARACTER_VOICE_CONFIGS,
  getCustomerVoiceType,
  type CharacterVoice,
  type SpeakerRole,
} from "./characters";
import { sanitizeTextForSpeech } from "./sanitize";
import type { TTSRequest, TTSResponse } from "./types";
import { ambienceEngine } from "@/lib/ambience";

export type CharacterType = CharacterVoice;

export interface SpeakOptions {
  text: string;
  character: CharacterType;
  customerId?: string | undefined;
  voiceId?: string | undefined;
  modelId?: string | undefined;
  dialogueType?: "fixed" | "dynamic" | undefined;
  priority?: "normal" | "high" | undefined;
  speaker?: SpeakerRole | undefined;
  onStart?: (() => void) | undefined;
  onEnd?: (() => void) | undefined;
  onError?: ((err: unknown) => void) | undefined;
}

export interface VoiceState {
  isSpeaking: boolean;
  activeCharacter: CharacterType | null;
  activeText: string | null;
  isEnabled: boolean;
  volume: number;
  isLoading: boolean;
  engine: "elevenlabs" | "browser-tts" | null;
}

class VoiceManager {
  private isEnabled = true;
  private volume = 1.0;
  private isSpeaking = false;
  private isLoading = false;
  private activeCharacter: CharacterType | null = null;
  private activeText: string | null = null;
  private engine: "elevenlabs" | "browser-tts" | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastDialogue: SpeakOptions | null = null;
  private listeners: Set<(state: VoiceState) => void> = new Set();
  private audioCache = new Map<string, HTMLAudioElement>();
  private speechCounter = 0;
  private simulatedTimer: ReturnType<typeof setTimeout> | null = null;
  private audioUnlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("kc-sound");
      if (savedSound === "off") {
        this.isEnabled = false;
        ambienceEngine.setMuted(true);
      }

      // Pre-unlock audio context on first user gesture
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
      engine: this.engine,
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

  public playDoorChime(): void {
    if (!this.isEnabled) return;
    ambienceEngine.playDoorChime();
  }

  public playCoinChime(): void {
    if (!this.isEnabled) return;
    ambienceEngine.playCoinChime();
  }

  public playSoundEffect(kind: "chime" | "coin" | "success" | "oops" | "tap"): void {
    if (!this.isEnabled) return;
    if (kind === "chime") this.playDoorChime();
    else if (kind === "coin") this.playCoinChime();
  }

  public startAmbience(): void {
    if (!this.isEnabled) return;
    ambienceEngine.startAmbience();
  }

  public stopAmbience(): void {
    ambienceEngine.stopAmbience();
  }

  public setAmbienceVolume(vol: number): void {
    ambienceEngine.setAmbienceVolume(vol);
  }

  public stop(): void {
    if (this.simulatedTimer) {
      clearTimeout(this.simulatedTimer);
      this.simulatedTimer = null;
    }

    this.speechCounter++;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.currentUtterance = null;

    if (this.isSpeaking || this.isLoading) {
      this.isSpeaking = false;
      this.isLoading = false;
      this.activeCharacter = null;
      this.activeText = null;
      this.engine = null;
      this.notify();
    }
  }

  public replay(): void {
    if (this.lastDialogue) {
      this.speak(this.lastDialogue);
    }
  }

  public replayLastDialogue(): void {
    this.replay();
  }

  public async speak(options: SpeakOptions): Promise<void> {
    const { text, character, customerId, onStart, onEnd, onError } = options;
    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    this.stop();
    this.lastDialogue = options;

    if (!this.isEnabled) {
      const words = text.split(/\s+/).length;
      const readingDelay = Math.max(2000, Math.min(6000, words * 380));
      this.simulatedTimer = setTimeout(() => {
        onEnd?.();
      }, readingDelay);
      return;
    }

    const currentSessionId = ++this.speechCounter;
    this.isLoading = true;
    this.activeCharacter = character;
    this.activeText = text;
    this.notify();

    try {
      const payload: TTSRequest = {
        text,
        character,
        customerId,
        speaker: options.speaker || (character === "shopkeeper" ? "shopkeeper" : "customer"),
        modelId: options.modelId,
        voiceId: options.voiceId,
      };

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (this.speechCounter !== currentSessionId) return;

      if (res.ok) {
        const data = (await res.json()) as TTSResponse;
        if (this.speechCounter !== currentSessionId) return;

        if (data.success && data.audioUrl) {
          this.isLoading = false;
          await this.playAudioFile(
            data.audioUrl,
            text,
            character,
            currentSessionId,
            onStart,
            onEnd,
          );
          return;
        }

        const cleanText = data.sanitizedText || sanitizeTextForSpeech(text);
        this.isLoading = false;
        this.playBrowserTTS(
          cleanText,
          text,
          character,
          customerId,
          currentSessionId,
          onStart,
          onEnd,
        );
        return;
      }
    } catch (err) {
      if (this.speechCounter !== currentSessionId) return;
      console.warn(
        "[VoiceManager] Audio synthesis network error, falling back to browser TTS:",
        err,
      );
      onError?.(err);
    }

    this.isLoading = false;
    const cleanText = sanitizeTextForSpeech(text);
    this.playBrowserTTS(cleanText, text, character, customerId, currentSessionId, onStart, onEnd);
  }

  private playAudioFile(
    audioUrl: string,
    originalText: string,
    character: CharacterType,
    sessionId: number,
    onStart?: () => void,
    onEnd?: () => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      let audio = this.audioCache.get(audioUrl);
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.preload = "auto";
        this.audioCache.set(audioUrl, audio);
      }

      audio.volume = this.volume;
      audio.currentTime = 0;
      this.currentAudio = audio;

      const cleanup = () => {
        audio.removeEventListener("ended", handleEnd);
        audio.removeEventListener("error", handleError);
      };

      const handleEnd = () => {
        cleanup();
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.isSpeaking = false;
          this.activeCharacter = null;
          this.activeText = null;
          this.engine = null;
          this.notify();
          onEnd?.();
        }
        resolve();
      };

      const handleError = () => {
        cleanup();
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.playBrowserTTS(
            originalText,
            originalText,
            character,
            undefined,
            sessionId,
            onStart,
            onEnd,
          );
        }
        resolve();
      };

      audio.addEventListener("ended", handleEnd);
      audio.addEventListener("error", handleError);

      try {
        const playPromise = audio.play();
        if (playPromise !== undefined && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              if (this.speechCounter !== sessionId) {
                audio.pause();
                return;
              }
              this.isSpeaking = true;
              this.activeCharacter = character;
              this.activeText = originalText;
              this.engine = "elevenlabs";
              this.notify();
              onStart?.();
            })
            .catch(() => {
              cleanup();
              this.playBrowserTTS(
                originalText,
                originalText,
                character,
                undefined,
                sessionId,
                onStart,
                onEnd,
              );
              resolve();
            });
        } else {
          this.isSpeaking = true;
          this.activeCharacter = character;
          this.activeText = originalText;
          this.engine = "elevenlabs";
          this.notify();
          onStart?.();
        }
      } catch {
        cleanup();
        this.playBrowserTTS(
          originalText,
          originalText,
          character,
          undefined,
          sessionId,
          onStart,
          onEnd,
        );
        resolve();
      }
    });
  }

  private playBrowserTTS(
    speechText: string,
    originalText: string,
    character: CharacterType,
    customerId: string | undefined,
    sessionId: number,
    onStart?: () => void,
    onEnd?: () => void,
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.isSpeaking = true;
      this.activeCharacter = character;
      this.activeText = originalText;
      this.engine = "browser-tts";
      this.notify();
      onStart?.();

      this.simulatedTimer = setTimeout(() => {
        if (this.speechCounter === sessionId) {
          this.isSpeaking = false;
          this.activeCharacter = null;
          this.activeText = null;
          this.engine = null;
          this.notify();
          onEnd?.();
        }
      }, 100);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      const config = CHARACTER_VOICE_CONFIGS[character] || CHARACTER_VOICE_CONFIGS.shopkeeper;

      utterance.pitch = config.browserFallback?.pitch ?? 1.0;
      utterance.rate = config.browserFallback?.rate ?? 1.0;
      utterance.volume = this.volume;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const targetGender = config.browserFallback?.gender ?? "male";
        const matchingVoice =
          voices.find((v) => {
            const name = v.name.toLowerCase();
            const isEnglish = v.lang.startsWith("en");
            if (!isEnglish) return false;
            if (targetGender === "female") {
              return (
                name.includes("female") ||
                name.includes("zira") ||
                name.includes("samantha") ||
                name.includes("victoria")
              );
            }
            return (
              name.includes("male") ||
              name.includes("david") ||
              name.includes("george") ||
              name.includes("alex")
            );
          }) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];

        if (matchingVoice) utterance.voice = matchingVoice;
      }

      this.currentUtterance = utterance;

      utterance.onstart = () => {
        if (this.speechCounter !== sessionId) return;
        this.isSpeaking = true;
        this.activeCharacter = character;
        this.activeText = originalText;
        this.engine = "browser-tts";
        this.notify();
        onStart?.();
      };

      const finish = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
          this.isSpeaking = false;
          this.activeCharacter = null;
          this.activeText = null;
          this.engine = null;
          this.notify();
          onEnd?.();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }
}

export const voiceManager = new VoiceManager();
export { getCustomerVoiceType };
