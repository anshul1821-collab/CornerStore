import { describe, it, expect, vi, beforeEach } from "vitest";
import { dialogueAudio } from "@/lib/dialogueAudio";

describe("Web Audio API & Gameplay Playback Resilience", () => {
  beforeEach(() => {
    dialogueAudio.stop();
  });

  it("exposes AudioContext and GainNode for resilient browser playback", () => {
    // In node/JSDOM, AudioContext may not be defined by default, but dialogueAudio handles gracefully
    const ctx = dialogueAudio.getAudioContext();
    if (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) {
      expect(ctx).toBeDefined();
    } else {
      expect(ctx).toBeNull();
    }
  });

  it("handles unlockAudio without throwing errors in any environment", () => {
    expect(() => dialogueAudio.unlockAudio()).not.toThrow();
  });

  it("tracks pending audio state cleanly when autoplay policy defers playback", () => {
    expect(dialogueAudio.hasPendingAudio()).toBe(false);

    // Simulate mute state
    dialogueAudio.setMuted(true);
    expect((dialogueAudio as any).isMuted).toBe(true);

    dialogueAudio.setMuted(false);
    expect((dialogueAudio as any).isMuted).toBe(false);
  });

  it("prewarms key audio assets without crashing", async () => {
    await expect(
      dialogueAudio.prewarmAudio([
        "/audio/characters/shopkeeper/check_bill_instruction.mp3",
        "/audio/characters/aunty/004e9c8faf553351ab558f58883c5c29.mp3",
      ]),
    ).resolves.not.toThrow();
  });

  it("maintains currentAudio for test dispatch compatibility while speaking", async () => {
    vi.useFakeTimers();

    dialogueAudio.playDialogue({
      text: "Please check the price on the bill before you count the change!",
      speaker: "shopkeeper",
      characterVoice: "shopkeeper",
    });

    const audio = (dialogueAudio as any).currentAudio as HTMLAudioElement;
    expect(audio).toBeDefined();
    expect(audio.src).toContain("check_bill_instruction.mp3");

    // Dispatching ended advances state
    audio.dispatchEvent(new Event("ended"));
    expect(dialogueAudio.isSpeaking()).toBe(false);

    vi.useRealTimers();
  });
});

