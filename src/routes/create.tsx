import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shuffle, Download, Loader2 } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import {
  SAMPLE_TEAMS,
  createTournament,
  createTournamentWithGroups,
  saveOne,
  shuffle,
  totalRoundsFor,
} from "@/lib/tournament";
import { COMPETITIONS, fetchCompetitionTeams } from "@/lib/football-data.functions";
import { setCrests } from "@/lib/crests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Novo torneio — Brocket" },
      { name: "description", content: "Configure um novo chaveamento no Brocket." },
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
  const [competition, setCompetition] = useState<string>("CL");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedFrom, setImportedFrom] = useState<string | null>(null);

  const totalTeams = mode === "ko" ? koSize : groupsCount * TEAMS_PER_GROUP;
  const [teams, setTeams] = useState<string[]>(() => SAMPLE_TEAMS.slice(0, 8));

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

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const result = await fetchCompetitionTeams({ data: { code: competition } });
      const imported = result.teams;
      if (imported.length === 0) {
        setImportError("Nenhum time retornado para esta competição.");
        return;
      }
      const crestMap: Record<string, string> = {};
      for (const t of imported) {
        if (t.crest) crestMap[t.name] = t.crest;
      }
      setCrests(crestMap);
      const names = imported.map((t) => t.name);
      const shuffled = shuffle(names);
      const take = shuffled.slice(0, totalTeams);
      while (take.length < totalTeams) take.push(`Time ${take.length + 1}`);
      setTeams(take);
      const label = COMPETITIONS.find((c) => c.code === competition)?.label ?? competition;
      setImportedFrom(label);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Falha ao importar times");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Novo torneio" />
      <main className="mx-auto max-w-2xl px-5 py-10 pb-32">
        <h1 className="font-display text-3xl font-medium text-foreground">
          Criar torneio
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Mata-mata direto ou com fase de grupos.
        </p>

        <div className="mt-10 space-y-8">
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground outline-none transition-colors focus:border-ring"
              placeholder="Ex.: Champions Brocket"
            />
          </Field>

          <Field
            label="Importar times reais"
            right={
              importedFrom ? (
                <span className="text-[11px] text-muted-foreground">
                  via football-data.org
                </span>
              ) : null
            }
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground outline-none focus:border-ring"
              >
                {COMPETITIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {importing ? "Buscando…" : "Importar"}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Preenche os {totalTeams} primeiros times com escudos oficiais.
              {importedFrom && (
                <>
                  {" "}Última: <span className="text-foreground">{importedFrom}</span>.
                </>
              )}
            </p>
            {importError && (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-[12px] text-destructive">
                {importError}
              </p>
            )}
          </Field>

          <Field label="Formato">
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn
                active={mode === "ko"}
                onClick={() => setMode("ko")}
                title="Mata-mata"
                desc="Eliminatória direta."
              />
              <ModeBtn
                active={mode === "groups"}
                onClick={() => setMode("groups")}
                title="Grupos + mata-mata"
                desc="Grupos de 4, dois avançam."
              />
            </div>
          </Field>

          {mode === "ko" ? (
            <Field label="Quantos times">
              <div className="flex flex-wrap gap-1.5">
                {KO_SIZES.map((s) => (
                  <PillBtn key={s} active={koSize === s} onClick={() => setKoSize(s)}>
                    {s}
                  </PillBtn>
                ))}
              </div>
              <Hint>
                {koRounds} fases · {koSize / 2} confrontos na primeira rodada
              </Hint>
            </Field>
          ) : (
            <Field label="Quantos grupos">
              <div className="flex flex-wrap gap-1.5">
                {GROUP_COUNTS.map((g) => (
                  <PillBtn key={g} active={groupsCount === g} onClick={() => setGroupsCount(g)}>
                    {g}
                  </PillBtn>
                ))}
              </div>
              <Hint>
                {groupsCount} grupos de {TEAMS_PER_GROUP} ·{" "}
                <span className="text-foreground">{totalTeams}</span> times ·{" "}
                {knockoutSize} no mata-mata ({koRounds} fases)
              </Hint>
            </Field>
          )}

          <Field label={mode === "ko" ? "Formato dos confrontos" : "Mata-mata"}>
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn
                active={!twoLegged}
                onClick={() => setTwoLegged(false)}
                title="Jogo único"
                desc="Empate vai a pênaltis."
              />
              <ModeBtn
                active={twoLegged}
                onClick={() => setTwoLegged(true)}
                title="Ida e volta"
                desc="Final segue como jogo único."
              />
            </div>
          </Field>

          <Field
            label={mode === "groups" ? "Times por grupo" : "Times"}
            right={
              <button
                onClick={() => setTeams((prev) => shuffle(prev))}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Shuffle className="h-3 w-3" /> Sortear
              </button>
            }
          >
            {mode === "groups" ? (
              <div className="space-y-4">
                {Array.from({ length: groupsCount }).map((_, gi) => (
                  <div key={gi}>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Grupo {String.fromCharCode(65 + gi)}
                    </div>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {teams
                        .slice(gi * TEAMS_PER_GROUP, (gi + 1) * TEAMS_PER_GROUP)
                        .map((t, j) => {
                          const i = gi * TEAMS_PER_GROUP + j;
                          return (
                            <TeamInput key={i} index={i} value={t} setTeams={setTeams} />
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {teams.map((t, i) => (
                  <TeamInput key={i} index={i} value={t} setTeams={setTeams} />
                ))}
              </div>
            )}
          </Field>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <div className="text-[12px] text-muted-foreground">
            <span className="text-foreground">{totalTeams}</span> times ·{" "}
            {mode === "groups" ? `${groupsCount} grupos · ` : ""}
            {twoLegged ? "ida e volta" : "jogo único"}
          </div>
          <button
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Gerar torneio
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
    <div className="flex items-center gap-2.5 border-b border-border/60 py-1.5">
      <span className="w-5 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
        {index + 1}
      </span>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setTeams((prev) => prev.map((p, idx) => (idx === index ? v : p)));
        }}
        className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
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
        "rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground"
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
        "rounded-md border p-3 text-left transition-colors",
        active
          ? "border-primary/60 bg-primary/[0.06]"
          : "border-border bg-surface hover:bg-accent"
      )}
    >
      <div className="text-[13px] font-medium text-foreground">{title}</div>
      <div className="mt-0.5 text-[11.5px] text-muted-foreground">{desc}</div>
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
      <div className="mb-2.5 flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-[12px] text-muted-foreground">{children}</div>;
}
