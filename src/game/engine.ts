import type {
  Customer,
  DenomId,
  Denomination,
  Discount,
  HintStep,
  LevelDef,
  LineItem,
  Progress,
  Scenario,
  SubmissionResult,
  TotalState,
  TransactionRecord,
  Tray,
} from "./types";

export const DENOMINATIONS: Denomination[] = [
  { id: "c1", value: 1, kind: "coin" },
  { id: "c2", value: 2, kind: "coin" },
  { id: "c5", value: 5, kind: "coin" },
  { id: "c10", value: 10, kind: "coin" },
  { id: "n10", value: 10, kind: "note" },
  { id: "n20", value: 20, kind: "note" },
  { id: "n50", value: 50, kind: "note" },
  { id: "n100", value: 100, kind: "note" },
  { id: "n200", value: 200, kind: "note" },
  { id: "n500", value: 500, kind: "note" },
];

export const denomById = (id: DenomId) => DENOMINATIONS.find((d) => d.id === id)!;

export const LEVELS: LevelDef[] = [
  {
    number: 1,
    icon: "🏪",
    title: { en: "First Day at the Shop" },
    customers: 4,
    description: {
      en: "Welcome to your first shift! Learn the basics of cash registers by handling single-item purchases and giving simple change.",
    },
    concept: { en: "Single-item sales & round change" },
    difficulty: "Easy",
    timeLimit: null,
  },
  {
    number: 2,
    icon: "🎯",
    title: { en: "Exact Change & Quick Cash" },
    customers: 4,
    description: {
      en: "Customers now sometimes pay with exact money! Check carefully: if change is $0, press the green NO CHANGE button.",
    },
    concept: { en: "Exact payment ($0 change) vs small change" },
    difficulty: "Easy",
    timeLimit: null,
  },
  {
    number: 3,
    icon: "🪙",
    title: { en: "Tricky Prices & Coins" },
    customers: 4,
    description: {
      en: "Items now have uneven prices! Master breaking dollar amounts using $1, $2, and $5 coins alongside bills.",
    },
    concept: { en: "Coin arithmetic & non-round prices" },
    difficulty: "Medium",
    timeLimit: null,
  },
  {
    number: 4,
    icon: "📝",
    title: { en: "Shopping List Basket" },
    customers: 5,
    description: {
      en: "Customers arrive with multiple grocery items! Sum up the bill across 2-3 items before calculating their change.",
    },
    concept: { en: "Multi-item addition & bill subtotals" },
    difficulty: "Medium",
    timeLimit: null,
  },
  {
    number: 5,
    icon: "📦",
    title: { en: "Buy More, Save More" },
    customers: 5,
    description: {
      en: "Volume discounts are active! Customers buying in bulk (3+ items) get special savings. Calculate subtotal minus volume discount.",
    },
    concept: { en: "Multiplication & quantity discounts" },
    difficulty: "Medium",
    timeLimit: 75,
  },
  {
    number: 6,
    icon: "🏷️",
    title: { en: "Special Coupons & Promo Codes" },
    customers: 5,
    description: {
      en: "Promotional season! Customers present flat store coupons ($10 to $25 off). Apply the deduction to find the final payable.",
    },
    concept: { en: "Flat promotional coupon deductions" },
    difficulty: "Hard",
    timeLimit: 65,
  },
  {
    number: 7,
    icon: "🎁",
    title: { en: "Combo Deals & Percentage Off" },
    customers: 5,
    description: {
      en: "Flash sale day! Calculate 10%, 20%, or 50% discount deals on selected items, plus combo pairings.",
    },
    concept: { en: "Percentage discounts & combo savings" },
    difficulty: "Hard",
    timeLimit: 55,
  },
  {
    number: 8,
    icon: "🛒",
    title: { en: "Big Shopping Day" },
    customers: 5,
    description: {
      en: "High-value grocery carts! Customers pay with $200 and $500 bills for large baskets totaling over $100.",
    },
    concept: { en: "Large bills ($200/$500) & high-value change" },
    difficulty: "Hard",
    timeLimit: 50,
  },
  {
    number: 9,
    icon: "🧠",
    title: { en: "The Smart Cashier" },
    customers: 5,
    description: {
      en: "Test your mastery! Handle mixed baskets combining quantities, tricky coin prices, and coupon discounts with steady speed.",
    },
    concept: { en: "Multi-concept mastery & mixed transactions" },
    difficulty: "Expert",
    timeLimit: 45,
  },
  {
    number: 10,
    icon: "⚡",
    title: { en: "Rush Hour Challenge" },
    customers: 6,
    description: {
      en: "Peak evening rush! The line is long and customers are in a hurry. Rapid calculation across 4-6 items under strict 35s timer.",
    },
    concept: { en: "Rapid multi-item calculation under rush pressure" },
    difficulty: "Expert",
    timeLimit: 35,
  },
];

const PRODUCTS: { id: string; emoji: string; name: { en: string }; price: number }[] = [
  { id: "toffee", emoji: "🍬", name: { en: "Toffee" }, price: 1 },
  { id: "matchbox", emoji: "🪔", name: { en: "Matchbox" }, price: 2 },
  { id: "pencil", emoji: "✏️", name: { en: "Pencil" }, price: 5 },
  { id: "eraser", emoji: "🧽", name: { en: "Eraser" }, price: 5 },
  { id: "biscuits", emoji: "🍪", name: { en: "Biscuits" }, price: 10 },
  { id: "pen", emoji: "🖊️", name: { en: "Pen" }, price: 10 },
  { id: "maggi", emoji: "🍜", name: { en: "Noodles" }, price: 14 },
  { id: "battery", emoji: "🔋", name: { en: "Battery" }, price: 15 },
  { id: "chips", emoji: "🥔", name: { en: "Chips" }, price: 20 },
  { id: "juice", emoji: "🧃", name: { en: "Juice Box" }, price: 20 },
  { id: "salt", emoji: "🧂", name: { en: "Salt (1 kg)" }, price: 22 },
  { id: "potato", emoji: "🥔", name: { en: "Potato (1 kg)" }, price: 25 },
  { id: "chocolate", emoji: "🍫", name: { en: "Chocolate" }, price: 25 },
  { id: "icecream", emoji: "🍦", name: { en: "Ice Cream" }, price: 25 },
  { id: "soap", emoji: "🧼", name: { en: "Soap" }, price: 28 },
  { id: "milk", emoji: "🥛", name: { en: "Milk Packet" }, price: 30 },
  { id: "onion", emoji: "🧅", name: { en: "Onion (1 kg)" }, price: 35 },
  { id: "bread", emoji: "🍞", name: { en: "Bread" }, price: 35 },
  { id: "bananas", emoji: "🍌", name: { en: "Bananas (1 Doz)" }, price: 40 },
  { id: "tomato", emoji: "🍅", name: { en: "Tomato (1 kg)" }, price: 40 },
  { id: "colddrink", emoji: "🥤", name: { en: "Cold Drink" }, price: 40 },
  { id: "notebook", emoji: "📒", name: { en: "Notebook" }, price: 40 },
  { id: "eggs", emoji: "🥚", name: { en: "Eggs (6 pcs)" }, price: 42 },
  { id: "sugar", emoji: "🧂", name: { en: "Sugar (1 kg)" }, price: 45 },
  { id: "toothpaste", emoji: "🪥", name: { en: "Toothpaste" }, price: 55 },
  { id: "rice", emoji: "🍚", name: { en: "Rice (1 kg)" }, price: 65 },
  { id: "dal", emoji: "🥣", name: { en: "Lentils (500g)" }, price: 75 },
  { id: "tea", emoji: "🍵", name: { en: "Tea Leaves (250g)" }, price: 95 },
  { id: "shampoo", emoji: "🧴", name: { en: "Shampoo Bottle" }, price: 110 },
  { id: "oil", emoji: "🛢️", name: { en: "Cooking Oil (1 Ltr)" }, price: 120 },
];

export const CUSTOMERS: Customer[] = [
  {
    id: "uncle",
    emoji: "👨🏽‍🦳",
    name: { en: "Mr. Sharma" },
    greeting: { en: "Hello there!" },
  },
  {
    id: "aunty",
    emoji: "👩🏽",
    name: { en: "Mrs. Priya" },
    greeting: { en: "Hello, dear!" },
  },
  {
    id: "student",
    emoji: "🧒🏽",
    name: { en: "Rohan" },
    greeting: { en: "Hi there!" },
  },
  {
    id: "parent",
    emoji: "👩🏽‍👧🏽",
    name: { en: "Meera & Anu" },
    greeting: { en: "Good morning!" },
  },
  {
    id: "delivery",
    emoji: "🧑🏽‍🔧",
    name: { en: "Raju" },
    greeting: { en: "Hey there!" },
  },
  {
    id: "dadi",
    emoji: "👵🏽",
    name: { en: "Grandma" },
    greeting: { en: "Hello, dear!" },
  },
  {
    id: "girl",
    emoji: "👧🏽",
    name: { en: "Jessica" },
    greeting: { en: "Hello, dear!" },
  },
];

type Rng = () => number;
const randInt = (rng: Rng, lo: number, hi: number, step = 1) =>
  lo + step * Math.floor(rng() * (Math.floor((hi - lo) / step) + 1));
const pick = <T>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;

function pickProducts(
  rng: Rng,
  n: number,
  filterFn?: (p: (typeof PRODUCTS)[number]) => boolean,
): typeof PRODUCTS {
  const pool = filterFn ? PRODUCTS.filter(filterFn) : [...PRODUCTS];
  if (pool.length < n) return pickProducts(rng, n); // fallback if filter too strict
  const out = [];
  const p2 = [...pool];
  for (let i = 0; i < n; i++) out.push(p2.splice(Math.floor(rng() * p2.length), 1)[0]!);
  return out;
}

const item = (p: (typeof PRODUCTS)[number], unitPrice: number, qty = 1): LineItem => ({
  productId: p.id,
  emoji: p.emoji,
  name: p.name,
  unitPrice,
  qty,
});

const PAY_NOTES = [10, 20, 50, 100, 200, 500];

/** Choose what the customer hands over: a single natural note (sometimes two). */
export function choosePayment(
  rng: Rng,
  payable: number,
  allowExact: boolean,
): { paid: number; pieces: DenomId[] } {
  if (allowExact && rng() < 0.12 && PAY_NOTES.includes(payable)) {
    return { paid: payable, pieces: [`n${payable}` as DenomId] };
  }
  const options = PAY_NOTES.filter((n) => n > payable);
  if (options.length) {
    const note = (options.length > 1 && rng() < 0.25 ? options[1] : options[0])!;
    return { paid: note, pieces: [`n${note}` as DenomId] };
  }
  // larger than 500: pay with multiple $500 notes
  const count = Math.ceil((payable + 1) / 500);
  return { paid: count * 500, pieces: Array(count).fill("n500") };
}

export const STUDIO_ORDERS_BY_CUSTOMER: Record<
  string,
  Array<{
    items: Array<{ productId: string; qty: number; unitPrice?: number }>;
    paid: number;
    discount?: Discount;
  }>
> = {
  aunty: [
    { items: [{ productId: "chocolate", qty: 2 }], paid: 200 },
    { items: [{ productId: "juice", qty: 1 }], paid: 50 },
    { items: [{ productId: "milk", qty: 1 }], paid: 100 },
    { items: [{ productId: "pen", qty: 2 }], paid: 50 },
    { items: [{ productId: "potato", qty: 2 }], paid: 100 },
    { items: [{ productId: "pencil", qty: 2 }], paid: 20 },
    { items: [{ productId: "biscuits", qty: 1 }], paid: 20 },
    { items: [{ productId: "battery", qty: 2 }], paid: 100 },
  ],
  uncle: [
    { items: [{ productId: "chocolate", qty: 2 }], paid: 200 },
    { items: [{ productId: "soap", qty: 1, unitPrice: 10 }], paid: 10 },
    { items: [{ productId: "bread", qty: 1 }], paid: 50 },
    { items: [{ productId: "tea", qty: 1 }], paid: 100 },
    { items: [{ productId: "soap", qty: 2 }], paid: 100 },
    { items: [{ productId: "milk", qty: 1 }], paid: 50 },
  ],
  student: [
    { items: [{ productId: "chips", qty: 1 }], paid: 20 },
    { items: [{ productId: "pencil", qty: 2 }, { productId: "eraser", qty: 1 }], paid: 20 },
    { items: [{ productId: "notebook", qty: 1 }], paid: 50 },
    { items: [{ productId: "chocolate", qty: 2 }], paid: 50 },
    { items: [{ productId: "pen", qty: 2 }], paid: 20 },
    { items: [{ productId: "icecream", qty: 1 }], paid: 50 },
  ],
  parent: [
    { items: [{ productId: "milk", qty: 1 }], paid: 50 },
    { items: [{ productId: "chocolate", qty: 2 }, { productId: "bread", qty: 1 }], paid: 100 },
    { items: [{ productId: "bread", qty: 1 }], paid: 50 },
    { items: [{ productId: "juice", qty: 2 }], paid: 50 },
    { items: [{ productId: "bananas", qty: 1 }], paid: 50 },
    { items: [{ productId: "eggs", qty: 1 }], paid: 50 },
  ],
  delivery: [
    { items: [{ productId: "colddrink", qty: 1 }], paid: 50 },
    { items: [{ productId: "battery", qty: 2 }], paid: 50 },
    { items: [{ productId: "colddrink", qty: 2 }], paid: 100 },
    { items: [{ productId: "chips", qty: 1 }], paid: 50 },
    { items: [{ productId: "oil", qty: 1 }], paid: 200 },
    { items: [{ productId: "matchbox", qty: 1 }], paid: 10 },
  ],
  dadi: [
    { items: [{ productId: "bread", qty: 1 }], paid: 100 },
    { items: [{ productId: "milk", qty: 1 }], paid: 50 },
    { items: [{ productId: "tea", qty: 1 }], paid: 100 },
    { items: [{ productId: "biscuits", qty: 1 }], paid: 50 },
    { items: [{ productId: "sugar", qty: 1 }], paid: 50 },
    { items: [{ productId: "bread", qty: 2 }], paid: 100 },
    { items: [{ productId: "dal", qty: 1 }], paid: 100 },
  ],
  girl: [
    { items: [{ productId: "juice", qty: 1 }], paid: 50 },
    { items: [{ productId: "toffee", qty: 1 }], paid: 5 },
    { items: [{ productId: "chocolate", qty: 1 }], paid: 50 },
    { items: [{ productId: "icecream", qty: 2 }], paid: 50 },
    { items: [{ productId: "pen", qty: 2 }], paid: 20 },
    { items: [{ productId: "chips", qty: 1 }], paid: 20 },
  ],
};

export interface ScenarioPlan {
  customerId: string;
  items: Array<{ productId: string; qty: number; unitPrice?: number }>;
  paid: number;
  discount?: Discount;
}

export const LEVEL_SCENARIO_TEMPLATES: Record<number, ScenarioPlan[]> = {
  1: [
    // Level 1: First Day at the Shop (Single-item sales & round change)
    { customerId: "aunty", items: [{ productId: "chocolate", qty: 2 }], paid: 200 },
    { customerId: "uncle", items: [{ productId: "bread", qty: 1 }], paid: 50 },
    { customerId: "parent", items: [{ productId: "milk", qty: 1 }], paid: 50 },
    { customerId: "delivery", items: [{ productId: "matchbox", qty: 1 }], paid: 10 },
  ],
  2: [
    // Level 2: Exact Change & Quick Cash (Exact payment $0 change vs small change)
    { customerId: "student", items: [{ productId: "chips", qty: 1 }], paid: 20 },
    { customerId: "uncle", items: [{ productId: "soap", qty: 1, unitPrice: 10 }], paid: 10 },
    { customerId: "girl", items: [{ productId: "pen", qty: 2 }], paid: 20 },
    { customerId: "student", items: [{ productId: "chocolate", qty: 2 }], paid: 50 },
  ],
  3: [
    // Level 3: Tricky Prices & Coins (Coin arithmetic & non-round prices $1, $2, $5)
    { customerId: "parent", items: [{ productId: "milk", qty: 1 }], paid: 50 },
    { customerId: "delivery", items: [{ productId: "matchbox", qty: 1 }], paid: 10 },
    { customerId: "girl", items: [{ productId: "toffee", qty: 1 }], paid: 5 },
    { customerId: "uncle", items: [{ productId: "tea", qty: 1 }], paid: 100 },
  ],
  4: [
    // Level 4: Shopping List Basket (Multi-item addition & bill subtotals 2-3 items)
    { customerId: "delivery", items: [{ productId: "matchbox", qty: 1 }], paid: 10 },
    { customerId: "student", items: [{ productId: "pencil", qty: 2 }, { productId: "eraser", qty: 1 }], paid: 20 },
    { customerId: "parent", items: [{ productId: "chocolate", qty: 2 }, { productId: "bread", qty: 1 }], paid: 100 },
    { customerId: "student", items: [{ productId: "pencil", qty: 2 }, { productId: "eraser", qty: 1 }], paid: 20 },
    { customerId: "parent", items: [{ productId: "chocolate", qty: 2 }, { productId: "bread", qty: 1 }], paid: 100 },
  ],
  5: [
    // Level 5: Buy More, Save More (Multiplication & quantity discounts)
    { customerId: "dadi", items: [{ productId: "bread", qty: 1 }], paid: 100 },
    { customerId: "delivery", items: [{ productId: "colddrink", qty: 2 }], paid: 100, discount: { label: { en: "Buy 2, save $10" }, amount: 10 } },
    { customerId: "aunty", items: [{ productId: "potato", qty: 2 }], paid: 100, discount: { label: { en: "Buy 2, save $10" }, amount: 10 } },
    { customerId: "parent", items: [{ productId: "juice", qty: 2 }], paid: 50, discount: { label: { en: "Buy 2, save $5" }, amount: 5 } },
    { customerId: "uncle", items: [{ productId: "soap", qty: 2 }], paid: 100, discount: { label: { en: "Buy 2, save $6" }, amount: 6 } },
  ],
  6: [
    // Level 6: Special Coupons & Promo Codes (Flat promotional coupon deductions)
    { customerId: "girl", items: [{ productId: "juice", qty: 1 }], paid: 50 },
    { customerId: "student", items: [{ productId: "notebook", qty: 1 }], paid: 50, discount: { label: { en: "Store coupon: $10 off" }, amount: 10 } },
    { customerId: "dadi", items: [{ productId: "dal", qty: 1 }], paid: 100, discount: { label: { en: "Store coupon: $15 off" }, amount: 15 } },
    { customerId: "uncle", items: [{ productId: "chocolate", qty: 2 }], paid: 200, discount: { label: { en: "Store coupon: $10 off" }, amount: 10 } },
    { customerId: "aunty", items: [{ productId: "battery", qty: 2 }], paid: 100, discount: { label: { en: "Store coupon: $5 off" }, amount: 5 } },
  ],
  7: [
    // Level 7: Combo Deals & Percentage Off (Percentage discounts & combo savings)
    { customerId: "uncle", items: [{ productId: "bread", qty: 1 }], paid: 50, discount: { label: { en: "Combo deal: 20% off" }, amount: 7 } },
    { customerId: "parent", items: [{ productId: "bananas", qty: 1 }], paid: 50, discount: { label: { en: "20% off on Bananas" }, amount: 8 } },
    { customerId: "delivery", items: [{ productId: "chips", qty: 1 }], paid: 50, discount: { label: { en: "50% off on Snack Deal" }, amount: 10 } },
    { customerId: "student", items: [{ productId: "icecream", qty: 1 }], paid: 50, discount: { label: { en: "20% off on Ice Cream" }, amount: 5 } },
    { customerId: "dadi", items: [{ productId: "tea", qty: 1 }], paid: 100, discount: { label: { en: "10% off on Tea" }, amount: 10 } },
  ],
  8: [
    // Level 8: Big Shopping Day (Large bills $200/$500 & high-value purchases)
    { customerId: "aunty", items: [{ productId: "juice", qty: 1 }], paid: 50 },
    { customerId: "delivery", items: [{ productId: "oil", qty: 1 }], paid: 200 },
    { customerId: "uncle", items: [{ productId: "chocolate", qty: 2 }], paid: 200 },
    { customerId: "aunty", items: [{ productId: "chocolate", qty: 2 }], paid: 200 },
    { customerId: "delivery", items: [{ productId: "oil", qty: 1 }], paid: 200, discount: { label: { en: "Big Shopper Coupon: $20 off" }, amount: 20 } },
  ],
  9: [
    // Level 9: The Smart Cashier (Multi-concept mastery & mixed transactions)
    { customerId: "student", items: [{ productId: "notebook", qty: 1 }], paid: 50 },
    { customerId: "parent", items: [{ productId: "chocolate", qty: 2 }, { productId: "bread", qty: 1 }], paid: 100, discount: { label: { en: "Member reward: $15 off" }, amount: 15 } },
    { customerId: "girl", items: [{ productId: "icecream", qty: 2 }], paid: 50 },
    { customerId: "dadi", items: [{ productId: "dal", qty: 1 }], paid: 100, discount: { label: { en: "Store coupon: $15 off" }, amount: 15 } },
    { customerId: "delivery", items: [{ productId: "oil", qty: 1 }], paid: 200, discount: { label: { en: "Member reward: $20 off" }, amount: 20 } },
  ],
  10: [
    // Level 10: Rush Hour Challenge (Rapid multi-item calculation under rush pressure)
    { customerId: "parent", items: [{ productId: "milk", qty: 1 }], paid: 50 },
    { customerId: "delivery", items: [{ productId: "colddrink", qty: 2 }], paid: 100 },
    { customerId: "student", items: [{ productId: "chips", qty: 1 }], paid: 20 },
    { customerId: "girl", items: [{ productId: "pen", qty: 2 }], paid: 20 },
    { customerId: "uncle", items: [{ productId: "bread", qty: 1 }], paid: 50 },
    { customerId: "delivery", items: [{ productId: "matchbox", qty: 1 }], paid: 10 },
  ],
};

export function generateScenario(level: number, index: number, rng: Rng = Math.random): Scenario {
  const levelDef = LEVELS.find((l) => l.number === level) ?? LEVELS[0]!;
  const timeLimit = levelDef.timeLimit ?? null;

  const templates = LEVEL_SCENARIO_TEMPLATES[level] ?? LEVEL_SCENARIO_TEMPLATES[1]!;
  const template = templates[index % templates.length]!;
  const customer = CUSTOMERS.find((c) => c.id === template.customerId) ?? CUSTOMERS[0]!;

  const items: LineItem[] = template.items.map((it) => {
    const p = PRODUCTS.find((prod) => prod.id === it.productId)!;
    return item(p, it.unitPrice ?? p.price, it.qty);
  });

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const discount = template.discount ? { ...template.discount } : null;
  const payable = Math.max(1, subtotal - (discount?.amount ?? 0));
  const paid = template.paid;
  const pieces: DenomId[] = paid === 5 ? ["c5"] : [`n${paid}` as DenomId];

  return {
    id: `L${level}-${index}-${Math.floor(rng() * 1e6)}`,
    level,
    customer,
    items,
    subtotal,
    discount,
    payable,
    paid,
    paidPieces: pieces,
    timeLimit,
  };
}

export const requiredChange = (s: Scenario) => s.paid - s.payable;

export function trayTotal(tray: Tray): number {
  return Object.entries(tray).reduce(
    (s, [id, n]) => s + denomById(id as DenomId).value * (n ?? 0),
    0,
  );
}

export function trayState(tray: Tray, required: number): TotalState {
  const t = trayTotal(tray);
  if (t === 0) return required === 0 ? "exact" : "empty";
  if (t < required) return "below";
  if (t === required) return "exact";
  return "above";
}

export function evaluate(
  tray: Tray,
  scenario: Scenario,
  mistakes: number,
  hintsUsed: number,
): SubmissionResult {
  const diff = trayTotal(tray) - requiredChange(scenario);
  if (diff < 0) return { kind: "too-little", difference: -diff };
  if (diff > 0) return { kind: "too-much", difference: diff };
  return { kind: "correct", stars: customerStars(mistakes, hintsUsed, scenario.level) };
}

export interface StarEvaluationParams {
  billMistakes: number;
  changeMistakes: number;
  multiplicationMistakes?: number;
  hintsUsed: number;
  timeTaken: number;
  timeLimit?: number | null;
  level?: number;
  timedOut?: boolean;
}

/**
 * Evaluates performance stars for a single transaction across:
 * - Line Item Multiplications
 * - Stage 1 (Bill Calculation)
 * - Stage 2 (Change Counting)
 * 3 Stars: All calculations correct on 1st attempt, 0 hints, within time.
 * 2 Stars: Completed with 1-2 mistakes or some hints.
 * 1 Star: Completed with multiple mistakes, substantial hints, or timed out.
 */
export function calculateTransactionStars(params: StarEvaluationParams): number {
  const totalMistakes =
    params.billMistakes + params.changeMistakes + (params.multiplicationMistakes ?? 0);
  const { hintsUsed, timedOut, level = 1 } = params;

  // On timed levels, if timer expired, cap stars at 1 (or 2 if 0 mistakes made)
  if (timedOut) {
    return totalMistakes === 0 ? 2 : 1;
  }

  // Advanced levels (8-10): Higher precision required
  if (level >= 8) {
    if (totalMistakes === 0 && hintsUsed === 0) return 3;
    if (totalMistakes <= 1 && hintsUsed <= 1) return 2;
    return 1;
  }

  // Standard levels (1-7):
  if (totalMistakes === 0 && hintsUsed === 0) return 3;
  if (totalMistakes <= 2 && hintsUsed <= 2) return 2;
  return 1;
}

/**
 * Returns child-friendly multiplication hints for individual shopping basket items.
 */
export function getItemMultiplicationHint(
  qty: number,
  unitPrice: number,
  attempt: number = 1
): string {
  if (qty === 1) {
    return `1 item costs its exact unit price: $${unitPrice.toFixed(2)}.`;
  }
  if (qty === 2) {
    return `2 × $${unitPrice.toFixed(2)} is the same as $${unitPrice.toFixed(2)} + $${unitPrice.toFixed(2)}.`;
  }
  if (attempt <= 1) {
    return `Multiply quantity (${qty}) by unit price ($${unitPrice.toFixed(2)}).`;
  }
  return `Try repeated addition: add $${unitPrice.toFixed(2)} a total of ${qty} times.`;
}

/**
 * Checks whether all shopping basket items have been multiplied and solved by the player.
 */
export function areAllItemsMultiplied(
  scenario: Scenario,
  solvedItemIds: Record<string, boolean>
): boolean {
  return scenario.items.every((item) => Boolean(solvedItemIds[item.productId]));
}

/**
 * Returns progressive, pedagogical hints for Stage 1 (Bill Calculation) without leaking the answer.
 * Attempt 1: Identify which part needs checking.
 * Attempt 2: Explain the arithmetic operation.
 * Attempt 3+: Step-by-step worked approach using the customer's actual transaction values.
 */
export function getBillHint(
  attempt: number,
  scenario: Scenario,
  enteredTotal?: number | ""
): string {
  const { items, discount, subtotal } = scenario;
  const entered = typeof enteredTotal === "number" ? enteredTotal : null;

  // Specific check: user forgot discount
  if (discount && entered === subtotal) {
    return `Almost! You found the subtotal ($${subtotal.toFixed(2)}), but remember to subtract the $${discount.amount.toFixed(2)} discount!`;
  }

  // Attempt 1: Identify which part needs checking
  if (attempt <= 1) {
    if (items.length === 1) {
      return `Multiply quantity (${items[0]!.qty}) by unit price ($${items[0]!.unitPrice.toFixed(2)}).`;
    }
    if (discount) {
      return "Check both your item multiplications and the coupon deduction.";
    }
    return "Check your addition across all items in the shopping basket.";
  }

  // Attempt 2: Explain the arithmetic operation
  if (attempt === 2) {
    if (items.length === 1) {
      return `Multiply quantity (${items[0]!.qty}) by unit price ($${items[0]!.unitPrice.toFixed(2)}) to find the total to pay.`;
    }
    if (discount) {
      return `First multiply Quantity × Unit Price for each product, add them together, then subtract the $${discount.amount.toFixed(2)} discount.`;
    }
    return "First multiply Quantity × Unit Price for each product, then add all item subtotals together.";
  }

  // Attempt 3+: Worked approach using player's actual values without giving the final answer
  if (items.length === 1) {
    return `Worked step: Multiply ${items[0]!.qty} by $${items[0]!.unitPrice.toFixed(2)}.${discount ? ` Then subtract $${discount.amount.toFixed(2)}.` : " Enter that amount into Total to Pay."}`;
  }

  const itemsFormula = items
    .map((i) => `${i.qty} × $${i.unitPrice.toFixed(2)}`)
    .join(" + ");
  if (discount) {
    return `Worked steps: Calculate (${itemsFormula}), then subtract $${discount.amount.toFixed(2)} discount.`;
  }
  return `Worked steps: Calculate each item (${itemsFormula}), then add them all together.`;
}

/**
 * Returns progressive hints for Stage 2 (Change Counting).
 * Attempt 1: Explain difference (too much vs too little).
 * Attempt 2: Explain mathematical subtraction.
 * Attempt 3+: Count-up step guidance.
 */
export function getChangeHint(
  attempt: number,
  scenario: Scenario,
  traySum: number
): string {
  const required = scenario.paid - scenario.payable;
  const diff = traySum - required;

  if (required === 0) {
    return "The customer paid exact money! Tap the green NO CHANGE button.";
  }

  if (attempt <= 1) {
    if (diff < 0) {
      return `Customer needs $${(-diff).toFixed(2)} more change. Try adding more coins or bills from the drawer!`;
    }
    return `That's $${diff.toFixed(2)} too much change. Tap a piece in the tray to take it back!`;
  }

  if (attempt === 2) {
    return `Customer paid $${scenario.paid.toFixed(2)} for a $${scenario.payable.toFixed(2)} bill: $${scenario.paid.toFixed(2)} − $${scenario.payable.toFixed(2)} = $${required.toFixed(2)} change needed.`;
  }

  // Attempt 3+: Count-up steps
  const steps = countUpSteps(scenario.payable, scenario.paid);
  if (steps.length > 0) {
    const firstStep = steps[0]!;
    const denom = denomById(firstStep.denom);
    return `Count-up hint: Start at $${scenario.payable.toFixed(2)}, add a $${denom.value.toFixed(2)} ${denom.kind} to reach $${firstStep.to.toFixed(2)}.`;
  }
  return `Target change is $${required.toFixed(2)}. Select bills and coins that add up to this exact amount.`;
}

/**
 * Encouraging feedback message based on performance stars.
 */
export function getEncouragingFeedback(stars: number): string {
  switch (stars) {
    case 3:
      return "Excellent! Perfect calculation!";
    case 2:
      return "Great job! You handled that transaction.";
    default:
      return "Good effort! Keep practising your calculations.";
  }
}

/**
 * Aggregates all transaction records into an overall level performance summary.
 */
export function calculateLevelSummary(transactions: TransactionRecord[]) {
  const totalCustomers = transactions.length;
  const totalMistakes = transactions.reduce(
    (acc, t) => acc + t.billMistakes + t.changeMistakes + (t.multiplicationMistakes ?? 0),
    0
  );
  const totalHints = transactions.reduce((acc, t) => acc + t.hintsUsed, 0);
  const totalStars = transactions.reduce((acc, t) => acc + t.stars, 0);
  const correctBillFirstTry = transactions.filter((t) => t.billFirstTry).length;
  const correctChangeFirstTry = transactions.filter((t) => t.changeFirstTry).length;
  const totalTime = transactions.reduce((acc, t) => acc + t.timeTaken, 0);
  const avgTime = totalCustomers > 0 ? Math.round(totalTime / totalCustomers) : 0;
  const starsList = transactions.map((t) => t.stars);
  const finalLevelStars = levelStars(starsList);
  const totalMultiplicationsCompleted = transactions.reduce(
    (acc, t) => acc + (t.multiplicationsCompleted ?? 0),
    0
  );
  const totalMultiplicationMistakes = transactions.reduce(
    (acc, t) => acc + (t.multiplicationMistakes ?? 0),
    0
  );

  return {
    totalCustomers,
    totalMistakes,
    totalHints,
    totalStars,
    correctBillFirstTry,
    correctChangeFirstTry,
    totalTime,
    avgTime,
    finalLevelStars,
    totalMultiplicationsCompleted,
    totalMultiplicationMistakes,
  };
}

export const customerStars = (mistakes: number, hintsUsed: number, level: number = 1) => {
  if (level >= 8) {
    // Advanced levels (8-10): Higher precision required - 0 mistakes/hints for 3 stars, 1 for 2 stars, otherwise 1
    return mistakes === 0 && hintsUsed === 0 ? 3 : mistakes + hintsUsed === 1 ? 2 : 1;
  }
  return mistakes === 0 && hintsUsed === 0 ? 3 : mistakes + hintsUsed <= 2 ? 2 : 1;
};

/** Level stars = rounded average of customer stars. */
export const levelStars = (customerStarList: number[]) =>
  customerStarList.length
    ? Math.max(1, Math.round(customerStarList.reduce((a, b) => a + b, 0) / customerStarList.length))
    : 0;

const COUNT_UP_DENOMS: DenomId[] = ["n500", "n200", "n100", "n50", "n20", "n10", "c5", "c2", "c1"];

/**
 * Count-up hint: starting at the price, add one piece at a time,
 * preferring the largest piece that lands on a "round" number for that piece.
 */
export function countUpSteps(price: number, paid: number): HintStep[] {
  const steps: HintStep[] = [];
  let cur = price;
  while (cur < paid) {
    const rem = paid - cur;
    let chosen = COUNT_UP_DENOMS.find((id) => {
      const v = denomById(id).value;
      return v <= rem && (cur + v) % v === 0;
    });
    if (!chosen) chosen = COUNT_UP_DENOMS.find((id) => denomById(id).value <= rem)!;
    const v = denomById(chosen).value;
    steps.push({ from: cur, to: cur + v, denom: chosen });
    cur += v;
  }
  return steps;
}

export function stepsToTray(steps: HintStep[]): Tray {
  const t: Tray = {};
  for (const s of steps) t[s.denom] = (t[s.denom] ?? 0) + 1;
  return t;
}

export const isUnlocked = (_progress: Progress, _levelIndex: number) => true;

export const emptyProgress = (): Progress => ({ stars: Array(LEVELS.length).fill(0) });
