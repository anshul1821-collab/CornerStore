import asyncio
import os
import sys
import hashlib
import json
import edge_tts

# Audio directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "audio", "characters"))
MANIFEST_FILE = os.path.join(BASE_DIR, "manifest.json")

CHARACTER_VOICES = {
    "shopkeeper": "en-US-EricNeural",
    "uncle": "en-US-RogerNeural",
    "aunty": "en-US-JennyNeural",
    "student": "en-US-GuyNeural",
    "parent": "en-US-EmmaNeural",
    "delivery": "en-US-ChristopherNeural",
    "dadi": "en-US-MichelleNeural",
    "girl": "en-US-AnaNeural",
}

# Dialogues to ensure exist
DIALOGUES = [
    # --- Shopkeeper ---
    {
        "char": "shopkeeper",
        "voice": "en-US-EricNeural",
        "file": "check_bill_instruction.mp3",
        "text": "Please check the price on the bill before you count the change!",
    },
    {
        "char": "shopkeeper",
        "voice": "en-US-EricNeural",
        "file": "check_price_in_bill.mp3",
        "text": "Please check the price in the bill!",
    },
    {
        "char": "shopkeeper",
        "voice": "en-US-EricNeural",
        "file": "1_greetings.mp3",
        "text": "Welcome to the shop! Great to see you today. What can I get for you?",
    },
    {
        "char": "shopkeeper",
        "voice": "en-US-EricNeural",
        "file": "4_excited_expressions.mp3",
        "text": "Spot on! That's the exact change. Brilliant calculation!",
    },

    # --- Uncle (Mr. Sharma) ---
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "0623f7cbc9a1ae5a317b446facc0e87a.mp3",
        "text": "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "short_feedback.mp3",
        "text": "Hmm, wait a second... looks like this is a bit short. Could you please check?",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "extra_feedback.mp3",
        "text": "Oh, hold on — you gave me a bit too much extra! Take a quick look.",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "c2170b6f6a00da0029d714b8f54ed3b2.mp3",
        "text": "Wonderful! That is spot on. Thank you!",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "1711f437a9e9f302b4cb8f2ccb4c16af.mp3",
        "text": "Hello there! I'd like Soap. Here's exactly $10.00!",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "7a7447887a0606bd7c1e9f0191ebc594.mp3",
        "text": "Hello there! I'd like 2 Chocolate. Here's $200.00!",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "order_bread_50.mp3",
        "text": "Hello there! I'd like Bread. Here's $50.00!",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "order_tea_100.mp3",
        "text": "Hello there! I'd like Tea Leaves (250g). Here's $100.00!",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "order_soap_100.mp3",
        "text": "Hello there! I'd like 2 Soap. Here's $100.00!",
    },
    {
        "char": "uncle",
        "voice": "en-US-RogerNeural",
        "file": "order_milk_50.mp3",
        "text": "Hello there! I'd like Milk Packet. Here's $50.00!",
    },

    # --- Student (Rohan) ---
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "54cd930f008d7f60c45bacfe78d38c11.mp3",
        "text": "Hi there! I'd like Chips. Here's $20.00!",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "6c478cb6ccbe77b53065432e1265e59d.mp3",
        "text": "Hi there! I'd like 2 Pencil and Eraser. Here's $20.00!",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "7c49ff4e495a109e08aa694ca6f350c7.mp3",
        "text": "Awesome, perfect change! Thanks a lot!",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "e0e3f67bb780492e7db7df76c07b7217.mp3",
        "text": "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "short_feedback.mp3",
        "text": "Hmm, wait a second... looks like this is a bit short. Could you please check?",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "extra_feedback.mp3",
        "text": "Oh, hold on — you gave me a bit too much extra! Take a quick look.",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "order_notebook_50.mp3",
        "text": "Hi there! I'd like Notebook. Here's $50.00!",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "order_chocolate_50.mp3",
        "text": "Hi there! I'd like 2 Chocolate. Here's $50.00!",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "order_pen_20.mp3",
        "text": "Hi there! I'd like 2 Pen. Here's $20.00!",
    },
    {
        "char": "student",
        "voice": "en-US-GuyNeural",
        "file": "order_icecream_50.mp3",
        "text": "Hi there! I'd like Ice Cream. Here's $50.00!",
    },

    # --- Parent (Meera & Anu) ---
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "d35801d023442bc0fef0187e603c7836.mp3",
        "text": "Good morning! I'd like Milk Packet. Here's $50.00!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "40de7834c058f5b6363688d3a95c272f.mp3",
        "text": "Good morning! I'd like 2 Chocolate and Bread. Here's $100.00!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "b447fcb93f0238ededc196be094685e5.mp3",
        "text": "Good morning! We'd like 2 Chocolate and Bread. Here's $100.00!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "gratitude.mp3",
        "text": "Thank you so much! That's the exact change. Have a wonderful day!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "short_feedback.mp3",
        "text": "Hmm, wait a second... looks like this is a bit short. Could you please check?",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "extra_feedback.mp3",
        "text": "Oh, hold on — you gave me a bit too much extra! Take a quick look.",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "order_bread_50.mp3",
        "text": "Good morning! I'd like Bread. Here's $50.00!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "order_juice_50.mp3",
        "text": "Good morning! I'd like 2 Juice Box. Here's $50.00!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "order_bananas_50.mp3",
        "text": "Good morning! I'd like Bananas (1 Doz). Here's $50.00!",
    },
    {
        "char": "parent",
        "voice": "en-US-EmmaNeural",
        "file": "order_eggs_50.mp3",
        "text": "Good morning! I'd like Eggs (6 pcs). Here's $50.00!",
    },

    # --- Delivery (Raju) ---
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "fd977d9e003712f9d84dc6eb2098fb5d.mp3",
        "text": "Hey there! I'd like Cold Drink. Here's $50.00!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "6c67efe4f0d7c79836c1bf050d5902da.mp3",
        "text": "Hey there! I'd like 2 Battery. Here's $50.00!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "cb8c65bf4d37cd4420b64ababc4235a5.mp3",
        "text": "Hey there! Need these items quickly. Here's $50.00!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "gratitude.mp3",
        "text": "Awesome, perfect change! Thanks a lot!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "short_feedback.mp3",
        "text": "Hey, wait a second... looks like this is a bit short. Could you please check?",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "extra_feedback.mp3",
        "text": "Hey, hold on — you gave me a bit too much extra! Take a quick look.",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "order_colddrink_100.mp3",
        "text": "Hey there! I'd like 2 Cold Drink. Here's $100.00!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "order_chips_50.mp3",
        "text": "Hey there! I'd like Chips. Here's $50.00!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "order_oil_200.mp3",
        "text": "Hey there! I'd like Cooking Oil (1 Ltr). Here's $200.00!",
    },
    {
        "char": "delivery",
        "voice": "en-US-ChristopherNeural",
        "file": "order_matchbox_10.mp3",
        "text": "Hey there! I'd like Matchbox. Here's $10.00!",
    },

    # --- Dadi (Grandma) ---
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "ab713783d86d08cb1024d03be596f96e.mp3",
        "text": "Hello, dear! I'd like Bread. Here's $100.00!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "08b9c67dffeca45549399a28960bc1b8.mp3",
        "text": "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "0b9e110b10b86fa2b20770a536f63ecf.mp3",
        "text": "No rush at all! Take your time to count the notes.",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "e7c6c0618854e7f4fd1db3e15b46f650.mp3",
        "text": "Thank you so much, dear. You counted that beautifully!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "order_milk_50.mp3",
        "text": "Hello, dear! I'd like Milk Packet. Here's $50.00!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "order_tea_100.mp3",
        "text": "Hello, dear! I'd like Tea Leaves (250g). Here's $100.00!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "order_biscuits_50.mp3",
        "text": "Hello, dear! I'd like Biscuits. Here's $50.00!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "order_sugar_50.mp3",
        "text": "Hello, dear! I'd like Sugar (1 kg). Here's $50.00!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "order_bread_100.mp3",
        "text": "Hello, dear! I'd like 2 Bread. Here's $100.00!",
    },
    {
        "char": "dadi",
        "voice": "en-US-MichelleNeural",
        "file": "order_lentils_100.mp3",
        "text": "Hello, dear! I'd like Lentils (500g). Here's $100.00!",
    },

    # --- Girl (Jessica) ---
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "77781fa32d38bdbe1960271800d0bdb7.mp3",
        "text": "Hello, dear! I'd like Juice Box. Here's $50.00!",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "29e5f23d2143f55b01f41bc9d1f75d1c.mp3",
        "text": "Thank you so much! That's the exact change. Have a wonderful day!",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "short_feedback.mp3",
        "text": "Hmm, wait a second... looks like this is a bit short. Could you please check?",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "extra_feedback.mp3",
        "text": "Oh, hold on — you gave me a bit too much extra! Take a quick look.",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "order_toffee_5.mp3",
        "text": "Hello, dear! I'd like Toffee. Here's $5.00!",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "order_chocolate_50.mp3",
        "text": "Hello, dear! I'd like Chocolate. Here's $50.00!",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "order_icecream_50.mp3",
        "text": "Hello, dear! I'd like 2 Ice Cream. Here's $50.00!",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "order_pen_20.mp3",
        "text": "Hello, dear! I'd like 2 Pen. Here's $20.00!",
    },
    {
        "char": "girl",
        "voice": "en-US-AnaNeural",
        "file": "order_chips_20.mp3",
        "text": "Hello, dear! I'd like Chips. Here's $20.00!",
    },

    # --- Aunty (Mrs. Priya) ---
    {
        "char": "aunty",
        "voice": "en-US-JennyNeural",
        "file": "004e9c8faf553351ab558f58883c5c29.mp3",
        "text": "Hello, dear! I'd like 2 Chocolate. Here's $200.00!",
    },
    {
        "char": "aunty",
        "voice": "en-US-JennyNeural",
        "file": "d421208a67bf66b53565b495a3527d06.mp3",
        "text": "Thank you so much! That's the exact change. Have a wonderful day!",
    },
    {
        "char": "aunty",
        "voice": "en-US-JennyNeural",
        "file": "short_feedback.mp3",
        "text": "Hmm, wait a second... looks like this is a bit short. Could you please check?",
    },
    {
        "char": "aunty",
        "voice": "en-US-JennyNeural",
        "file": "extra_feedback.mp3",
        "text": "Oh, hold on — you gave me a bit too much extra! Take a quick look.",
    },
]

async def generate():
    os.makedirs(BASE_DIR, exist_ok=True)
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".output", "public", "audio", "characters"))

    print(f"Total dialogue items to verify: {len(DIALOGUES)}")
    generated = 0
    skipped = 0

    for d in DIALOGUES:
        char_dir = os.path.join(BASE_DIR, d["char"])
        os.makedirs(char_dir, exist_ok=True)
        out_file = os.path.join(char_dir, d["file"])

        if os.path.exists(out_file) and os.path.getsize(out_file) > 10000:
            skipped += 1
            continue

        print(f"Generating [{d['char']}] '{d['text']}' -> {d['file']}...")
        communicate = edge_tts.Communicate(d["text"], d["voice"])
        await communicate.save(out_file)
        print(f"  ✓ Saved ({os.path.getsize(out_file)} bytes)")
        generated += 1

    print(f"\nDone! Generated: {generated}, Already cached: {skipped}")

if __name__ == "__main__":
    asyncio.run(generate())

