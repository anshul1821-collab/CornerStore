import { describe, it, expect } from "vitest";
import { resolveStudioAudio, PREGENERATED_STUDIO_MAP } from "@/lib/dialogueAudio";
import { CUSTOMER_VOICE_PROFILES, getCustomerVoiceType } from "@/lib/voice/characters";
import {
  getCustomerOrderDialogue,
  getFeedbackDialogue,
  getShopkeeperCheckBillInstruction,
} from "@/components/game/3d/dialogue";
import { CUSTOMERS, generateScenario } from "@/game/engine";
import type { SubmissionResult } from "@/game/types";

describe("Customer Dialogue Audio Playback Verification", () => {
  describe("1. Customer Character Voice Mapping Verification", () => {
    it("maps every customer to their exact voice actor and voice ID", () => {
      // Mrs. Priya -> Sarah
      expect(CUSTOMER_VOICE_PROFILES["aunty"]?.name).toContain("Sarah");
      expect(CUSTOMER_VOICE_PROFILES["aunty"]?.voiceId).toBe("EXAVITQu4vr4xnSDxMaL");

      // Mr. Sharma -> Roger
      expect(CUSTOMER_VOICE_PROFILES["uncle"]?.name).toContain("Roger");
      expect(CUSTOMER_VOICE_PROFILES["uncle"]?.voiceId).toBe("CwhRBWXzGAHq8TQ4Fs17");

      // Rohan -> Will
      expect(CUSTOMER_VOICE_PROFILES["student"]?.name).toContain("Will");
      expect(CUSTOMER_VOICE_PROFILES["student"]?.voiceId).toBe("bIHbv24MWmeRgasZH58o");

      // Jessica -> Jessica
      expect(CUSTOMER_VOICE_PROFILES["girl"]?.name).toContain("Jessica");
      expect(CUSTOMER_VOICE_PROFILES["girl"]?.voiceId).toBe("cgSgspJ2msm6clMCkdW9");

      // Grandma -> Alice
      expect(CUSTOMER_VOICE_PROFILES["dadi"]?.name).toContain("Alice");
      expect(CUSTOMER_VOICE_PROFILES["dadi"]?.voiceId).toBe("Xb7hH8MSUJpSbSDYk0k2");

      // Meera and Anu -> Laura
      expect(CUSTOMER_VOICE_PROFILES["parent"]?.name).toContain("Laura");
      expect(CUSTOMER_VOICE_PROFILES["parent"]?.voiceId).toBe("FGY2WhTYpPnrIDTdsKH5");

      // Raju -> Callum
      expect(CUSTOMER_VOICE_PROFILES["delivery"]?.name).toContain("Callum");
      expect(CUSTOMER_VOICE_PROFILES["delivery"]?.voiceId).toBe("N2lVS1w4EtoT3dr4eOWO");
    });
  });

  describe("2. Order Dialogue Audio Resolution for All 7 Customers", () => {
    // 1. Mrs. Priya
    it("1. Mrs. Priya order resolves to verified studio audio", () => {
      const text = "Hello, dear! I'd like 2 Chocolate. Here's $200.00!";
      const audioUrl = resolveStudioAudio(text, "aunty", "girl", "customer");
      expect(audioUrl).toBe("/audio/characters/aunty/004e9c8faf553351ab558f58883c5c29.mp3");
    });

    // 2. Mr. Sharma
    it("2. Mr. Sharma order resolves to verified studio audio", () => {
      const text = "Hello there! I'd like 2 Chocolate. Here's $200.00!";
      const audioUrl = resolveStudioAudio(text, "uncle", "boy", "customer");
      expect(audioUrl).toBe("/audio/characters/uncle/7a7447887a0606bd7c1e9f0191ebc594.mp3");
    });

    // 3. Rohan
    it("3. Rohan order resolves to verified studio audio", () => {
      const text = "Hi there! I'd like Chips. Here's $20.00!";
      const audioUrl = resolveStudioAudio(text, "student", "boy", "customer");
      expect(audioUrl).toBe("/audio/characters/student/54cd930f008d7f60c45bacfe78d38c11.mp3");
    });

    // 4. Jessica
    it("4. Jessica order resolves to verified studio audio", () => {
      const text = "Hello, dear! I'd like Juice Box. Here's $50.00!";
      const audioUrl = resolveStudioAudio(text, "girl", "girl", "customer");
      expect(audioUrl).toBe("/audio/characters/aunty/77781fa32d38bdbe1960271800d0bdb7.mp3");
    });

    // 5. Grandma (Dadi)
    it("5. Grandma order resolves to verified studio audio", () => {
      const text = "Hello, dear! I'd like Bread. Here's $100.00!";
      const audioUrl = resolveStudioAudio(text, "dadi", "girl", "customer");
      expect(audioUrl).toBe("/audio/characters/dadi/ab713783d86d08cb1024d03be596f96e.mp3");
    });

    // 6. Meera and Anu
    it("6. Meera and Anu order resolves to verified studio audio", () => {
      const text = "Good morning! I'd like Milk Packet. Here's $50.00!";
      const audioUrl = resolveStudioAudio(text, "parent", "girl", "customer");
      expect(audioUrl).toBe("/audio/characters/parent/d35801d023442bc0fef0187e603c7836.mp3");
    });

    // 7. Raju (Delivery)
    it("7. Raju order resolves to verified studio audio", () => {
      const text = "Hey there! I'd like Cold Drink. Here's $50.00!";
      const audioUrl = resolveStudioAudio(text, "delivery", "boy", "customer");
      expect(audioUrl).toBe("/audio/characters/delivery/fd977d9e003712f9d84dc6eb2098fb5d.mp3");
    });
  });

  describe("3. Customer Feedback Audio Resolution (Thank You & Incorrect Change)", () => {
    it("Mrs. Priya thank-you message resolves to studio audio", () => {
      const scenario = generateScenario(1, 0); // aunty
      const result: SubmissionResult = { kind: "correct", stars: 3 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/aunty/d421208a67bf66b53565b495a3527d06.mp3");
    });

    it("Mr. Sharma thank-you message resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "uncle")! };
      const result: SubmissionResult = { kind: "correct", stars: 3 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/uncle/c2170b6f6a00da0029d714b8f54ed3b2.mp3");
    });

    it("Mr. Sharma short-change feedback resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "uncle")! };
      const result: SubmissionResult = { kind: "too-little", difference: 5 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/uncle/0623f7cbc9a1ae5a317b446facc0e87a.mp3");
    });

    it("Rohan thank-you message resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "student")! };
      const result: SubmissionResult = { kind: "correct", stars: 3 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/student/7c49ff4e495a109e08aa694ca6f350c7.mp3");
    });

    it("Rohan extra-change feedback resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "student")! };
      const result: SubmissionResult = { kind: "too-much", difference: 10.5 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/student/e0e3f67bb780492e7db7df76c07b7217.mp3");
    });

    it("Grandma thank-you message resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "dadi")! };
      const result: SubmissionResult = { kind: "correct", stars: 3 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/dadi/e7c6c0618854e7f4fd1db3e15b46f650.mp3");
    });

    it("Grandma patience encouragement resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "dadi")! };
      const result: SubmissionResult = { kind: "too-little", difference: 10 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/dadi/08b9c67dffeca45549399a28960bc1b8.mp3");
    });

    it("Jessica thank-you message resolves to studio audio", () => {
      const scenario = { ...generateScenario(1, 0), customer: CUSTOMERS.find((c) => c.id === "girl")! };
      const result: SubmissionResult = { kind: "correct", stars: 3 };
      const d = getFeedbackDialogue(scenario, result, "en");
      const audioUrl = resolveStudioAudio(d.text, d.customerId, d.characterVoice, "customer");
      expect(audioUrl).toBe("/audio/characters/girl/29e5f23d2143f55b01f41bc9d1f75d1c.mp3");
    });
  });

  describe("4. Automatic Shopkeeper Instruction Dialogue Sequence", () => {
    it("generates the exact required instruction text and shopkeeper voice configuration", async () => {
      const { getShopkeeperCheckBillInstruction } = await import("@/components/game/3d/dialogue");
      const { CHARACTER_VOICE_CONFIGS } = await import("@/lib/voice/characters");

      const instruction = getShopkeeperCheckBillInstruction("en");

      // Exact text requirement: "Please check the price on the bill before you count the change!"
      expect(instruction.text).toBe("Please check the price on the bill before you count the change!");
      expect(instruction.speaker).toBe("shopkeeper");
      expect(instruction.speakerName).toBe("Shopkeeper");
      expect(instruction.avatarEmoji).toBe("👨🏽‍🦳");
      expect(instruction.characterVoice).toBe("shopkeeper");

      // Verify shopkeeper voice identity is Eric (cjVigY5qzO86Huf0OWal)
      const shopkeeperVoice = CHARACTER_VOICE_CONFIGS["shopkeeper"];
      expect(shopkeeperVoice.name).toContain("Eric");
      expect(shopkeeperVoice.voiceId).toBe("cjVigY5qzO86Huf0OWal");
      expect(shopkeeperVoice.settings.stability).toBe(0.4);
      expect(shopkeeperVoice.settings.style).toBe(0.4);
      expect(shopkeeperVoice.settings.use_speaker_boost).toBe(true);
    });

    it("strictly ensures visible dialogue box is single source of truth and plays exact matching recordings", () => {
      // 1. Exact instruction resolves to authentic recording of that exact sentence
      const instructionText = "Please check the price on the bill before you count the change!";
      const audioUrl = resolveStudioAudio(instructionText, undefined, "shopkeeper", "shopkeeper");
      expect(audioUrl).toBe("/audio/characters/shopkeeper/check_bill_instruction.mp3");

      // 2. Custom instruction resolves to its authentic recording
      const customText = "Please check the price in the bill!";
      const customAudioUrl = resolveStudioAudio(customText, undefined, "shopkeeper", "shopkeeper");
      expect(customAudioUrl).toBe("/audio/characters/shopkeeper/check_price_in_bill.mp3");

      // 3. Unrelated or unmapped text does NOT resolve to greeting or hardcoded recording
      const unknownText = "Let's check the items one by one!";
      const unknownAudio = resolveStudioAudio(unknownText, undefined, "shopkeeper", "shopkeeper");
      expect(unknownAudio).toBeNull(); // Strictly routes to dynamic /api/tts

      // 4. Exact praise text ONLY matches its exact studio recording
      const praiseText = "Spot on! That's the exact change. Brilliant calculation!";
      const praiseAudio = resolveStudioAudio(praiseText, undefined, "shopkeeper", "shopkeeper");
      expect(praiseAudio).toBe("/audio/characters/shopkeeper/3a8be5f7c5284849218c6ccd2ded7a7b.mp3");

      // 5. Exact greeting text ONLY matches its exact studio recording
      const greetingText = "Welcome to the shop! Great to see you today. What can I get for you?";
      const greetingAudio = resolveStudioAudio(greetingText, undefined, "shopkeeper", "shopkeeper");
      expect(greetingAudio).toBe("/audio/characters/shopkeeper/9756face6b3ff410afb733eef033cc62.mp3");
    });

    it("verifies customer order -> shopkeeper instruction flow across ALL Levels 1 to 10", () => {
      const instruction = getShopkeeperCheckBillInstruction("en");
      expect(instruction.speaker).toBe("shopkeeper");
      expect(instruction.speakerName).toBe("Shopkeeper");
      expect(instruction.characterVoice).toBe("shopkeeper");
      expect(instruction.text).toBe("Please check the price on the bill before you count the change!");

      // Test at least one customer interaction in every level from 1 to 10
      for (let levelNum = 1; levelNum <= 10; levelNum++) {
        const scenario = generateScenario(levelNum, 0);
        const order = getCustomerOrderDialogue(scenario, "en");

        // Step 1: Customer order is generated with valid text and customer ID
        expect(order.text.length).toBeGreaterThan(10);
        expect(order.speaker).toBe("customer");
        expect(order.customerId).toBe(scenario.customer.id);

        // Step 2: Audio resolves for customer
        const customerAudio = resolveStudioAudio(order.text, order.customerId, order.characterVoice, "customer");
        expect(customerAudio).toBeTruthy();

        // Step 3: Shopkeeper instruction follows exactly
        expect(instruction.text).toBe("Please check the price on the bill before you count the change!");
        expect(instruction.speaker).toBe("shopkeeper");
      }
    });

    it("verifies exact sequence timing: Customer audio finishes -> 3000ms pause -> Shopkeeper speaks -> Customer order restored", async () => {
      const { dialogueAudio } = await import("@/lib/dialogueAudio");
      const { vi } = await import("vitest");

      vi.useFakeTimers();

      // Mock /api/tts to simulate dynamic ElevenLabs generation response matching displayed text
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("/api/tts")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              audioUrl: "/audio/characters/shopkeeper/test-instruction.mp3",
            }),
          } as Response);
        }
        return typeof originalFetch === "function" ? originalFetch(url as any) : Promise.resolve(new Response());
      });

      const dialogueHistory: string[] = [];
      const scenario = generateScenario(1, 0); // Mrs. Priya (Aunty)
      const order = getCustomerOrderDialogue(scenario, "en");
      const instruction = getShopkeeperCheckBillInstruction("en");

      let sequenceFinished = false;

      dialogueAudio.startArrivalSequence({
        sequenceId: "test-seq-1",
        orderDialogue: order,
        instructionDialogue: instruction,
        onDialogueChange: (d) => {
          dialogueHistory.push(`${d.speaker}:${d.text}`);
        },
        onSequenceComplete: () => {
          sequenceFinished = true;
        },
      });

      // 1. Customer speech bubble appears immediately
      expect(dialogueHistory.length).toBe(1);
      expect(dialogueHistory[0]).toContain("customer:");
      expect(dialogueHistory[0]).toContain("2 Chocolate");

      // 2. Simulate customer audio finishing (firing actual DOM 'ended' event on HTMLAudioElement)
      const currentAudio = (dialogueAudio as any).currentAudio as HTMLAudioElement;
      expect(currentAudio).toBeDefined();
      currentAudio.dispatchEvent(new Event("ended"));

      // 3. Right after customer finishes, 3000ms pause begins - Shopkeeper has NOT spoken yet
      expect(dialogueHistory.length).toBe(1);

      // 4. Advance 1500ms (halfway through 3000ms pause)
      await vi.advanceTimersByTimeAsync(1500);
      expect(dialogueHistory.length).toBe(1); // Still waiting in 3000ms pause

      // 5. Advance remaining 1500ms (completes 3000ms pause)
      await vi.advanceTimersByTimeAsync(1500);

      // Flush microtasks so fetch completes
      await Promise.resolve();
      await Promise.resolve();

      // 6. Shopkeeper instruction speech bubble is now displayed!
      expect(dialogueHistory.length).toBe(2);
      expect(dialogueHistory[1]).toBe("shopkeeper:Please check the price on the bill before you count the change!");

      // 7. Simulate Shopkeeper audio finishing (firing DOM 'ended' event)
      const shopkeeperAudio = (dialogueAudio as any).currentAudio as HTMLAudioElement;
      expect(shopkeeperAudio).toBeDefined();
      shopkeeperAudio.dispatchEvent(new Event("ended"));

      // 8. Customer order is restored in speech bubble so player can calculate change!
      expect(dialogueHistory.length).toBe(3);
      expect(dialogueHistory[2]).toBe(dialogueHistory[0]); // Restored exact customer order

      globalThis.fetch = originalFetch;
      vi.useRealTimers();
      dialogueAudio.stop();
    });

    it("ensures initial customer dialogue is NEVER skipped on level start across Levels 1 to 10", async () => {
      const { dialogueAudio } = await import("@/lib/dialogueAudio");
      dialogueAudio.stop(); // Stop any previous run

      for (let levelNum = 1; levelNum <= 10; levelNum++) {
        const scenario = generateScenario(levelNum, 0); // First customer of level
        const order = getCustomerOrderDialogue(scenario, "en");
        const instruction = getShopkeeperCheckBillInstruction("en");
        const sequenceId = `${scenario.id}-${scenario.customer.id}-0`;

        let activeDialogueText = "";

        // Start level sequence
        dialogueAudio.startArrivalSequence({
          sequenceId,
          orderDialogue: order,
          instructionDialogue: instruction,
          onDialogueChange: (d) => {
            activeDialogueText = d.text;
          },
        });

        // 1. Initial customer dialogue must be present immediately
        expect(activeDialogueText).toBe(order.text);
        expect(dialogueAudio.isSpeaking() || (dialogueAudio as any).currentAudio !== null).toBe(true);

        // 2. Simulate React remount / StrictMode re-running startArrivalSequence
        let remountDialogueText = "";
        dialogueAudio.startArrivalSequence({
          sequenceId,
          orderDialogue: order,
          instructionDialogue: instruction,
          onDialogueChange: (d) => {
            remountDialogueText = d.text;
          },
        });

        // Remount must also have the active dialogue immediately!
        expect(remountDialogueText).toBe(order.text);

        dialogueAudio.stop();
      }
    });
  });
});
