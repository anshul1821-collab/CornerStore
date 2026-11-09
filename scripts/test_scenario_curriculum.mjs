import fs from "fs";
import path from "path";

// Load PREGENERATED_STUDIO_MAP
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

console.log("Loaded PREGENERATED_STUDIO_MAP with", Object.keys(studioMap).length, "entries.");

// Check if a dialogue key exists and file is on disk
function checkAudio(char, text) {
  const key = `${char}:${text}`;
  const url = studioMap[key];
  if (!url) return { ok: false, reason: "KEY_NOT_IN_MAP", key };
  const diskPath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  if (!fs.existsSync(diskPath)) return { ok: false, reason: "FILE_MISSING_ON_DISK", url };
  return { ok: true, url };
}

// Test sample customer orders
console.log("Check Aunty 2 Chocolate:", checkAudio("aunty", "Hello, dear! I'd like 2 Chocolate. Here's $200.00!"));
console.log("Check Student Chips Exact:", checkAudio("student", "Hi there! I'd like Chips. Here's exactly $20.00!"));
console.log("Check Parent 2 Choc & Bread:", checkAudio("parent", "Good morning! I'd like 2 Chocolate and Bread. Here's $100.00!"));
console.log("Check Shopkeeper Instruction:", checkAudio("shopkeeper", "Please check the price on the bill before you count the change!"));

