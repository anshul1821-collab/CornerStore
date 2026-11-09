/**
 * Number to spoken English words converter (handles 0 to 999,999)
 */
const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

export function numberToWords(num: number): string {
  if (num === 0) return "zero";
  if (num < 0) return `minus ${numberToWords(Math.abs(num))}`;

  let words = "";

  if (Math.floor(num / 1000) > 0) {
    words += `${numberToWords(Math.floor(num / 1000))} thousand `;
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    words += `${ONES[Math.floor(num / 100)]} hundred `;
    num %= 100;
  }

  if (num > 0) {
    if (words !== "") {
      words += "and ";
    }

    if (num < 20) {
      words += ONES[num];
    } else {
      const ten = TENS[Math.floor(num / 10)];
      const one = ONES[num % 10];
      words += one ? `${ten}-${one}` : ten;
    }
  }

  return words.trim();
}

/**
 * Converts a dollar amount like 5.00, 10.50, 0.75, 200 into natural spoken words.
 * Examples:
 * - 5.00 -> "five dollars"
 * - 1.00 -> "one dollar"
 * - 10.50 -> "ten dollars and fifty cents"
 * - 0.50 -> "fifty cents"
 * - 0.01 -> "one cent"
 */
export function formatCurrencyForSpeech(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const dollars = Math.floor(rounded);
  const cents = Math.round((rounded - dollars) * 100);

  if (dollars === 0 && cents > 0) {
    return cents === 1 ? "one cent" : `${numberToWords(cents)} cents`;
  }

  const dollarWord = dollars === 1 ? "one dollar" : `${numberToWords(dollars)} dollars`;

  if (cents === 0) {
    return dollarWord;
  }

  const centWord = cents === 1 ? "one cent" : `${numberToWords(cents)} cents`;
  return `${dollarWord} and ${centWord}`;
}

/**
 * Sanitizes and prepares exact displayed dialogue text for natural human text-to-speech.
 * - $5.00 -> five dollars
 * - $10.50 -> ten dollars and fifty cents
 * - $200 -> two hundred dollars
 * - ×2 or x2 -> two
 * - Preserves conversational punctuation (. , ! ? - —) for natural pauses and intonation.
 * - Strips emojis so TTS doesn't vocalize emoji labels.
 * - Does not alter original displayed text in the UI.
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return "";

  let result = text;

  // 1. Expand currency amounts with decimals: $XX.YY or $XX
  // Match patterns like $5.00, $10.50, $0.50, $200
  result = result.replace(/\$(\d+(?:\.\d{1,2})?)/g, (_match, numStr: string) => {
    const val = parseFloat(numStr);
    if (isNaN(val)) return numStr;
    return formatCurrencyForSpeech(val);
  });

  // 2. Handle quantity multipliers like ×2, x2, × 2
  result = result.replace(/[×x]\s*(\d+)/gi, (_match, countStr: string) => {
    const count = parseInt(countStr, 10);
    return isNaN(count) ? countStr : numberToWords(count);
  });

  // 3. Expand standalone numbers before words (e.g. "2 Pencil" -> "two Pencil")
  result = result.replace(/\b(\d+)\b(?!\s*dollars|\s*cents)/gi, (_match, countStr: string) => {
    const count = parseInt(countStr, 10);
    return isNaN(count) ? countStr : numberToWords(count);
  });

  // 4. Remove emoji unicode ranges (standard emojis, symbols, pictographs, flags)
  result = result.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
    "",
  );

  // 5. Clean up ellipses and punctuation spacing for natural conversational pauses
  result = result.replace(/\.{2,}/g, "___ELLIPSIS___");
  result = result.replace(/\s*([,!?.;:])\s*/g, "$1 ");
  result = result.replace(/___ELLIPSIS___/g, "... ");
  result = result.replace(/\s+/g, " ").trim();

  return result;
}
