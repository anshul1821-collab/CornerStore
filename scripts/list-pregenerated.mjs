import fs from "fs";
import path from "path";

const code = fs.readFileSync("src/lib/dialogueAudio.ts", "utf-8");
const mapMatch = code.match(/export const PREGENERATED_STUDIO_MAP: Record<string, string> = {([\s\S]*?)};/);
if (mapMatch) {
  const lines = mapMatch[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith('"') && l.includes(":"));

  console.log("Total entries in PREGENERATED_STUDIO_MAP:", lines.length);

  const byChar = {};
  for (const l of lines) {
    const quoteEnd = l.indexOf('":');
    if (quoteEnd > 0) {
      const key = l.slice(1, quoteEnd);
      const url = l.slice(quoteEnd + 2).trim().replace(/['",]/g, "");
      const [char, ...textParts] = key.split(":");
      const text = textParts.join(":");
      if (!byChar[char]) byChar[char] = [];
      byChar[char].push({ text, url });
    }
  }

  for (const [char, items] of Object.entries(byChar)) {
    console.log(`\n=== Character: ${char} (${items.length} audio mappings) ===`);
    for (const item of items) {
      console.log(`  "${item.text}" -> ${item.url}`);
    }
  }
}

