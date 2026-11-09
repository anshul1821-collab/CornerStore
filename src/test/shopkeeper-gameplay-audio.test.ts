import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { generateScenario } from "@/game/engine";
import { getCustomerOrderDialogue, getShopkeeperCheckBillInstruction } from "@/components/game/3d/dialogue";
import { dialogueAudio, resolveStudioAudio } from "@/lib/dialogueAudio";

describe("Shopkeeper Gameplay Voice Integration & Audio Verification", () => {
  it("verifies shopkeeper audio files exist on disk with valid MP3 headers", () => {
    const f1 = path.join(process.cwd(), "public", "audio", "characters", "shopkeeper", "check_bill_instruction.mp3");
    const f2 = path.join(process.cwd(), "public", "audio", "characters", "shopkeeper", "check_price_in_bill.mp3");

    expect(fs.existsSync(f1)).toBe(true);
    expect(fs.existsSync(f2)).toBe(true);

    const buf1 = fs.readFileSync(f1);
    const buf2 = fs.readFileSync(f2);

    expect(buf1.length).toBeGreaterThan(10000); // 23,472 bytes
    expect(buf2.length).toBeGreaterThan(10000); // 15,552 bytes

    // Verify MP3 ID3 header or sync frames
    const isMp3Header = (buf: Buffer) =>
      Boolean(
        (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) || // ID3
        (buf[0] === 0xff && buf[1] !== undefined && (buf[1] & 0xe0) === 0xe0), // MPEG sync
      );

    expect(isMp3Header(buf1)).toBe(true);
    expect(isMp3Header(buf2)).toBe(true);
  });

  it("verifies exact speech bubble text matches the spoken audio across Levels 1 to 10", () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      const scenario = generateScenario(lvl, 0);
      const instruction = getShopkeeperCheckBillInstruction("en");

      expect(instruction.speaker).toBe("shopkeeper");
      expect(instruction.characterVoice).toBe("shopkeeper");
      expect(instruction.text).toBe("Please check the price on the bill before you count the change!");

      const audioUrl = resolveStudioAudio(instruction.text, undefined, "shopkeeper", "shopkeeper");
      expect(audioUrl).toBe("/audio/characters/shopkeeper/check_bill_instruction.mp3");

      const diskPath = path.join(process.cwd(), "public", audioUrl!.replace(/^\//, ""));
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it("runs the full gameplay sequence in exact order without silence, locks, or interruptions", async () => {
    vi.useFakeTimers();

    const history: { step: string; dialogue: any }[] = [];
    let sequenceFinished = false;

    const scenario = generateScenario(1, 0); // Mrs. Priya
    const order = getCustomerOrderDialogue(scenario, "en");
    const instruction = getShopkeeperCheckBillInstruction("en");

    // 1. Start Arrival Sequence
    dialogueAudio.startArrivalSequence({
      sequenceId: "gameplay-test-l1",
      orderDialogue: order,
      instructionDialogue: instruction,
      onDialogueChange: (d) => {
        history.push({ step: d.speaker, dialogue: d });
      },
      onSequenceComplete: () => {
        sequenceFinished = true;
      },
    });

    // Step 1: Customer speech bubble appears immediately
    expect(history.length).toBe(1);
    expect(history[0]?.step).toBe("customer");
    expect(history[0]?.dialogue.text).toContain("2 Chocolate");

    // Step 2: Customer audio plays and finishes
    const customerAudio = (dialogueAudio as any).currentAudio as HTMLAudioElement;
    expect(customerAudio).toBeDefined();
    customerAudio.dispatchEvent(new Event("ended"));

    // Step 3: 3000ms pause starts - shopkeeper has not spoken yet
    expect(history.length).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(history.length).toBe(1); // halfway

    await vi.advanceTimersByTimeAsync(1500);

    // Step 4: Shopkeeper speech bubble appears with exact instruction text
    expect(history.length).toBe(2);
    expect(history[1]?.step).toBe("shopkeeper");
    expect(history[1]?.dialogue.text).toBe("Please check the price on the bill before you count the change!");

    // Step 5: Shopkeeper voice plays matching exact displayed text
    const shopkeeperAudio = (dialogueAudio as any).currentAudio as HTMLAudioElement;
    expect(shopkeeperAudio).toBeDefined();
    expect(shopkeeperAudio.src).toContain("check_bill_instruction.mp3");

    // Step 6: Shopkeeper audio finishes
    shopkeeperAudio.dispatchEvent(new Event("ended"));

    // Step 7: Customer order dialogue is restored so player can calculate change
    expect(history.length).toBe(3);
    expect(history[2]?.step).toBe("customer");
    expect(history[2]?.dialogue.text).toBe(order.text);
    expect(sequenceFinished).toBe(true);

    vi.useRealTimers();
    dialogueAudio.stop();
  });
});
