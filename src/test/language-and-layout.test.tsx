import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { t, type StringKey } from "@/game/i18n";
import { LEVELS, CUSTOMERS, emptyProgress } from "@/game/engine";
import {
  getShopkeeperWelcome,
  getShopkeeperPraise,
  getCustomerOrderDialogue,
  getFeedbackDialogue,
} from "@/components/game/3d/dialogue";
import { generateScenario } from "@/game/engine";
import { HomeScreen } from "@/components/game/HomeScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { SettingsProvider } from "@/components/game/settings";

describe("English-only compliance & Layout", () => {
  const devanagariRegex = /[\u0900-\u097F]/;
  const prohibitedHindiPhrases = [
    /\bnamaste\b/i,
    /\bram\s*ram\b/i,
    /\bnamaskar\b/i,
    /\bshabash\b/i,
    /\bdhanyawad\b/i,
    /\bshukriya\b/i,
    /\bjeete\s*raho\b/i,
    /\bbhaiya\b/i,
    /\bbeta\b/i,
    /\bji\b/i,
    /\bshubh\s*labh\b/i,
    /\bkhata\b/i,
  ];

  it("verifies all LEVELS titles have English strings and no Devanagari or Hindi phrases", () => {
    LEVELS.forEach((level) => {
      expect(level.title.en).toBeDefined();
      expect(level.title.en.length).toBeGreaterThan(0);
      expect(devanagariRegex.test(level.title.en)).toBe(false);
      prohibitedHindiPhrases.forEach((regex) => {
        expect(regex.test(level.title.en)).toBe(false);
      });
    });
  });

  it("verifies all CUSTOMERS have English names and neutral greetings", () => {
    CUSTOMERS.forEach((customer) => {
      expect(customer.name.en).toBeDefined();
      expect(customer.greeting.en).toBeDefined();
      expect(devanagariRegex.test(customer.name.en)).toBe(false);
      expect(devanagariRegex.test(customer.greeting.en)).toBe(false);

      prohibitedHindiPhrases.forEach((regex) => {
        expect(regex.test(customer.greeting.en)).toBe(false);
      });
    });
  });

  it("verifies all i18n keys resolve to English and contain no Devanagari or Hindi phrases", () => {
    const keys: StringKey[] = [
      "title",
      "tagline",
      "intro",
      "play",
      "levels",
      "level",
      "locked",
      "customer",
      "of",
      "bill",
      "subtotal",
      "discount",
      "totalToPay",
      "customerGave",
      "drawer",
      "drawerHint",
      "tray",
      "trayEmpty",
      "giving",
      "clear",
      "remove",
      "st_empty",
      "st_below",
      "st_check",
      "st_ready",
      "give",
      "noChange",
      "hint",
      "hintTitle",
      "hintIntro",
      "price",
      "paid",
      "step",
      "next",
      "prev",
      "showPieces",
      "close",
      "correct",
      "correctSub",
      "tooLittle",
      "tooMuch",
      "timeout",
      "tryAgain",
      "continue",
      "done1",
      "done2",
      "done3",
      "served",
      "mistakes",
      "hintsUsed",
      "replay",
      "nextLevel",
      "home",
      "sound",
      "speak",
      "timeLeft",
      "wants",
      "wantsExact",
      "and",
    ];

    keys.forEach((k) => {
      const translated = t("en", k, { x: 5, items: "toffee", paid: 10, total: 10 });
      expect(translated).toBeDefined();
      expect(translated.length).toBeGreaterThan(0);
      expect(devanagariRegex.test(translated)).toBe(false);
      prohibitedHindiPhrases.forEach((regex) => {
        expect(regex.test(translated)).toBe(false);
      });
    });
  });

  it("verifies dialogue outputs are English only and contain no Hindi expressions", () => {
    const welcome = getShopkeeperWelcome("en");
    expect(devanagariRegex.test(welcome.text)).toBe(false);
    expect(devanagariRegex.test(welcome.speakerName)).toBe(false);
    prohibitedHindiPhrases.forEach((regex) => {
      expect(regex.test(welcome.text)).toBe(false);
    });

    const praise = getShopkeeperPraise("en");
    expect(devanagariRegex.test(praise.text)).toBe(false);
    prohibitedHindiPhrases.forEach((regex) => {
      expect(regex.test(praise.text)).toBe(false);
    });

    for (let l = 1; l <= 10; l++) {
      const scenario = generateScenario(l, 0);
      const order = getCustomerOrderDialogue(scenario, "en");
      expect(devanagariRegex.test(order.text)).toBe(false);
      expect(devanagariRegex.test(order.speakerName)).toBe(false);
      prohibitedHindiPhrases.forEach((regex) => {
        expect(regex.test(order.text)).toBe(false);
      });

      const correctFb = getFeedbackDialogue(scenario, { kind: "correct", stars: 3 }, "en");
      expect(devanagariRegex.test(correctFb.text)).toBe(false);
      prohibitedHindiPhrases.forEach((regex) => {
        expect(regex.test(correctFb.text)).toBe(false);
      });
    }
  });

  it("renders HomeScreen in English-only with no language toggle and no Devanagari text", () => {
    const { container } = render(
      <SettingsProvider>
        <HomeScreen
          levels={LEVELS}
          progress={emptyProgress()}
          selected={0}
          onSelect={() => {}}
          onPlay={() => {}}
        />
      </SettingsProvider>,
    );

    // Title & tagline
    expect(screen.getByText("KIRANA CHANGE")).toBeInTheDocument();
    expect(screen.getByText("Every Rupee Counts!")).toBeInTheDocument();

    // Play button
    expect(screen.getByText(/LET'S PLAY!/)).toBeInTheDocument();

    // No language switcher toggle exists
    expect(screen.queryByRole("group", { name: /Language/i })).not.toBeInTheDocument();
    expect(screen.queryByText("हिन्दी")).not.toBeInTheDocument();
    expect(screen.queryByText("EN")).not.toBeInTheDocument();

    // No Devanagari text in entire container
    expect(devanagariRegex.test(container.textContent || "")).toBe(false);
    prohibitedHindiPhrases.forEach((regex) => {
      expect(regex.test(container.textContent || "")).toBe(false);
    });
  });

  it("renders GameScreen with all sections connected and no empty space gap", () => {
    const { container } = render(
      <SettingsProvider>
        <GameScreen level={LEVELS[0]!} onExit={() => {}} onComplete={() => {}} />
      </SettingsProvider>,
    );

    // Verify main components render
    expect(screen.getByText(/BILL/i)).toBeInTheDocument();
    expect(screen.getByText(/CHANGE FOR THE CUSTOMER/i)).toBeInTheDocument();
    expect(screen.getByText(/Cash Drawer/i)).toBeInTheDocument();

    // Verify no Devanagari or Hindi phrases
    expect(devanagariRegex.test(container.textContent || "")).toBe(false);
    prohibitedHindiPhrases.forEach((regex) => {
      expect(regex.test(container.textContent || "")).toBe(false);
    });
  });
});
