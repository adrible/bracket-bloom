import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Sparkles, Zap, Download } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import { loadAll, deleteOne, type Tournament } from "@/lib/tournament";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brocket — Chaveamento esportivo premium" },
      {
        name: "description",
        content:
          "Monte chaveamentos mata-mata de futebol com visual dark premium. Simule resultados e exporte sua chave em PNG.",
      },
      { property: "og:title", content: "Brocket — Chaveamento esportivo" },
      {
        property: "og:description",
        content:
          "Crie torneios mata-mata bonitos e legíveis. Inspirado em apps esportivos premium.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [list, setList] = useState<Tournament[]>([]);
  useEffect(() => {
    setList(loadAll());
  }, []);

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Bracket builder" />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[oklch(0.2_0.035_168/0.55)] p-8 shadow-[var(--shadow-card)] md:p-12">
          <div className="absolute inset-0 -z-10 opacity-60 [background:radial-gradient(circle_at_top_right,oklch(0.45_0.13_158/0.4),transparent_60%)]" />
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> Mata-mata premium
          </div>
          <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.05] md:text-6xl">
            Chaveamentos que parecem{" "}
            <span className="bg-gradient-to-r from-[oklch(0.85_0.14_88)] to-[oklch(0.72_0.16_158)] bg-clip-text text-transparent">
              uma árvore real.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Brocket monta brackets eliminatórios com linhas que conectam de verdade, placares
            limpos e detalhes completos por confronto — pênaltis, prorrogação, ida e volta.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/create"
              className="rounded-xl bg-[var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
            >
              Criar mata-mata
            </Link>
            {list.length > 0 && (
              <a
                href="#meus-torneios"
                className="rounded-xl border border-border bg-[oklch(0.24_0.04_168/0.6)] px-5 py-3 text-sm font-semibold text-foreground hover:bg-[oklch(0.28_0.04_168/0.7)]"
              >
                Meus torneios ({list.length})
              </a>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Feature
              icon={<Trophy className="h-4 w-4" />}
              title="4 a 64 times"
              desc="Oitavas, quartas, semi e final geradas automaticamente."
            />
            <Feature
              icon={<Zap className="h-4 w-4" />}
              title="Simulação instantânea"
              desc="Veja o caminho até o título com um clique."
            />
            <Feature
              icon={<Download className="h-4 w-4" />}
              title="Exporta em PNG"
              desc="Compartilhe a chave limpa, sem interface."
            />
          </div>
        </section>

        {list.length > 0 && (
          <section id="meus-torneios" className="mt-12">
            <h2 className="font-display text-xl font-bold">Meus torneios</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => {
                const final = t.matches[t.matches.length - 1];
                const champ =
                  final?.winner === "home" ? final.home : final?.winner === "away" ? final.away : null;
                return (
                  <div key={t.id} className="glass group relative rounded-2xl p-4">
                    <Link
                      to="/bracket/$id"
                      params={{ id: t.id }}
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display text-base font-semibold">{t.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.size} times · {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <span className="rounded-md border border-border bg-[oklch(0.16_0.03_165)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {champ ? "Concluído" : "Em aberto"}
                        </span>
                      </div>
                      {champ && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.14_88/0.3)] bg-[oklch(0.85_0.14_88/0.06)] px-2.5 py-1.5">
                          <Trophy className="h-3.5 w-3.5 text-[oklch(0.85_0.14_88)]" />
                          <span className="text-xs font-semibold text-[oklch(0.92_0.14_88)]">
                            {champ}
                          </span>
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={() => {
                        deleteOne(t.id);
                        setList(loadAll());
                      }}
                      className="absolute right-3 top-3 hidden text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive group-hover:block"
                    >
                      Excluir
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
