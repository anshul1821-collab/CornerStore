import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const apiKey = "sk_79759d34a721fa6542748bfb6aef59f6221b82d4e194a214";
const modelId = "eleven_multilingual_v2";

// Distinct voice mapping for each character identity
export const CHARACTER_VOICES = {
  shopkeeper: {
    voiceId: "cjVigY5qzO86Huf0OWal", // Eric - Smooth, classy, conversational, warm adult male
    name: "Eric (Shopkeeper)",
    gender: "male",
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.4,
    speed: 0.98,
  },
  boy: {
    voiceId: "bIHbv24MWmeRgasZH58o", // Will - Relaxed, cheerful, friendly young male
    name: "Will (Boy)",
    gender: "male",
    stability: 0.38,
    similarityBoost: 0.75,
    style: 0.42,
    speed: 1.0,
  },
  girl: {
    voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica - Playful, bright, warm young female
    name: "Jessica (Girl)",
    gender: "female",
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.45,
    speed: 0.98,
  },
  // Specific Customer Identities
  uncle: {
    voiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger - Classy, resonant, polite mature gentleman (Mr. Sharma)
    name: "Roger (Mr. Sharma)",
    gender: "male",
    stability: 0.45,
    similarityBoost: 0.75,
    style: 0.35,
    speed: 0.96,
  },
  aunty: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - Reassuring, warm, mature confident female (Mrs. Priya)
    name: "Sarah (Mrs. Priya)",
    gender: "female",
    stability: 0.42,
    similarityBoost: 0.75,
    style: 0.4,
    speed: 0.98,
  },
  student: {
    voiceId: "bIHbv24MWmeRgasZH58o", // Will - Cheerful young male (Rohan)
    name: "Will (Rohan)",
    gender: "male",
    stability: 0.38,
    similarityBoost: 0.75,
    style: 0.45,
    speed: 1.0,
  },
  parent: {
    voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura - Sassy, upbeat, enthusiastic young mom (Meera & Anu)
    name: "Laura (Meera & Anu)",
    gender: "female",
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.4,
    speed: 0.98,
  },
  delivery: {
    voiceId: "N2lVS1w4EtoT3dr4eOWO", // Callum - Energetic young adult delivery guy (Raju)
    name: "Callum (Raju)",
    gender: "male",
    stability: 0.38,
    similarityBoost: 0.75,
    style: 0.42,
    speed: 1.02,
  },
  dadi: {
    voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice - Clear, warm, gentle mature female (Grandma)
    name: "Alice (Grandma)",
    gender: "female",
    stability: 0.45,
    similarityBoost: 0.8,
    style: 0.35,
    speed: 0.94,
  },
};

// 7 Required Test Categories:
// 1. Greetings
// 2. Normal conversations
// 3. Questions
// 4. Excited expressions
// 5. Thank-you messages
// 6. Longer sentences
// 7. Sentences containing dollar amounts
const TEST_CATEGORIES = [
  {
    category: "1_greetings",
    charKey: "shopkeeper",
    text: "Welcome to the shop! Great to see you today. What can I get for you?",
    spokenText: "Welcome to the shop! Great to see you today. What can I get for you?",
  },
  {
    category: "2_normal_conversations",
    charKey: "aunty",
    text: "Hello, dear! I'd like Juice Box. Here's $50.00!",
    spokenText: "Hello, dear! I'd like Juice Box. Here's fifty dollars!",
  },
  {
    category: "3_questions",
    charKey: "uncle",
    text: "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
    spokenText:
      "Hmm, wait a second... looks like this is five dollars short. Could you please check?",
  },
  {
    category: "4_excited_expressions",
    charKey: "shopkeeper",
    text: "Spot on! That's the exact change. Brilliant calculation!",
    spokenText: "Spot on! That's the exact change. Brilliant calculation!",
  },
  {
    category: "5_thank_you_messages",
    charKey: "girl",
    text: "Thank you so much! That's the exact change. Have a wonderful day!",
    spokenText: "Thank you so much! That's the exact change. Have a wonderful day!",
  },
  {
    category: "6_longer_sentences",
    charKey: "dadi",
    text: "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
    spokenText:
      "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
  },
  {
    category: "7_sentences_containing_dollar_amounts",
    charKey: "student",
    text: "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
    spokenText: "Oh, hold on — you gave me ten dollars and fifty cents extra! Take a quick look.",
  },
];

async function generateTestAudios() {
  const outputBase = path.join(rootDir, "public", "audio", "characters");

  console.log("=== Auditioning & Generating Voice Samples with eleven_multilingual_v2 ===");

  for (const item of TEST_CATEGORIES) {
    const charConfig = CHARACTER_VOICES[item.charKey];
    const charDir = path.join(outputBase, item.charKey);
    if (!fs.existsSync(charDir)) {
      fs.mkdirSync(charDir, { recursive: true });
    }

    const fileName = `${item.category}.mp3`;
    const destPath = path.join(charDir, fileName);

    console.log(`\nTesting Category [${item.category}]:`);
    console.log(`- Character: ${charConfig.name} (${charConfig.voiceId})`);
    console.log(`- Text: "${item.text}"`);
    console.log(`- Spoken: "${item.spokenText}"`);

    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(charConfig.voiceId)}?output_format=mp3_44100_128`;

    try {
      const startTime = Date.now();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: item.spokenText,
          model_id: modelId,
          voice_settings: {
            stability: charConfig.stability,
            similarity_boost: charConfig.similarityBoost,
            style: charConfig.style,
            speed: charConfig.speed,
            use_speaker_boost: true,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`  ❌ Failed (HTTP ${res.status}): ${errText}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      const elapsed = Date.now() - startTime;
      console.log(
        `  ✓ Generated & saved to ${path.relative(rootDir, destPath)} (${Math.round(buffer.length / 1024)} KB in ${elapsed}ms)`,
      );
    } catch (err) {
      console.error(`  ❌ Network error:`, err);
    }
  }
}

generateTestAudios().catch(console.error);
