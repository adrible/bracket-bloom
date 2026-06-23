import { useState } from "react";
import { Zap, Trophy, Check } from "lucide-react";
import {
  computeStandings,
  type Tournament,
  type GroupMatch,
  simulateGroupMatch,
} from "@/lib/tournament";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-6xl px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {gs.groups.map((g) => {
          const standings = computeStandings(g, gs.matches);
          const groupMatches = gs.matches.filter((m) => m.groupIdx === g.idx);
          const allPlayed = groupMatches.every((m) => m.score);
          return (
            <div
              key={g.idx}
              className="glass rounded-2xl border border-border/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 font-display text-sm font-bold text-primary">
                    {String.fromCharCode(65 + g.idx)}
                  </span>
                  <h3 className="font-display text-base font-bold">{g.name}</h3>
                  {allPlayed && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                      <Check className="h-2.5 w-2.5" /> Encerrado
                    </span>
                  )}
                </div>
                <button
                  onClick={() => simulateGroup(g.idx)}
                  className="flex items-center gap-1 rounded-lg border border-border bg-[oklch(0.22_0.04_168/0.6)] px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-[oklch(0.28_0.04_168/0.7)]"
                >
                  <Zap className="h-3 w-3" /> Simular
                </button>
              </div>

              {/* Standings table */}
              <div className="overflow-hidden rounded-xl border border-border/60">
                <table className="w-full text-[12px]">
                  <thead className="bg-[oklch(0.18_0.03_168)] text-[9px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold">#</th>
                      <th className="px-2 py-1.5 text-left font-semibold">Time</th>
                      <th className="px-1 py-1.5 text-center font-semibold">P</th>
                      <th className="px-1 py-1.5 text-center font-semibold">V</th>
                      <th className="px-1 py-1.5 text-center font-semibold">E</th>
                      <th className="px-1 py-1.5 text-center font-semibold">D</th>
                      <th className="px-1 py-1.5 text-center font-semibold">SG</th>
                      <th className="px-2 py-1.5 text-center font-bold text-primary">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => {
                      const qualified = i < gs.qualifiersPerGroup;
                      return (
                        <tr
                          key={s.team}
                          className={cn(
                            "border-t border-border/40",
                            qualified
                              ? "bg-[oklch(0.45_0.13_158/0.08)]"
                              : "bg-transparent"
                          )}
                        >
                          <td className="px-2 py-1.5">
                            <span
                              className={cn(
                                "grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold",
                                qualified
                                  ? "bg-primary/25 text-primary"
                                  : "bg-[oklch(0.16_0.03_165)] text-muted-foreground"
                              )}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td
                            className={cn(
                              "truncate px-2 py-1.5 font-medium",
                              qualified ? "text-foreground" : "text-muted-foreground/80"
                            )}
                          >
                            {s.team}
                            {qualified && i === 0 && (
                              <Trophy className="ml-1 inline h-3 w-3 text-[oklch(0.85_0.14_88)]" />
                            )}
                          </td>
                          <td className="px-1 py-1.5 text-center text-muted-foreground">{s.played}</td>
                          <td className="px-1 py-1.5 text-center">{s.w}</td>
                          <td className="px-1 py-1.5 text-center">{s.d}</td>
                          <td className="px-1 py-1.5 text-center">{s.l}</td>
                          <td className="px-1 py-1.5 text-center text-muted-foreground">
                            {s.gd > 0 ? `+${s.gd}` : s.gd}
                          </td>
                          <td className="px-2 py-1.5 text-center font-bold text-primary">
                            {s.pts}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Matches */}
              <div className="mt-3 space-y-1.5">
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
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-[oklch(0.16_0.03_165/0.7)] px-2 py-1.5 text-[12px]">
      <span
        className={cn(
          "flex-1 truncate text-right",
          homeWon ? "font-bold text-foreground" : "text-muted-foreground/85"
        )}
      >
        {match.home}
      </span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            value={h}
            onChange={(e) => setH(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            autoFocus
            className="h-6 w-7 rounded-md border border-primary/40 bg-[oklch(0.12_0.02_165)] text-center text-[12px] font-bold text-foreground outline-none"
          />
          <span className="text-muted-foreground">×</span>
          <input
            value={a}
            onChange={(e) => setA(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="h-6 w-7 rounded-md border border-primary/40 bg-[oklch(0.12_0.02_165)] text-center text-[12px] font-bold text-foreground outline-none"
          />
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn(
            "score-chip min-w-[52px] rounded-md px-2 py-0.5 text-center text-[12px] font-bold",
            !played && "text-muted-foreground/60"
          )}
        >
          {played ? `${match.score!.home} – ${match.score!.away}` : "—"}
        </button>
      )}
      <span
        className={cn(
          "flex-1 truncate",
          awayWon ? "font-bold text-foreground" : "text-muted-foreground/85"
        )}
      >
        {match.away}
      </span>
    </div>
  );
}
