// Tournament types and logic

export type LegResult = {
  homeScore: number;
  awayScore: number;
};

export type Match = {
  id: string;
  round: number; // 0 = first round
  slot: number; // position within the round
  home: string | null;
  away: string | null;
  // For two-legged: leg1 = home is "home", leg2 = away is "home"
  legs: LegResult[]; // 0, 1 or 2 entries
  twoLegged: boolean;
  // Decision (extra time + penalties or just penalties)
  penalties?: { home: number; away: number } | null;
  hadExtraTime?: boolean;
  winner: "home" | "away" | null;
};

export type Tournament = {
  id: string;
  name: string;
  size: 4 | 8 | 16 | 32 | 64;
  teams: string[]; // length === size
  matches: Match[];
  createdAt: number;
};

export const SAMPLE_TEAMS = [
  "Liverpool",
  "PSG",
  "Bayern München",
  "Barcelona",
  "Inter de Milão",
  "Manchester City",
  "Real Madrid",
  "Chelsea",
  "Arsenal",
  "Napoli",
  "Atlético de Madrid",
  "Aston Villa",
  "Benfica",
  "Milan",
  "Fiorentina",
  "Bayer Leverkusen",
  "Borussia Dortmund",
  "Juventus",
  "Tottenham",
  "Manchester United",
  "Roma",
  "Lazio",
  "Sevilla",
  "Villarreal",
  "Porto",
  "Sporting CP",
  "Ajax",
  "PSV",
  "Feyenoord",
  "Marseille",
  "Lyon",
  "Monaco",
  "Atalanta",
  "Newcastle",
  "Brighton",
  "West Ham",
  "Eintracht Frankfurt",
  "RB Leipzig",
  "Real Sociedad",
  "Real Betis",
  "Galatasaray",
  "Fenerbahçe",
  "Shakhtar",
  "Celtic",
  "Rangers",
  "Salzburg",
  "Club Brugge",
  "Olympiacos",
  "Flamengo",
  "Palmeiras",
  "Boca Juniors",
  "River Plate",
  "Botafogo",
  "Fluminense",
  "Santos",
  "São Paulo",
  "Corinthians",
  "Grêmio",
  "Internacional",
  "Atlético Mineiro",
  "Cruzeiro",
  "Vasco",
  "Bahia",
  "Athletico-PR",
];

export function roundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semifinal";
  if (remaining === 3) return "Quartas";
  if (remaining === 4) return "Oitavas";
  if (remaining === 5) return "16-avos";
  return `Rodada ${round + 1}`;
}

export function totalRoundsFor(size: number): number {
  return Math.log2(size);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createTournament(
  name: string,
  size: 4 | 8 | 16 | 32 | 64,
  teams: string[],
  twoLeggedFromRound: number | null = null
): Tournament {
  const totalRounds = totalRoundsFor(size);
  const matches: Match[] = [];
  for (let r = 0; r < totalRounds; r++) {
    const count = size / Math.pow(2, r + 1);
    for (let s = 0; s < count; s++) {
      matches.push({
        id: `${r}-${s}`,
        round: r,
        slot: s,
        home: null,
        away: null,
        legs: [],
        twoLegged: twoLeggedFromRound !== null && r >= twoLeggedFromRound && r < totalRounds - 1,
        penalties: null,
        hadExtraTime: false,
        winner: null,
      });
    }
  }
  // Seed first round
  for (let i = 0; i < size / 2; i++) {
    matches[i].home = teams[i * 2];
    matches[i].away = teams[i * 2 + 1];
  }
  return {
    id: uid(),
    name,
    size,
    teams,
    matches,
    createdAt: Date.now(),
  };
}

export function computeWinner(m: Match): "home" | "away" | null {
  if (!m.home || !m.away || m.legs.length === 0) return null;
  if (!m.twoLegged) {
    const leg = m.legs[0];
    if (leg.homeScore > leg.awayScore) return "home";
    if (leg.awayScore > leg.homeScore) return "away";
    // Tied -> needs penalties
    if (m.penalties) {
      return m.penalties.home > m.penalties.away ? "home" : "away";
    }
    return null;
  }
  if (m.legs.length < 2) return null;
  const homeAgg = m.legs[0].homeScore + m.legs[1].awayScore;
  const awayAgg = m.legs[0].awayScore + m.legs[1].homeScore;
  if (homeAgg > awayAgg) return "home";
  if (awayAgg > homeAgg) return "away";
  if (m.penalties) {
    return m.penalties.home > m.penalties.away ? "home" : "away";
  }
  return null;
}

export function aggregateScore(m: Match): { home: number; away: number } | null {
  if (m.legs.length === 0) return null;
  if (!m.twoLegged) {
    return { home: m.legs[0].homeScore, away: m.legs[0].awayScore };
  }
  if (m.legs.length < 2) {
    return { home: m.legs[0].homeScore, away: m.legs[0].awayScore };
  }
  return {
    home: m.legs[0].homeScore + m.legs[1].awayScore,
    away: m.legs[0].awayScore + m.legs[1].homeScore,
  };
}

// Propagate winners through the bracket
export function propagate(t: Tournament): Tournament {
  const matches = t.matches.map((m) => ({ ...m, legs: m.legs.map((l) => ({ ...l })) }));
  const totalRounds = totalRoundsFor(t.size);
  for (let r = 0; r < totalRounds - 1; r++) {
    const inRound = matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot);
    const nextRound = matches.filter((m) => m.round === r + 1).sort((a, b) => a.slot - b.slot);
    for (let i = 0; i < nextRound.length; i++) {
      const a = inRound[i * 2];
      const b = inRound[i * 2 + 1];
      const wA = computeWinner(a);
      const wB = computeWinner(b);
      const next = nextRound[i];
      const newHome = wA ? (wA === "home" ? a.home : a.away) : null;
      const newAway = wB ? (wB === "home" ? b.home : b.away) : null;
      // Reset downstream if changed
      if (next.home !== newHome || next.away !== newAway) {
        next.home = newHome;
        next.away = newAway;
        next.legs = [];
        next.penalties = null;
        next.hadExtraTime = false;
        next.winner = null;
      }
    }
  }
  matches.forEach((m) => {
    m.winner = computeWinner(m);
  });
  return { ...t, matches };
}

// Simulate a random score
function randScore() {
  // skew to 0-3
  const r = Math.random();
  if (r < 0.25) return 0;
  if (r < 0.55) return 1;
  if (r < 0.8) return 2;
  if (r < 0.93) return 3;
  return 4;
}

export function simulateMatch(m: Match): Match {
  if (!m.home || !m.away) return m;
  const out: Match = { ...m, legs: [], penalties: null, hadExtraTime: false };
  if (!m.twoLegged) {
    let h = randScore();
    let a = randScore();
    out.legs = [{ homeScore: h, awayScore: a }];
    if (h === a) {
      // Coin flip penalties
      out.hadExtraTime = false;
      const ph = 3 + Math.floor(Math.random() * 3);
      let pa = 3 + Math.floor(Math.random() * 3);
      if (pa === ph) pa = ph - 1 >= 0 ? ph - 1 : ph + 1;
      out.penalties = { home: ph, away: pa };
    }
  } else {
    const l1 = { homeScore: randScore(), awayScore: randScore() };
    const l2 = { homeScore: randScore(), awayScore: randScore() };
    out.legs = [l1, l2];
    const aggH = l1.homeScore + l2.awayScore;
    const aggA = l1.awayScore + l2.homeScore;
    if (aggH === aggA) {
      out.hadExtraTime = true;
      // penalties decide
      const ph = 3 + Math.floor(Math.random() * 3);
      let pa = 3 + Math.floor(Math.random() * 3);
      if (pa === ph) pa = ph - 1 >= 0 ? ph - 1 : ph + 1;
      out.penalties = { home: ph, away: pa };
    }
  }
  out.winner = computeWinner(out);
  return out;
}

export function simulateAll(t: Tournament): Tournament {
  let curr: Tournament = { ...t, matches: t.matches.map((m) => ({ ...m })) };
  const totalRounds = totalRoundsFor(t.size);
  for (let r = 0; r < totalRounds; r++) {
    curr = {
      ...curr,
      matches: curr.matches.map((m) => {
        if (m.round !== r) return m;
        if (!m.home || !m.away) return m;
        if (m.winner) return m;
        return simulateMatch(m);
      }),
    };
    curr = propagate(curr);
  }
  return curr;
}

// localStorage
const KEY = "brocket:tournaments";
export function loadAll(): Tournament[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
export function saveAll(list: Tournament[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}
export function saveOne(t: Tournament) {
  const list = loadAll();
  const i = list.findIndex((x) => x.id === t.id);
  if (i >= 0) list[i] = t;
  else list.unshift(t);
  saveAll(list);
}
export function loadOne(id: string): Tournament | null {
  return loadAll().find((t) => t.id === id) ?? null;
}
export function deleteOne(id: string) {
  saveAll(loadAll().filter((t) => t.id !== id));
}
