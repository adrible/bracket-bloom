import { createServerFn } from "@tanstack/react-start";

export type ImportedTeam = {
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
};

export const COMPETITIONS = [
  { code: "CL", label: "UEFA Champions League" },
  { code: "PL", label: "Premier League (Inglaterra)" },
  { code: "PD", label: "La Liga (Espanha)" },
  { code: "BL1", label: "Bundesliga (Alemanha)" },
  { code: "SA", label: "Serie A (Itália)" },
  { code: "FL1", label: "Ligue 1 (França)" },
  { code: "BSA", label: "Brasileirão Série A" },
  { code: "PPL", label: "Primeira Liga (Portugal)" },
  { code: "DED", label: "Eredivisie (Holanda)" },
  { code: "WC", label: "Copa do Mundo (FIFA)" },
  { code: "EC", label: "Eurocopa (UEFA)" },
] as const;

export const fetchCompetitionTeams = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => {
    if (!input || typeof input.code !== "string" || input.code.length < 2 || input.code.length > 6) {
      throw new Error("Código de competição inválido");
    }
    return { code: input.code.toUpperCase() };
  })
  .handler(async ({ data }): Promise<{ teams: ImportedTeam[] }> => {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY não está configurada");

    const res = await fetch(`https://api.football-data.org/v4/competitions/${data.code}/teams`, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 403) {
        throw new Error("Competição indisponível no plano gratuito da football-data.org.");
      }
      if (res.status === 429) {
        throw new Error("Limite de requisições atingido. Aguarde 1 min e tente novamente.");
      }
      throw new Error(`Falha ao buscar times (${res.status}) ${text.slice(0, 120)}`);
    }

    const json = (await res.json()) as {
      teams?: Array<{
        name?: string;
        shortName?: string | null;
        tla?: string | null;
        crest?: string | null;
      }>;
    };

    const teams: ImportedTeam[] = (json.teams ?? [])
      .filter((t) => t && t.name)
      .map((t) => ({
        name: t.shortName || t.name!,
        shortName: t.shortName ?? null,
        tla: t.tla ?? null,
        crest: t.crest ?? null,
      }));

    return { teams };
  });
