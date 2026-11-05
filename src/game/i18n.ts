import type { Lang } from "./types";

const STRINGS = {
  title: { en: "KIRANA CHANGE" },
  tagline: { en: "Every Rupee Counts!" },
  intro: {
    en: "Run your own little shop, help customers, and become a money master!",
  },
  play: { en: "LET'S PLAY!" },
  levels: { en: "Your Shop Journey" },
  level: { en: "Level" },
  locked: { en: "Locked" },
  customer: { en: "Customer" },
  of: { en: "of" },
  bill: { en: "BILL" },
  subtotal: { en: "Subtotal" },
  discount: { en: "Discount" },
  totalToPay: { en: "TOTAL TO PAY" },
  customerGave: { en: "CUSTOMER GAVE" },
  drawer: { en: "Cash Drawer" },
  drawerHint: { en: "Tap or drag money into the tray" },
  tray: { en: "CHANGE FOR THE CUSTOMER" },
  trayEmpty: { en: "Choose notes and coins from the drawer!" },
  giving: { en: "YOU ARE GIVING" },
  clear: { en: "Clear" },
  remove: { en: "Remove one" },
  st_empty: { en: "Start counting!" },
  st_below: { en: "Keep counting!" },
  st_check: { en: "Check your change!" },
  st_ready: { en: "Ready to serve your customer?" },
  give: { en: "GIVE CHANGE" },
  noChange: { en: "NO CHANGE NEEDED" },
  hint: { en: "Show hint" },
  hintTitle: { en: "Count Up!" },
  hintIntro: {
    en: "Start at the price and add money until you reach what the customer paid.",
  },
  price: { en: "Price" },
  paid: { en: "Customer paid" },
  step: { en: "STEP" },
  next: { en: "Next step" },
  prev: { en: "Previous" },
  showPieces: { en: "Show me the pieces" },
  close: { en: "Got it!" },
  correct: {
    en: "Perfect! You're a smart shopkeeper!",
  },
  correctSub: { en: "The customer is happy!" },
  tooLittle: {
    en: "Almost there! The customer needs ₹{x} more.",
  },
  tooMuch: {
    en: "Oops! That's ₹{x} too much. Let's make it fair.",
  },
  timeout: {
    en: "Time's up! Let's try this customer again.",
  },
  tryAgain: { en: "Try again" },
  continue: { en: "Continue" },
  done1: { en: "Wonderful work!" },
  done2: { en: "Your shop is getting busier!" },
  done3: { en: "You're becoming a money master!" },
  served: { en: "Customers served" },
  mistakes: { en: "Tries to fix" },
  hintsUsed: { en: "Hints used" },
  replay: { en: "Play again" },
  nextLevel: { en: "Next level" },
  home: { en: "Home" },
  sound: { en: "Sound" },
  speak: { en: "Read aloud" },
  timeLeft: { en: "seconds left" },
  wants: {
    en: "I'd like {items}. Here's ₹{paid}!",
  },
  wantsExact: {
    en: "I'd like {items}. Here's exactly ₹{paid}!",
  },
  and: { en: "and" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey, vars: Record<string, string | number> = {}) {
  let s: string = STRINGS[key][lang];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
