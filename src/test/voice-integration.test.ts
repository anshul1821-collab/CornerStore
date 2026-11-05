import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { sanitizeTextForSpeech, formatItemForSpeech } from "../lib/voice/sanitize";
import { synthesizeSpeech } from "../server/ttsService";
import { getVoiceForSpeaker, SHOPKEEPER_VOICE, CUSTOMER_ARCHETYPES } from "../lib/voice/characters";
import { voiceManager } from "../lib/voice/voiceManager";

describe("Enhanced Realistic ElevenLabs Voice Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    voiceManager.stop();
  });

  afterEach(() => {
    voiceManager.stop();
  });

  describe("Conversational Speech Formatting & Number Pronunciation", () => {
    it("converts all key rupee denominations into natural spoken words without commas", () => {
      expect(sanitizeTextForSpeech("Price is ₹1")).toBe("Price is 1 rupee");
      expect(sanitizeTextForSpeech("Total is ₹25")).toBe("Total is 25 rupees");
      expect(sanitizeTextForSpeech("Total is ₹45.50")).toBe("Total is 45 rupees and 50 paise");
      expect(sanitizeTextForSpeech("Total is ₹75")).toBe("Total is 75 rupees");
      expect(sanitizeTextForSpeech("Total is ₹135")).toBe("Total is 135 rupees");
      expect(sanitizeTextForSpeech("Total is ₹200")).toBe("Total is 200 rupees");
      expect(sanitizeTextForSpeech("Total is ₹1,250")).toBe("Total is 1250 rupees");
    });

    it("formats product unit notations into natural spoken grocery phrasing", () => {
      expect(formatItemForSpeech("Salt (1 kg)", 1)).toBe("a kilo of salt");
      expect(formatItemForSpeech("Sugar (1 kg)", 2)).toBe("2 kilos of sugar");
      expect(formatItemForSpeech("Eggs (6 pcs)", 1)).toBe("six eggs");
      expect(formatItemForSpeech("Bananas (1 Doz)", 1)).toBe("a dozen bananas");
      expect(formatItemForSpeech("Cooking Oil (1 Ltr)", 1)).toBe("a bottle of cooking oil");
      expect(formatItemForSpeech("Lentils (500g)", 1)).toBe("a packet of lentils");
      expect(formatItemForSpeech("Pencil", 1)).toBe("a pencil");
      expect(formatItemForSpeech("Pencil", 2)).toBe("2 pencils");
      expect(formatItemForSpeech("Eraser", 1)).toBe("an eraser");
      expect(formatItemForSpeech("Eraser", 2)).toBe("2 erasers");
      expect(formatItemForSpeech("Soap", 1)).toBe("a bar of soap");
      expect(formatItemForSpeech("Soap", 2)).toBe("2 bars of soap");
    });

    it("strips bracket tags cleanly by default so voice models never say brackets aloud", () => {
      const tagged = "[friendly] Hello! Here's ₹200 for your groceries! [excited] Perfect! ⭐";
      const sanitized = sanitizeTextForSpeech(tagged);

      expect(sanitized).toBe("Hello! Here's 200 rupees for your groceries! Perfect!");
      expect(sanitized).not.toContain("[friendly]");
      expect(sanitized).not.toContain("[excited]");
    });
  });

  describe("3-Voice System & Expressive Settings", () => {
    it("configures Shopkeeper with stability 0.40 and warm style exaggeration", () => {
      const voice = getVoiceForSpeaker("shopkeeper");
      expect(voice.voiceId).toBe(SHOPKEEPER_VOICE.voiceId);
      expect(voice.settings.stability).toBe(0.40);
      expect(voice.settings.similarity_boost).toBe(0.75);
      expect(voice.settings.style).toBe(0.20);
      expect(voice.settings.use_speaker_boost).toBe(true);
    });

    it("uses exactly 3 distinct voices in the entire application", () => {
      const boyVoice = getVoiceForSpeaker("customer", "student");
      const girlVoice = getVoiceForSpeaker("customer", "aunty");
      const shopkeeperVoice = getVoiceForSpeaker("shopkeeper");

      const uniqueVoices = new Set([boyVoice.voiceId, girlVoice.voiceId, shopkeeperVoice.voiceId]);
      expect(uniqueVoices.size).toBe(3);
    });

    it("correctly maps all male customers to the Boy Voice and all female customers to the Girl Voice", () => {
      const boyId = getVoiceForSpeaker("customer", "student").voiceId;
      const girlId = getVoiceForSpeaker("customer", "aunty").voiceId;

      // All male customers must use Boy Voice ID
      expect(getVoiceForSpeaker("customer", "uncle").voiceId).toBe(boyId);
      expect(getVoiceForSpeaker("customer", "student").voiceId).toBe(boyId);
      expect(getVoiceForSpeaker("customer", "delivery").voiceId).toBe(boyId);

      // All female customers must use Girl Voice ID
      expect(getVoiceForSpeaker("customer", "aunty").voiceId).toBe(girlId);
      expect(getVoiceForSpeaker("customer", "parent").voiceId).toBe(girlId);
      expect(getVoiceForSpeaker("customer", "dadi").voiceId).toBe(girlId);
    });
  });

  describe("Backend TTS Service, Models & Caching", () => {
    it("gracefully falls back when ELEVENLABS_API_KEY is not set", async () => {
      const origKey = process.env.ELEVENLABS_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const res = await synthesizeSpeech(
        {
          text: "Hello, welcome to our shop!",
          character: "shopkeeper",
        },
        "your_elevenlabs_api_key_here", // Placeholder key simulates unconfigured key
      );

      expect(res.success).toBe(false);
      expect(res.reason).toBe("NO_API_KEY");
      expect(res.fallback).toBe("browser-tts");

      if (origKey) process.env.ELEVENLABS_API_KEY = origKey;
    });

    it("caches audio and selects model based on dialogueType", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([10, 20, 30]).buffer,
      });
      global.fetch = mockFetch;

      const req = {
        text: "Thank you for shopping with us today!",
        character: "customer" as const,
        dialogueType: "fixed" as const,
      };

      const res1 = await synthesizeSpeech(req, "test_key");
      expect(res1.success).toBe(true);
      expect(res1.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify model passed in request was the high-expressiveness model for fixed dialogue
      const requestPayload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestPayload.model_id).toBe("eleven_multilingual_v2");
      expect(requestPayload.voice_settings.style).toBe(0.2);

      // Second call is retrieved from cache without network request
      const res2 = await synthesizeSpeech(req, "test_key");
      expect(res2.success).toBe(true);
      expect(res2.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Centralized VoiceManager & Shop Ambience", () => {
    it("supports playDoorChime, playCoinChime, and replayLastDialogue", () => {
      expect(typeof voiceManager.playDoorChime).toBe("function");
      expect(typeof voiceManager.playCoinChime).toBe("function");
      expect(typeof voiceManager.replayLastDialogue).toBe("function");
      expect(typeof voiceManager.setVoiceEnabled).toBe("function");

      // Should not throw even in test environment without full audio output
      expect(() => voiceManager.playDoorChime()).not.toThrow();
      expect(() => voiceManager.playCoinChime()).not.toThrow();
    });

    it("stops audio and clears active character on stop()", () => {
      voiceManager.setVoiceEnabled(true);
      voiceManager.stop();

      const state = voiceManager.getState();
      expect(state.isSpeaking).toBe(false);
      expect(state.activeCharacter).toBeNull();
      expect(state.activeText).toBeNull();
    });
  });
});
