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
      expect(voice.settings.stability).toBe(0.4);
      expect(voice.settings.similarity_boost).toBe(0.75);
      expect(voice.settings.style).toBe(0.2);
      expect(voice.settings.use_speaker_boost).toBe(true);
    });

    it("uses exactly 3 distinct voices in the entire application", () => {
      const boyVoice = getVoiceForSpeaker("customer", "student");
      const girlVoice = getVoiceForSpeaker("customer", "aunty");
      const shopkeeperVoice = getVoiceForSpeaker("shopkeeper");

      const uniqueVoices = new Set([boyVoice.voiceId, girlVoice.voiceId, shopkeeperVoice.voiceId]);
      expect(uniqueVoices.size).toBe(3);

      // Verify exact canonical IDs
      expect(boyVoice.voiceId).toBe("9gKJk2fZsPLQCuOnaVLS");
      expect(girlVoice.voiceId).toBe("7vLdoQUU3acmEiAVXlaN");
      expect(shopkeeperVoice.voiceId).toBe("bbGyqGAEIg7zLT7U2n9A");
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

  describe("Vercel Serverless Function & Diagnostic Route", () => {
    it("returns safe diagnostic status without exposing private API keys", async () => {
      const { getDiagnosticStatus } = await import("../server/ttsService");
      const diag = getDiagnosticStatus();

      expect(diag.service).toContain("ElevenLabs TTS");
      expect(diag.voices.shopkeeper).toBeDefined();
      expect(diag.voices.girl).toBeDefined();
      expect(diag.voices.boy).toBeDefined();
      expect(diag.models.default).toBeDefined();

      // Masked key must NEVER be the raw key
      if (diag.auth.configured) {
        expect(diag.auth.maskedKey).toContain("...");
      } else {
        expect(diag.auth.maskedKey).toBe("not_set");
      }
    });

    it("handles Vercel serverless request via api/tts.ts", async () => {
      const { default: handler } = await import("../../api/tts");

      // Test GET diagnostic endpoint
      const headers: Record<string, string> = {};
      let responseBody = "";

      const mockReq = {
        method: "GET",
        headers: {},
      };
      const mockRes = {
        statusCode: 200,
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        end: (data?: string) => {
          if (data) responseBody = data;
        },
      };

      await handler(mockReq, mockRes);
      expect(headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(headers["Content-Type"]).toBe("application/json");

      const parsed = JSON.parse(responseBody);
      expect(parsed.service).toContain("ElevenLabs");
      expect(parsed.auth).toBeDefined();

      // Test Web Standard Request object
      const webReq = new Request("http://localhost/api/tts", { method: "GET" });
      const webRes = await handler(webReq);
      expect(webRes).toBeInstanceOf(Response);
      const webJson = await webRes.json();
      expect(webJson.service).toContain("ElevenLabs");
      expect(webJson.voices.boy).toBe("9gKJk2fZsPLQCuOnaVLS");
      expect(webJson.voices.girl).toBe("7vLdoQUU3acmEiAVXlaN");
      expect(webJson.voices.shopkeeper).toBe("bbGyqGAEIg7zLT7U2n9A");
      expect(webJson.models.default).toBe("eleven_multilingual_v2");
    });

    it("supports TanStack Start native server functions for ElevenLabs", async () => {
      const { synthesizeSpeechServerFn, getDiagnosticStatusServerFn } =
        await import("../server/voiceServerFn");

      expect(typeof synthesizeSpeechServerFn).toBe("function");
      expect(typeof getDiagnosticStatusServerFn).toBe("function");
    });
  });
});
