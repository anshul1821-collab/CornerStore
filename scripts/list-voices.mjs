const apiKey = "sk_79759d34a721fa6542748bfb6aef59f6221b82d4e194a214";

async function main() {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  const data = await res.json();
  if (data.voices) {
    console.log(`Found ${data.voices.length} voices:`);
    for (const v of data.voices) {
      const desc = v.labels
        ? Object.entries(v.labels)
            .map(([k, val]) => `${k}:${val}`)
            .join(", ")
        : "";
      console.log(`${v.name.padEnd(20)} ID: ${v.voice_id} | ${v.category} | ${desc}`);
    }
  } else {
    console.log(data);
  }
}

main().catch(console.error);
