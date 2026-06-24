// Global crest store: maps team display names to logo URLs.
// Lets any <TeamCrest /> render official crests once they're imported.

const STORAGE_KEY = "brocket:crests:v1";

type CrestMap = Record<string, string>;

let state: CrestMap = load();
const listeners = new Set<() => void>();

function load(): CrestMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as CrestMap) : {};
  } catch {
    return {};
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  for (const l of listeners) l();
}

export function getCrest(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return state[name] ?? state[name.trim()];
}

export function setCrests(entries: Record<string, string>) {
  state = { ...state, ...entries };
  persist();
  emit();
}

export function subscribeCrests(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCrestSnapshot(): CrestMap {
  return state;
}
