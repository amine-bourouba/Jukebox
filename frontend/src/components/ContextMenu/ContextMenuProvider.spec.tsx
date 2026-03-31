import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../store/playerSlice';
import songReducer from '../../store/songSlice';
import artistReducer from '../../store/artistSlice';
import { ContextMenuProvider, useContextMenu as useContextMenuFromProvider } from './ContextMenuProvider';

// Mock api
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../services/snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

const mockShareSongLink = vi.fn();
const mockSharePlaylistLink = vi.fn();
vi.mock('../../services/share', () => ({
  shareSongLink: (...args: any[]) => mockShareSongLink(...args),
  sharePlaylistLink: (...args: any[]) => mockSharePlaylistLink(...args),
}));

const mockShowEditSong = vi.fn();
vi.mock('../EditSongModal', () => ({
  useEditSong: () => ({ showEditSong: mockShowEditSong }),
  EditSongModalProvider: ({ children }: any) => children,
}));

const mockShowCreatePlaylist = vi.fn();
const mockShowEditPlaylist = vi.fn();
vi.mock('../PlaylistModal', () => ({
  usePlaylistModal: () => ({ showCreatePlaylist: mockShowCreatePlaylist, showEditPlaylist: mockShowEditPlaylist }),
}));

function createStore(playlists: any[] = [], likedSongIds: string[] = [], artists: any[] = []) {
  return configureStore({
    reducer: { player: playerReducer, songs: songReducer, artists: artistReducer },
    preloadedState: {
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off',
        shuffle: false,
        playlists,
        selectedPlaylistId: null,
        selectedPlaylist: null,
      },
      songs: {
        filterOptions: { artist: [], genre: [] },
        filter: { type: 'all', value: '' },
        songs: [],
        likedSongIds,
      },
      artists: {
        artists,
        selectedArtistId: null,
        followedArtistIds: [],
        loading: false,
      },
    },
  });
}

function createWrapper(playlists: any[] = [], likedSongIds: string[] = [], artists: any[] = []) {
  const store = createStore(playlists, likedSongIds, artists);
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ContextMenuProvider>{children}</ContextMenuProvider>
    </Provider>
  );
}

describe('ContextMenuProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide context values', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toBeDefined();
    expect(result.current.showMenu).toBeInstanceOf(Function);
    expect(result.current.hideMenu).toBeInstanceOf(Function);
    expect(result.current.showSubmenu).toBeInstanceOf(Function);
    expect(result.current.hideSubmenu).toBeInstanceOf(Function);
    expect(result.current.hideAllSubmenus).toBeInstanceOf(Function);
    expect(result.current.getMenuItems).toBeInstanceOf(Function);
  });

  it('should start with menu closed', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.config).toBeNull();
  });

  it('should open menu via showMenu', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.showMenu(100, 200, {
        trigger: 'rightclick',
        items: [{ id: 'test', label: 'Test Item' }],
      });
    });

    expect(result.current.state.isOpen).toBe(true);
    expect(result.current.state.position).toEqual({ x: 100, y: 200 });
    expect(result.current.state.config!.items).toHaveLength(1);
  });

  it('should close menu via hideMenu', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.showMenu(100, 200, {
        trigger: 'rightclick',
        items: [{ id: 'test', label: 'Test' }],
      });
    });

    expect(result.current.state.isOpen).toBe(true);

    act(() => {
      result.current.hideMenu();
    });

    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.config).toBeNull();
  });

  it('should manage submenu states', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.showMenu(100, 200, {
        trigger: 'rightclick',
        items: [{ id: 'parent', label: 'Parent', submenu: [{ id: 'child', label: 'Child' }] }],
      });
    });

    act(() => {
      result.current.showSubmenu('parent', 250, 210);
    });

    expect(result.current.state.submenuStates['parent']).toEqual({
      isOpen: true,
      position: { x: 250, y: 210 },
    });

    act(() => {
      result.current.hideSubmenu('parent');
    });

    expect(result.current.state.submenuStates['parent']).toBeUndefined();
  });

  it('should hide all submenus', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.showMenu(0, 0, {
        trigger: 'rightclick',
        items: [{ id: 'a', label: 'A' }],
      });
      result.current.showSubmenu('a', 10, 10);
      result.current.showSubmenu('b', 20, 20);
    });

    act(() => {
      result.current.hideAllSubmenus();
    });

    expect(Object.keys(result.current.state.submenuStates)).toHaveLength(0);
  });

  it('should return playlist-song menu items', () => {
    const playlists = [{ id: 'p1', title: 'My Playlist' }];
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(playlists),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Test Song' },
    });

    expect(items.length).toBeGreaterThan(0);
    const ids = items.map((i: any) => i.id);
    expect(ids).toContain('queue');
    expect(ids).toContain('playlist');
    expect(ids).toContain('remove');
    expect(ids).toContain('download');
    expect(ids).toContain('delete');
  });

  it('should return sidebar-playlist menu items', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('sidebar-playlist', { title: 'Faves' });
    const ids = items.map((i: any) => i.id);
    expect(ids).toContain('play');
    expect(ids).toContain('edit');
    expect(ids).toContain('delete');
  });

  it('should return empty array for unknown trigger type', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('unknown', {});
    expect(items).toEqual([]);
  });

  it('should throw if useContextMenu called outside provider', () => {
    expect(() => {
      renderHook(() => useContextMenuFromProvider());
    }).toThrow('useContextMenu must be used within a ContextMenuProvider');
  });

  it('addToQueue menu item should dispatch addToQueue', () => {
    const playlists = [{ id: 'p1', title: 'My Playlist' }];
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(playlists),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Test Song', artist: 'Artist', streamUrl: '/s' },
    });

    const queueItem = items.find((i: any) => i.id === 'queue');
    expect(queueItem).toBeDefined();
    expect(queueItem!.onClick).toBeInstanceOf(Function);
  });

  it('playPlaylist menu item should dispatch playPlaylist thunk', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('sidebar-playlist', { id: 'p1', title: 'Test' });
    const playItem = items.find((i: any) => i.id === 'play');

    expect(playItem).toBeDefined();
    expect(playItem!.onClick).toBeInstanceOf(Function);
  });

  it('share song menu item should call shareSongLink', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Test Song' },
    });

    const shareItem = items.find((i: any) => i.id === 'share');
    act(() => {
      shareItem!.onClick!();
    });

    expect(mockShareSongLink).toHaveBeenCalledWith('s1');
  });

  it('share playlist menu item should call sharePlaylistLink', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('sidebar-playlist', { id: 'p1', title: 'Test' });
    const shareItem = items.find((i: any) => i.id === 'share');
    act(() => {
      shareItem!.onClick!();
    });

    expect(mockSharePlaylistLink).toHaveBeenCalledWith('p1');
  });

  it('should show "Like Song" for unliked songs', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper([], []),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Song' },
    });

    const likeItem = items.find((i: any) => i.id === 'like');
    expect(likeItem).toBeDefined();
    expect(likeItem!.label).toBe('Like Song');
  });

  it('should show "Unlike Song" for liked songs', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper([], ['s1']),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Song' },
    });

    const likeItem = items.find((i: any) => i.id === 'like');
    expect(likeItem).toBeDefined();
    expect(likeItem!.label).toBe('Unlike Song');
  });

  it('edit details menu item should call showEditSong', () => {
    const song = { id: 's1', title: 'Test Song', artist: 'Artist' };
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('playlist-song', { song });
    const editItem = items.find((i: any) => i.id === 'edit');
    act(() => {
      editItem!.onClick!();
    });

    expect(mockShowEditSong).toHaveBeenCalledWith(song);
  });

  it('delete playlist menu item should exist in sidebar-playlist menu', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('sidebar-playlist', { id: 'p1', title: 'Test' });
    const deleteItem = items.find((i: any) => i.id === 'delete');
    expect(deleteItem).toBeDefined();
    expect(deleteItem!.label).toBe('Delete Playlist');
    expect(deleteItem!.onClick).toBeInstanceOf(Function);
  });

  it('playlist-song menu should include like item', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Test' },
    });

    const ids = items.map((i: any) => i.id);
    expect(ids).toContain('like');
  });

  // ── Go to artist ──────────────────────────────────────────────────────────────

  it('playlist-song: includes go-to-artist when artist matches', () => {
    const artists = [{ id: 'a1', name: 'Led Zeppelin', _count: { songs: 0, followers: 0 } }];
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper([], [], artists),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
    });

    const ids = items.map((i: any) => i.id);
    expect(ids).toContain('go-to-artist');
  });

  it('playlist-song: omits go-to-artist when no matching artist', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Song', artist: 'Unknown Artist' },
    });

    const ids = items.map((i: any) => i.id);
    expect(ids).not.toContain('go-to-artist');
  });

  it('playlist-song: go-to-artist uses case-insensitive artist match', () => {
    const artists = [{ id: 'a1', name: 'The Beatles', _count: { songs: 0, followers: 0 } }];
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper([], [], artists),
    });

    const items = result.current.getMenuItems('playlist-song', {
      song: { id: 's1', title: 'Hey Jude', artist: 'the beatles' },
    });

    const ids = items.map((i: any) => i.id);
    expect(ids).toContain('go-to-artist');
  });

  it('now-playing: includes go-to-artist when artist matches', () => {
    const artists = [{ id: 'a1', name: 'Queen', _count: { songs: 0, followers: 0 } }];
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper([], [], artists),
    });

    const items = result.current.getMenuItems('now-playing', {
      song: { id: 's1', title: 'Bohemian Rhapsody', artist: 'Queen' },
    });

    const ids = items.map((i: any) => i.id);
    expect(ids).toContain('go-to-artist');
  });

  it('now-playing: omits go-to-artist when no matching artist', () => {
    const { result } = renderHook(() => useContextMenuFromProvider(), {
      wrapper: createWrapper(),
    });

    const items = result.current.getMenuItems('now-playing', {
      song: { id: 's1', title: 'Song', artist: 'Unknown' },
    });

    const ids = items.map((i: any) => i.id);
    expect(ids).not.toContain('go-to-artist');
  });

  it('now-playing: go-to-artist onClick dispatches setSelectedArtistId and setSongFilter', () => {
    const artists = [{ id: 'a1', name: 'Pink Floyd', _count: { songs: 0, followers: 0 } }];
    const store = createStore([], [], artists);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ContextMenuProvider>{children}</ContextMenuProvider>
      </Provider>
    );
    const { result } = renderHook(() => useContextMenuFromProvider(), { wrapper });

    const items = result.current.getMenuItems('now-playing', {
      song: { id: 's1', title: 'Comfortably Numb', artist: 'Pink Floyd' },
    });

    const goToArtist = items.find((i: any) => i.id === 'go-to-artist');
    act(() => {
      goToArtist!.onClick!();
    });

    expect(store.getState().artists.selectedArtistId).toBe('a1');
    expect(store.getState().songs.filter).toEqual({ type: 'artist', value: 'Pink Floyd' });
  });
});
