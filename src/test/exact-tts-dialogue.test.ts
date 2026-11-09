import { describe, it, expect } from "vitest";
import {
  sanitizeTextForSpeech,
  formatCurrencyForSpeech,
  numberToWords,
} from "../lib/voice/sanitize";
import { CHARACTER_VOICE_CONFIGS, getCustomerVoiceType } from "../lib/voice/characters";
import {
  formatCustomerOrderText,
  getCustomerOrderDialogue,
  getFeedbackDialogue,
  getShopkeeperPraise,
  getShopkeeperWelcome,
} from "../components/game/3d/dialogue";
import { synthesizeSpeech } from "../server/ttsService";
import type { Scenario, SubmissionResult } from "../game/types";

function makeTestScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "l1_c1",
    level: 1,
    customer: {
      id: "aunty",
      emoji: "👩🏽",
      name: { en: "Mrs. Priya" },
      greeting: { en: "Hello, dear!" },
    },
    items: [],
    subtotal: 50,
    discount: null,
    payable: 50,
    paid: 100,
    paidPieces: ["n100"],
    timeLimit: null,
    ...overrides,
  };
}

describe("Exact Text-to-Speech & Character Dialogue System", () => {
  describe("1. Currency & Spoken Phrasing Sanitization", () => {
    it("converts numbers to words correctly", () => {
      expect(numberToWords(0)).toBe("zero");
      expect(numberToWords(1)).toBe("one");
      expect(numberToWords(5)).toBe("five");
      expect(numberToWords(10)).toBe("ten");
      expect(numberToWords(15)).toBe("fifteen");
      expect(numberToWords(50)).toBe("fifty");
      expect(numberToWords(100)).toBe("one hundred");
      expect(numberToWords(200)).toBe("two hundred");
      expect(numberToWords(150)).toBe("one hundred and fifty");
    });

    it("expands dollar amounts naturally for human speech", () => {
      expect(formatCurrencyForSpeech(5.0)).toBe("five dollars");
      expect(formatCurrencyForSpeech(1.0)).toBe("one dollar");
      expect(formatCurrencyForSpeech(10.5)).toBe("ten dollars and fifty cents");
      expect(formatCurrencyForSpeech(0.5)).toBe("fifty cents");
      expect(formatCurrencyForSpeech(200.0)).toBe("two hundred dollars");
      expect(formatCurrencyForSpeech(150.0)).toBe("one hundred and fifty dollars");
    });

    it("sanitizes dialogue strings without mutating punctuation", () => {
      const input = "Hello, dear! I'd like Juice Box. Here's $50.00!";
      const spoken = sanitizeTextForSpeech(input);
      expect(spoken).toBe("Hello, dear! I'd like Juice Box. Here's fifty dollars!");
      expect(spoken).toContain("fifty dollars");
      expect(spoken).toContain("Hello, dear!");
      expect(spoken).not.toContain("$");
    });

    it("strips emojis cleanly for voice synthesis", () => {
      const input = "Awesome, perfect change! Thanks a lot! 👍 😊";
      const spoken = sanitizeTextForSpeech(input);
      expect(spoken).toBe("Awesome, perfect change! Thanks a lot!");
      expect(spoken).not.toContain("👍");
      expect(spoken).not.toContain("😊");
    });
  });

  describe("2. Testing 10+ Distinct Dialogues Across All Characters", () => {
    // Dialogue 1: Mrs. Priya (Aunty - Girl voice)
    it("Dialogue 1: Mrs. Priya order dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "aunty",
          emoji: "👩🏽",
          name: { en: "Mrs. Priya" },
          greeting: { en: "Hello, dear!" },
        },
        items: [
          { productId: "juice", name: { en: "Juice Box" }, unitPrice: 20, qty: 1, emoji: "🧃" },
        ],
        payable: 20,
        paid: 50,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Mrs. Priya");
      expect(d.characterVoice).toBe("girl");
      expect(d.text).toBe("Hello, dear! I'd like Juice Box. Here's $50.00!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe("Hello, dear! I'd like Juice Box. Here's fifty dollars!");
    });

    // Dialogue 2: Mr. Sharma (Uncle - Male voice) with exact payment
    it("Dialogue 2: Mr. Sharma exact order dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "uncle",
          emoji: "👨🏽‍🦳",
          name: { en: "Mr. Sharma" },
          greeting: { en: "Hello there!" },
        },
        items: [{ productId: "soap", name: { en: "Soap" }, unitPrice: 10, qty: 1, emoji: "🧼" }],
        payable: 10,
        paid: 10,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Mr. Sharma");
      expect(d.characterVoice).toBe("boy");
      expect(d.text).toBe("Hello there! I'd like Soap. Here's exactly $10.00!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe("Hello there! I'd like Soap. Here's exactly ten dollars!");
    });

    // Dialogue 3: Rohan (Student - Boy voice) with multiple items
    it("Dialogue 3: Rohan student order dialogue with multiple items", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "student",
          emoji: "🧒🏽",
          name: { en: "Rohan" },
          greeting: { en: "Hi there!" },
        },
        items: [
          { productId: "pencil", name: { en: "Pencil" }, unitPrice: 5, qty: 2, emoji: "✏️" },
          { productId: "eraser", name: { en: "Eraser" }, unitPrice: 5, qty: 1, emoji: "🧹" },
        ],
        payable: 15,
        paid: 20,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Rohan");
      expect(d.characterVoice).toBe("boy");
      expect(d.text).toBe("Hi there! I'd like 2 Pencil and Eraser. Here's $20.00!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe("Hi there! I'd like two Pencil and Eraser. Here's twenty dollars!");
    });

    // Dialogue 4: Meera & Anu (Parent - Girl voice)
    it("Dialogue 4: Meera & Anu order dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "parent",
          emoji: "👩🏽‍👧🏽",
          name: { en: "Meera & Anu" },
          greeting: { en: "Good morning!" },
        },
        items: [
          { productId: "milk", name: { en: "Milk Packet" }, unitPrice: 30, qty: 1, emoji: "🥛" },
        ],
        payable: 30,
        paid: 50,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Meera & Anu");
      expect(d.characterVoice).toBe("girl");
      expect(d.text).toBe("Good morning! I'd like Milk Packet. Here's $50.00!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe("Good morning! I'd like Milk Packet. Here's fifty dollars!");
    });

    // Dialogue 5: Raju (Delivery boy - Boy voice)
    it("Dialogue 5: Raju order dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "delivery",
          emoji: "🧑🏽‍🔧",
          name: { en: "Raju" },
          greeting: { en: "Hey there!" },
        },
        items: [{ productId: "chips", name: { en: "Chips" }, unitPrice: 10, qty: 1, emoji: "🥔" }],
        payable: 10,
        paid: 20,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Raju");
      expect(d.characterVoice).toBe("boy");
      expect(d.text).toBe("Hey there! I'd like Chips. Here's $20.00!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe("Hey there! I'd like Chips. Here's twenty dollars!");
    });

    // Dialogue 5b: Jessica (Girl voice)
    it("Dialogue 5b: Jessica order dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "girl",
          emoji: "👧🏽",
          name: { en: "Jessica" },
          greeting: { en: "Hello, dear!" },
        },
        items: [{ productId: "juice", name: { en: "Juice Box" }, unitPrice: 20, qty: 1, emoji: "🧃" }],
        payable: 20,
        paid: 50,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Jessica");
      expect(d.characterVoice).toBe("girl");
      expect(d.text).toBe("Hello, dear! I'd like Juice Box. Here's $50.00!");
    });

    // Dialogue 6: Grandma (Dadi - Girl/Elder female voice)
    it("Dialogue 6: Grandma order dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "dadi",
          emoji: "👵🏽",
          name: { en: "Grandma" },
          greeting: { en: "Hello, dear!" },
        },
        items: [{ productId: "bread", name: { en: "Bread" }, unitPrice: 25, qty: 1, emoji: "🍞" }],
        payable: 25,
        paid: 100,
      });

      const d = getCustomerOrderDialogue(scenario, "en");
      expect(d.speaker).toBe("customer");
      expect(d.speakerName).toBe("Grandma");
      expect(d.characterVoice).toBe("girl");
      expect(d.text).toBe("Hello, dear! I'd like Bread. Here's $100.00!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe("Hello, dear! I'd like Bread. Here's one hundred dollars!");
    });

    // Dialogue 7: Shopkeeper welcome
    it("Dialogue 7: Shopkeeper welcome dialogue", () => {
      const d = getShopkeeperWelcome("en");
      expect(d.speaker).toBe("shopkeeper");
      expect(d.speakerName).toBe("Shopkeeper");
      expect(d.characterVoice).toBe("shopkeeper");
      expect(d.text).toBe("Welcome to the shop! Great to see you today. What can I get for you?");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe(d.text);
    });

    // Dialogue 8: Shopkeeper praise on correct transaction
    it("Dialogue 8: Shopkeeper praise dialogue", () => {
      const d = getShopkeeperPraise("en");
      expect(d.speaker).toBe("shopkeeper");
      expect(d.speakerName).toBe("Shopkeeper");
      expect(d.characterVoice).toBe("shopkeeper");
      expect(d.text).toBe("Spot on! That's the exact change. Brilliant calculation!");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe(d.text);
    });

    // Dialogue 9: Customer feedback on correct change
    it("Dialogue 9: Customer gratitude on correct change", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "aunty",
          emoji: "👩🏽",
          name: { en: "Mrs. Priya" },
          greeting: { en: "Hello, dear!" },
        },
      });
      const result: SubmissionResult = { kind: "correct", stars: 3 };

      const d = getFeedbackDialogue(scenario, result, "en");
      expect(d.speaker).toBe("customer");
      expect(d.characterVoice).toBe("girl");
      expect(d.text).toBe("Thank you so much! That's the exact change. Have a wonderful day!");
    });

    // Dialogue 10: Customer feedback on too little change ($5.00 short)
    it("Dialogue 10: Customer feedback when change is short ($5.00 short)", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "uncle",
          emoji: "👨🏽‍🦳",
          name: { en: "Mr. Sharma" },
          greeting: { en: "Hello there!" },
        },
        payable: 45,
        paid: 50,
      });
      const result: SubmissionResult = { kind: "too-little", difference: 5 };

      const d = getFeedbackDialogue(scenario, result, "en");
      expect(d.speaker).toBe("customer");
      expect(d.text).toBe(
        "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
      );

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe(
        "Hmm, wait a second... looks like this is five dollars short. Could you please check?",
      );
    });

    // Dialogue 11: Customer feedback on too much change ($10.50 extra)
    it("Dialogue 11: Customer feedback when change is too much ($10.50 extra)", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "student",
          emoji: "🧒🏽",
          name: { en: "Rohan" },
          greeting: { en: "Hi there!" },
        },
        payable: 10,
        paid: 50,
      });
      const result: SubmissionResult = { kind: "too-much", difference: 10.5 };

      const d = getFeedbackDialogue(scenario, result, "en");
      expect(d.speaker).toBe("customer");
      expect(d.text).toBe("Oh, hold on — you gave me $10.50 extra! Take a quick look.");

      const spoken = sanitizeTextForSpeech(d.text);
      expect(spoken).toBe(
        "Oh, hold on — you gave me ten dollars and fifty cents extra! Take a quick look.",
      );
    });

    // Dialogue 12: Customer timeout feedback
    it("Dialogue 12: Customer timeout dialogue", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "dadi",
          emoji: "👵🏽",
          name: { en: "Grandma" },
          greeting: { en: "Hello, dear!" },
        },
        payable: 10,
        paid: 20,
      });
      const result: SubmissionResult = { kind: "timeout" };

      const d = getFeedbackDialogue(scenario, result, "en");
      expect(d.speaker).toBe("customer");
      expect(d.text).toBe("No rush at all! Take your time to count the notes.");
    });
  });

  describe("3. ElevenLabs TTS Service & Caching Mechanism", () => {
    it("resolves character voice configs with distinct voices", () => {
      expect(CHARACTER_VOICE_CONFIGS.shopkeeper.voiceId).toBe("cjVigY5qzO86Huf0OWal");
      expect(CHARACTER_VOICE_CONFIGS.boy.voiceId).toBe("bIHbv24MWmeRgasZH58o");
      expect(CHARACTER_VOICE_CONFIGS.girl.voiceId).toBe("cgSgspJ2msm6clMCkdW9");

      // Verify male and female character mappings
      expect(getCustomerVoiceType("student")).toBe("boy");
      expect(getCustomerVoiceType("aunty")).toBe("girl");
      expect(getCustomerVoiceType("parent")).toBe("girl");
      expect(getCustomerVoiceType("dadi")).toBe("girl");
      expect(getCustomerVoiceType("delivery")).toBe("boy");
    });

    it("synthesizeSpeech handles empty input gracefully", async () => {
      const res = await synthesizeSpeech({ text: "", character: "shopkeeper" });
      expect(res.success).toBe(false);
      expect(res.reason).toBe("EMPTY_TEXT");
    });

    it("strictly forbids robotic browser fallback when synthesis is unavailable", async () => {
      const res = await synthesizeSpeech({
        text: "Hello, dear! I'd like Juice Box. Here's $50.00!",
        character: "girl",
        customerId: "aunty",
      });

      expect(res.sanitizedText).toBe("Hello, dear! I'd like Juice Box. Here's fifty dollars!");
      // Fallback is strictly "none" to guarantee zero robotic speech synthesis
      if (!res.success) {
        expect(res.fallback).toBe("none");
      }
    });

    it("displayed text matches single source of truth across components", () => {
      const scenario = makeTestScenario({
        customer: {
          id: "aunty",
          emoji: "👩🏽",
          name: { en: "Mrs. Priya" },
          greeting: { en: "Hello, dear!" },
        },
        items: [
          { productId: "juice", name: { en: "Juice Box" }, unitPrice: 20, qty: 1, emoji: "🧃" },
        ],
        payable: 20,
        paid: 50,
      });

      const orderText = formatCustomerOrderText(scenario, "en");
      const orderDialogue = getCustomerOrderDialogue(scenario, "en");

      // The dialogue text must be IDENTICAL to the customer bubble text
      expect(orderDialogue.text).toBe(orderText);
      expect(orderDialogue.text).toBe("Hello, dear! I'd like Juice Box. Here's $50.00!");
    });

    it("verifies gameplay audio matches Voice Studio reference standard across all characters and categories", async () => {
      // 1. Shopkeeper Greeting
      const shopkeeperWelcome = await synthesizeSpeech({
        text: "Welcome to the shop! Great to see you today. What can I get for you?",
        character: "shopkeeper",
      });
      expect(shopkeeperWelcome.success).toBe(true);
      expect(shopkeeperWelcome.audioUrl).toBe("/audio/characters/shopkeeper/1_greetings.mp3");

      // 2. Shopkeeper Praise (Excited Expression)
      const shopkeeperPraise = await synthesizeSpeech({
        text: "Spot on! That's the exact change. Brilliant calculation!",
        character: "shopkeeper",
      });
      expect(shopkeeperPraise.success).toBe(true);
      expect(shopkeeperPraise.audioUrl).toBe(
        "/audio/characters/shopkeeper/4_excited_expressions.mp3",
      );

      // 3. Mrs. Priya (Normal conversation / payment order)
      const auntyOrder = await synthesizeSpeech({
        text: "Hello, dear! I'd like Juice Box. Here's $50.00!",
        character: "girl",
        customerId: "aunty",
      });
      expect(auntyOrder.success).toBe(true);
      expect(auntyOrder.audioUrl).toBe("/audio/characters/aunty/2_normal_conversations.mp3");

      // 4. Mr. Sharma (Uncle question)
      const uncleQuestion = await synthesizeSpeech({
        text: "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
        character: "boy",
        customerId: "uncle",
      });
      expect(uncleQuestion.success).toBe(true);
      expect(uncleQuestion.audioUrl).toBe("/audio/characters/uncle/3_questions.mp3");

      // 5. Jessica / Girl (Thank-you message)
      const girlThankYou = await synthesizeSpeech({
        text: "Thank you so much! That's the exact change. Have a wonderful day!",
        character: "girl",
      });
      expect(girlThankYou.success).toBe(true);
      expect(girlThankYou.audioUrl).toBe("/audio/characters/girl/5_thank_you_messages.mp3");

      // 6. Grandma / Dadi (Longer sentences & Encouragement)
      const dadiEncourage = await synthesizeSpeech({
        text: "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
        character: "girl",
        customerId: "dadi",
      });
      expect(dadiEncourage.success).toBe(true);
      expect(dadiEncourage.audioUrl).toBe("/audio/characters/dadi/6_longer_sentences.mp3");

      // 7. Rohan / Student (Dollar amounts sentence)
      const studentAmount = await synthesizeSpeech({
        text: "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
        character: "boy",
        customerId: "student",
      });
      expect(studentAmount.success).toBe(true);
      expect(studentAmount.audioUrl).toBe(
        "/audio/characters/student/7_sentences_containing_dollar_amounts.mp3",
      );

      // 8. Grandma / Dadi Correct Change Gratitude
      const dadiPraise = await synthesizeSpeech({
        text: "Thank you so much, dear. You counted that beautifully!",
        character: "girl",
        customerId: "dadi",
      });
      expect(dadiPraise.success).toBe(true);
      expect(dadiPraise.audioUrl).toContain("/audio/characters/dadi/");

      // 9. Rohan / Student Correct Change Gratitude
      const studentPraise = await synthesizeSpeech({
        text: "Awesome, perfect change! Thanks a lot!",
        character: "boy",
        customerId: "student",
      });
      expect(studentPraise.success).toBe(true);
      expect(studentPraise.audioUrl).toContain("/audio/characters/student/");

      // 10. Mr. Sharma / Uncle Correct Change Gratitude
      const unclePraise = await synthesizeSpeech({
        text: "Wonderful! That is spot on. Thank you!",
        character: "boy",
        customerId: "uncle",
      });
      expect(unclePraise.success).toBe(true);
      expect(unclePraise.audioUrl).toContain("/audio/characters/uncle/");
    });
  });
});
