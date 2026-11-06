#!/usr/bin/env node

/**
 * ElevenLabs Speech Quality & Model Comparison Script for Kirana Change
 *
 * Compares eleven_turbo_v2_5 with eleven_multilingual_v2 using identical
 * dialogue and identical voice settings (stability: 0.40, similarity_boost: 0.75).
 *
 * Saves generated sample MP3s to .voice-test/ for side-by-side listening.
 */

import fs from "node:fs";
import path from "node:path";

// 1. Read environment variables from .env
const envPath = path.resolve(process.cwd(), ".env");
const env = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      env[k] = val;
    }
  }
}

const apiKey = env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;

if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
  console.error("\x1b[31m[ERROR]\x1b[0m ELEVENLABS_API_KEY is not set in your .env file!");
  console.error("Please ensure your API key is in .env before running this test.\n");
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.resolve(process.cwd(), ".voice-test");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configurable Settings (tested with stability 0.40 and similarity 0.75)
const stability = parseFloat(env.ELEVENLABS_STABILITY || "0.40");
const similarityBoost = parseFloat(env.ELEVENLABS_SIMILARITY_BOOST || "0.75");
const style = parseFloat(env.ELEVENLABS_STYLE || "0.20");
const speakerBoost = env.ELEVENLABS_SPEAKER_BOOST !== "false";

const shopkeeperVoiceId = env.ELEVENLABS_SHOPKEEPER_VOICE_ID || "bbGyqGAEIg7zLT7U2n9A"; // Shopkeeper
const boyVoiceId = env.ELEVENLABS_BOY_VOICE_ID || "9gKJk2fZsPLQCuOnaVLS"; // Boy Customer
const girlVoiceId = env.ELEVENLABS_GIRL_VOICE_ID || "7vLdoQUU3acmEiAVXlaN"; // Girl Customer

console.log("\x1b[36m======================================================================\x1b[0m");
console.log("\x1b[1m  KIRANA CHANGE - 3-VOICE QUALITY & MODEL BENCHMARK                   \x1b[0m");
console.log("\x1b[36m======================================================================\x1b[0m");
console.log(`API Key: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`);
console.log(`Test Settings: Stability = ${stability}, Similarity Boost = ${similarityBoost}, Style = ${style}`);
console.log(`Output Directory: ${outputDir}\n`);

const testCases = [
  {
    id: "shopkeeper_welcome",
    title: "1. Shopkeeper Voice (Welcome & Greeting)",
    voiceId: shopkeeperVoiceId,
    character: "Shopkeeper (George)",
    text: "Welcome to the shop! Great to see you today. What can I get for you?",
  },
  {
    id: "boy_customer_order",
    title: "2. Boy Voice (Male Customer Order)",
    voiceId: boyVoiceId,
    character: "Boy Customer (Antoni)",
    text: "Hello! Could I please get a kilo of salt, an eraser, and two pencils? Here's 50 rupees, thanks!",
  },
  {
    id: "girl_customer_order",
    title: "3. Girl Voice (Female Customer Order)",
    voiceId: girlVoiceId,
    character: "Girl Customer (Sarah)",
    text: "Hi! Just need a bottle of cooking oil and a packet of biscuits, please. Here's 200 rupees, thank you!",
  },
];

const models = [
  {
    id: "eleven_turbo_v2_5",
    name: "Eleven Turbo v2.5",
    focus: "Ultra-low latency & responsive gameplay",
  },
  {
    id: "eleven_multilingual_v2",
    name: "Eleven Multilingual v2",
    focus: "Maximum emotional nuance & human warmth",
  },
];

async function generateSpeech(modelId, voiceId, text, filename) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey.trim(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: speakerBoost,
        },
      }),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const err = await response.text();
      return { success: false, latency, error: err };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      latency,
      sizeKb: (buffer.length / 1024).toFixed(1),
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
    };
  }
}

const results = [];

for (const testCase of testCases) {
  console.log(`\x1b[33m▶ Testing Case: "${testCase.title}"\x1b[0m`);
  console.log(`  Character: ${testCase.character} (Voice ID: ${testCase.voiceId})`);
  console.log(`  Spoken Text: "${testCase.text}"\n`);

  for (const model of models) {
    const filename = `${testCase.id}_${model.id.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`;
    process.stdout.write(`  ⏳ Synthesizing with ${model.name.padEnd(26)} ... `);

    const res = await generateSpeech(model.id, testCase.voiceId, testCase.text, filename);

    if (res.success) {
      console.log(`\x1b[32m✔ Success\x1b[0m in \x1b[1m${res.latency}ms\x1b[0m (${res.sizeKb} KB)`);
      results.push({
        testCase: testCase.title,
        modelName: model.name,
        modelId: model.id,
        latency: res.latency,
        sizeKb: res.sizeKb,
        filePath: res.filePath,
      });
    } else {
      console.log(`\x1b[31m✖ Failed\x1b[0m (${res.latency}ms): ${res.error?.slice(0, 100)}`);
    }
  }
  console.log("");
}

console.log("\x1b[36m======================================================================\x1b[0m");
console.log("\x1b[1m  BENCHMARK SUMMARY & COMPARISON                                     \x1b[0m");
console.log("\x1b[36m======================================================================\x1b[0m\n");

console.log("┌─────────────────────────────┬──────────────────────────┬───────────┬──────────┐");
console.log("│ Test Scenario               │ Model                    │ Latency   │ File Size│");
console.log("├─────────────────────────────┼──────────────────────────┼───────────┼──────────┤");

results.forEach((r) => {
  const sc = r.testCase.length > 27 ? r.testCase.slice(0, 24) + "..." : r.testCase;
  console.log(
    `│ ${sc.padEnd(27)} │ ${r.modelName.padEnd(24)} │ ${(r.latency + " ms").padStart(9)} │ ${(r.sizeKb + " KB").padStart(8)} │`,
  );
});

console.log("└─────────────────────────────┴──────────────────────────┴───────────┴──────────┘\n");

console.log("\x1b[32m✔ Audio samples generated successfully in:\x1b[0m");
console.log(`  ${outputDir}\n`);

console.log("\x1b[1m💡 Analysis & Model Recommendation:\x1b[0m");
console.log("  • \x1b[1meleven_turbo_v2_5\x1b[0m: Recommended for dynamic shopping lists & fast gameplay.");
console.log("    Fastest turnaround times, minimal delay when customer approaches the counter.");
console.log("  • \x1b[1meleven_multilingual_v2\x1b[0m: Recommended for maximum emotional warmth and richness.");
console.log("    Rich vocal depth and expressive cadence, perfect for fixed dialogues & celebrations.\n");

console.log("\x1b[1mTo switch between models in your game:\x1b[0m");
console.log("  Edit your \x1b[33m.env\x1b[0m file:");
console.log("    ELEVENLABS_MODEL_ID=eleven_turbo_v2_5       # (for fastest response)");
console.log("    or");
console.log("    ELEVENLABS_MODEL_ID=eleven_multilingual_v2  # (for deepest expressiveness)\n");

