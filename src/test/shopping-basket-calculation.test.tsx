import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { ShoppingBill } from "@/components/game/ShoppingBill";
import { GameScreen } from "@/components/game/GameScreen";
import { HintPanel } from "@/components/game/HintPanel";
import { SettingsProvider } from "@/components/game/settings";
import { LEVELS, generateScenario } from "@/game/engine";

describe("Shopping Basket & Calculation Mechanics", () => {
  describe("1. Hidden Precalculated Subtotals & Mandatory Player Calculation", () => {
    it("displays product name, quantity, and unit price, but HIDES the computed total before player submits", () => {
      // Level 1 Customer 0: 2 Chocolate @ $25.00 (subtotal $50.00)
      const scenario = generateScenario(1, 0);
      const onChangeTotal = vi.fn();
      const onCheckTotal = vi.fn();

      const { rerender } = render(
        <SettingsProvider>
          <ShoppingBill
            scenario={scenario}
            calculatedTotal=""
            onChangeTotal={onChangeTotal}
            onCheckTotal={onCheckTotal}
            isTotalVerified={false}
          />
        </SettingsProvider>,
      );

      // 1. Must show quantity and unit price as clues: "(2 × $25.00)"
      expect(screen.getByText(/2 × \$25\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/Chocolate/i)).toBeInTheDocument();

      // 2. Must NOT display the precalculated $50.00 anywhere before submission
      expect(screen.queryByText("$50.00")).not.toBeInTheDocument();

      // 3. Shows placeholder '?' for item amount and '???' for subtotal
      expect(screen.getByText("?")).toBeInTheDocument();
      expect(screen.getByText("???")).toBeInTheDocument();

      // 4. Input is empty and ready for player calculation
      const input = screen.getByLabelText(/TOTAL TO PAY/i) as HTMLInputElement;
      expect(input.value).toBe("");

      // 5. When verified = true (after correct submission), reveals the calculated amounts
      rerender(
        <SettingsProvider>
          <ShoppingBill
            scenario={scenario}
            calculatedTotal={50}
            onChangeTotal={onChangeTotal}
            onCheckTotal={onCheckTotal}
            isTotalVerified={true}
          />
        </SettingsProvider>,
      );

      // Now reveals $50.00
      expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Verified/i)).toBeInTheDocument();
    });

    it("displays discounts clearly but requires the player to calculate the net deduction", () => {
      // Level 5 Customer 1: 2 Cold Drink @ $40.00 = $80.00 with "Buy 2, save $10" -> payable $70.00
      const scenario = generateScenario(5, 1);
      const onChangeTotal = vi.fn();
      const onCheckTotal = vi.fn();

      render(
        <SettingsProvider>
          <ShoppingBill
            scenario={scenario}
            calculatedTotal=""
            onChangeTotal={onChangeTotal}
            onCheckTotal={onCheckTotal}
            isTotalVerified={false}
          />
        </SettingsProvider>,
      );

      // Clues present: 2 × $40.00 and discount label "Buy 2, save $10"
      expect(screen.getByText(/2 × \$40\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/Buy 2, save \$10/i)).toBeInTheDocument();

      // The final answer ($70.00) is NOT displayed anywhere
      expect(screen.queryByText("$70.00")).not.toBeInTheDocument();
    });
  });

  describe("2. Two-Stage Interactive Cashier Flow (Bill Calculation -> Change Calculation)", () => {
    it("locks cash drawer until bill total is calculated and checked by player", () => {
      const onComplete = vi.fn();
      const onExit = vi.fn();

      render(
        <SettingsProvider>
          <GameScreen level={LEVELS[0]!} onExit={onExit} onComplete={onComplete} />
        </SettingsProvider>,
      );

      const input = screen.getByLabelText(/TOTAL TO PAY/i);
      const checkBtn = screen.getByRole("button", { name: /Check Bill Total/i });

      // In Stage 1: Give change button must indicate that bill must be checked first
      const allButtons = screen.getAllByRole("button");
      const giveBtn = allButtons.find(
        (b) => b.textContent?.includes("Check Bill First") || b.textContent?.includes("GIVE CHANGE"),
      ) as HTMLButtonElement;
      expect(giveBtn).toBeDefined();
      expect(giveBtn.disabled).toBe(true);

      // Submitting an incorrect calculation: e.g. 40
      fireEvent.change(input, { target: { value: "40" } });
      fireEvent.click(checkBtn);

      // Error hint provided to guide player
      expect(screen.getAllByText(/Multiply quantity/i).length).toBeGreaterThanOrEqual(1);
      expect(giveBtn.disabled).toBe(true);

      // Solve the line item multiplication first via interactive [ ? ] button
      const calcItemBtn = screen.getByRole("button", { name: /Calculate 2 × \$25\.00/i });
      fireEvent.click(calcItemBtn);

      const itemInput = screen.getByLabelText(/Enter answer for 2 × \$25\.00/i);
      fireEvent.change(itemInput, { target: { value: "50" } });
      const itemCheckBtn = screen.getByRole("button", { name: /Check subtotal/i });
      fireEvent.click(itemCheckBtn);

      // Entering correct calculation: 50
      fireEvent.change(input, { target: { value: "50" } });
      fireEvent.click(checkBtn);

      // Bill is now verified!
      expect(screen.getAllByText(/Verified/i).length).toBeGreaterThanOrEqual(1);

      // Give Change button is now unlocked and functional!
      expect(giveBtn.disabled).toBe(false);
    });

    it("HintPanel in bill phase provides mathematical guidance without revealing the answer", () => {
      const scenario = generateScenario(4, 1); // 2 Pencil and Eraser

      render(
        <SettingsProvider>
          <HintPanel
            mode="bill"
            items={scenario.items}
            discount={scenario.discount}
            price={scenario.payable}
            paid={scenario.paid}
            steps={[]}
            onShowPieces={vi.fn()}
            onClose={vi.fn()}
          />
        </SettingsProvider>,
      );

      // Explains how to multiply and add
      expect(screen.getByText(/How to Calculate the Bill/i)).toBeInTheDocument();
      expect(screen.getByText(/Multiply each item/i)).toBeInTheDocument();
      expect(screen.getByText(/Add up all the item amounts/i)).toBeInTheDocument();

      // Does NOT reveal the payable answer
      expect(screen.queryByText(`Price: $${scenario.payable.toFixed(2)}`)).not.toBeInTheDocument();
    });
  });

  describe("3. Interactive Multiplication Calculator in Shopping Basket", () => {
    it("expands inline calculator on clicking [ ? ], validates input, and displays green check on success", () => {
      const scenario = generateScenario(1, 0); // 2 Chocolate @ $25.00
      const onSolveItem = vi.fn();
      const onMultiplicationMistake = vi.fn();

      render(
        <SettingsProvider>
          <ShoppingBill
            scenario={scenario}
            calculatedTotal=""
            onChangeTotal={vi.fn()}
            onCheckTotal={vi.fn()}
            isTotalVerified={false}
            onSolveItem={onSolveItem}
            onMultiplicationMistake={onMultiplicationMistake}
          />
        </SettingsProvider>,
      );

      // 1. Initial state: [ ? ] button present, item subtotal hidden
      const calcBtn = screen.getByRole("button", { name: /Calculate 2 × \$25\.00/i });
      expect(calcBtn).toBeInTheDocument();
      expect(screen.queryByLabelText(/Enter answer for 2 × \$25\.00/i)).not.toBeInTheDocument();

      // 2. Click [ ? ]: expands inline calculator
      fireEvent.click(calcBtn);
      const input = screen.getByLabelText(/Enter answer for 2 × \$25\.00/i);
      const checkBtn = screen.getByRole("button", { name: /Check subtotal for Chocolate/i });
      expect(input).toBeInTheDocument();
      expect(checkBtn).toBeInTheDocument();

      // 3. Enter incorrect answer (e.g. 45)
      fireEvent.change(input, { target: { value: "45" } });
      fireEvent.click(checkBtn);

      // Friendly hint shown, mistakes tracked, answer NOT revealed
      expect(screen.getByText(/Not quite!/i)).toBeInTheDocument();
      expect(onMultiplicationMistake).toHaveBeenCalledWith("chocolate");
      expect(onSolveItem).not.toHaveBeenCalled();

      // 4. Enter correct answer (50)
      fireEvent.change(input, { target: { value: "50" } });
      fireEvent.click(checkBtn);

      // Verified checkmark shown, onSolveItem called
      expect(onSolveItem).toHaveBeenCalledWith("chocolate");
      expect(screen.getByText("✓")).toBeInTheDocument();
      expect(screen.getByText("$50.00")).toBeInTheDocument();
    });

    it("requires each item in multi-item orders to be multiplied independently", () => {
      const scenario = generateScenario(4, 1); // 2 items in Level 4 (Customer 1)
      expect(scenario.items.length).toBeGreaterThanOrEqual(2);

      const item1 = scenario.items[0]!;
      const item2 = scenario.items[1]!;

      render(
        <SettingsProvider>
          <ShoppingBill
            scenario={scenario}
            calculatedTotal=""
            onChangeTotal={vi.fn()}
            onCheckTotal={vi.fn()}
            isTotalVerified={false}
          />
        </SettingsProvider>,
      );

      // Both items have their own [ ? ] button
      const btn1 = screen.getByRole("button", {
        name: new RegExp(`Calculate ${item1.qty} × \\$${item1.unitPrice.toFixed(2)}`, "i"),
      });
      const btn2 = screen.getByRole("button", {
        name: new RegExp(`Calculate ${item2.qty} × \\$${item2.unitPrice.toFixed(2)}`, "i"),
      });

      expect(btn1).toBeInTheDocument();
      expect(btn2).toBeInTheDocument();

      // Solve item 1
      fireEvent.click(btn1);
      const input1 = screen.getByLabelText(
        new RegExp(`Enter answer for ${item1.qty} × \\$${item1.unitPrice.toFixed(2)}`, "i"),
      );
      fireEvent.change(input1, { target: { value: String(item1.qty * item1.unitPrice) } });
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`Check subtotal for ${item1.name.en}`, "i") }));

      // Item 1 is solved (shows check), but Item 2 still has [ ? ] button
      expect(screen.getByRole("button", {
        name: new RegExp(`Calculate ${item2.qty} × \\$${item2.unitPrice.toFixed(2)}`, "i"),
      })).toBeInTheDocument();
    });
  });
});

