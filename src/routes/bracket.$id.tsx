import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Zap, RotateCcw, ArrowLeft } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import { Bracket } from "@/components/Bracket";
import { GroupStageView } from "@/components/GroupStage";
import {
  loadOne,
  propagate,
  saveOne,
  simulateAll,
  simulateMatch,
  simulateAllGroups,
  seedKnockoutFromGroups,
  allGroupMatchesPlayed,
  type Tournament,
  createTournament,
  SAMPLE_TEAMS,
} from "@/lib/tournament";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bracket/$id")({
  head: () => ({
    meta: [
      { title: "Chave — Brocket" },
      { name: "description", content: "Visualize, simule e exporte seu chaveamento." },
    ],
  }),
  component: BracketPage,
});

function BracketPage() {
  const { id } = useParams({ from: "/bracket/$id" });
  const [t, setT] = useState<Tournament | null>(null);
  const [tab, setTab] = useState<"groups" | "ko">("groups");
  const bracketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = loadOne(id);
    if (found) {
      const seeded = found.groupStage ? seedKnockoutFromGroups(found) : found;
      setT(propagate(seeded));
      setTab(found.groupStage ? "groups" : "ko");
    } else {
      const demo = createTournament("Brocket Demo", 8, SAMPLE_TEAMS.slice(0, 8));
      saveOne(demo);
      setT(demo);
      setTab("ko");
    }
  }, [id]);

  if (!t) {
    return (
      <div className="min-h-screen">
        <BrandHeader subtitle="Chave" />
        <div className="grid place-items-center p-16 text-sm text-muted-foreground">
          Carregando…
        </div>
      </div>
    );
  }

  const hasGroups = !!t.groupStage;

  const update = (next: Tournament) => {
    let n = next;
    if (n.groupStage) n = seedKnockoutFromGroups(n);
    n = propagate(n);
    setT(n);
    saveOne(n);
  };

  const handleSimulateAll = () => {
    update(simulateAll(t));
  };

  const handleSimulateNext = () => {
    if (hasGroups && !allGroupMatchesPlayed(t)) {
      // simulate next pending group match
      const next = t.groupStage!.matches.find((m) => !m.score);
      if (!next) return;
      const matches = t.groupStage!.matches.map((m) =>
        m.id === next.id ? { ...m, score: simulateRandomScore() } : m
      );
      update({ ...t, groupStage: { ...t.groupStage!, matches } });
      return;
    }
    const next = t.matches.find((m) => m.home && m.away && !m.winner);
    if (!next) return;
    const simulated = simulateMatch(next);
    update({ ...t, matches: t.matches.map((m) => (m.id === next.id ? simulated : m)) });
  };

  const handleSimulateAllGroups = () => {
    update(simulateAllGroups(t));
  };

  const handleReset = () => {
    let fresh: Tournament;
    if (t.groupStage) {
      // reset both groups and knockout
      const matches = t.groupStage.matches.map((m) => ({ ...m, score: null }));
      const koMatches = t.matches.map((m) => ({
        ...m,
        home: null,
        away: null,
        legs: [],
        penalties: null,
        hadExtraTime: false,
        winner: null,
      }));
      fresh = {
        ...t,
        matches: koMatches,
        groupStage: { ...t.groupStage, matches },
      };
    } else {
      fresh = createTournament(t.name, t.size, t.teams, t.matches[0].twoLegged ? 0 : null);
      fresh.id = t.id;
      fresh.createdAt = t.createdAt;
    }
    update(fresh);
  };

  const handleExport = async () => {
    if (!bracketRef.current) return;
    try {
      const dataUrl = await toPng(bracketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0f1f1a",
      });
      const link = document.createElement("a");
      link.download = `${t.name.replace(/\s+/g, "-").toLowerCase()}-brocket.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const finalMatch = t.matches[t.matches.length - 1];
  const champ =
    finalMatch.winner === "home"
      ? finalMatch.home
      : finalMatch.winner === "away"
        ? finalMatch.away
        : null;

  const koReady = !hasGroups || allGroupMatchesPlayed(t);

  return (
    <div className="min-h-screen pb-28">
      <BrandHeader subtitle="Chave" />
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              to="/"
              className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar
            </Link>
            <h1 className="font-display text-2xl font-bold md:text-3xl">{t.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {hasGroups && (
                <>
                  <span>{t.groupStage!.groups.length} grupos</span>
                  <span className="opacity-50">·</span>
                </>
              )}
              <span>{t.teams.length} times</span>
              <span className="opacity-50">·</span>
              <span>{t.matches[0].twoLegged ? "Mata-mata ida/volta" : "Mata-mata único"}</span>
              {champ && (
                <>
                  <span className="opacity-50">·</span>
                  <span className="font-semibold text-[oklch(0.85_0.14_88)]">🏆 {champ}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {hasGroups && (
          <div className="mt-5 inline-flex rounded-xl border border-border bg-[oklch(0.18_0.03_168)] p-1">
            <TabBtn active={tab === "groups"} onClick={() => setTab("groups")}>
              Fase de grupos
            </TabBtn>
            <TabBtn
              active={tab === "ko"}
              onClick={() => setTab("ko")}
              disabled={!koReady}
              hint={!koReady ? "Finalize os grupos" : undefined}
            >
              Mata-mata
            </TabBtn>
          </div>
        )}
      </div>

      {/* Body */}
      {hasGroups && tab === "groups" ? (
        <div className="mt-5">
          <GroupStageView tournament={t} onChange={update} />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto overflow-y-hidden">
          <Bracket ref={bracketRef} tournament={t} />
        </div>
      )}

      {/* Hotbar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-[oklch(0.15_0.025_165/0.85)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5">
          <HotbarBtn onClick={handleSimulateNext} icon={<Zap className="h-4 w-4" />}>
            Próx.
          </HotbarBtn>
          {hasGroups && tab === "groups" && (
            <HotbarBtn onClick={handleSimulateAllGroups} icon={<Zap className="h-4 w-4" />}>
              <span className="hidden sm:inline">Simular grupos</span>
              <span className="sm:hidden">Grupos</span>
            </HotbarBtn>
          )}
          <HotbarBtn primary onClick={handleSimulateAll} icon={<Zap className="h-4 w-4" />}>
            Simular tudo
          </HotbarBtn>
          <HotbarBtn onClick={handleReset} icon={<RotateCcw className="h-4 w-4" />}>
            <span className="hidden sm:inline">Resetar</span>
          </HotbarBtn>
          <div className="flex-1" />
          <HotbarBtn primary onClick={handleExport} icon={<Download className="h-4 w-4" />}>
            PNG
          </HotbarBtn>
        </div>
      </div>
    </div>
  );
}

function simulateRandomScore() {
  const r = () => {
    const x = Math.random();
    if (x < 0.22) return 0;
    if (x < 0.55) return 1;
    if (x < 0.82) return 2;
    if (x < 0.94) return 3;
    return 4;
  };
  return { home: r(), away: r() };
}

function TabBtn({
  active,
  onClick,
  children,
  disabled,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={cn(
        "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
        active
          ? "bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
          : "text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50 hover:text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function HotbarBtn({
  onClick,
  icon,
  children,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
        primary
          ? "bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
          : "border border-border bg-[oklch(0.22_0.04_168/0.7)] text-foreground hover:bg-[oklch(0.28_0.04_168/0.8)]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
