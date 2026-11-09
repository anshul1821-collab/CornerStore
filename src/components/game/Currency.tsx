import type { Denomination } from "@/game/types";
import { formatUSD } from "@/lib/currency";

interface Props {
  denom: Denomination;
  size?: "sm" | "md" | "lg";
  className?: string;
  isHighlighted?: boolean;
}

// Vibrant, kid-friendly distinct color palettes for USD denominations
const COIN_THEMES: Record<
  string,
  { bg: string; border: string; rim: string; text: string; glow: string; icon: string }
> = {
  c1: {
    // $1.00 Golden Dollar (Sacagawea / Presidential Gold)
    bg: "radial-gradient(circle at 32% 28%, #fff3b0 0%, #facc15 35%, #eab308 70%, #ca8a04 100%)",
    border: "#a16207",
    rim: "#fef08a",
    text: "#713f12",
    glow: "rgba(250, 204, 21, 0.4)",
    icon: "🪙",
  },
  c2: {
    // $2.00 Bi-Metal Coin (Silver outer with Golden inner core)
    bg: "radial-gradient(circle at 35% 30%, #fef9c3 0%, #e2e8f0 45%, #cbd5e1 75%, #94a3b8 100%)",
    border: "#64748b",
    rim: "#f1f5f9",
    text: "#1e293b",
    glow: "rgba(148, 163, 184, 0.4)",
    icon: "✨",
  },
  c5: {
    // $5.00 Copper-Bronze Coin
    bg: "radial-gradient(circle at 32% 28%, #ffedd5 0%, #fb923c 38%, #ea580c 75%, #c2410c 100%)",
    border: "#9a3412",
    rim: "#fed7aa",
    text: "#431407",
    glow: "rgba(234, 88, 12, 0.4)",
    icon: "⭐",
  },
  c10: {
    // $10.00 Platinum Star Coin
    bg: "radial-gradient(circle at 35% 30%, #fdf4ff 0%, #e879f9 35%, #c026d3 75%, #86198f 100%)",
    border: "#701a75",
    rim: "#fae8ff",
    text: "#4a044e",
    glow: "rgba(192, 38, 211, 0.4)",
    icon: "🌟",
  },
};

const NOTE_THEMES: Record<
  string,
  {
    bg: string;
    border: string;
    innerBorder: string;
    badgeBg: string;
    text: string;
    accent: string;
    glow: string;
  }
> = {
  n10: {
    // $10.00 Hamilton Warm Ochre / Amber Bill
    bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 35%, #f59e0b 100%)",
    border: "#b45309",
    innerBorder: "rgba(180, 83, 9, 0.45)",
    badgeBg: "#fffbeb",
    text: "#78350f",
    accent: "#d97706",
    glow: "rgba(245, 158, 11, 0.35)",
  },
  n20: {
    // $20.00 Jackson Emerald / Classic Green Bill
    bg: "linear-gradient(135deg, #dcfce7 0%, #86efac 35%, #22c55e 100%)",
    border: "#15803d",
    innerBorder: "rgba(21, 128, 61, 0.45)",
    badgeBg: "#f0fdf4",
    text: "#14532d",
    accent: "#16a34a",
    glow: "rgba(34, 197, 94, 0.35)",
  },
  n50: {
    // $50.00 Grant Rose / Coral Bill
    bg: "linear-gradient(135deg, #ffe4e6 0%, #fda4af 35%, #f43f5e 100%)",
    border: "#be123c",
    innerBorder: "rgba(190, 18, 60, 0.45)",
    badgeBg: "#fff1f2",
    text: "#881337",
    accent: "#e11d48",
    glow: "rgba(244, 63, 94, 0.35)",
  },
  n100: {
    // $100.00 Franklin Cyan / Security Blue Ribbon Bill
    bg: "linear-gradient(135deg, #cffafe 0%, #67e8f9 35%, #06b6d4 100%)",
    border: "#0e7490",
    innerBorder: "rgba(14, 116, 144, 0.45)",
    badgeBg: "#ecfeff",
    text: "#164e63",
    accent: "#0891b2",
    glow: "rgba(6, 182, 212, 0.35)",
  },
  n200: {
    // $200.00 Special Sunset Gold Bill
    bg: "linear-gradient(135deg, #ffedd5 0%, #fdba74 35%, #f97316 100%)",
    border: "#c2410c",
    innerBorder: "rgba(194, 65, 12, 0.45)",
    badgeBg: "#fff7ed",
    text: "#7c2d12",
    accent: "#ea580c",
    glow: "rgba(249, 115, 22, 0.35)",
  },
  n500: {
    // $500.00 Royal Purple Grand Bill
    bg: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 35%, #8b5cf6 100%)",
    border: "#6d28d9",
    innerBorder: "rgba(109, 40, 217, 0.45)",
    badgeBg: "#f5f3ff",
    text: "#4c1d95",
    accent: "#7c3aed",
    glow: "rgba(139, 92, 246, 0.35)",
  },
};

export function CurrencyPiece({
  denom,
  size = "md",
  className = "",
  isHighlighted = false,
}: Props) {
  const isCoin = denom.kind === "coin";
  const formattedVal = formatUSD(denom.value);

  if (isCoin) {
    const theme = COIN_THEMES[denom.id] || COIN_THEMES["c1"]!;
    const dim =
      size === "sm"
        ? "h-11 w-11 text-xs"
        : size === "lg"
          ? "h-20 w-20 text-base"
          : "h-14 w-14 sm:h-15 sm:w-15 md:h-16 md:w-16 text-sm";

    return (
      <div
        className={`${dim} relative grid shrink-0 place-items-center rounded-full font-display font-extrabold select-none transition-transform ${className}`}
        style={{
          boxShadow: isHighlighted
            ? `0 0 0 3px #fef08a, 0 6px 14px ${theme.glow}`
            : `0 4px 8px -2px rgba(40, 20, 5, 0.35), inset 0 2px 2px rgba(255, 255, 255, 0.7)`,
        }}
      >
        {/* Coin Base with Lustrous Gradient */}
        <span
          className="absolute inset-0 rounded-full border-2"
          style={{
            background: theme.bg,
            borderColor: theme.border,
          }}
        />

        {/* Ribbed Coin Outer Rim */}
        <span
          className="absolute inset-1 rounded-full border-2 border-dashed opacity-75"
          style={{ borderColor: theme.rim }}
        />

        {/* Inner Coin Content */}
        <div
          className="relative flex flex-col items-center justify-center leading-none"
          style={{ color: theme.text }}
        >
          <span
            className={size === "sm" ? "text-[10px]" : "text-xs sm:text-sm opacity-85"}
            aria-hidden
          >
            {theme.icon}
          </span>
          <span
            className={
              size === "sm"
                ? "text-[10px] sm:text-[11px] font-extrabold tracking-tight"
                : "text-xs sm:text-sm md:text-base font-black tracking-tight drop-shadow-xs"
            }
          >
            {formattedVal}
          </span>
        </div>
      </div>
    );
  }

  // Banknotes (US Dollar Bills)
  const theme = NOTE_THEMES[denom.id] || NOTE_THEMES["n10"]!;
  const dim =
    size === "sm"
      ? "h-11 w-26 text-xs"
      : size === "lg"
        ? "h-20 w-44 sm:h-22 sm:w-48 text-base"
        : "h-14 w-32 sm:h-15 sm:w-36 md:h-16 md:w-40 text-xs sm:text-sm";

  return (
    <div
      className={`${dim} relative flex shrink-0 items-center justify-between rounded-xl px-2.5 sm:px-3 py-1 font-display font-extrabold select-none transition-transform border-2 ${className}`}
      style={{
        background: theme.bg,
        borderColor: theme.border,
        boxShadow: isHighlighted
          ? `0 0 0 3px #fde047, 0 8px 16px ${theme.glow}`
          : `0 4px 8px -2px rgba(40, 20, 5, 0.3), inset 0 2px 2px rgba(255, 255, 255, 0.65)`,
      }}
    >
      {/* Ornate Inner Engraved Border */}
      <span
        className="absolute inset-1 rounded-lg border-2 pointer-events-none"
        style={{ borderColor: theme.innerBorder }}
      />

      {/* Security Watermark Seal Badge on Left */}
      <div
        className={`relative grid place-items-center rounded-full font-black shadow-xs border ${
          size === "sm"
            ? "h-6 w-6 text-[11px]"
            : "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-xs sm:text-sm"
        }`}
        style={{
          background: theme.badgeBg,
          color: theme.text,
          borderColor: theme.innerBorder,
        }}
      >
        <span>$</span>
      </div>

      {/* Prominent Center Value */}
      <div className="relative flex flex-col items-center justify-center text-center leading-none">
        <span
          className={`font-black tracking-tight drop-shadow-xs ${
            size === "sm" ? "text-xs" : "text-xs sm:text-sm md:text-base"
          }`}
          style={{ color: theme.text }}
        >
          {formattedVal}
        </span>
        <span
          className={`uppercase tracking-wider font-bold opacity-75 mt-0.5 ${
            size === "sm" ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          }`}
          style={{ color: theme.text }}
        >
          US Dollar
        </span>
      </div>

      {/* Corner Denomination Pip */}
      <div
        className={`relative font-black opacity-85 ${
          size === "sm" ? "text-[10px]" : "text-[11px] sm:text-xs md:text-sm"
        }`}
        style={{ color: theme.text }}
      >
        ${denom.value}
      </div>
    </div>
  );
}
