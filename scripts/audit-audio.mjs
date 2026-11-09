import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.join(process.cwd(), 'public', 'audio', 'characters');
const manifest = JSON.parse(fs.readFileSync(path.join(baseDir, 'manifest.json'), 'utf8'));
const manifestUrls = new Set(Object.values(manifest).map(e => e.audioUrl));

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.endsWith('.mp3')) {
      results.push(full);
    }
  });
  return results;
}

const allMp3s = getFiles(baseDir);
console.log(`Total MP3 files on disk: ${allMp3s.length}`);

for (const f of allMp3s) {
  const rel = '/' + path.relative(path.join(process.cwd(), 'public'), f).replace(/\\/g, '/');
  const inManifest = manifestUrls.has(rel);
  console.log(`${inManifest ? '✓ (in manifest)' : 'ℹ (category/standalone)'} ${rel} (${fs.statSync(f).size} bytes)`);
}
