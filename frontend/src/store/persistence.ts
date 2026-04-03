import type { PlayerState } from './types';

const STORAGE_KEY = 'jkx-player';
const PERSIST_KEYS: (keyof PlayerState)[] = [
  'currentTrack',
  'queue',
  'shuffle',
  'repeat',
  'showQueue',
];

export function loadPlayerState(): Partial<PlayerState> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as Partial<PlayerState>;
  } catch {
    return undefined;
  }
}

export function savePlayerState(state: PlayerState): void {
  try {
    const slice = Object.fromEntries(PERSIST_KEYS.map((k) => [k, state[k]]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}
