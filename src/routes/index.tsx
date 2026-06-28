import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { loadAll, deleteOne, type Tournament } from "@/lib/tournament";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brocket — Chaveamentos de futebol" },
      {
        name: "description",
        content:
          "Crie chaveamentos mata-mata e fases de grupos, registre placares e exporte sua chave em PNG.",
      },
      { property: "og:title", content: "Brocket" },
      {
        property: "og:description",
        content: "Chaveamentos de futebol, claros e bem desenhados.",
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
      <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <section className="max-w-2xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] text-foreground md:text-5xl">
            Chaveamentos de futebol,
            <br />
            do sorteio à final.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Monte um mata-mata ou uma fase de grupos completa. Registre placares,
            simule resultados e exporte a chave pronta para compartilhar.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/create"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar torneio
            </Link>
            {list.length > 0 && (
              <a
                href="#meus-torneios"
                className="rounded-md border border-border bg-surface px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
              >
                Ver meus torneios
              </a>
            )}
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-3">
          <Detail
            label="Formatos"
            text="Mata-mata de 4 a 64 times, ida e volta, ou fase de grupos com classificação."
          />
          <Detail
            label="Placares"
            text="Pênaltis, prorrogação, agregado e classificação calculados automaticamente."
          />
          <Detail
            label="Exportação"
            text="Baixe a chave em PNG, sem botões nem interface, pronta para compartilhar."
          />
        </section>

        {list.length > 0 && (
          <section id="meus-torneios" className="mt-16">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-medium text-foreground">
                Seus torneios
              </h2>
              <span className="text-[12px] text-muted-foreground">
                {list.length} {list.length === 1 ? "torneio" : "torneios"}
              </span>
            </div>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {list.map((t) => {
                const final = t.matches[t.matches.length - 1];
                const champ =
                  final?.winner === "home"
                    ? final.home
                    : final?.winner === "away"
                      ? final.away
                      : null;
                return (
                  <li key={t.id} className="group relative">
                    <Link
                      to="/bracket/$id"
                      params={{ id: t.id }}
                      className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-[17px] font-medium text-foreground">
                          {t.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">
                          {t.size} times ·{" "}
                          {new Date(t.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {champ ? (
                          <span className="hidden text-[12px] text-foreground sm:inline">
                            <span className="text-muted-foreground">Campeão · </span>
                            <span className="font-medium">{champ}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Em aberto
                          </span>
                        )}
                        <span
                          aria-hidden
                          className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        deleteOne(t.id);
                        setList(loadAll());
                      }}
                      className="absolute right-8 top-1/2 hidden -translate-y-1/2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive group-hover:block"
                    >
                      Excluir
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}
