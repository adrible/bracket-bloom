import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shuffle, ArrowRight } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import {
  SAMPLE_TEAMS,
  createTournament,
  saveOne,
  shuffle,
  totalRoundsFor,
} from "@/lib/tournament";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Novo torneio — Brocket" },
      { name: "description", content: "Configure um novo chaveamento mata-mata no Brocket." },
    ],
  }),
  component: CreatePage,
});

const SIZES = [4, 8, 16, 32, 64] as const;

function CreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Champions Brocket");
  const [size, setSize] = useState<(typeof SIZES)[number]>(8);
  const [twoLegged, setTwoLegged] = useState(false);
  const [teams, setTeams] = useState<string[]>(() => SAMPLE_TEAMS.slice(0, 8));

  // Keep teams in sync with size
  useMemo(() => {
    setTeams((prev) => {
      if (prev.length === size) return prev;
      if (prev.length < size) {
        const pool = SAMPLE_TEAMS.filter((t) => !prev.includes(t));
        return [...prev, ...pool.slice(0, size - prev.length)];
      }
      return prev.slice(0, size);
    });
  }, [size]);

  const totalRounds = totalRoundsFor(size);

  const handleCreate = () => {
    const twoLeggedFromRound = twoLegged ? 0 : null;
    const t = createTournament(name.trim() || "Brocket", size, teams, twoLeggedFromRound);
    saveOne(t);
    navigate({ to: "/bracket/$id", params: { id: t.id } });
  };

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Novo torneio" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-32">
        <h1 className="font-display text-3xl font-bold">Criar mata-mata</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina nome, tamanho e os times. Brocket gera o chaveamento na hora.
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

          <Field label="Quantos times">
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    size === s
                      ? "border-primary bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "border-border bg-[oklch(0.22_0.04_168/0.6)] text-foreground hover:bg-[oklch(0.28_0.04_168/0.7)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {totalRounds} fases · {size / 2} confrontos na primeira rodada
            </div>
          </Field>

          <Field label="Formato dos confrontos">
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
            label="Times"
            right={
              <button
                onClick={() => setTeams((prev) => shuffle(prev))}
                className="flex items-center gap-1 rounded-lg border border-border bg-[oklch(0.22_0.04_168/0.6)] px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-[oklch(0.28_0.04_168/0.7)]"
              >
                <Shuffle className="h-3 w-3" /> Sortear
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {teams.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border bg-[oklch(0.18_0.03_168)] px-2.5 py-1.5"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/15 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <input
                    value={t}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTeams((prev) => prev.map((p, idx) => (idx === i ? v : p)));
                    }}
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                  />
                </div>
              ))}
            </div>
          </Field>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-[oklch(0.15_0.025_165/0.85)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{size}</span> times ·{" "}
            {twoLegged ? "Ida e volta" : "Jogo único"}
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-[var(--gradient-primary)] px-5 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            Gerar chave <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
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
