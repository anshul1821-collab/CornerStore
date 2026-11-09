/**
 * Pre-generate and cache dialogue audio files using ElevenLabs eleven_multilingual_v2.
 * Run with: node scripts/pregenerate-dialogues.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load .env
const envPath = path.join(rootDir, ".env");
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      env[trimmed.slice(0, eq).trim()] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}

const apiKey = (process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY || "").trim();
const modelId = "eleven_multilingual_v2";

console.log("=== ElevenLabs Dialogue Audio Pre-Generator ===");
if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
  console.log("ℹ️  No valid ELEVENLABS_API_KEY found in .env.");
  process.exit(0);
}

console.log(`✓ ELEVENLABS_API_KEY configured (${apiKey.slice(0, 4)}...${apiKey.slice(-4)})`);
console.log(`✓ Model: ${modelId}`);

const CHARACTERS_AUDIO_DIR = path.join(rootDir, "public", "audio", "characters");
const MANIFEST_FILE = path.join(CHARACTERS_AUDIO_DIR, "manifest.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(CHARACTERS_AUDIO_DIR);

// Voice Profiles matching Voice Studio exactly
const VOICE_PROFILES = {
  shopkeeper: {
    voiceId: "cjVigY5qzO86Huf0OWal", // Eric
    character: "shopkeeper",
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.4,
    speed: 0.98,
  },
  boy: {
    voiceId: "bIHbv24MWmeRgasZH58o", // Will
    character: "boy",
    stability: 0.38,
    similarityBoost: 0.75,
    style: 0.42,
    speed: 1.0,
  },
  girl: {
    voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica
    character: "girl",
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.45,
    speed: 0.98,
  },
  uncle: {
    voiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger
    character: "boy",
    customerId: "uncle",
    stability: 0.45,
    similarityBoost: 0.75,
    style: 0.35,
    speed: 0.96,
  },
  aunty: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
    character: "girl",
    customerId: "aunty",
    stability: 0.42,
    similarityBoost: 0.75,
    style: 0.4,
    speed: 0.98,
  },
  student: {
    voiceId: "bIHbv24MWmeRgasZH58o", // Will
    character: "boy",
    customerId: "student",
    stability: 0.38,
    similarityBoost: 0.75,
    style: 0.45,
    speed: 1.0,
  },
  parent: {
    voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura
    character: "girl",
    customerId: "parent",
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.4,
    speed: 0.98,
  },
  delivery: {
    voiceId: "N2lVS1w4EtoT3dr4eOWO", // Callum
    character: "boy",
    customerId: "delivery",
    stability: 0.38,
    similarityBoost: 0.75,
    style: 0.42,
    speed: 1.02,
  },
  dadi: {
    voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice
    character: "girl",
    customerId: "dadi",
    stability: 0.45,
    similarityBoost: 0.8,
    style: 0.35,
    speed: 0.94,
  },
};

// Exact speech sanitization matching src/lib/voice/sanitize.ts 100%
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

function numberToWords(num) {
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
    if (words !== "") words += "and ";
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

function formatCurrencyForSpeech(amount) {
  const rounded = Math.round(amount * 100) / 100;
  const dollars = Math.floor(rounded);
  const cents = Math.round((rounded - dollars) * 100);
  if (dollars === 0 && cents > 0) {
    return cents === 1 ? "one cent" : `${numberToWords(cents)} cents`;
  }
  const dollarWord = dollars === 1 ? "one dollar" : `${numberToWords(dollars)} dollars`;
  if (cents === 0) return dollarWord;
  const centWord = cents === 1 ? "one cent" : `${numberToWords(cents)} cents`;
  return `${dollarWord} and ${centWord}`;
}

function sanitizeTextForSpeech(text) {
  if (!text) return "";
  let result = text;
  result = result.replace(/\$(\d+(?:\.\d{1,2})?)/g, (_match, numStr) => {
    const val = parseFloat(numStr);
    if (isNaN(val)) return numStr;
    return formatCurrencyForSpeech(val);
  });
  result = result.replace(/[×x]\s*(\d+)/gi, (_match, countStr) => {
    const count = parseInt(countStr, 10);
    return isNaN(count) ? countStr : numberToWords(count);
  });
  result = result.replace(/\b(\d+)\b(?!\s*dollars|\s*cents)/gi, (_match, countStr) => {
    const count = parseInt(countStr, 10);
    return isNaN(count) ? countStr : numberToWords(count);
  });
  result = result.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
    "",
  );
  result = result.replace(/\.{2,}/g, "___ELLIPSIS___");
  result = result.replace(/\s*([,!?.;:])\s*/g, "$1 ");
  result = result.replace(/___ELLIPSIS___/g, "... ");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

const DIALOGUES_TO_PRECACHE = [
  // Shopkeeper Welcome & Praise
  {
    profileKey: "shopkeeper",
    text: "Welcome to the shop! Great to see you today. What can I get for you?",
    existingCategoryFile: "shopkeeper/1_greetings.mp3",
  },
  {
    profileKey: "shopkeeper",
    text: "Spot on! That's the exact change. Brilliant calculation!",
    existingCategoryFile: "shopkeeper/4_excited_expressions.mp3",
  },

  // Mrs. Priya (Aunty)
  {
    profileKey: "aunty",
    text: "Hello, dear! I'd like Juice Box. Here's $50.00!",
    existingCategoryFile: "aunty/2_normal_conversations.mp3",
  },
  {
    profileKey: "aunty",
    text: "Hello, dear! I'd like 2 Chocolate. Here's $200.00!",
  },
  {
    profileKey: "aunty",
    text: "Thank you so much! That's the exact change. Have a wonderful day!",
  },
  {
    profileKey: "aunty",
    text: "Wonderful! That is spot on. Thank you!",
  },

  // Mr. Sharma (Uncle)
  {
    profileKey: "uncle",
    text: "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
    existingCategoryFile: "uncle/3_questions.mp3",
  },
  {
    profileKey: "uncle",
    text: "Wonderful! That is spot on. Thank you!",
  },
  {
    profileKey: "uncle",
    text: "Hello there! I'd like Soap. Here's exactly $10.00!",
  },
  {
    profileKey: "uncle",
    text: "Hello there! I'd like 2 Chocolate. Here's $200.00!",
  },

  // Jessica / Girl
  {
    profileKey: "girl",
    text: "Thank you so much! That's the exact change. Have a wonderful day!",
    existingCategoryFile: "girl/5_thank_you_messages.mp3",
  },

  // Grandma (Dadi)
  {
    profileKey: "dadi",
    text: "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
    existingCategoryFile: "dadi/6_longer_sentences.mp3",
  },
  {
    profileKey: "dadi",
    text: "No rush at all! Take your time to count the notes.",
    existingCategoryFile: "dadi/6_longer_sentences.mp3",
  },
  {
    profileKey: "dadi",
    text: "Thank you so much, dear. You counted that beautifully!",
  },
  {
    profileKey: "dadi",
    text: "Hello, dear! I'd like Bread. Here's $100.00!",
  },

  // Rohan (Student)
  {
    profileKey: "student",
    text: "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
    existingCategoryFile: "student/7_sentences_containing_dollar_amounts.mp3",
  },
  {
    profileKey: "student",
    text: "Awesome, perfect change! Thanks a lot!",
  },
  {
    profileKey: "student",
    text: "Hi there! I'd like 2 Pencil and Eraser. Here's $20.00!",
  },
  {
    profileKey: "student",
    text: "Hi there! I'd like Chips. Here's $20.00!",
  },

  // Meera & Anu (Parent)
  {
    profileKey: "parent",
    text: "Good morning! I'd like 2 Chocolate and Bread. Here's $100.00!",
  },
  {
    profileKey: "parent",
    text: "Good morning! I'd like Milk Packet. Here's $50.00!",
  },

  // Raju (Delivery)
  {
    profileKey: "delivery",
    text: "Hey there! I'd like Cold Drink. Here's $50.00!",
  },
  {
    profileKey: "delivery",
    text: "Hey there! I'd like 2 Battery. Here's $50.00!",
  },
];

async function run() {
  let manifest = {};
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
    } catch {
      manifest = {};
    }
  }

  let cachedCount = 0;
  let generatedCount = 0;

  for (const item of DIALOGUES_TO_PRECACHE) {
    const profile = VOICE_PROFILES[item.profileKey];
    const targetFolder = profile.customerId || profile.character;
    const sanitizedText = sanitizeTextForSpeech(item.text);

    const cacheKey = crypto
      .createHash("md5")
      .update(
        `${targetFolder}:${profile.voiceId}:${modelId}:${profile.stability}:${profile.style}:${profile.speed}:${sanitizedText}`,
      )
      .digest("hex");

    const charDir = path.join(CHARACTERS_AUDIO_DIR, targetFolder);
    ensureDir(charDir);

    const audioFileName = `${cacheKey}.mp3`;
    const diskPath = path.join(charDir, audioFileName);
    const audioUrl = `/audio/characters/${targetFolder}/${audioFileName}`;

    if (fs.existsSync(diskPath)) {
      console.log(`✓ [CACHED] ${targetFolder}: "${item.text.slice(0, 45)}..."`);
      cachedCount++;
      continue;
    }

    // Check if we can reuse an existing category sample
    if (item.existingCategoryFile) {
      const srcFile = path.join(CHARACTERS_AUDIO_DIR, item.existingCategoryFile);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, diskPath);
        console.log(`✓ [LINKED FROM CATEGORY SAMPLE] ${targetFolder} -> ${audioFileName}`);
        cachedCount++;

        manifest[cacheKey] = {
          cacheKey,
          originalText: item.text,
          sanitizedText,
          character: profile.character,
          customerId: profile.customerId,
          voiceId: profile.voiceId,
          modelId,
          audioUrl,
          settings: {
            stability: profile.stability,
            similarity_boost: profile.similarityBoost,
            style: profile.style,
            speed: profile.speed,
          },
          createdAt: new Date().toISOString(),
        };
        continue;
      }
    }

    // Generate fresh from ElevenLabs
    console.log(
      `🎙️ [GENERATING] ${targetFolder} (${profile.voiceId}): "${item.text.slice(0, 45)}..."`,
    );
    try {
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(profile.voiceId)}?output_format=mp3_44100_128`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: modelId,
          voice_settings: {
            stability: profile.stability,
            similarity_boost: profile.similarityBoost,
            style: profile.style,
            speed: profile.speed,
            use_speaker_boost: true,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`  ⚠️ Failed (${res.status}): ${errText.slice(0, 100)}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(diskPath, buffer);
      console.log(`  ✓ Saved ${audioFileName} (${Math.round(buffer.length / 1024)} KB)`);
      generatedCount++;

      manifest[cacheKey] = {
        cacheKey,
        originalText: item.text,
        sanitizedText,
        character: profile.character,
        customerId: profile.customerId,
        voiceId: profile.voiceId,
        modelId,
        audioUrl,
        settings: {
          stability: profile.stability,
          similarity_boost: profile.similarityBoost,
          style: profile.style,
          speed: profile.speed,
        },
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`  ⚠️ Network error: ${err.message}`);
    }
  }

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(
    `\n🎉 Pre-caching complete: ${generatedCount} generated, ${cachedCount} already available.`,
  );
  console.log(`📄 Manifest updated at ${path.relative(rootDir, MANIFEST_FILE)}.`);
}

run().catch(console.error);
