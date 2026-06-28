import { useState } from "react";
import type { Match } from "@/lib/tournament";
import { aggregateScore } from "@/lib/tournament";
import { cn } from "@/lib/utils";
import { TeamCrest } from "@/components/TeamCrest";

type Props = {
  match: Match;
  isFinal?: boolean;
  expanded: boolean;
  onToggle: () => void;
  champion?: string | null;
};

function teamLabel(name: string | null) {
  return name ?? "—";
}

export function MatchCard({ match, isFinal, expanded, onToggle }: Props) {
  const agg = aggregateScore(match);
  const winner = match.winner;
  const homeWon = winner === "home";
  const awayWon = winner === "away";

  const showAgg = match.twoLegged && match.legs.length === 2;
  const home = teamLabel(match.home);
  const away = teamLabel(match.away);

  const homeScore = agg?.home;
  const awayScore = agg?.away;

  const championName = isFinal && winner ? (winner === "home" ? match.home : match.away) : null;

  return (
    <div
      className={cn(
        "group relative w-full select-none rounded-md border border-border bg-surface text-[12.5px] transition-colors",
        "hover:border-border/100 hover:bg-surface-2",
        isFinal && "border-[oklch(0.78_0.10_85/0.45)] bg-[oklch(0.78_0.10_85/0.04)]",
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full flex-col gap-px rounded-md px-2.5 py-2 text-left"
        aria-expanded={expanded}
      >
        <TeamRow
          name={home}
          rawName={match.home}
          score={homeScore}
          pen={match.penalties?.home}
          won={homeWon}
          eliminated={winner !== null && !homeWon}
        />
        <TeamRow
          name={away}
          rawName={match.away}
          score={awayScore}
          pen={match.penalties?.away}
          won={awayWon}
          eliminated={winner !== null && !awayWon}
        />
        {showAgg && (
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            agregado
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-2.5 py-2 text-[11px] text-muted-foreground">
          <MatchDetails match={match} />
        </div>
      )}

      {isFinal && championName && (
        <div className="border-t border-[oklch(0.78_0.10_85/0.3)] px-2.5 py-1.5 text-center">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[oklch(0.78_0.10_85)]">
            Campeão
          </span>
          <div className="font-display text-[14px] font-medium text-foreground">
            {championName}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamRow({
  name,
  rawName,
  score,
  pen,
  won,
  eliminated,
}: {
  name: string;
  rawName: string | null;
  score: number | undefined;
  pen: number | undefined;
  won: boolean;
  eliminated: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <TeamCrest name={rawName} size={16} dim={eliminated} />
        <span
          className={cn(
            "truncate",
            won && "font-semibold text-foreground",
            eliminated && "text-muted-foreground",
            !won && !eliminated && "text-foreground/90",
          )}
        >
          {name}
        </span>
      </span>
      <span className="flex shrink-0 items-baseline gap-1 font-mono text-[12px] tabular-nums">
        <span className={cn(won ? "text-foreground" : "text-muted-foreground")}>
          {score ?? "·"}
        </span>
        {pen !== undefined && (
          <span className="text-[10px] text-muted-foreground">({pen})</span>
        )}
      </span>
    </div>
  );
}

function MatchDetails({ match }: { match: Match }) {
  const homeShort = (match.home ?? "—").slice(0, 3).toUpperCase();
  const awayShort = (match.away ?? "—").slice(0, 3).toUpperCase();
  if (!match.twoLegged) {
    const l = match.legs[0];
    return (
      <div className="space-y-1">
        {l && (
          <DetailRow
            label="Jogo"
            content={`${homeShort} ${l.homeScore}–${l.awayScore} ${awayShort}`}
          />
        )}
        {match.penalties && <DetailRow label="Decisão" content="Pênaltis" />}
        {!l && <div className="opacity-60">Aguardando resultado</div>}
      </div>
    );
  }
  const l1 = match.legs[0];
  const l2 = match.legs[1];
  return (
    <div className="space-y-1">
      {l1 && (
        <DetailRow
          label="Ida"
          content={`${homeShort} ${l1.homeScore}–${l1.awayScore} ${awayShort}`}
        />
      )}
      {l2 && (
        <DetailRow
          label="Volta"
          content={`${awayShort} ${l2.homeScore}–${l2.awayScore} ${homeShort}`}
        />
      )}
      {match.penalties && (
        <DetailRow
          label="Decisão"
          content={match.hadExtraTime ? "A.P. + pênaltis" : "Pênaltis"}
        />
      )}
    </div>
  );
}

function DetailRow({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-[11px] text-foreground/90">{content}</span>
    </div>
  );
}

export function useExpandedSet() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  return { open, toggle };
}
