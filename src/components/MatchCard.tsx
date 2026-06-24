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

export function MatchCard({ match, isFinal, expanded, onToggle, champion }: Props) {
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
        "group relative w-full select-none rounded-xl text-[13px] transition-all",
        "glass hover:translate-y-[-1px]",
        isFinal && "gold-border bg-[oklch(0.22_0.04_165/0.85)]",
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full flex-col gap-[2px] rounded-xl px-2.5 py-2 text-left"
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
        <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/70">
          {expanded ? "−" : "+"}
        </div>
        {showAgg && (
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/70">
            agregado
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-2.5 py-2 text-[11px] text-muted-foreground">
          <MatchDetails match={match} />
        </div>
      )}

      {isFinal && championName && (
        <div className="border-t border-[oklch(0.85_0.14_88/0.3)] px-2.5 py-1.5 text-center">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[oklch(0.85_0.14_88)]">
            Campeão
          </span>
          <div className="font-display text-[14px] font-bold text-[oklch(0.92_0.14_88)]">
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
      <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-4">
        <TeamCrest name={rawName} size={18} dim={eliminated} />
        <span
          className={cn(
            "truncate",
            won && "font-bold text-foreground",
            eliminated && "font-normal text-muted-foreground/70",
            !won && !eliminated && "text-foreground/90",
          )}
        >
          {name}
        </span>
      </span>
      <span className="score-chip flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px]">
        <span>{score ?? "·"}</span>
        {pen !== undefined && (
          <span className="text-[10px] font-semibold text-muted-foreground">({pen})</span>
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
            label="JOGO"
            content={`${homeShort} ${l.homeScore}-${l.awayScore} ${awayShort}`}
          />
        )}
        {match.penalties && (
          <DetailRow label="DECISÃO" content="Pênaltis" />
        )}
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
          label="IDA"
          content={`${homeShort} ${l1.homeScore}-${l1.awayScore} ${awayShort}`}
        />
      )}
      {l2 && (
        <DetailRow
          label="VOLTA"
          content={`${awayShort} ${l2.homeScore}-${l2.awayScore} ${homeShort}`}
        />
      )}
      {match.penalties && (
        <DetailRow
          label="DECISÃO"
          content={match.hadExtraTime ? "A.P. + Pênaltis" : "Pênaltis"}
        />
      )}
    </div>
  );
}

function DetailRow({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-sm bg-[oklch(0.12_0.02_165)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-primary">
        {label}
      </span>
      <span className="font-medium text-foreground/90">{content}</span>
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
