import type { Lang, Scenario, SubmissionResult } from "@/game/types";
import { formatItemForSpeech } from "@/lib/voice/sanitize";

export interface DialogueContent {
  speaker: "shopkeeper" | "customer";
  speakerName: string;
  avatarEmoji: string;
  text: string;
  dialogueType?: "fixed" | "dynamic";
}

/**
 * Welcome dialogue from the Shopkeeper when the shop opens
 */
export function getShopkeeperWelcome(_lang?: Lang): DialogueContent {
  return {
    speaker: "shopkeeper",
    speakerName: "Shopkeeper",
    avatarEmoji: "👨🏽‍🦳",
    text: "Welcome to the shop! Great to see you today. What can I get for you?",
    dialogueType: "fixed",
  };
}

/**
 * Shopkeeper celebration on correct change
 */
export function getShopkeeperPraise(_lang?: Lang): DialogueContent {
  return {
    speaker: "shopkeeper",
    speakerName: "Shopkeeper",
    avatarEmoji: "👨🏽‍🦳",
    text: "Spot on! That's the exact change. Brilliant calculation!",
    dialogueType: "fixed",
  };
}

/**
 * Customer arrival and order request with natural conversational phrasing
 * Strictly assigned to Boy Voice (male customers) and Girl Voice (female customers).
 */
export function getCustomerOrderDialogue(scenario: Scenario, lang: Lang = "en"): DialogueContent {
  const itemNames = scenario.items.map((i) => {
    const rawName = i.name[lang] || i.name.en;
    return formatItemForSpeech(rawName, i.qty);
  });

  const itemsText =
    itemNames.length > 1
      ? `${itemNames.slice(0, -1).join(", ")}, and ${itemNames[itemNames.length - 1]}`
      : (itemNames[0] ?? "groceries");

  const cid = scenario.customer.id;
  const exact = scenario.paid === scenario.payable;

  let text = "";
  if (cid === "uncle") {
    // Mr. Sharma (Male -> Boy Voice)
    text = exact
      ? `Hello! Could I please get ${itemsText}? Here's exact ₹${scenario.paid}, thank you!`
      : `Hello! Could I please get ${itemsText}? Here's ₹${scenario.paid}, change please!`;
  } else if (cid === "aunty") {
    // Mrs. Priya (Female -> Girl Voice)
    text = exact
      ? `Hi! Just need ${itemsText}, please. Here's exact ₹${scenario.paid}!`
      : `Hi! Just need ${itemsText}, please. Here's ₹${scenario.paid}, thank you!`;
  } else if (cid === "student") {
    // Rohan (Male -> Boy Voice)
    text = exact
      ? `Hey! Can I grab ${itemsText}? Here's exact ₹${scenario.paid}!`
      : `Hey! Can I grab ${itemsText}? Here's ₹${scenario.paid}, could I get the change please?`;
  } else if (cid === "parent") {
    // Meera & Anu (Female -> Girl Voice)
    text = exact
      ? `Good morning! We'd like to get ${itemsText}, please. Here's exact ₹${scenario.paid}!`
      : `Good morning! We'd like to get ${itemsText}, please. Here's ₹${scenario.paid}, thank you!`;
  } else if (cid === "delivery") {
    // Raju (Male -> Boy Voice)
    text = exact
      ? `Hey there! Need ${itemsText} quickly. Here's exact ₹${scenario.paid}!`
      : `Hey there! Need ${itemsText} quickly. Here's ₹${scenario.paid}, change please!`;
  } else if (cid === "dadi") {
    // Grandma (Female -> Girl Voice)
    text = exact
      ? `Hello, dear! Could you give me ${itemsText}? Here's exact ₹${scenario.paid}.`
      : `Hello, dear! Could you give me ${itemsText}? Here's ₹${scenario.paid}, thank you.`;
  } else {
    text = exact
      ? `Hello! I'd like ${itemsText}, please. Here's exact ₹${scenario.paid}!`
      : `Hello! I'd like ${itemsText}, please. Here's ₹${scenario.paid}, change please!`;
  }

  return {
    speaker: "customer",
    speakerName: scenario.customer.name[lang] || scenario.customer.name.en,
    avatarEmoji: scenario.customer.emoji,
    text,
    dialogueType: "dynamic",
  };
}

/**
 * Contextual feedback dialogue when change is submitted
 */
export function getFeedbackDialogue(
  scenario: Scenario,
  result: SubmissionResult,
  _lang?: Lang,
): DialogueContent {
  const customerName = scenario.customer.name.en;
  const emoji = scenario.customer.emoji;
  const cid = scenario.customer.id;

  if (result.kind === "correct") {
    let thankYou = "Thank you so much! That's the exact change. Have a wonderful day! 😊";
    if (cid === "dadi") {
      thankYou = "Thank you so much, dear. You counted that beautifully! 😊";
    } else if (cid === "student") {
      thankYou = "Awesome, perfect change! Thanks a lot! 👍";
    } else if (cid === "uncle") {
      thankYou = "Wonderful! That is spot on. Thank you! 😊";
    }

    return {
      speaker: "customer",
      speakerName: customerName,
      avatarEmoji: emoji,
      text: thankYou,
      dialogueType: "fixed",
    };
  }

  if (result.kind === "too-little") {
    return {
      speaker: "customer",
      speakerName: customerName,
      avatarEmoji: emoji,
      text: `Hmm, wait a second... looks like this is ₹${result.difference} short. Could you please check? 🤔`,
      dialogueType: "dynamic",
    };
  }

  if (result.kind === "too-much") {
    return {
      speaker: "customer",
      speakerName: customerName,
      avatarEmoji: emoji,
      text: `Oh, hold on — you gave me ₹${result.difference} extra! Take a quick look. 😊`,
      dialogueType: "dynamic",
    };
  }

  // Timeout
  return {
    speaker: "customer",
    speakerName: customerName,
    avatarEmoji: emoji,
    text: "No rush at all! Take your time to count the notes.",
    dialogueType: "fixed",
  };
}
