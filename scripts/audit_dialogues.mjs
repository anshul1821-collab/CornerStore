import fs from "fs";
import path from "path";

function getMp3s(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) res = res.concat(getMp3s(full));
    else if (item.name.endsWith(".mp3")) res.push(full);
  }
  return res;
}

const diskFiles = getMp3s("public/audio/characters").map((f) => {
  return "/" + path.relative("public", f).replace(/\\/g, "/");
});

const code = fs.readFileSync("src/lib/dialogueAudio.ts", "utf-8");
const mappedUrls = new Set();
for (const match of code.matchAll(/"(\/audio\/characters\/[^"]+\.mp3)"/g)) {
  mappedUrls.add(match[1]);
}

console.log("Total files on disk:", diskFiles.length);
console.log("Mapped in code:", mappedUrls.size);

const unmapped = diskFiles.filter((f) => !mappedUrls.has(f));
console.log("Files on disk not yet in PREGENERATED_STUDIO_MAP:", unmapped);

// Check manifest.json
if (fs.existsSync("public/audio/characters/manifest.json")) {
  const manifest = JSON.parse(fs.readFileSync("public/audio/characters/manifest.json", "utf-8"));
  console.log("Manifest entries count:", Object.keys(manifest).length);
  for (const f of unmapped) {
    const found = Object.values(manifest).find((m) => m.audioUrl === f);
    if (found) {
      console.log(`Unmapped file ${f} in manifest: "${found.originalText}" (${found.character}/${found.customerId})`);
    }
  }
}
