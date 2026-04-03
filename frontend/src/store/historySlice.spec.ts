import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import historyReducer, { fetchHistory, recordPlay } from './historySlice';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function createStore() {
  return configureStore({ reducer: { history: historyReducer } });
}

describe('historySlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchHistory', () => {
    it('should load history items on success', async () => {
      const items = [
        { id: 'h1', songId: 's1', playedAt: '2026-04-01T10:00:00Z', song: { id: 's1', title: 'Test', artist: 'A' } },
      ];
      (api.get as any).mockResolvedValue({ data: items });

      const store = createStore();
      await store.dispatch(fetchHistory());

      expect(api.get).toHaveBeenCalledWith('/analytics/history?take=10');
      expect(store.getState().history.items).toEqual(items);
      expect(store.getState().history.loading).toBe(false);
    });

    it('should set loading=true while fetching', () => {
      (api.get as any).mockReturnValue(new Promise(() => {})); // never resolves

      const store = createStore();
      store.dispatch(fetchHistory());

      expect(store.getState().history.loading).toBe(true);
    });

    it('should set loading=false on failure', async () => {
      (api.get as any).mockRejectedValue(new Error('Network error'));

      const store = createStore();
      await store.dispatch(fetchHistory());

      expect(store.getState().history.loading).toBe(false);
    });
  });

  describe('recordPlay', () => {
    it('should POST to /analytics/play with the songId', async () => {
      (api.post as any).mockResolvedValue({ data: { id: 'h1', songId: 's1', playedAt: '2026-04-01T10:00:00Z' } });

      const store = createStore();
      await store.dispatch(recordPlay('s1'));

      expect(api.post).toHaveBeenCalledWith('/analytics/play', { songId: 's1' });
    });
  });
});
