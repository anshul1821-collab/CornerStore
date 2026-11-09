import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Mic,
  Music,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Users,
  Volume2,
  X,
} from "lucide-react";
import {
  CHARACTER_VOICE_CONFIGS,
  CUSTOMER_VOICE_PROFILES,
  type CharacterVoice,
} from "@/lib/voice/characters";
import { sanitizeTextForSpeech } from "@/lib/voice/sanitize";
import { useSettings } from "./settings";

interface VoiceCategorySample {
  id: string;
  categoryNumber: number;
  categoryName: string;
  charName: string;
  charRole: string;
  avatarEmoji: string;
  characterVoice: CharacterVoice;
  customerId?: string;
  voiceActor: string;
  voiceId: string;
  dialogueText: string;
  spokenPhonetic: string;
  audioPath: string;
  model: string;
  stability: number;
  style: number;
  similarityBoost: number;
  speed: number;
  accent: string;
  tone: string;
}

const TEST_CATEGORIES: VoiceCategorySample[] = [
  {
    id: "cat1",
    categoryNumber: 1,
    categoryName: "Greetings",
    charName: "Shopkeeper",
    charRole: "Store Owner",
    avatarEmoji: "👨🏽‍🦳",
    characterVoice: "shopkeeper",
    voiceActor: "Eric",
    voiceId: "cjVigY5qzO86Huf0OWal",
    dialogueText: "Welcome to the shop! Great to see you today. What can I get for you?",
    spokenPhonetic: "Welcome to the shop! Great to see you today. What can I get for you?",
    audioPath: "/audio/characters/shopkeeper/1_greetings.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.4,
    style: 0.4,
    similarityBoost: 0.75,
    speed: 0.98,
    accent: "Conversational American",
    tone: "Warm, welcoming, mature and trustworthy",
  },
  {
    id: "cat2",
    categoryNumber: 2,
    categoryName: "Normal Conversations",
    charName: "Mrs. Priya",
    charRole: "Customer",
    avatarEmoji: "👩🏽",
    characterVoice: "girl",
    customerId: "aunty",
    voiceActor: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    dialogueText: "Hello, dear! I'd like Juice Box. Here's $50.00!",
    spokenPhonetic: "Hello, dear! I'd like Juice Box. Here's fifty dollars!",
    audioPath: "/audio/characters/aunty/2_normal_conversations.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.42,
    style: 0.4,
    similarityBoost: 0.75,
    speed: 0.98,
    accent: "Clear, Warm American",
    tone: "Friendly, polite, confident community shopper",
  },
  {
    id: "cat3",
    categoryNumber: 3,
    categoryName: "Questions",
    charName: "Mr. Sharma",
    charRole: "Customer",
    avatarEmoji: "👨🏽‍🦳",
    characterVoice: "boy",
    customerId: "uncle",
    voiceActor: "Roger",
    voiceId: "CwhRBWXzGAHq8TQ4Fs17",
    dialogueText: "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
    spokenPhonetic:
      "Hmm, wait a second... looks like this is five dollars short. Could you please check?",
    audioPath: "/audio/characters/uncle/3_questions.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.45,
    style: 0.35,
    similarityBoost: 0.75,
    speed: 0.96,
    accent: "Polite, Resonant Gentleman",
    tone: "Laid-back, thoughtful, inquisitive intonation",
  },
  {
    id: "cat4",
    categoryNumber: 4,
    categoryName: "Excited Expressions",
    charName: "Shopkeeper",
    charRole: "Store Owner",
    avatarEmoji: "👨🏽‍🦳",
    characterVoice: "shopkeeper",
    voiceActor: "Eric",
    voiceId: "cjVigY5qzO86Huf0OWal",
    dialogueText: "Spot on! That's the exact change. Brilliant calculation!",
    spokenPhonetic: "Spot on! That's the exact change. Brilliant calculation!",
    audioPath: "/audio/characters/shopkeeper/4_excited_expressions.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.4,
    style: 0.4,
    similarityBoost: 0.75,
    speed: 0.98,
    accent: "Energetic Conversational",
    tone: "Enthusiastic, encouraging, celebratory",
  },
  {
    id: "cat5",
    categoryNumber: 5,
    categoryName: "Thank-You Messages",
    charName: "Jessica",
    charRole: "Customer / Girl Voice",
    avatarEmoji: "👧🏽",
    characterVoice: "girl",
    voiceActor: "Jessica",
    voiceId: "cgSgspJ2msm6clMCkdW9",
    dialogueText: "Thank you so much! That's the exact change. Have a wonderful day!",
    spokenPhonetic: "Thank you so much! That's the exact change. Have a wonderful day!",
    audioPath: "/audio/characters/girl/5_thank_you_messages.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.4,
    style: 0.45,
    similarityBoost: 0.75,
    speed: 0.98,
    accent: "Bright, Sweet Young Female",
    tone: "Cheerful, heartfelt gratitude, expressive",
  },
  {
    id: "cat6",
    categoryNumber: 6,
    categoryName: "Longer Sentences",
    charName: "Grandma",
    charRole: "Customer (Dadi)",
    avatarEmoji: "👵🏽",
    characterVoice: "girl",
    customerId: "dadi",
    voiceActor: "Alice",
    voiceId: "Xb7hH8MSUJpSbSDYk0k2",
    dialogueText:
      "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
    spokenPhonetic:
      "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
    audioPath: "/audio/characters/dadi/6_longer_sentences.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.45,
    style: 0.35,
    similarityBoost: 0.8,
    speed: 0.94,
    accent: "Gentle Mature Female",
    tone: "Patient, nurturing, loving, unhurried cadence",
  },
  {
    id: "cat7",
    categoryNumber: 7,
    categoryName: "Sentences with Dollar Amounts",
    charName: "Rohan",
    charRole: "Customer (Student)",
    avatarEmoji: "👦🏽",
    characterVoice: "boy",
    customerId: "student",
    voiceActor: "Will",
    voiceId: "bIHbv24MWmeRgasZH58o",
    dialogueText: "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
    spokenPhonetic:
      "Oh, hold on — you gave me ten dollars and fifty cents extra! Take a quick look.",
    audioPath: "/audio/characters/student/7_sentences_containing_dollar_amounts.mp3",
    model: "eleven_multilingual_v2",
    stability: 0.38,
    style: 0.45,
    similarityBoost: 0.75,
    speed: 1.0,
    accent: "Relaxed Young Male",
    tone: "Natural everyday speech with accurate currency expansion",
  },
];

interface CharacterCastMember {
  id: string;
  name: string;
  role: string;
  avatarEmoji: string;
  voiceActor: string;
  voiceId: string;
  characterVoice: CharacterVoice;
  customerId?: string;
  bio: string;
  sampleQuote: string;
}

const CAST_MEMBERS: CharacterCastMember[] = [
  {
    id: "shopkeeper",
    name: "Shopkeeper",
    role: "Corner Store Owner",
    avatarEmoji: "👨🏽‍🦳",
    voiceActor: "Eric (Adult Male)",
    voiceId: CHARACTER_VOICE_CONFIGS.shopkeeper.voiceId,
    characterVoice: "shopkeeper",
    bio: "Warm, mature, trustworthy shopkeeper who guides players and celebrates correct change calculations.",
    sampleQuote: "Welcome to the shop! Great to see you today. What can I get for you?",
  },
  {
    id: "uncle",
    name: "Mr. Sharma",
    role: "Regular Customer",
    avatarEmoji: "👨🏽‍🦳",
    voiceActor: "Roger (Gentleman)",
    voiceId: CUSTOMER_VOICE_PROFILES["uncle"]?.voiceId ?? "CwhRBWXzGAHq8TQ4Fs17",
    characterVoice: "boy",
    customerId: "uncle",
    bio: "Laid-back, polite gentleman who appreciates thorough counting and clear receipts.",
    sampleQuote: "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
  },
  {
    id: "aunty",
    name: "Mrs. Priya",
    role: "Neighborhood Shopper",
    avatarEmoji: "👩🏽",
    voiceActor: "Sarah (Warm Female)",
    voiceId: CUSTOMER_VOICE_PROFILES["aunty"]?.voiceId ?? "EXAVITQu4vr4xnSDxMaL",
    characterVoice: "girl",
    customerId: "aunty",
    bio: "Friendly, organized local shopper who buys groceries and pays with crisp dollar notes.",
    sampleQuote: "Hello, dear! I'd like Juice Box. Here's $50.00!",
  },
  {
    id: "student",
    name: "Rohan",
    role: "Student",
    avatarEmoji: "👦🏽",
    voiceActor: "Will (Young Male)",
    voiceId: CUSTOMER_VOICE_PROFILES["student"]?.voiceId ?? "bIHbv24MWmeRgasZH58o",
    characterVoice: "boy",
    customerId: "student",
    bio: "Curious, cheerful boy stopping by after school for snacks and stationery.",
    sampleQuote: "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
  },
  {
    id: "parent",
    name: "Meera & Anu",
    role: "Mother & Daughter",
    avatarEmoji: "👩🏽‍👧",
    voiceActor: "Laura (Upbeat Female)",
    voiceId: CUSTOMER_VOICE_PROFILES["parent"]?.voiceId ?? "FGY2WhTYpPnrIDTdsKH5",
    characterVoice: "girl",
    customerId: "parent",
    bio: "Lively, energetic mom shopping with her little daughter for sweet treats and fruits.",
    sampleQuote: "Good morning! We'd like 2 Chocolate and Bread. Here's $100.00!",
  },
  {
    id: "delivery",
    name: "Raju",
    role: "Delivery Driver",
    avatarEmoji: "🛵",
    voiceActor: "Callum (Energetic Male)",
    voiceId: CUSTOMER_VOICE_PROFILES["delivery"]?.voiceId ?? "N2lVS1w4EtoT3dr4eOWO",
    characterVoice: "boy",
    customerId: "delivery",
    bio: "Fast, energetic courier picking up supplies on a busy delivery schedule.",
    sampleQuote: "Hey there! Need these items quickly. Here's $50.00!",
  },
  {
    id: "dadi",
    name: "Grandma",
    role: "Beloved Elder",
    avatarEmoji: "👵🏽",
    voiceActor: "Alice (Gentle Mature Female)",
    voiceId: CUSTOMER_VOICE_PROFILES["dadi"]?.voiceId ?? "Xb7hH8MSUJpSbSDYk0k2",
    characterVoice: "girl",
    customerId: "dadi",
    bio: "Gentle, patient grandmother who encourages the player to take their time counting change.",
    sampleQuote:
      "No rush at all, dear! Take your time to count the notes, you're doing wonderfully.",
  },
  {
    id: "girl",
    name: "Jessica",
    role: "Customer Character",
    avatarEmoji: "👧🏽",
    voiceActor: "Jessica (Sweet Female)",
    voiceId: CHARACTER_VOICE_CONFIGS.girl.voiceId,
    characterVoice: "girl",
    bio: "Sweet, lively young girl who is polite and enthusiastic about shopping.",
    sampleQuote: "Thank you so much! That's the exact change. Have a wonderful day!",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceTestingLabModal({ isOpen, onClose }: Props) {
  const { play } = useSettings();
  const [activeTab, setActiveTab] = useState<"categories" | "cast" | "live">("categories");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [customText, setCustomText] = useState(
    "Hello, dear! I'd like 2 Juice Box. Here is $50.00!",
  );
  const [selectedCastId, setSelectedCastId] = useState<string>("aunty");
  const [isGeneratingLive, setIsGeneratingLive] = useState(false);
  const [liveResultMsg, setLiveResultMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (!isOpen) return null;

  const playAudioTrack = (trackId: string, audioUrl: string) => {
    play("tap");
    if (playingId === trackId) {
      stopAudio();
      return;
    }
    stopAudio();

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(trackId);

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.play().catch((err) => {
      console.warn("Audio play prevented:", err);
      setPlayingId(null);
    });
  };

  const handleTestLiveVoice = async () => {
    play("tap");
    stopAudio();
    if (!customText.trim()) return;

    setIsGeneratingLive(true);
    setLiveResultMsg("Requesting ElevenLabs studio speech synthesis...");

    const cast = CAST_MEMBERS.find((c) => c.id === selectedCastId) || CAST_MEMBERS[0]!;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: customText,
          character: cast.characterVoice,
          customerId: cast.customerId,
          modelId: "eleven_multilingual_v2",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.audioUrl) {
        setLiveResultMsg(
          data.cached
            ? "✓ Audio loaded instantly from local disk cache"
            : "✓ High-fidelity audio generated via ElevenLabs eleven_multilingual_v2",
        );
        playAudioTrack("live-custom", data.audioUrl);
      } else {
        setLiveResultMsg(`⚠️ Voice generation failed: ${data.reason || "Unknown"}`);
      }
    } catch (err: unknown) {
      setLiveResultMsg(`❌ Network error: ${(err as Error)?.message || "Failed to reach TTS API"}`);
    } finally {
      setIsGeneratingLive(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-lab-title"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-4xl rounded-3xl border-4 border-wood-dark bg-paper shadow-wood overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-wood-grain border-b-3 border-wood-dark px-4 py-3 sm:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-2xl shadow-xs border-2 border-wood-dark">
                🎙️
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="voice-lab-title"
                    className="font-display text-lg sm:text-xl font-extrabold text-sun leading-none drop-shadow-xs"
                  >
                    Character Voice Studio & Audition Lab
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-black px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    eleven_multilingual_v2
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-cream/90 leading-tight">
                  High-Quality Human Voice Acting & Dynamic Speech Audition
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                play("tap");
                stopAudio();
                onClose();
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-sun/20 hover:bg-sun text-cream hover:text-wood-dark border-2 border-sun/60 transition-colors cursor-pointer"
              aria-label="Close Voice Studio"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Engine Quality Banner */}
          <div className="bg-amber-100/90 border-b-2 border-amber-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-950 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>Studio Engine:</strong> ElevenLabs Multilingual v2 • Stability: 0.38-0.45 •
                Style: 0.35-0.45 • Speed: 0.96-1.00
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-leaf-dark">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Zero Robotic Fallbacks • Exact Word-For-Word Dialogue Match</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-wood-light/40 border-b-2 border-wood-light px-4 py-2 flex gap-2 shrink-0 overflow-x-auto">
            <button
              onClick={() => {
                play("tap");
                setActiveTab("categories");
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-display text-sm font-bold cursor-pointer transition-all ${
                activeTab === "categories"
                  ? "bg-leaf text-white shadow-soft"
                  : "bg-paper text-wood-dark hover:bg-peach"
              }`}
            >
              <Music className="h-4 w-4" />
              <span>7 Test Categories</span>
            </button>

            <button
              onClick={() => {
                play("tap");
                setActiveTab("cast");
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-display text-sm font-bold cursor-pointer transition-all ${
                activeTab === "cast"
                  ? "bg-leaf text-white shadow-soft"
                  : "bg-paper text-wood-dark hover:bg-peach"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Character Roster ({CAST_MEMBERS.length})</span>
            </button>

            <button
              onClick={() => {
                play("tap");
                setActiveTab("live");
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-display text-sm font-bold cursor-pointer transition-all ${
                activeTab === "live"
                  ? "bg-leaf text-white shadow-soft"
                  : "bg-paper text-wood-dark hover:bg-peach"
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>Live Dialogue Tester</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: 7 TEST CATEGORIES */}
            {activeTab === "categories" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-extrabold text-wood-dark">
                    Auditioning the 7 Core Conversational Categories
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    Click Play on any track to preview
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-1">
                  {TEST_CATEGORIES.map((cat) => {
                    const isPlaying = playingId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className={`rounded-2xl border-2 p-3.5 sm:p-4 transition-all ${
                          isPlaying
                            ? "border-emerald-500 bg-emerald-50/70 shadow-wood"
                            : "border-wood-light/60 bg-cream/50 hover:bg-cream"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Left: Category info & speaker */}
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-paper text-2xl shadow-xs border-2 border-wood-light shrink-0">
                              {cat.avatarEmoji}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-sun/60 px-2 py-0.5 text-[11px] font-black text-wood-dark">
                                  #{cat.categoryNumber} {cat.categoryName}
                                </span>
                                <span className="font-display font-extrabold text-wood-dark text-sm sm:text-base">
                                  {cat.charName}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground">
                                  ({cat.voiceActor})
                                </span>
                              </div>
                              <p className="text-xs font-medium text-wood-dark/80 mt-0.5">
                                {cat.tone} • <span className="italic">{cat.accent}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Audio action button */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isPlaying && (
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                                <span className="flex gap-0.5 items-end h-3.5">
                                  <span className="w-1 bg-emerald-600 rounded-full animate-bounce h-3" />
                                  <span className="w-1 bg-emerald-600 rounded-full animate-bounce h-4 delay-75" />
                                  <span className="w-1 bg-emerald-600 rounded-full animate-bounce h-2 delay-150" />
                                </span>
                                <span>Playing...</span>
                              </div>
                            )}

                            <button
                              onClick={() => playAudioTrack(cat.id, cat.audioPath)}
                              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-display text-sm font-extrabold cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                                isPlaying
                                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-soft"
                                  : "bg-leaf hover:brightness-105 text-white shadow-soft"
                              }`}
                            >
                              {isPlaying ? (
                                <>
                                  <Square className="h-4 w-4 fill-white" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 fill-white" />
                                  <span>Audition</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Speech Bubble Display */}
                        <div className="mt-2.5 rounded-xl bg-paper border-2 border-sun/70 p-3 shadow-xs">
                          <p className="font-bold text-wood-dark text-sm leading-relaxed">
                            "{cat.dialogueText}"
                          </p>
                          {cat.spokenPhonetic !== cat.dialogueText && (
                            <p className="mt-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md px-2 py-1">
                              🗣️ Natural Spoken Pronunciation: "{cat.spokenPhonetic}"
                            </p>
                          )}
                        </div>

                        {/* Technical voice parameters footnote */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-muted-foreground/90">
                          <span>Voice ID: {cat.voiceId}</span>
                          <span>Model: {cat.model}</span>
                          <span>Stability: {cat.stability}</span>
                          <span>Style Boost: {cat.style}</span>
                          <span>Speed: {cat.speed}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CHARACTER CAST ROSTER */}
            {activeTab === "cast" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-extrabold text-wood-dark">
                    Corner Store Full Voice Cast ({CAST_MEMBERS.length} Characters)
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    Consistent studio voice identities
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {CAST_MEMBERS.map((cast) => {
                    const isPlaying = playingId === `cast-${cast.id}`;

                    return (
                      <div
                        key={cast.id}
                        className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between transition-all ${
                          isPlaying
                            ? "border-emerald-500 bg-emerald-50/70 shadow-wood"
                            : "border-wood-light/60 bg-cream/50 hover:bg-cream"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-paper text-2xl shadow-xs border-2 border-wood-light shrink-0">
                              {cast.avatarEmoji}
                            </span>
                            <div>
                              <h4 className="font-display font-extrabold text-wood-dark text-sm sm:text-base leading-none">
                                {cast.name}
                              </h4>
                              <p className="text-xs font-bold text-orange mt-0.5">
                                {cast.voiceActor}
                              </p>
                            </div>
                          </div>

                          <p className="mt-2 text-xs font-medium text-wood-dark/80 leading-normal">
                            {cast.bio}
                          </p>

                          <div className="mt-2.5 rounded-lg bg-paper/80 border border-sun/60 p-2 text-xs font-bold text-wood-dark">
                            <span className="text-sun font-black mr-1">💬</span>"{cast.sampleQuote}"
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-wood-light/40 flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-muted-foreground truncate max-w-[150px]">
                            ID: {cast.voiceId.slice(0, 10)}...
                          </span>

                          <button
                            onClick={async () => {
                              play("tap");
                              if (isPlaying) {
                                stopAudio();
                                return;
                              }
                              // Try playing category audio or synthesize
                              const matchingCat = TEST_CATEGORIES.find(
                                (c) => c.customerId === cast.customerId || c.charName === cast.name,
                              );
                              if (matchingCat) {
                                playAudioTrack(`cast-${cast.id}`, matchingCat.audioPath);
                              } else {
                                // synthesize live sample
                                try {
                                  const res = await fetch("/api/tts", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      text: cast.sampleQuote,
                                      character: cast.characterVoice,
                                      customerId: cast.customerId,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (data.audioUrl) {
                                    playAudioTrack(`cast-${cast.id}`, data.audioUrl);
                                  }
                                } catch {
                                  // ignore
                                }
                              }
                            }}
                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 font-display text-xs font-extrabold cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                              isPlaying
                                ? "bg-rose-500 text-white"
                                : "bg-leaf text-white hover:brightness-105"
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Square className="h-3.5 w-3.5 fill-white" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5" />
                                <span>Sample Voice</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE DIALOGUE TESTER */}
            {activeTab === "live" && (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-sun/80 bg-sun/10 p-3.5">
                  <h4 className="font-display font-extrabold text-wood-dark text-sm sm:text-base">
                    Test Any Dialogue with Studio Quality Speech Synthesis
                  </h4>
                  <p className="text-xs font-medium text-wood-dark/80 mt-0.5">
                    Type or pick any dialogue line to audition real-time text-to-speech with natural
                    numbers, pauses, and currency expressions.
                  </p>
                </div>

                {/* Character Picker */}
                <div>
                  <label className="block text-xs font-extrabold text-wood-dark uppercase tracking-wider mb-1.5">
                    Select Character:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CAST_MEMBERS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          play("tap");
                          setSelectedCastId(c.id);
                        }}
                        className={`flex items-center gap-2 rounded-xl p-2 border-2 text-left transition-all cursor-pointer ${
                          selectedCastId === c.id
                            ? "border-leaf bg-leaf/10 font-black shadow-xs"
                            : "border-wood-light/60 bg-paper hover:bg-cream font-bold"
                        }`}
                      >
                        <span className="text-xl">{c.avatarEmoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-wood-dark truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.voiceActor}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset suggestions */}
                <div>
                  <label className="block text-xs font-extrabold text-wood-dark uppercase tracking-wider mb-1.5">
                    Quick Preset Phrases:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Hello, dear! I'd like Juice Box. Here's $50.00!",
                      "Hmm, wait a second... looks like this is $5.00 short. Could you please check?",
                      "Spot on! That's the exact change. Brilliant calculation!",
                      "Oh, hold on — you gave me $10.50 extra! Take a quick look.",
                      "No rush at all! Take your time to count the notes.",
                    ].map((phrase, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          play("tap");
                          setCustomText(phrase);
                        }}
                        className="rounded-lg bg-paper border border-wood-light/80 px-2.5 py-1 text-xs font-semibold text-wood-dark hover:bg-peach cursor-pointer transition-colors"
                      >
                        {phrase.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <label
                    htmlFor="custom-dialogue-input"
                    className="block text-xs font-extrabold text-wood-dark uppercase tracking-wider mb-1.5"
                  >
                    Dialogue Text (Word-for-word spoken source):
                  </label>
                  <textarea
                    id="custom-dialogue-input"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border-2 border-wood-light bg-paper p-3 text-sm font-semibold text-wood-dark focus:border-leaf focus:outline-none shadow-xs"
                    placeholder="Enter dialogue to speak..."
                  />
                  <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                    Spoken expansion: "{sanitizeTextForSpeech(customText)}"
                  </p>
                </div>

                {/* Action & Feedback */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs font-bold text-wood-dark">
                    {liveResultMsg && <span>{liveResultMsg}</span>}
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingLive || !customText.trim()}
                    onClick={handleTestLiveVoice}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-leaf hover:brightness-105 disabled:opacity-50 text-white px-6 py-2.5 font-display text-base font-extrabold shadow-soft cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    {isGeneratingLive ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5" />
                        <span>Generate & Audition Voice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-cream border-t-2 border-wood-light px-4 py-3 sm:px-6 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              Corner Store Simulator Voice Engine v2.0
            </span>
            <button
              onClick={() => {
                play("tap");
                stopAudio();
                onClose();
              }}
              className="rounded-xl bg-wood-dark hover:bg-wood-dark/90 text-sun font-display font-extrabold text-sm px-5 py-2 shadow-soft cursor-pointer transition-colors"
            >
              Done Testing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
