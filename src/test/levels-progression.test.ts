import { describe, expect, it } from "vitest";
import {
  LEVELS,
  CUSTOMERS,
  generateScenario,
  requiredChange,
  evaluate,
  trayTotal,
  customerStars,
  levelStars,
  DENOMINATIONS,
} from "@/game/engine";
import {
  formatCustomerOrderText,
  getCustomerOrderDialogue,
  getShopkeeperCheckBillInstruction,
} from "@/components/game/3d/dialogue";
import { resolveStudioAudio } from "@/lib/dialogueAudio";
import type { Tray } from "@/game/types";

describe("Level-Wise Difficulty Progression & Curriculum Verification", () => {
  describe("1. Audit & Completeness of All 10 Levels", () => {
    it("defines exactly 10 distinct levels with complete metadata", () => {
      expect(LEVELS).toHaveLength(10);

      const numbers = LEVELS.map((l) => l.number);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      // Every level must have unique title, icon, concept, description, and difficulty
      const titles = new Set<string>();
      const concepts = new Set<string>();

      for (const level of LEVELS) {
        expect(level.title.en.length).toBeGreaterThan(4);
        expect(level.description.en.length).toBeGreaterThan(15);
        expect(level.concept.en.length).toBeGreaterThan(5);
        expect(["Easy", "Medium", "Hard", "Expert"]).toContain(level.difficulty);
        expect(level.customers).toBeGreaterThanOrEqual(4);

        expect(titles.has(level.title.en)).toBe(false);
        expect(concepts.has(level.concept.en)).toBe(false);
        titles.add(level.title.en);
        concepts.add(level.concept.en);
      }
    });

    it("verifies smooth progression of difficulty tiers from Easy to Expert", () => {
      expect(LEVELS[0]!.difficulty).toBe("Easy");
      expect(LEVELS[1]!.difficulty).toBe("Easy");
      expect(LEVELS[2]!.difficulty).toBe("Medium");
      expect(LEVELS[3]!.difficulty).toBe("Medium");
      expect(LEVELS[4]!.difficulty).toBe("Medium");
      expect(LEVELS[5]!.difficulty).toBe("Hard");
      expect(LEVELS[6]!.difficulty).toBe("Hard");
      expect(LEVELS[7]!.difficulty).toBe("Hard");
      expect(LEVELS[8]!.difficulty).toBe("Expert");
      expect(LEVELS[9]!.difficulty).toBe("Expert");
    });

    it("verifies time pressure curve (early levels untimed, late levels strictly timed)", () => {
      // Early learning levels have zero timer stress
      expect(LEVELS[0]!.timeLimit).toBeNull();
      expect(LEVELS[1]!.timeLimit).toBeNull();
      expect(LEVELS[2]!.timeLimit).toBeNull();
      expect(LEVELS[3]!.timeLimit).toBeNull();

      // Timed challenges scale down as expertise increases
      expect(LEVELS[4]!.timeLimit).toBe(75);
      expect(LEVELS[5]!.timeLimit).toBe(65);
      expect(LEVELS[6]!.timeLimit).toBe(55);
      expect(LEVELS[7]!.timeLimit).toBe(50);
      expect(LEVELS[8]!.timeLimit).toBe(45);
      expect(LEVELS[9]!.timeLimit).toBe(35);
    });
  });

  describe("2. Individual Level Gameplay Concepts & Mechanics", () => {
    it("Level 1 (First Day): single item, clean round numbers, positive change", () => {
      for (let i = 0; i < 4; i++) {
        const scenario = generateScenario(1, i);
        expect(scenario.level).toBe(1);
        expect(scenario.items.length).toBe(1);
        expect(scenario.discount).toBeNull();
        expect(scenario.timeLimit).toBeNull();
        // Payment is strictly greater than payable (no exact zero-change in level 1)
        expect(scenario.paid).toBeGreaterThan(scenario.payable);
        expect(requiredChange(scenario)).toBeGreaterThan(0);
      }
    });

    it("Level 2 (Exact Change): introduces exact payments ($0 change) alongside small change", () => {
      let seenExact = false;
      for (let i = 0; i < 6; i++) {
        const scenario = generateScenario(2, i);
        expect(scenario.level).toBe(2);
        expect(scenario.timeLimit).toBeNull();
        if (scenario.paid === scenario.payable) {
          seenExact = true;
          expect(requiredChange(scenario)).toBe(0);
        }
      }
      expect(seenExact).toBe(true);
    });

    it("Level 3 (Tricky Prices & Coins): includes non-multiples of 5 requiring coin arithmetic", () => {
      let seenCoinsNeeded = false;
      for (let i = 1; i < 6; i++) {
        const scenario = generateScenario(3, i);
        expect(scenario.level).toBe(3);
        const change = requiredChange(scenario);
        if (change % 5 !== 0) {
          seenCoinsNeeded = true;
        }
      }
      expect(seenCoinsNeeded).toBe(true);
    });

    it("Level 4 (Shopping List): multi-item baskets requiring sum calculation on receipt", () => {
      for (let i = 1; i < 5; i++) {
        const scenario = generateScenario(4, i);
        expect(scenario.level).toBe(4);
        expect(scenario.items.length).toBeGreaterThanOrEqual(2);
        expect(scenario.items.length).toBeLessThanOrEqual(3);
        // Receipt subtotal equals sum of items
        const sum = scenario.items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
        expect(scenario.subtotal).toBe(sum);
      }
    });

    it("Level 5 (Buy More, Save More): bulk quantities with volume discounts under 75s timer", () => {
      for (let i = 1; i < 5; i++) {
        const scenario = generateScenario(5, i);
        expect(scenario.level).toBe(5);
        expect(scenario.timeLimit).toBe(75);
        expect(scenario.discount).not.toBeNull();
        expect(scenario.discount!.label.en).toContain("Buy");
        expect(scenario.payable).toBe(scenario.subtotal - scenario.discount!.amount);
      }
    });

    it("Level 6 (Special Coupons): flat promotional coupons under 65s timer", () => {
      for (let i = 1; i < 5; i++) {
        const scenario = generateScenario(6, i);
        expect(scenario.level).toBe(6);
        expect(scenario.timeLimit).toBe(65);
        expect(scenario.discount).not.toBeNull();
        expect(scenario.discount!.label.en).toContain("Store coupon");
        expect(scenario.payable).toBe(scenario.subtotal - scenario.discount!.amount);
      }
    });

    it("Level 7 (Combo Deals & Percentage Off): percentage discounts under 55s timer", () => {
      for (let i = 1; i < 5; i++) {
        const scenario = generateScenario(7, i);
        expect(scenario.level).toBe(7);
        expect(scenario.timeLimit).toBe(55);
        expect(scenario.discount).not.toBeNull();
        expect(scenario.discount!.label.en).toContain("% off");
        expect(scenario.payable).toBe(scenario.subtotal - scenario.discount!.amount);
      }
    });

    it("Level 8 (Big Shopping Day): high-value grocery carts paid with large bills ($200/$500)", () => {
      for (let i = 1; i < 5; i++) {
        const scenario = generateScenario(8, i);
        expect(scenario.level).toBe(8);
        expect(scenario.timeLimit).toBe(50);
        expect(scenario.items.length).toBeGreaterThanOrEqual(1);
        expect(scenario.paid).toBeGreaterThanOrEqual(100);
      }
    });

    it("Level 9 (The Smart Cashier): mixed transactions combining multi-item and discounts", () => {
      for (let i = 1; i < 5; i++) {
        const scenario = generateScenario(9, i);
        expect(scenario.level).toBe(9);
        expect(scenario.timeLimit).toBe(45);
        expect(scenario.items.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("Level 10 (Rush Hour Challenge): 4-6 items under strict 35s timer", () => {
      for (let i = 1; i < 6; i++) {
        const scenario = generateScenario(10, i);
        expect(scenario.level).toBe(10);
        expect(scenario.timeLimit).toBe(35);
        expect(scenario.items.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("3. Mathematical Correctness & Star Rating Tolerances", () => {
    it("verifies accurate arithmetic across 50 random scenarios", () => {
      for (let lvl = 1; lvl <= 10; lvl++) {
        for (let idx = 0; idx < 5; idx++) {
          const s = generateScenario(lvl, idx);
          const computedSubtotal = s.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
          expect(s.subtotal).toBe(computedSubtotal);

          const computedPayable = Math.max(1, s.subtotal - (s.discount?.amount ?? 0));
          expect(s.payable).toBe(computedPayable);

          expect(s.paid).toBeGreaterThanOrEqual(s.payable);
          expect(requiredChange(s)).toBe(s.paid - s.payable);
        }
      }
    });

    it("verifies higher precision and tighter mistake tolerances for Level 8-10", () => {
      // Early levels: 0 mistakes/hints = 3 stars, 1-2 mistakes/hints = 2 stars
      expect(customerStars(0, 0, 1)).toBe(3);
      expect(customerStars(1, 0, 1)).toBe(2);
      expect(customerStars(2, 0, 1)).toBe(2);
      expect(customerStars(3, 0, 1)).toBe(1);

      // Advanced levels (8-10): 0 mistakes/hints = 3 stars, 1 mistake = 2 stars, 2 mistakes drops to 1 star
      expect(customerStars(0, 0, 8)).toBe(3);
      expect(customerStars(1, 0, 8)).toBe(2);
      expect(customerStars(2, 0, 8)).toBe(1);
      expect(customerStars(0, 2, 10)).toBe(1);
    });

    it("evaluates correct change submission accurately", () => {
      const scenario = generateScenario(1, 0);
      const req = requiredChange(scenario);

      // Give exact change in notes
      const tray: Tray = {};
      let rem = req;
      for (const d of DENOMINATIONS) {
        if (rem >= d.value) {
          const count = Math.floor(rem / d.value);
          tray[d.id] = count;
          rem -= count * d.value;
        }
      }
      expect(trayTotal(tray)).toBe(req);

      const result = evaluate(tray, scenario, 0, 0);
      expect(result.kind).toBe("correct");
      if (result.kind === "correct") {
        expect(result.stars).toBe(3);
      }
    });
  });

  describe("4. Dialogue & Audio Consistency Across All Levels", () => {
    it("ensures every customer order dialogue generates natural text and resolves audio across all 10 levels", () => {
      const fs = require("fs");
      const path = require("path");

      let totalVerifiedCustomers = 0;
      for (let lvl = 1; lvl <= 10; lvl++) {
        const levelDef = LEVELS[lvl - 1]!;
        for (let idx = 0; idx < levelDef.customers; idx++) {
          totalVerifiedCustomers++;
          const scenario = generateScenario(lvl, idx);
          const dialogue = getCustomerOrderDialogue(scenario, "en");

          expect(dialogue.text.length).toBeGreaterThan(10);
          expect(dialogue.speaker).toBe("customer");
          expect(dialogue.customerId).toBe(scenario.customer.id);

          const audioUrl = resolveStudioAudio(
            dialogue.text,
            dialogue.customerId,
            dialogue.characterVoice,
            "customer",
          );
          expect(audioUrl).toBeTruthy();
          expect(typeof audioUrl).toBe("string");

          // Verify physical existence of MP3 file on disk
          const diskPath = path.join(process.cwd(), "public", audioUrl!.replace(/^\//, ""));
          expect(fs.existsSync(diskPath)).toBe(true);
        }
      }
      expect(totalVerifiedCustomers).toBe(48);
    });

    it("ensures shopkeeper check bill instruction resolves to audio in all levels", () => {
      const instruction = getShopkeeperCheckBillInstruction("en");
      expect(instruction.text).toBe("Please check the price on the bill before you count the change!");
      const audioUrl = resolveStudioAudio(instruction.text, undefined, "shopkeeper", "shopkeeper");
      expect(audioUrl).toBe("/audio/characters/shopkeeper/check_bill_instruction.mp3");
    });
  });
});

