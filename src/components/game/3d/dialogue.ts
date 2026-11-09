import type { Lang, Scenario, SubmissionResult } from "@/game/types";
import { formatUSD } from "@/lib/currency";
import { t } from "@/game/i18n";
import {
  getCustomerVoiceType,
  type CharacterVoice,
  type SpeakerRole,
} from "@/lib/voice/characters";

export interface DialogueContent {
  speaker: SpeakerRole;
  speakerName: string;
  avatarEmoji: string;
  text: string;
  characterVoice: CharacterVoice;
  customerId?: string;
}

/**
 * Builds the exact displayed text for a customer's order.
 * This function is the SINGLE SOURCE OF TRUTH for customer dialogue.
 * Both CustomerBubble and speech generation retrieve text from here.
 */
export function formatCustomerOrderText(scenario: Scenario, lang: Lang = "en"): string {
  const names = scenario.items.map((i) => (i.qty > 1 ? `${i.qty} ${i.name[lang]}` : i.name[lang]));
  const list =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} ${t(lang, "and")} ${names[names.length - 1]}`
      : (names[0] ?? "");
  const exact = scenario.paid === scenario.payable;
  return `${scenario.customer.greeting[lang]} ${t(lang, exact ? "wantsExact" : "wants", {
    items: list,
    total: formatUSD(scenario.payable),
    paid: formatUSD(scenario.paid),
  })}`;
}

/**
 * Welcome dialogue from the Shopkeeper when the store opens
 */
export function getShopkeeperWelcome(_lang: Lang = "en"): DialogueContent {
  return {
    speaker: "shopkeeper",
    speakerName: "Shopkeeper",
    avatarEmoji: "👨🏽‍🦳",
    text: "Welcome to the shop! Great to see you today. What can I get for you?",
    characterVoice: "shopkeeper",
  };
}

/**
 * Shopkeeper celebration on correct change
 */
export function getShopkeeperPraise(_lang: Lang = "en"): DialogueContent {
  return {
    speaker: "shopkeeper",
    speakerName: "Shopkeeper",
    avatarEmoji: "👨🏽‍🦳",
    text: "Spot on! That's the exact change. Brilliant calculation!",
    characterVoice: "shopkeeper",
  };
}

/**
 * Shopkeeper instruction to check bill before counting change
 */
export function getShopkeeperCheckBillInstruction(lang: Lang = "en"): DialogueContent {
  return {
    speaker: "shopkeeper",
    speakerName: "Shopkeeper",
    avatarEmoji: "👨🏽‍🦳",
    text: t(lang, "checkBillInstruction"),
    characterVoice: "shopkeeper",
  };
}

/**
 * Customer arrival and order request
 */
export function getCustomerOrderDialogue(scenario: Scenario, lang: Lang = "en"): DialogueContent {
  return {
    speaker: "customer",
    speakerName: scenario.customer.name[lang] || scenario.customer.name.en,
    avatarEmoji: scenario.customer.emoji,
    text: formatCustomerOrderText(scenario, lang),
    characterVoice: getCustomerVoiceType(scenario.customer.id),
    customerId: scenario.customer.id,
  };
}

/**
 * Contextual feedback dialogue when change is submitted
 */
export function getFeedbackDialogue(
  scenario: Scenario,
  result: SubmissionResult,
  lang: Lang = "en",
): DialogueContent {
  const customerName = scenario.customer.name[lang] || scenario.customer.name.en;
  const emoji = scenario.customer.emoji;
  const cid = scenario.customer.id;
  const voice = getCustomerVoiceType(cid);

  if (result.kind === "correct") {
    let thankYou = "Thank you so much! That's the exact change. Have a wonderful day!";
    if (cid === "dadi") {
      thankYou = "Thank you so much, dear. You counted that beautifully!";
    } else if (cid === "student" || cid === "delivery") {
      thankYou = "Awesome, perfect change! Thanks a lot!";
    } else if (cid === "uncle") {
      thankYou = "Wonderful! That is spot on. Thank you!";
    }

    return {
      speaker: "customer",
      speakerName: customerName,
      avatarEmoji: emoji,
      text: thankYou,
      characterVoice: voice,
      customerId: cid,
    };
  }

  if (result.kind === "too-little") {
    let msg = "Hmm, wait a second... looks like this is a bit short. Could you please check?";
    if (cid === "dadi") {
      msg = "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.";
    } else if (cid === "uncle" && Math.abs(result.difference - 5) < 0.01) {
      msg = "Hmm, wait a second... looks like this is $5.00 short. Could you please check?";
    } else if (cid === "delivery") {
      msg = "Hey, wait a second... looks like this is a bit short. Could you please check?";
    }
    return {
      speaker: "customer",
      speakerName: customerName,
      avatarEmoji: emoji,
      text: msg,
      characterVoice: voice,
      customerId: cid,
    };
  }

  if (result.kind === "too-much") {
    let msg = "Oh, hold on — you gave me a bit too much extra! Take a quick look.";
    if (cid === "student" && Math.abs(result.difference - 10.5) < 0.01) {
      msg = "Oh, hold on — you gave me $10.50 extra! Take a quick look.";
    } else if (cid === "dadi") {
      msg = "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.";
    } else if (cid === "delivery") {
      msg = "Hey, hold on — you gave me a bit too much extra! Take a quick look.";
    }
    return {
      speaker: "customer",
      speakerName: customerName,
      avatarEmoji: emoji,
      text: msg,
      characterVoice: voice,
      customerId: cid,
    };
  }

  // Timeout
  return {
    speaker: "customer",
    speakerName: customerName,
    avatarEmoji: emoji,
    text: "No rush at all! Take your time to count the notes.",
    characterVoice: voice,
    customerId: cid,
  };
}
