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

    // 1. Read the payable total from the hint strip
    const hintText = screen.getByText(/Total to Pay \(\$(\d+(\.\d{2})?)\)/i).textContent || "";
    const match = hintText.match(/Total to Pay \(\$(\d+(\.\d{2})?)\)/i);
    const payable = Number(match?.[1]);
    expect(payable).toBeGreaterThan(0);

    // 2. Enter total in receipt input
    const input = screen.getByLabelText(/TOTAL TO PAY/i);
    fireEvent.change(input, { target: { value: String(payable) } });

    // 3. Click Hint button to auto-add pieces or see steps
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
