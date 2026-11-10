import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import React from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { SettingsProvider } from "@/components/game/settings";
import { LEVELS } from "@/game/engine";

describe("GameScreen user submission flow", () => {
  it("answers a question correctly, sees the celebration feedback dialog, and advances to next customer without freezing", async () => {
    const onComplete = vi.fn();
    const onExit = vi.fn();

    render(
      <SettingsProvider>
        <GameScreen level={LEVELS[0]!} onExit={onExit} onComplete={onComplete} />
      </SettingsProvider>,
    );

    // 1. Shopping basket displays item quantity and unit price without precalculating total
    // Level 1 Customer 0: 2 Chocolate @ $25.00 -> Player calculates 2 × 25 = $50.00
    const input = screen.getByLabelText(/TOTAL TO PAY/i);

    // Test incorrect answer first: enters $40.00
    fireEvent.change(input, { target: { value: "40" } });
    const checkBtn = screen.getByRole("button", { name: /Check Bill Total/i });
    fireEvent.click(checkBtn);

    // Verify error hint appears and bill is NOT verified yet
    expect(screen.getAllByText(/Multiply quantity/i).length).toBeGreaterThanOrEqual(1);

    // Solve item multiplication via interactive [ ? ] button
    const calcItemBtn = screen.getByRole("button", { name: /Calculate 2 × \$25\.00/i });
    fireEvent.click(calcItemBtn);

    const itemInput = screen.getByLabelText(/Enter answer for 2 × \$25\.00/i);
    fireEvent.change(itemInput, { target: { value: "50" } });
    const itemCheckBtn = screen.getByRole("button", { name: /Check subtotal/i });
    fireEvent.click(itemCheckBtn);

    // Now enter the correct calculated payable: $50.00
    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /Check Bill Total/i }));

    // Verify bill is verified successfully
    expect(screen.getAllByText(/Verified/i).length).toBeGreaterThanOrEqual(1);

    // 2. Click Hint button to auto-add pieces or see steps
    const hintBtn = screen.getByRole("button", { name: /Hint/i });
    fireEvent.click(hintBtn);

    // Modal opens: Click "Show me the pieces" to place exact pieces in the tray
    const showPiecesBtn = screen.getByRole("button", { name: /Show me the pieces/i });
    fireEvent.click(showPiecesBtn);

    // Close hint modal
    const closeBtn = screen.getByRole("button", { name: /Got it!/i });
    fireEvent.click(closeBtn);

    // 4. Find Give change button - it should be enabled now!
    const allButtons = screen.getAllByRole("button");
    const giveBtn = allButtons.find(
      (b) => b.textContent?.includes("GIVE CHANGE") || b.textContent?.includes("NO CHANGE"),
    ) as HTMLButtonElement;
    expect(giveBtn).toBeDefined();
    expect(giveBtn.disabled).toBe(false);

    // 5. Click give change
    await act(async () => {
      fireEvent.click(giveBtn);
    });

    // 6. Celebration Feedback modal MUST be fully visible on screen
    const feedbackText = screen.getByText("Perfect! You're a smart shopkeeper!");
    expect(feedbackText).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    expect(continueBtn).toBeInTheDocument();

    // 7. Click Continue to advance to customer 2
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    // 8. Verify modal dismissed and transitioned cleanly to next customer without screen freeze
    await waitFor(() => {
      expect(screen.queryByText("Perfect! You're a smart shopkeeper!")).not.toBeInTheDocument();
    });
    const receiptInputAfter = screen.getByLabelText(/TOTAL TO PAY/i);
    expect(receiptInputAfter).toHaveValue(null);
  });
});
