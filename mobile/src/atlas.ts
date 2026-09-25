import { countries } from './data/countries';

export interface FlagAtlasEntry {
  seen: number;
  correct: number;
  wrong: number;
}

export interface FlagAtlas {
  flags: Record<string, FlagAtlasEntry>;
}

export type AtlasCellState = 'unseen' | 'seen' | 'discovered';

const knownCodes = new Set(countries.map((country) => country.code));

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;

export const parseFlagAtlas = (payload: unknown): FlagAtlas => {
  const raw = payload && typeof payload === 'object' && 'flags' in payload
    ? (payload as { flags: unknown }).flags
    : null;
  if (!raw || typeof raw !== 'object') return { flags: {} };
  const flags: Record<string, FlagAtlasEntry> = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalized = code.toLowerCase();
    if (!knownCodes.has(normalized) || !value || typeof value !== 'object') continue;
    const entry = value as Record<string, unknown>;
    const seen = count(entry.seen);
    const correct = Math.min(seen, count(entry.correct));
    const wrong = Math.min(Math.max(0, seen - correct), count(entry.wrong));
    if (seen === 0) continue;
    flags[normalized] = { seen, correct, wrong };
  }
  return { flags };
};

export const atlasCellState = (entry: FlagAtlasEntry | undefined): AtlasCellState => {
  if (!entry || entry.correct < 1 && entry.seen < 1) return 'unseen';
  return entry.correct >= 1 ? 'discovered' : 'seen';
};

/** Sin sesión no hay atlas oficial, aunque haya una respuesta vieja en memoria. */
export const visibleAtlas = (signedIn: boolean, atlas: FlagAtlas | null): FlagAtlas =>
  signedIn && atlas ? atlas : { flags: {} };
