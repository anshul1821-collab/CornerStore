import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import React from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { SettingsProvider } from "@/components/game/settings";
import {
  LEVELS,
  calculateLevelSummary,
  calculateTransactionStars,
  generateScenario,
  getBillHint,
  getChangeHint,
  getEncouragingFeedback,
} from "@/game/engine";
import type { TransactionRecord } from "@/game/types";

describe("Cashier Transaction Experience & Performance Architecture", () => {
  describe("1. Engine Rules: Star Grading & Performance Evaluation", () => {
    it("awards 3 stars for flawless first-attempt transactions without hints", () => {
      const stars = calculateTransactionStars({
        billMistakes: 0,
        changeMistakes: 0,
        hintsUsed: 0,
        timeTaken: 12,
        timeLimit: 60,
        level: 1,
        timedOut: false,
      });
      expect(stars).toBe(3);
    });

    it("awards 2 stars when 1 or 2 mistakes are made, or some hints are used", () => {
      const stars1 = calculateTransactionStars({
        billMistakes: 1,
        changeMistakes: 0,
        hintsUsed: 0,
        timeTaken: 18,
        level: 3,
        timedOut: false,
      });
      expect(stars1).toBe(2);

      const stars2 = calculateTransactionStars({
        billMistakes: 0,
        changeMistakes: 1,
        hintsUsed: 1,
        timeTaken: 22,
        level: 5,
        timedOut: false,
      });
      expect(stars2).toBe(2);
    });

    it("awards 1 star for multiple mistakes or substantial hint usage", () => {
      const stars = calculateTransactionStars({
        billMistakes: 2,
        changeMistakes: 2,
        hintsUsed: 1,
        timeTaken: 45,
        level: 4,
        timedOut: false,
      });
      expect(stars).toBe(1);
    });

    it("caps stars fairly when transaction times out on timed levels", () => {
      const starsTimedOut = calculateTransactionStars({
        billMistakes: 0,
        changeMistakes: 0,
        hintsUsed: 0,
        timeTaken: 76,
        timeLimit: 75,
        level: 5,
        timedOut: true,
      });
      expect(starsTimedOut).toBe(2); // Completed with 0 mistakes, capped at 2 for timeout

      const starsTimedOutWithMistakes = calculateTransactionStars({
        billMistakes: 1,
        changeMistakes: 0,
        hintsUsed: 0,
        timeTaken: 80,
        timeLimit: 75,
        level: 5,
        timedOut: true,
      });
      expect(starsTimedOutWithMistakes).toBe(1);
    });

    it("applies higher precision criteria to advanced levels (8 to 10)", () => {
      // 0 mistakes + 0 hints = 3 stars
      expect(
        calculateTransactionStars({
          billMistakes: 0,
          changeMistakes: 0,
          hintsUsed: 0,
          timeTaken: 20,
          level: 10,
          timedOut: false,
        }),
      ).toBe(3);

      // 1 mistake = 2 stars
      expect(
        calculateTransactionStars({
          billMistakes: 1,
          changeMistakes: 0,
          hintsUsed: 0,
          timeTaken: 25,
          level: 10,
          timedOut: false,
        }),
      ).toBe(2);

      // 2 mistakes on Level 10 = 1 star
      expect(
        calculateTransactionStars({
          billMistakes: 1,
          changeMistakes: 1,
          hintsUsed: 0,
          timeTaken: 30,
          level: 10,
          timedOut: false,
        }),
      ).toBe(1);
    });
  });

  describe("2. Engine Rules: Progressive Hints", () => {
    it("provides progressive hints for bill calculations", () => {
      const sc = generateScenario(1, 0); // 2 Chocolate @ $25.00
      // Attempt 1: reminds multiplication
      const h1 = getBillHint(1, sc, 40);
      expect(h1).toContain("Multiply quantity (2)");

      // Attempt 2: explains arithmetic operation
      const h2 = getBillHint(2, sc, 40);
      expect(h2).toContain("Multiply quantity (2) by unit price");

      // Attempt 3: worked step
      const h3 = getBillHint(3, sc, 40);
      expect(h3).toContain("Worked step:");
      expect(h3).not.toContain("$50.00"); // Does not leak final answer
    });

    it("detects when customer forgot discount and provides an explicit reminder", () => {
      const sc = generateScenario(6, 0); // Flat coupon discount
      if (sc.discount) {
        const hint = getBillHint(1, sc, sc.subtotal);
        expect(hint).toContain("remember to subtract");
        expect(hint).toContain(`$${sc.discount.amount.toFixed(2)}`);
      }
    });

    it("provides progressive change hints", () => {
      const sc = generateScenario(1, 0); // Payable 50, Paid 200 -> Change 150
      // Returned 100 -> diff -50
      const h1 = getChangeHint(1, sc, 100);
      expect(h1).toContain("$50.00 more change");

      // Attempt 2: subtraction operation
      const h2 = getChangeHint(2, sc, 100);
      expect(h2).toContain("Customer paid $200.00 for a $50.00 bill");
      expect(h2).toContain("$150.00 change needed");
    });
  });

  describe("3. Engine Rules: Level Performance Aggregation", () => {
    it("aggregates transaction records into complete level performance stats", () => {
      const records: TransactionRecord[] = [
        {
          customerIndex: 0,
          customerName: "Mrs. Priya",
          billMistakes: 0,
          changeMistakes: 0,
          hintsUsed: 0,
          timeTaken: 12,
          billFirstTry: true,
          changeFirstTry: true,
          stars: 3,
        },
        {
          customerIndex: 1,
          customerName: "Mr. Sharma",
          billMistakes: 1,
          changeMistakes: 0,
          hintsUsed: 1,
          timeTaken: 18,
          billFirstTry: false,
          changeFirstTry: true,
          stars: 2,
        },
        {
          customerIndex: 2,
          customerName: "Rohan",
          billMistakes: 0,
          changeMistakes: 1,
          hintsUsed: 0,
          timeTaken: 15,
          billFirstTry: true,
          changeFirstTry: false,
          stars: 2,
        },
      ];

      const summary = calculateLevelSummary(records);
      expect(summary.totalCustomers).toBe(3);
      expect(summary.totalMistakes).toBe(2);
      expect(summary.totalHints).toBe(1);
      expect(summary.correctBillFirstTry).toBe(2);
      expect(summary.correctChangeFirstTry).toBe(2);
      expect(summary.totalTime).toBe(45);
      expect(summary.avgTime).toBe(15);
      expect(summary.finalLevelStars).toBe(2);
    });

    it("provides encouraging feedback corresponding to star tiers", () => {
      expect(getEncouragingFeedback(3)).toBe("Excellent! Perfect calculation!");
      expect(getEncouragingFeedback(2)).toBe("Great job! You handled that transaction.");
      expect(getEncouragingFeedback(1)).toBe("Good effort! Keep practising your calculations.");
    });
  });

  describe("4. Integration: Complete Four-Stage Transaction Flow", () => {
    it("runs Stage 1 (Bill) -> Stage 2 (Change) -> Stage 3 (Sale Complete) -> Stage 4 (Summary)", async () => {
      const onExit = vi.fn();
      const onComplete = vi.fn();

      render(
        <SettingsProvider>
          <GameScreen level={LEVELS[1]!} onExit={onExit} onComplete={onComplete} />
        </SettingsProvider>,
      );

      // Level 2 Customer 0: Exact payment scenario ($0 change needed)
      // Check 4-stage transaction tracker is visible
      expect(screen.getByText(/1\. Calculate Bill/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Count Change/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Complete Sale/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Summary/i)).toBeInTheDocument();

      const input = screen.getByLabelText(/TOTAL TO PAY/i);
      const checkBtn = screen.getByRole("button", { name: /Check Bill Total/i });

      // Stage 1: Incorrect calculation attempt
      fireEvent.change(input, { target: { value: "999" } });
      fireEvent.click(checkBtn);
      // Verify retry opportunity with math hint
      expect(screen.getAllByText(/Multiply quantity/i).length).toBeGreaterThanOrEqual(1);

      // Solve the line item multiplication first via interactive [ ? ] button
      const sc = generateScenario(2, 0);
      const firstItem = sc.items[0]!;
      const calcItemBtn = screen.getByRole("button", {
        name: new RegExp(`Calculate ${firstItem.qty} × \\$${firstItem.unitPrice.toFixed(2)}`, "i"),
      });
      fireEvent.click(calcItemBtn);

      const itemInput = screen.getByLabelText(
        new RegExp(`Enter answer for ${firstItem.qty} × \\$${firstItem.unitPrice.toFixed(2)}`, "i"),
      );
      fireEvent.change(itemInput, { target: { value: String(firstItem.qty * firstItem.unitPrice) } });
      const itemCheckBtn = screen.getByRole("button", {
        name: new RegExp(`Check subtotal for ${firstItem.name.en}`, "i"),
      });
      fireEvent.click(itemCheckBtn);

      // Enter correct payable
      fireEvent.change(input, { target: { value: String(sc.payable) } });
      fireEvent.click(checkBtn);

      // Stage 1 Verified!
      expect(screen.getAllByText(/Verified/i).length).toBeGreaterThanOrEqual(1);

      // Stage 2: In Level 2, customer pays exact money ($0 change needed)
      const exactChangeBtn = screen.getByRole("button", { name: /NO CHANGE/i });
      expect(exactChangeBtn).toBeInTheDocument();

      // Click NO CHANGE NEEDED
      await act(async () => {
        fireEvent.click(exactChangeBtn);
      });

      // Stage 4: Transaction Summary Modal is displayed!
      expect(screen.getByText(/Stage 4: Transaction Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Bill Total/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Change/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Time Taken/i)).toBeInTheDocument();

      // Click Continue to advance
      const continueBtn = screen.getByRole("button", { name: /Continue/i });
      await act(async () => {
        fireEvent.click(continueBtn);
      });

      // Customer 2 loaded (input cleared and ready for new transaction)
      await waitFor(() => {
        expect(screen.queryByText(/Stage 4: Transaction Summary/i)).not.toBeInTheDocument();
      });
      const inputAfter = screen.getByLabelText(/TOTAL TO PAY/i) as HTMLInputElement;
      expect(inputAfter.value).toBe("");
    });
  });
});
