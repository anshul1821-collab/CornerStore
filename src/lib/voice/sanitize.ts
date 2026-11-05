/**
 * Conversational text formatting and speech sanitization for ElevenLabs & browser TTS:
 * - Natural pronunciation of numbers & rupee amounts (₹25, ₹75, ₹135, ₹200, ₹1,250)
 * - Conversational phrasing for groceries (e.g. "a kilo of salt", "six eggs")
 * - Smart audio tags removal so TTS models never speak bracketed words aloud
 * - Clean emoji removal to eliminate unnatural speech pauses
 */

/**
 * Format product item quantities into natural, spoken English.
 * e.g. "Salt (1 kg)" -> "a kilo of salt"
 *      "Eggs (6 pcs)" -> "six eggs"
 *      "Bananas (1 Doz)" -> "a dozen bananas"
 */
export function formatItemForSpeech(itemName: string, qty: number = 1): string {
  const name = itemName.trim();

  // Handle unit notations in product names
  if (name.includes("(1 kg)")) {
    const base = name.replace(/\(1 kg\)/i, "").trim().toLowerCase();
    return qty > 1 ? `${qty} kilos of ${base}` : `a kilo of ${base}`;
  }
  if (name.includes("(6 pcs)")) {
    const base = name.replace(/\(6 pcs\)/i, "").trim().toLowerCase();
    return qty > 1 ? `${qty * 6} ${base}` : `six ${base}`;
  }
  if (name.includes("(1 Doz)")) {
    const base = name.replace(/\(1 Doz\)/i, "").trim().toLowerCase();
    return qty > 1 ? `${qty} dozen ${base}` : `a dozen ${base}`;
  }
  if (name.includes("(1 Ltr)")) {
    const base = name.replace(/\(1 Ltr\)/i, "").trim().toLowerCase();
    return qty > 1 ? `${qty} liters of ${base}` : `a bottle of ${base}`;
  }
  if (name.includes("(500g)")) {
    const base = name.replace(/\(500g\)/i, "").trim().toLowerCase();
    return qty > 1 ? `${qty} packets of ${base}` : `a packet of ${base}`;
  }
  if (name.includes("(250g)")) {
    const base = name.replace(/\(250g\)/i, "").trim().toLowerCase();
    return qty > 1 ? `${qty} packs of ${base}` : `tea leaves`;
  }

  // Handle specific grocery products naturally
  const lower = name.toLowerCase();
  if (lower === "bread") {
    return qty > 1 ? `${qty} loaves of bread` : "a loaf of bread";
  }
  if (lower === "soap") {
    return qty > 1 ? `${qty} bars of soap` : "a bar of soap";
  }
  if (lower === "milk packet" || lower === "milk") {
    return qty > 1 ? `${qty} packets of milk` : "a packet of milk";
  }
  if (lower === "biscuits") {
    return qty > 1 ? `${qty} packets of biscuits` : "a packet of biscuits";
  }
  if (lower === "chips") {
    return qty > 1 ? `${qty} packets of chips` : "a packet of chips";
  }
  if (lower === "noodles") {
    return qty > 1 ? `${qty} packets of noodles` : "a packet of noodles";
  }
  if (lower === "toothpaste") {
    return qty > 1 ? `${qty} tubes of toothpaste` : "a tube of toothpaste";
  }
  if (lower === "shampoo bottle") {
    return qty > 1 ? `${qty} bottles of shampoo` : "a bottle of shampoo";
  }
  if (lower === "juice box") {
    return qty > 1 ? `${qty} juice boxes` : "a juice box";
  }
  if (lower === "matchbox") {
    return qty > 1 ? `${qty} matchboxes` : "a matchbox";
  }

  // Generic natural singular/plural English phrasing
  if (qty > 1) {
    if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) {
      return `${qty} ${lower.slice(0, -1)}ies`;
    }
    if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("ch") || lower.endsWith("sh")) {
      return `${qty} ${lower}es`;
    }
    return `${qty} ${lower}s`;
  }

  // Singular with "a" or "an"
  const startsWithVowel = /^[aeiou]/i.test(lower);
  return `${startsWithVowel ? "an" : "a"} ${lower}`;
}

/**
 * Clean text for high-quality, natural TTS pronunciation:
 * - Replaces ₹1 with "1 rupee" (singular)
 * - Replaces ₹1,250 with "1250 rupees" (removes commas so TTS does not pause mid-number)
 * - Replaces ₹45.50 with "45 rupees and 50 paise"
 * - Replaces lone ₹ with "rupees"
 * - Strips any bracketed tags (e.g. [friendly], [excited]) so voice models never say brackets aloud
 * - Removes emojis so TTS engine doesn't stutter or read out unicode descriptions
 */
export function sanitizeTextForSpeech(raw: string, options?: { stripTags?: boolean }): string {
  let text = raw
    // Match ₹ followed by numbers with optional commas and decimals (e.g. ₹1,250 or ₹200 or ₹45.50)
    .replace(/₹\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]+)?)/g, (_match, num) => {
      const cleanNum = num.replace(/,/g, "");
      if (cleanNum.includes(".")) {
        const [whole, dec] = cleanNum.split(".");
        const paise = dec.length === 1 ? `${dec}0` : dec;
        const wholeRupees = whole === "1" ? "1 rupee" : `${whole} rupees`;
        return `${wholeRupees} and ${paise} paise`;
      }
      if (cleanNum === "1") {
        return "1 rupee";
      }
      return `${cleanNum} rupees`;
    })
    .replace(/₹/g, "rupees")
    // Remove emojis
    .replace(/\p{Extended_Pictographic}/gu, "");

  // Strip [bracket] tags by default (or if stripTags is requested)
  // This guarantees neither ElevenLabs nor Browser TTS speaks bracket words aloud!
  if (options?.stripTags !== false) {
    text = text.replace(/\[[a-zA-Z\s_-]+\]/g, "");
  }

  return text.replace(/\s+/g, " ").trim();
}
