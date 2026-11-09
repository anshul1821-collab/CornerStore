import asyncio
import os
import shutil
import edge_tts

async def gen():
    tasks = [
        ('student', 'en-US-GuyNeural', 'order_chips_20_exact.mp3', "Hi there! I'd like Chips. Here's exactly $20.00!"),
        ('student', 'en-US-GuyNeural', 'order_chocolate_50_exact.mp3', "Hi there! I'd like 2 Chocolate. Here's exactly $50.00!"),
        ('student', 'en-US-GuyNeural', 'order_pen_20_exact.mp3', "Hi there! I'd like 2 Pen. Here's exactly $20.00!"),
        ('girl', 'en-US-AnaNeural', 'order_pen_20_exact.mp3', "Hello, dear! I'd like 2 Pen. Here's exactly $20.00!"),
        ('girl', 'en-US-AnaNeural', 'order_icecream_50_exact.mp3', "Hello, dear! I'd like 2 Ice Cream. Here's exactly $50.00!"),
        ('girl', 'en-US-AnaNeural', 'order_chips_20_exact.mp3', "Hello, dear! I'd like Chips. Here's exactly $20.00!"),
    ]
    for char, voice, fname, text in tasks:
        p1 = os.path.join('public', 'audio', 'characters', char, fname)
        p2 = os.path.join('.output', 'public', 'audio', 'characters', char, fname)
        os.makedirs(os.path.dirname(p1), exist_ok=True)
        c = edge_tts.Communicate(text, voice)
        await c.save(p1)
        if os.path.exists(os.path.dirname(p2)):
            os.makedirs(os.path.dirname(p2), exist_ok=True)
            shutil.copy2(p1, p2)
        print(f"Generated {p1}: {os.path.getsize(p1)} bytes")

if __name__ == '__main__':
    asyncio.run(gen())

