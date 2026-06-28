import { forwardRef, useMemo } from "react";
import type { Tournament } from "@/lib/tournament";
import { roundName, totalRoundsFor } from "@/lib/tournament";
import { MatchCard, useExpandedSet } from "./MatchCard";

type Props = {
  tournament: Tournament;
  onMatchClick?: (matchId: string) => void;
};

const CARD_W = 200;
const CARD_H = 64;
const ROUND_GAP = 56; // gap between columns
const BASE_GAP = 22; // vertical gap between matches in round 0

export const Bracket = forwardRef<HTMLDivElement, Props>(function Bracket({ tournament }, ref) {
  const { open, toggle } = useExpandedSet();
  const totalRounds = totalRoundsFor(tournament.size);

  const layout = useMemo(() => {
    const pitch0 = CARD_H + BASE_GAP; // round 0 spacing
    const firstCenter0 = pitch0 / 2;
    const positions: Record<string, { x: number; y: number }> = {};
    for (let r = 0; r < totalRounds; r++) {
      const count = tournament.size / Math.pow(2, r + 1);
      const pitch = pitch0 * Math.pow(2, r);
      const first = firstCenter0 * Math.pow(2, r);
      for (let s = 0; s < count; s++) {
        const cy = first + s * pitch;
        const x = r * (CARD_W + ROUND_GAP);
        positions[`${r}-${s}`] = { x, y: cy };
      }
    }
    const width = totalRounds * CARD_W + (totalRounds - 1) * ROUND_GAP;
    const height = (tournament.size / 2) * (CARD_H + BASE_GAP);
    return { positions, width, height };
  }, [tournament.size, totalRounds]);

  return (
    <div ref={ref} className="relative inline-block bg-transparent p-6">
      {/* Round headers */}
      <div className="relative mb-4" style={{ width: layout.width }}>
        <div className="flex">
          {Array.from({ length: totalRounds }).map((_, r) => (
            <div
              key={r}
              className="text-center"
              style={{
                width: CARD_W,
                marginRight: r === totalRounds - 1 ? 0 : ROUND_GAP,
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {roundName(r, totalRounds)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bracket body */}
      <div
        className="relative"
        style={{ width: layout.width, height: layout.height }}
      >
        {/* SVG connecting lines */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={layout.width}
          height={layout.height}
        >
          {tournament.matches
            .filter((m) => m.round < totalRounds - 1)
            .map((m) => {
              const from = layout.positions[m.id];
              const nextSlot = Math.floor(m.slot / 2);
              const to = layout.positions[`${m.round + 1}-${nextSlot}`];
              if (!from || !to) return null;
              const startX = from.x + CARD_W;
              const startY = from.y;
              const midX = startX + ROUND_GAP / 2;
              const endX = to.x;
              const endY = to.y;
              const path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
              const active = m.winner !== null;
              return (
                <path
                  key={m.id}
                  d={path}
                  stroke={active ? "oklch(0.66 0.10 158 / 0.85)" : "oklch(0.40 0.02 170 / 0.7)"}
                  strokeWidth={1}
                  fill="none"
                />
              );
            })}
        </svg>

        {/* Match cards */}
        {tournament.matches.map((m) => {
          const pos = layout.positions[m.id];
          if (!pos) return null;
          const isFinal = m.round === totalRounds - 1;
          return (
            <div
              key={m.id}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y - CARD_H / 2,
                width: CARD_W,
              }}
            >
              <MatchCard
                match={m}
                isFinal={isFinal}
                expanded={open.has(m.id)}
                onToggle={() => toggle(m.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
