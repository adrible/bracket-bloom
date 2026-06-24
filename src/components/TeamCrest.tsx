import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getCrest, subscribeCrests } from "@/lib/crests";

function useCrestUrl(name: string | null | undefined): string | undefined {
  return useSyncExternalStore(
    subscribeCrests,
    () => (name ? getCrest(name) : undefined),
    () => undefined,
  );
}

// Deterministic hash from team name
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function initials(name: string): string {
  const clean = name.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const p = parts[0];
    return (p[0] + (p[1] ?? "")).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Curated palette tuned for dark green theme
const PALETTE: [string, string][] = [
  ["#e11d48", "#7f1d1d"], // crimson
  ["#f59e0b", "#78350f"], // amber
  ["#10b981", "#064e3b"], // emerald
  ["#3b82f6", "#1e3a8a"], // blue
  ["#8b5cf6", "#4c1d95"], // violet
  ["#ec4899", "#831843"], // pink
  ["#14b8a6", "#134e4a"], // teal
  ["#f97316", "#7c2d12"], // orange
  ["#0ea5e9", "#0c4a6e"], // sky
  ["#a3a3a3", "#3f3f46"], // silver
  ["#eab308", "#713f12"], // gold
  ["#22c55e", "#14532d"], // green
];

type Shape = "shield" | "round" | "diamond";
const SHAPES: Shape[] = ["shield", "round", "diamond"];

export type TeamCrestProps = {
  name: string | null | undefined;
  size?: number;
  className?: string;
  dim?: boolean;
};

export function TeamCrest({ name, size = 18, className, dim }: TeamCrestProps) {
  const crestUrl = useCrestUrl(name);

  if (!name) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block shrink-0 rounded-md border border-border/50 bg-[oklch(0.18_0.03_165)]",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  if (crestUrl) {
    return (
      <img
        src={crestUrl}
        alt=""
        aria-hidden
        width={size}
        height={size}
        loading="lazy"
        className={cn(
          "shrink-0 object-contain",
          dim && "opacity-60 grayscale",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  const h = hash(name);
  const [primary, dark] = PALETTE[h % PALETTE.length];
  const shape: Shape = SHAPES[(h >> 4) % SHAPES.length];
  const stripe = (h >> 8) % 3; // 0 none, 1 vertical, 2 horizontal
  const text = initials(name);

  const id = `crest-${(h % 1_000_000).toString(36)}`;
  const s = size;

  let bg: React.ReactNode;
  if (shape === "shield") {
    // Shield path normalized 0..24
    const path = "M12 1 L22 4 L22 12 C22 18 17 22 12 23 C7 22 2 18 2 12 L2 4 Z";
    bg = (
      <g>
        <path d={path} fill={`url(#${id})`} stroke={dark} strokeWidth={0.7} />
        {stripe === 1 && (
          <rect x={10.5} y={1} width={3} height={22} fill={dark} opacity={0.45} />
        )}
        {stripe === 2 && (
          <rect x={2} y={10.5} width={20} height={3} fill={dark} opacity={0.45} />
        )}
        <path d={path} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
      </g>
    );
  } else if (shape === "round") {
    bg = (
      <g>
        <circle cx={12} cy={12} r={10.5} fill={`url(#${id})`} stroke={dark} strokeWidth={0.7} />
        {stripe === 1 && (
          <rect x={10.5} y={1.5} width={3} height={21} fill={dark} opacity={0.45} />
        )}
        {stripe === 2 && (
          <rect x={1.5} y={10.5} width={21} height={3} fill={dark} opacity={0.45} />
        )}
        <circle cx={12} cy={12} r={10.5} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />
      </g>
    );
  } else {
    const path = "M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z";
    bg = (
      <g>
        <path d={path} fill={`url(#${id})`} stroke={dark} strokeWidth={0.7} />
        {stripe === 1 && (
          <rect x={10.5} y={1.5} width={3} height={21} fill={dark} opacity={0.45} />
        )}
        {stripe === 2 && (
          <rect x={1.5} y={10.5} width={21} height={3} fill={dark} opacity={0.45} />
        )}
      </g>
    );
  }

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      className={cn("shrink-0", dim && "opacity-60", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {bg}
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={shape === "diamond" ? 8.5 : 9.5}
        fontWeight={800}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#ffffff"
        style={{ paintOrder: "stroke", letterSpacing: -0.3 }}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={0.4}
      >
        {text}
      </text>
    </svg>
  );
}
