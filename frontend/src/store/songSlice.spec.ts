import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import songReducer, {
  fetchFilterOptions, fetchFilteredSongs, deleteSong, setSongFilter,
} from './songSlice';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

function createStore(preloadedState?: any) {
  return configureStore({
    reducer: { songs: songReducer },
    preloadedState: preloadedState ? { songs: preloadedState } : undefined,
  });
}

const defaultState = {
  filterOptions: { artist: [], genre: [] },
  filter: { type: 'all', value: '' },
  songs: [],
};

describe('songSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('setSongFilter should update the filter', () => {
      const store = createStore(defaultState);

      store.dispatch(setSongFilter({ type: 'artist', value: 'Drake' }));

      expect(store.getState().songs.filter).toEqual({ type: 'artist', value: 'Drake' });
    });
  });

  describe('fetchFilterOptions thunk', () => {
    it('should set artist filter options on success', async () => {
      const artists = ['Artist A', 'Artist B'];
      (api.get as any).mockResolvedValue({ data: artists });

      const store = createStore(defaultState);
      await store.dispatch(fetchFilterOptions('artist'));

      expect(api.get).toHaveBeenCalledWith('songs/artists');
      expect(store.getState().songs.filterOptions.artist).toEqual(artists);
    });

    it('should set genre filter options on success', async () => {
      const genres = ['Pop', 'Rock'];
      (api.get as any).mockResolvedValue({ data: genres });

      const store = createStore(defaultState);
      await store.dispatch(fetchFilterOptions('genre'));

      expect(api.get).toHaveBeenCalledWith('songs/genres');
      expect(store.getState().songs.filterOptions.genre).toEqual(genres);
    });
  });

  describe('fetchFilteredSongs thunk', () => {
    it('should fetch all songs when type is "all"', async () => {
      const songs = [{ id: 's2', title: 'B' }, { id: 's1', title: 'A' }];
      (api.get as any).mockResolvedValue({ data: songs });

      const store = createStore(defaultState);
      await store.dispatch(fetchFilteredSongs({ type: 'all', value: '' }));

      expect(api.get).toHaveBeenCalledWith('songs');
      // Songs should be sorted by title
      expect(store.getState().songs.songs[0].title).toBe('A');
      expect(store.getState().songs.songs[1].title).toBe('B');
    });

    it('should fetch filtered songs with query params', async () => {
      const songs = [{ id: 's1', title: 'Pop Song' }];
      (api.get as any).mockResolvedValue({ data: songs });

      const store = createStore(defaultState);
      await store.dispatch(fetchFilteredSongs({ type: 'genre', value: 'Pop' }));

      expect(api.get).toHaveBeenCalledWith('songs?genre=Pop');
      expect(store.getState().songs.songs).toEqual(songs);
    });
  });

  describe('deleteSong thunk', () => {
    it('should remove the song from state on success', async () => {
      (api.delete as any).mockResolvedValue({});

      const store = createStore({
        ...defaultState,
        songs: [
          { id: 's1', title: 'Song 1' },
          { id: 's2', title: 'Song 2' },
        ],
      });

      await store.dispatch(deleteSong('s1'));

      expect(api.delete).toHaveBeenCalledWith('/songs/s1');
      expect(store.getState().songs.songs).toEqual([{ id: 's2', title: 'Song 2' }]);
    });

    it('should not remove songs on failure', async () => {
      (api.delete as any).mockRejectedValue({ response: { data: { message: 'Unauthorized' } } });

      const store = createStore({
        ...defaultState,
        songs: [{ id: 's1', title: 'Song 1' }],
      });

      await store.dispatch(deleteSong('s1'));

      expect(store.getState().songs.songs).toEqual([{ id: 's1', title: 'Song 1' }]);
    });
  });
});
