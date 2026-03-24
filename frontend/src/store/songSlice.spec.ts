import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import songReducer, {
  fetchFilterOptions, fetchFilteredSongs, deleteSong, setSongFilter,
  fetchLikedSongs, likeSong, unlikeSong, updateSong,
} from './songSlice';
import playerReducer from './playerSlice';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

function createStore(preloadedState?: any, playerState?: any) {
  return configureStore({
    reducer: { songs: songReducer, player: playerReducer },
    preloadedState: {
      songs: preloadedState ?? defaultState,
      player: playerState ?? defaultPlayerState,
    },
  });
}

const defaultPlayerState = {
  currentTrack: null,
  queue: [],
  repeat: 'off' as const,
  shuffle: false,
  playlists: [],
  selectedPlaylistId: null,
  selectedPlaylist: null,
};

const defaultState = {
  filterOptions: { artist: [], genre: [] },
  filter: { type: 'all', value: '' },
  songs: [],
  likedSongIds: [],
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
      (api.get as any).mockResolvedValue({ data: [] });

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

    it('should refetch selected playlist after deleting a song', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: { id: 'pl-1', playlistSongs: [] } });

      const store = createStore(
        { ...defaultState, songs: [{ id: 's1', title: 'Song 1' }] },
        { ...defaultPlayerState, selectedPlaylistId: 'pl-1' },
      );

      await store.dispatch(deleteSong('s1'));

      expect(api.get).toHaveBeenCalledWith('/playlists/pl-1');
    });

    it('should refetch filter options after deleting a song', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({
        ...defaultState,
        songs: [{ id: 's1', title: 'Song 1' }],
      });

      await store.dispatch(deleteSong('s1'));

      expect(api.get).toHaveBeenCalledWith('songs/artists');
      expect(api.get).toHaveBeenCalledWith('songs/genres');
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

  describe('fetchLikedSongs thunk', () => {
    it('should populate likedSongIds on success', async () => {
      const likedSongs = [{ id: 's1', title: 'Song 1' }, { id: 's3', title: 'Song 3' }];
      (api.get as any).mockResolvedValue({ data: likedSongs });

      const store = createStore(defaultState);
      await store.dispatch(fetchLikedSongs());

      expect(api.get).toHaveBeenCalledWith('/songs/liked');
      expect(store.getState().songs.likedSongIds).toEqual(['s1', 's3']);
    });
  });

  describe('likeSong thunk', () => {
    it('should add song id to likedSongIds on success', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Song liked' } });

      const store = createStore(defaultState);
      await store.dispatch(likeSong('s1'));

      expect(api.post).toHaveBeenCalledWith('/songs/s1/like');
      expect(store.getState().songs.likedSongIds).toContain('s1');
    });

    it('should not duplicate likedSongIds', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Already liked' } });

      const store = createStore({ ...defaultState, likedSongIds: ['s1'] });
      await store.dispatch(likeSong('s1'));

      expect(store.getState().songs.likedSongIds).toEqual(['s1']);
    });

    it('should not add on failure', async () => {
      (api.post as any).mockRejectedValue({ response: { data: { message: 'Not found' } } });

      const store = createStore(defaultState);
      await store.dispatch(likeSong('s1'));

      expect(store.getState().songs.likedSongIds).toEqual([]);
    });
  });

  describe('unlikeSong thunk', () => {
    it('should remove song id from likedSongIds on success', async () => {
      (api.delete as any).mockResolvedValue({ data: { message: 'Song unliked' } });

      const store = createStore({ ...defaultState, likedSongIds: ['s1', 's2'] });
      await store.dispatch(unlikeSong('s1'));

      expect(api.delete).toHaveBeenCalledWith('/songs/s1/like');
      expect(store.getState().songs.likedSongIds).toEqual(['s2']);
    });

    it('should not modify state on failure', async () => {
      (api.delete as any).mockRejectedValue({ response: { data: { message: 'Error' } } });

      const store = createStore({ ...defaultState, likedSongIds: ['s1'] });
      await store.dispatch(unlikeSong('s1'));

      expect(store.getState().songs.likedSongIds).toEqual(['s1']);
    });
  });

  describe('updateSong thunk', () => {
    it('should update song in state on success', async () => {
      const updatedSong = { id: 's1', title: 'New Title', artist: 'New Artist' };
      (api.put as any).mockResolvedValue({ data: updatedSong });
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({
        ...defaultState,
        songs: [
          { id: 's1', title: 'Old Title', artist: 'Old Artist' },
          { id: 's2', title: 'Song 2', artist: 'Artist 2' },
        ],
      });

      await store.dispatch(updateSong({ songId: 's1', data: { title: 'New Title', artist: 'New Artist' } }));

      expect(api.put).toHaveBeenCalledWith('/songs/s1', { title: 'New Title', artist: 'New Artist' });
      expect(store.getState().songs.songs[0]).toEqual(updatedSong);
      expect(store.getState().songs.songs[1]).toEqual({ id: 's2', title: 'Song 2', artist: 'Artist 2' });
    });

    it('should refetch selected playlist after updating a song', async () => {
      const updatedSong = { id: 's1', title: 'New Title', artist: 'A' };
      (api.put as any).mockResolvedValue({ data: updatedSong });
      (api.get as any).mockResolvedValue({ data: { id: 'pl-1', playlistSongs: [] } });

      const store = createStore(
        { ...defaultState, songs: [{ id: 's1', title: 'Old', artist: 'A' }] },
        { ...defaultPlayerState, selectedPlaylistId: 'pl-1' },
      );

      await store.dispatch(updateSong({ songId: 's1', data: { title: 'New Title' } }));

      expect(api.get).toHaveBeenCalledWith('/playlists/pl-1');
    });

    it('should refetch artist filter options after updating a song', async () => {
      const updatedSong = { id: 's1', title: 'Song', artist: 'New Artist' };
      (api.put as any).mockResolvedValue({ data: updatedSong });
      (api.get as any).mockResolvedValue({ data: ['New Artist'] });

      const store = createStore({
        ...defaultState,
        songs: [{ id: 's1', title: 'Song', artist: 'Old Artist' }],
      });

      await store.dispatch(updateSong({ songId: 's1', data: { artist: 'New Artist' } }));

      expect(api.get).toHaveBeenCalledWith('songs/artists');
    });

    it('should not modify state on failure', async () => {
      (api.put as any).mockRejectedValue({ response: { data: { message: 'Unauthorized' } } });

      const store = createStore({
        ...defaultState,
        songs: [{ id: 's1', title: 'Song 1' }],
      });

      await store.dispatch(updateSong({ songId: 's1', data: { title: 'New' } }));

      expect(store.getState().songs.songs[0].title).toBe('Song 1');
    });
  });
});
