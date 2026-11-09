import argparse
import asyncio
import os
import sys
import edge_tts

async def main():
    parser = argparse.ArgumentParser(description="Generate Neural Voice MP3")
    parser.add_argument("--text", required=True, help="Text to speak")
    parser.add_argument("--voice", default="en-US-EricNeural", help="Edge TTS voice name")
    parser.add_argument("--out", required=True, help="Output MP3 file path")
    parser.add_argument("--rate", default="+0%", help="Speaking rate")
    parser.add_argument("--pitch", default="+0Hz", help="Speaking pitch")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    communicate = edge_tts.Communicate(args.text, args.voice, rate=args.rate, pitch=args.pitch)
    await communicate.save(args.out)
    print(f"OK:{os.path.getsize(args.out)}")

if __name__ == "__main__":
    asyncio.run(main())

