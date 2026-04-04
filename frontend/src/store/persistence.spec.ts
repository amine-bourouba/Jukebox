import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPlayerState, savePlayerState } from './persistence';
import type { PlayerState } from './types';

const makeState = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  currentTrack: null,
  queue: [],
  repeat: 'off',
  shuffle: false,
  showQueue: true,
  playlists: [],
  selectedPlaylistId: null,
  selectedPlaylist: null,
  ...overrides,
});

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadPlayerState', () => {
    it('returns undefined when nothing is stored', () => {
      expect(loadPlayerState()).toBeUndefined();
    });

    it('returns parsed state when valid JSON is stored', () => {
      const saved = { currentTrack: null, queue: [], shuffle: true, repeat: 'all', showQueue: false };
      localStorage.setItem('jkx-player', JSON.stringify(saved));
      expect(loadPlayerState()).toEqual(saved);
    });

    it('returns undefined on invalid JSON', () => {
      localStorage.setItem('jkx-player', 'not-json');
      expect(loadPlayerState()).toBeUndefined();
    });
  });

  describe('savePlayerState', () => {
    it('persists only the allowed keys', () => {
      savePlayerState(makeState({ shuffle: true, repeat: 'one' }));
      const raw = localStorage.getItem('jkx-player');
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveProperty('shuffle', true);
      expect(parsed).toHaveProperty('repeat', 'one');
      expect(parsed).not.toHaveProperty('playlists');
      expect(parsed).not.toHaveProperty('selectedPlaylistId');
      expect(parsed).not.toHaveProperty('selectedPlaylist');
    });

    it('persists currentTrack and queue', () => {
      const track = { id: 't1', title: 'Song', artist: 'Artist', coverUrl: '' };
      savePlayerState(makeState({ currentTrack: track as any, queue: [track as any] }));
      const parsed = JSON.parse(localStorage.getItem('jkx-player')!);
      expect(parsed.currentTrack).toEqual(track);
      expect(parsed.queue).toHaveLength(1);
    });

    it('silently ignores storage quota errors', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      expect(() => savePlayerState(makeState())).not.toThrow();
    });
  });
});
