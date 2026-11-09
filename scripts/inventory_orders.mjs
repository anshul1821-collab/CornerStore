import fs from "fs";

const code = fs.readFileSync("src/lib/dialogueAudio.ts", "utf-8");
const lines = code.split("\n");
let inMap = false;
let currentKey = "";
const studioMap = {};

for (const line of lines) {
  if (line.includes("export const PREGENERATED_STUDIO_MAP")) {
    inMap = true;
    continue;
  }
  if (inMap && line.includes("};")) {
    inMap = false;
    break;
  }
  if (inMap) {
    const trimmed = line.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('":')) {
      currentKey = trimmed.slice(1, -2);
    } else if (currentKey && (trimmed.startsWith('"') || trimmed.startsWith("'"))) {
      const url = trimmed.replace(/['",]/g, "").trim();
      studioMap[currentKey] = url;
      currentKey = "";
    }
  }
}

const ordersByChar = {};
for (const [k, url] of Object.entries(studioMap)) {
  const [char, ...rest] = k.split(":");
  const text = rest.join(":");
  if (text.includes("I'd like") || text.includes("We'd like") || text.includes("Need these items")) {
    if (!ordersByChar[char]) ordersByChar[char] = [];
    ordersByChar[char].push({ text, url });
  }
}

console.log("=== PRE-GENERATED ORDER INVENTORY BY CHARACTER ===");
for (const [char, list] of Object.entries(ordersByChar)) {
  console.log(`\nCustomer [${char}] (${list.length} pre-generated orders):`);
  for (const item of list) {
    console.log(`  "${item.text}" -> ${item.url}`);
  }
}

