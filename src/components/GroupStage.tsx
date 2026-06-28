import { useState } from "react";
import { Zap, Check } from "lucide-react";
import {
  computeStandings,
  type Tournament,
  type GroupMatch,
  simulateGroupMatch,
} from "@/lib/tournament";
import { cn } from "@/lib/utils";
import { TeamCrest } from "@/components/TeamCrest";

type Props = {
  tournament: Tournament;
  onChange: (next: Tournament) => void;
};

export function GroupStageView({ tournament, onChange }: Props) {
  if (!tournament.groupStage) return null;
  const gs = tournament.groupStage;

  const updateMatch = (id: string, score: { home: number; away: number } | null) => {
    const matches = gs.matches.map((m) => (m.id === id ? { ...m, score } : m));
    onChange({ ...tournament, groupStage: { ...gs, matches } });
  };

  const simulateGroup = (groupIdx: number) => {
    const matches = gs.matches.map((m) =>
      m.groupIdx === groupIdx && !m.score ? simulateGroupMatch(m) : m
    );
    onChange({ ...tournament, groupStage: { ...gs, matches } });
  };

  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {gs.groups.map((g) => {
          const standings = computeStandings(g, gs.matches);
          const groupMatches = gs.matches.filter((m) => m.groupIdx === g.idx);
          const allPlayed = groupMatches.every((m) => m.score);
          return (
            <div key={g.idx}>
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Grupo
                  </span>
                  <h3 className="font-display text-[17px] font-medium text-foreground">
                    {g.name}
                  </h3>
                  {allPlayed && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                      <Check className="h-2.5 w-2.5" /> Encerrado
                    </span>
                  )}
                </div>
                <button
                  onClick={() => simulateGroup(g.idx)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Zap className="h-3 w-3" /> Simular
                </button>
              </div>

              <table className="w-full text-[12.5px]">
                <thead className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="py-1.5 pr-2 text-left font-normal">#</th>
                    <th className="py-1.5 pr-2 text-left font-normal">Time</th>
                    <th className="py-1.5 text-center font-normal">P</th>
                    <th className="py-1.5 text-center font-normal">V</th>
                    <th className="py-1.5 text-center font-normal">E</th>
                    <th className="py-1.5 text-center font-normal">D</th>
                    <th className="py-1.5 text-center font-normal">SG</th>
                    <th className="py-1.5 pl-2 text-right font-normal text-foreground">
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => {
                    const qualified = i < gs.qualifiersPerGroup;
                    return (
                      <tr key={s.team} className="border-t border-border">
                        <td className="py-2 pr-2">
                          <span
                            className={cn(
                              "font-mono text-[11px]",
                              qualified ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-2",
                            qualified ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden
                              className={cn(
                                "h-3 w-0.5 rounded-sm",
                                qualified ? "bg-primary" : "bg-transparent"
                              )}
                            />
                            <TeamCrest name={s.team} size={16} dim={!qualified} />
                            <span className="truncate">{s.team}</span>
                          </span>
                        </td>
                        <td className="py-2 text-center font-mono tabular-nums text-muted-foreground">
                          {s.played}
                        </td>
                        <td className="py-2 text-center font-mono tabular-nums">{s.w}</td>
                        <td className="py-2 text-center font-mono tabular-nums">{s.d}</td>
                        <td className="py-2 text-center font-mono tabular-nums">{s.l}</td>
                        <td className="py-2 text-center font-mono tabular-nums text-muted-foreground">
                          {s.gd > 0 ? `+${s.gd}` : s.gd}
                        </td>
                        <td className="py-2 pl-2 text-right font-mono font-semibold tabular-nums text-foreground">
                          {s.pts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-5 space-y-1">
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Confrontos
                </div>
                {groupMatches.map((m) => (
                  <GroupMatchRow key={m.id} match={m} onChange={(s) => updateMatch(m.id, s)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupMatchRow({
  match,
  onChange,
}: {
  match: GroupMatch;
  onChange: (s: { home: number; away: number } | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [h, setH] = useState<string>(match.score ? String(match.score.home) : "");
  const [a, setA] = useState<string>(match.score ? String(match.score.away) : "");

  const commit = () => {
    const hn = parseInt(h);
    const an = parseInt(a);
    if (!isNaN(hn) && !isNaN(an) && hn >= 0 && an >= 0) {
      onChange({ home: hn, away: an });
    }
    setEditing(false);
  };

  const played = match.score !== null;
  const homeWon = played && match.score!.home > match.score!.away;
  const awayWon = played && match.score!.away > match.score!.home;

  return (
    <div className="flex items-center gap-3 py-1.5 text-[12.5px]">
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center justify-end gap-2",
          homeWon ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="truncate text-right">{match.home}</span>
        <TeamCrest name={match.home} size={15} dim={played && !homeWon} />
      </span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            value={h}
            onChange={(e) => setH(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            autoFocus
            className="h-6 w-7 rounded border border-ring bg-background text-center font-mono text-[12px] text-foreground outline-none"
          />
          <span className="text-muted-foreground">–</span>
          <input
            value={a}
            onChange={(e) => setA(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="h-6 w-7 rounded border border-ring bg-background text-center font-mono text-[12px] text-foreground outline-none"
          />
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn(
            "min-w-[56px] rounded border border-border bg-surface px-2 py-0.5 text-center font-mono text-[12px] tabular-nums transition-colors hover:bg-accent",
            played ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {played ? `${match.score!.home} – ${match.score!.away}` : "—"}
        </button>
      )}
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          awayWon ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <TeamCrest name={match.away} size={15} dim={played && !awayWon} />
        <span className="truncate">{match.away}</span>
      </span>
    </div>
  );
}
