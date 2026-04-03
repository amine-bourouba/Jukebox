import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import playerReducer, {
  setTrack, clearTrack, setQueue, addToQueue, setRepeat, setShuffle, setSelectedPlaylist,
  fetchPlaylists, fetchSelectedPlaylist, addSongToPlaylist, removeSongFromPlaylist, playPlaylist,
  deletePlaylist,
} from './playerSlice';
import songsReducer, { fetchFilteredSongs } from './songSlice';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

function createStore(preloadedState?: any) {
  return configureStore({
    reducer: { player: playerReducer },
    preloadedState: preloadedState ? { player: preloadedState } : undefined,
  });
}

const defaultState = {
  currentTrack: null,
  queue: [],
  repeat: 'off' as const,
  shuffle: false,
  playlists: [],
  selectedPlaylistId: null,
  selectedPlaylist: null,
};

describe('playerSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('setTrack should set currentTrack', () => {
      const store = createStore(defaultState);
      const track = { id: 't1', title: 'Song', artist: 'Artist', streamUrl: '/stream' };

      store.dispatch(setTrack(track));

      expect(store.getState().player.currentTrack).toEqual(track);
    });

    it('clearTrack should set currentTrack to null', () => {
      const store = createStore({
        ...defaultState,
        currentTrack: { id: 't1', title: 'Song', artist: 'A', streamUrl: '/s' },
      });

      store.dispatch(clearTrack());

      expect(store.getState().player.currentTrack).toBeNull();
    });

    it('setQueue should set the queue', () => {
      const store = createStore(defaultState);
      const queue = [
        { id: 't1', title: 'S1', artist: 'A', streamUrl: '/s1' },
        { id: 't2', title: 'S2', artist: 'B', streamUrl: '/s2' },
      ];

      store.dispatch(setQueue(queue));

      expect(store.getState().player.queue).toEqual(queue);
    });

    it('addToQueue should append a track to the queue', () => {
      const store = createStore({
        ...defaultState,
        queue: [{ id: 't1', title: 'S1', artist: 'A', streamUrl: '/s1' }],
      });
      const newTrack = { id: 't2', title: 'S2', artist: 'B', streamUrl: '/s2' };

      store.dispatch(addToQueue(newTrack));

      expect(store.getState().player.queue).toHaveLength(2);
      expect(store.getState().player.queue[1]).toEqual(newTrack);
    });

    it('addToQueue should allow duplicate tracks', () => {
      const track = { id: 't1', title: 'S1', artist: 'A', streamUrl: '/s1' };
      const store = createStore({ ...defaultState, queue: [track] });

      store.dispatch(addToQueue(track));

      expect(store.getState().player.queue).toHaveLength(2);
    });

    it('setRepeat should update repeat mode', () => {
      const store = createStore(defaultState);

      store.dispatch(setRepeat('one'));
      expect(store.getState().player.repeat).toBe('one');

      store.dispatch(setRepeat('all'));
      expect(store.getState().player.repeat).toBe('all');
    });

    it('setShuffle should toggle shuffle', () => {
      const store = createStore(defaultState);

      store.dispatch(setShuffle(true));
      expect(store.getState().player.shuffle).toBe(true);

      store.dispatch(setShuffle(false));
      expect(store.getState().player.shuffle).toBe(false);
    });

    it('setSelectedPlaylist should set selectedPlaylistId', () => {
      const store = createStore(defaultState);

      store.dispatch(setSelectedPlaylist('pl-1'));

      expect(store.getState().player.selectedPlaylistId).toBe('pl-1');
    });
  });

  describe('fetchPlaylists thunk', () => {
    it('should set playlists on success', async () => {
      const playlists = [{ id: 'pl-1', title: 'My Playlist' }];
      (api.get as any).mockResolvedValue({ data: playlists });

      const store = createStore(defaultState);
      await store.dispatch(fetchPlaylists());

      expect(api.get).toHaveBeenCalledWith('/playlists');
      expect(store.getState().player.playlists).toEqual(playlists);
    });
  });

  describe('fetchSelectedPlaylist thunk', () => {
    it('should set selectedPlaylist and id on success', async () => {
      const playlistData = { id: 'pl-1', title: 'Test', songs: [] };
      (api.get as any).mockResolvedValue({ data: playlistData });

      const store = createStore(defaultState);
      await store.dispatch(fetchSelectedPlaylist('pl-1'));

      expect(api.get).toHaveBeenCalledWith('/playlists/pl-1');
      const state = store.getState().player;
      expect(state.selectedPlaylistId).toBe('pl-1');
      expect(state.selectedPlaylist).toEqual(playlistData);
    });
  });

  describe('addSongToPlaylist thunk', () => {
    it('should call API, refresh playlist list, and re-fetch selected playlist when it matches', async () => {
      (api.post as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: { id: 'pl-1', songs: [] } });

      const store = createStore({ ...defaultState, selectedPlaylistId: 'pl-1' });
      await store.dispatch(addSongToPlaylist({ playlistId: 'pl-1', songId: 'song-1' }));

      expect(api.post).toHaveBeenCalledWith('/playlists/pl-1/songs', { songId: 'song-1' });
      expect(api.get).toHaveBeenCalledWith('/playlists');
      expect(api.get).toHaveBeenCalledWith('/playlists/pl-1');
    });

    it('should refresh playlist list but not re-fetch a different selected playlist', async () => {
      (api.post as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({ ...defaultState, selectedPlaylistId: 'pl-other' });
      await store.dispatch(addSongToPlaylist({ playlistId: 'pl-1', songId: 'song-1' }));

      expect(api.post).toHaveBeenCalledWith('/playlists/pl-1/songs', { songId: 'song-1' });
      expect(api.get).toHaveBeenCalledWith('/playlists');
      expect(api.get).not.toHaveBeenCalledWith('/playlists/pl-other');
    });
  });

  describe('removeSongFromPlaylist thunk', () => {
    it('should call API to remove song and refresh playlist list', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({ ...defaultState, selectedPlaylistId: 'pl-other' });
      await store.dispatch(removeSongFromPlaylist({ playlistId: 'pl-1', songId: 'song-1' }));

      expect(api.delete).toHaveBeenCalledWith('/playlists/pl-1/songs/song-1');
      expect(api.get).toHaveBeenCalledWith('/playlists');
    });

    it('should also re-fetch selected playlist when it matches', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: { id: 'pl-1', songs: [] } });

      const store = createStore({ ...defaultState, selectedPlaylistId: 'pl-1' });
      await store.dispatch(removeSongFromPlaylist({ playlistId: 'pl-1', songId: 'song-1' }));

      expect(api.get).toHaveBeenCalledWith('/playlists');
      expect(api.get).toHaveBeenCalledWith('/playlists/pl-1');
    });
  });

  describe('playPlaylist thunk', () => {
    it('should fetch playlist, set queue and play first song', async () => {
      const playlistSongs = [
        { song: { id: 's1', title: 'Song 1', artist: 'A', streamUrl: '/s1' } },
        { song: { id: 's2', title: 'Song 2', artist: 'B', streamUrl: '/s2' } },
      ];
      (api.get as any).mockResolvedValue({ data: { playlistSongs } });

      const store = createStore(defaultState);
      await store.dispatch(playPlaylist('pl-1'));

      expect(api.get).toHaveBeenCalledWith('/playlists/pl-1');
      const state = store.getState().player;
      expect(state.queue).toHaveLength(2);
      expect(state.currentTrack?.id).toBe('s1');
    });

    it('should show snackbar when playlist is empty', async () => {
      (api.get as any).mockResolvedValue({ data: { playlistSongs: [] } });
      const { snackbar } = await import('../services/snackbar');

      const store = createStore(defaultState);
      await store.dispatch(playPlaylist('pl-1'));

      expect(snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Playlist is empty' })
      );
      expect(store.getState().player.queue).toHaveLength(0);
    });
  });

  describe('stale track guard', () => {
    function createStoreWithGuard(initialPlayerState?: any) {
      const listener = createListenerMiddleware();
      listener.startListening({
        actionCreator: fetchFilteredSongs.fulfilled,
        effect: (action, listenerApi) => {
          const state = listenerApi.getState() as any;
          const { currentTrack } = state.player;
          const songs: any[] = action.payload ?? [];
          if (currentTrack && !songs.some((s: any) => s.id === currentTrack.id)) {
            listenerApi.dispatch(clearTrack());
          }
        },
      });
      return configureStore({
        reducer: { player: playerReducer, songs: songsReducer },
        preloadedState: initialPlayerState ? { player: initialPlayerState } : undefined,
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().prepend(listener.middleware),
      });
    }

    it('clears currentTrack when it is not in the fetched songs', async () => {
      const store = createStoreWithGuard({
        ...defaultState,
        currentTrack: { id: 'stale-id', title: 'Old Song', artist: 'A', streamUrl: '/s' },
      });

      store.dispatch(
        fetchFilteredSongs.fulfilled(
          [{ id: 'other-id', title: 'Other', artist: 'B' }],
          'req',
          { type: 'all', value: '' }
        )
      );
      await Promise.resolve();

      expect(store.getState().player.currentTrack).toBeNull();
    });

    it('keeps currentTrack when it is present in the fetched songs', async () => {
      const track = { id: 'live-id', title: 'Still Here', artist: 'A', streamUrl: '/s' };
      const store = createStoreWithGuard({ ...defaultState, currentTrack: track });

      store.dispatch(
        fetchFilteredSongs.fulfilled(
          [{ id: 'live-id', title: 'Still Here', artist: 'A' }],
          'req',
          { type: 'all', value: '' }
        )
      );
      await Promise.resolve();

      expect(store.getState().player.currentTrack).toEqual(track);
    });

    it('does nothing when there is no currentTrack', async () => {
      const store = createStoreWithGuard({ ...defaultState, currentTrack: null });

      store.dispatch(
        fetchFilteredSongs.fulfilled([], 'req', { type: 'all', value: '' })
      );
      await Promise.resolve();

      expect(store.getState().player.currentTrack).toBeNull();
    });
  });

  describe('deletePlaylist thunk', () => {
    it('should call API to delete and refresh playlists', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({ ...defaultState, selectedPlaylistId: 'pl-other' });
      await store.dispatch(deletePlaylist('pl-1'));

      expect(api.delete).toHaveBeenCalledWith('/playlists/pl-1');
      expect(api.get).toHaveBeenCalledWith('/playlists');
    });

    it('should clear selectedPlaylist when deleting the selected playlist', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({
        ...defaultState,
        selectedPlaylistId: 'pl-1',
        selectedPlaylist: { id: 'pl-1', songs: [] },
      });
      await store.dispatch(deletePlaylist('pl-1'));

      expect(store.getState().player.selectedPlaylistId).toBeNull();
      expect(store.getState().player.selectedPlaylist).toBeNull();
    });

    it('should not clear selectedPlaylist when deleting a different playlist', async () => {
      (api.delete as any).mockResolvedValue({});
      (api.get as any).mockResolvedValue({ data: [] });

      const store = createStore({
        ...defaultState,
        selectedPlaylistId: 'pl-2',
      });
      await store.dispatch(deletePlaylist('pl-1'));

      expect(store.getState().player.selectedPlaylistId).toBe('pl-2');
    });

    it('should not modify state on failure', async () => {
      (api.delete as any).mockRejectedValue({ response: { data: { message: 'Unauthorized' } } });

      const store = createStore({
        ...defaultState,
        selectedPlaylistId: 'pl-1',
      });
      await store.dispatch(deletePlaylist('pl-1'));

      expect(store.getState().player.selectedPlaylistId).toBe('pl-1');
    });
  });
});
