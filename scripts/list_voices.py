import asyncio
import edge_tts

async def main():
    voices = await edge_tts.list_voices()
    us_voices = [v for v in voices if v['Locale'].startswith('en-')]
    for v in us_voices:
        print(f"{v['ShortName']}|{v['Gender']}|{v.get('FriendlyName', '')}")

if __name__ == "__main__":
    asyncio.run(main())

