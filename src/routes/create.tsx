import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shuffle, ArrowRight } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import {
  SAMPLE_TEAMS,
  createTournament,
  createTournamentWithGroups,
  saveOne,
  shuffle,
  totalRoundsFor,
} from "@/lib/tournament";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Novo torneio — Brocket" },
      { name: "description", content: "Configure um novo chaveamento mata-mata no Brocket." },
    ],
  }),
  component: CreatePage,
});

const KO_SIZES = [4, 8, 16, 32, 64] as const;
const GROUP_COUNTS = [2, 4, 8, 16] as const;
const TEAMS_PER_GROUP = 4;

function CreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Champions Brocket");
  const [mode, setMode] = useState<"ko" | "groups">("ko");
  const [koSize, setKoSize] = useState<(typeof KO_SIZES)[number]>(8);
  const [groupsCount, setGroupsCount] = useState<(typeof GROUP_COUNTS)[number]>(4);
  const [twoLegged, setTwoLegged] = useState(false);

  const totalTeams = mode === "ko" ? koSize : groupsCount * TEAMS_PER_GROUP;

  const [teams, setTeams] = useState<string[]>(() => SAMPLE_TEAMS.slice(0, 8));

  // Keep teams in sync with totalTeams
  useEffect(() => {
    setTeams((prev) => {
      if (prev.length === totalTeams) return prev;
      if (prev.length < totalTeams) {
        const pool = SAMPLE_TEAMS.filter((t) => !prev.includes(t));
        return [...prev, ...pool.slice(0, totalTeams - prev.length)];
      }
      return prev.slice(0, totalTeams);
    });
  }, [totalTeams]);

  const knockoutSize = mode === "ko" ? koSize : groupsCount * 2;
  const koRounds = totalRoundsFor(knockoutSize);

  const handleCreate = () => {
    let t;
    if (mode === "ko") {
      const twoLeggedFromRound = twoLegged ? 0 : null;
      t = createTournament(name.trim() || "Brocket", koSize, teams, twoLeggedFromRound);
    } else {
      t = createTournamentWithGroups(
        name.trim() || "Brocket",
        groupsCount,
        TEAMS_PER_GROUP,
        teams,
        twoLegged
      );
    }
    saveOne(t);
    navigate({ to: "/bracket/$id", params: { id: t.id } });
  };

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Novo torneio" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-32">
        <h1 className="font-display text-3xl font-bold">Criar torneio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mata-mata direto ou com fase de grupos. Brocket monta tudo na hora.
        </p>

        <div className="mt-6 space-y-5">
          <Field label="Nome do torneio">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-[oklch(0.18_0.03_168)] px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-primary"
              placeholder="Ex.: Champions Brocket"
            />
          </Field>

          <Field label="Formato do torneio">
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn
                active={mode === "ko"}
                onClick={() => setMode("ko")}
                title="Mata-mata"
                desc="Eliminatória direta do início ao fim."
              />
              <ModeBtn
                active={mode === "groups"}
                onClick={() => setMode("groups")}
                title="Grupos + Mata-mata"
                desc="Fase de grupos com 4 times, os 2 melhores avançam."
              />
            </div>
          </Field>

          {mode === "ko" ? (
            <Field label="Quantos times">
              <div className="flex flex-wrap gap-2">
                {KO_SIZES.map((s) => (
                  <PillBtn key={s} active={koSize === s} onClick={() => setKoSize(s)}>
                    {s}
                  </PillBtn>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {koRounds} fases · {koSize / 2} confrontos na primeira rodada
              </div>
            </Field>
          ) : (
            <Field label="Quantos grupos">
              <div className="flex flex-wrap gap-2">
                {GROUP_COUNTS.map((g) => (
                  <PillBtn key={g} active={groupsCount === g} onClick={() => setGroupsCount(g)}>
                    {g}
                  </PillBtn>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {groupsCount} grupos de {TEAMS_PER_GROUP} times ·{" "}
                <span className="font-semibold text-foreground">{totalTeams}</span> times no
                total · {knockoutSize} no mata-mata ({koRounds} fases)
              </div>
            </Field>
          )}

          <Field label={mode === "ko" ? "Formato dos confrontos" : "Mata-mata"}>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTwoLegged(false)}
                className={`rounded-xl border p-3 text-left text-sm ${
                  !twoLegged
                    ? "border-primary bg-primary/10"
                    : "border-border bg-[oklch(0.22_0.04_168/0.6)]"
                }`}
              >
                <div className="font-semibold">Jogo único</div>
                <div className="text-xs text-muted-foreground">Empate vai para pênaltis.</div>
              </button>
              <button
                onClick={() => setTwoLegged(true)}
                className={`rounded-xl border p-3 text-left text-sm ${
                  twoLegged
                    ? "border-primary bg-primary/10"
                    : "border-border bg-[oklch(0.22_0.04_168/0.6)]"
                }`}
              >
                <div className="font-semibold">Ida e volta</div>
                <div className="text-xs text-muted-foreground">Final segue como jogo único.</div>
              </button>
            </div>
          </Field>

          <Field
            label={mode === "groups" ? "Times (na ordem dos grupos)" : "Times"}
            right={
              <button
                onClick={() => setTeams((prev) => shuffle(prev))}
                className="flex items-center gap-1 rounded-lg border border-border bg-[oklch(0.22_0.04_168/0.6)] px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-[oklch(0.28_0.04_168/0.7)]"
              >
                <Shuffle className="h-3 w-3" /> Sortear
              </button>
            }
          >
            {mode === "groups" ? (
              <div className="space-y-3">
                {Array.from({ length: groupsCount }).map((_, gi) => (
                  <div
                    key={gi}
                    className="rounded-xl border border-border/60 bg-[oklch(0.16_0.03_165/0.5)] p-2.5"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                        {String.fromCharCode(65 + gi)}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Grupo {String.fromCharCode(65 + gi)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {teams
                        .slice(gi * TEAMS_PER_GROUP, (gi + 1) * TEAMS_PER_GROUP)
                        .map((t, j) => {
                          const i = gi * TEAMS_PER_GROUP + j;
                          return <TeamInput key={i} index={i} value={t} setTeams={setTeams} />;
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {teams.map((t, i) => (
                  <TeamInput key={i} index={i} value={t} setTeams={setTeams} />
                ))}
              </div>
            )}
          </Field>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-[oklch(0.15_0.025_165/0.85)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalTeams}</span> times ·{" "}
            {mode === "groups" ? `${groupsCount} grupos · ` : ""}
            {twoLegged ? "Ida e volta" : "Jogo único"}
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-[var(--gradient-primary)] px-5 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            Gerar torneio <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamInput({
  index,
  value,
  setTeams,
}: {
  index: number;
  value: string;
  setTeams: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-[oklch(0.18_0.03_168)] px-2.5 py-1.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/15 text-[11px] font-bold text-primary">
        {index + 1}
      </span>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setTeams((prev) => prev.map((p, idx) => (idx === index ? v : p)));
        }}
        className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
      />
    </div>
  );
}

function PillBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "border-primary bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
          : "border-border bg-[oklch(0.22_0.04_168/0.6)] text-foreground hover:bg-[oklch(0.28_0.04_168/0.7)]"
      )}
    >
      {children}
    </button>
  );
}

function ModeBtn({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left text-sm transition-all",
        active
          ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
          : "border-border bg-[oklch(0.22_0.04_168/0.6)] hover:bg-[oklch(0.28_0.04_168/0.7)]"
      )}
    >
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}

function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  );
}
