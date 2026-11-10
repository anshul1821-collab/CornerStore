export type Lang = "en";
export type DenomKind = "coin" | "note";
export type DenomId = "c1" | "c2" | "c5" | "c10" | "n10" | "n20" | "n50" | "n100" | "n200" | "n500";

export interface Denomination {
  id: DenomId;
  value: number;
  kind: DenomKind;
}

export interface Localized {
  en: string;
  hi?: string;
}

export interface Customer {
  id: string;
  emoji: string;
  name: Localized;
  greeting: Localized;
}

export interface LineItem {
  productId: string;
  emoji: string;
  name: Localized;
  unitPrice: number;
  qty: number;
}

export interface Discount {
  label: Localized;
  amount: number;
}

export interface Scenario {
  id: string;
  level: number;
  customer: Customer;
  items: LineItem[];
  subtotal: number;
  discount: Discount | null;
  payable: number;
  paid: number;
  paidPieces: DenomId[];
  timeLimit: number | null;
}

/** Map of denomination -> count placed in the change tray. */
export type Tray = Partial<Record<DenomId, number>>;

export interface HintStep {
  from: number;
  to: number;
  denom: DenomId;
}

export type SubmissionResult =
  | { kind: "correct"; stars: number }
  | { kind: "too-little"; difference: number }
  | { kind: "too-much"; difference: number }
  | { kind: "timeout" };

export type TotalState = "empty" | "below" | "exact" | "above";

export type DifficultyTier = "Easy" | "Medium" | "Hard" | "Expert";

export interface LevelDef {
  number: number;
  icon: string;
  title: Localized;
  customers: number;
  description: Localized;
  concept: Localized;
  difficulty: DifficultyTier;
  timeLimit?: number | null;
}

export interface Progress {
  /** stars per level index (0 = not completed) */
  stars: number[];
}

export interface TransactionRecord {
  customerIndex: number;
  customerName: string;
  billMistakes: number;
  changeMistakes: number;
  multiplicationMistakes?: number;
  multiplicationsCompleted?: number;
  hintsUsed: number;
  timeTaken: number;
  billFirstTry: boolean;
  changeFirstTry: boolean;
  stars: number;
  timedOut?: boolean;
}

export interface LevelStats {
  stars: number[];
  mistakes: number;
  hints: number;
  transactions?: TransactionRecord[];
  totalTime?: number;
  correctBillFirstTry?: number;
  correctChangeFirstTry?: number;
  totalMultiplicationsCompleted?: number;
  totalMultiplicationMistakes?: number;
}

