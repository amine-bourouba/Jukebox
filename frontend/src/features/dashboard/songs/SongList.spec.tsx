import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../../store/playerSlice';
import songsReducer from '../../../store/songSlice';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('./SongListItem', () => ({
  default: ({ playlistSong }: any) => (
    <tr data-testid={`song-${playlistSong.song.id}`}>
      <td>{playlistSong.song.title}</td>
    </tr>
  ),
}));

vi.mock('./ArtistView', () => ({
  default: () => <div data-testid="artist-view">ArtistView</div>,
}));

vi.mock('../../../components/ContextMenu/useContextMenu', () => ({
  useContextMenu: () => ({ showContextMenu: vi.fn(), showContextMenuAt: vi.fn() }),
}));

import SongList from './SongList';

function createStore(playerOverrides: any = {}, songsOverrides: any = {}) {
  return configureStore({
    reducer: { player: playerReducer, songs: songsReducer },
    preloadedState: {
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off',
        shuffle: false,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
        ...playerOverrides,
      },
      songs: {
        filterOptions: { artist: [] },
        filter: { type: 'all', value: '' },
        songs: [],
        likedSongIds: [],
        ...songsOverrides,
      },
    },
  });
}

describe('SongList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders All Songs view when no playlist is selected', () => {
    render(<Provider store={createStore()}><SongList /></Provider>);
    expect(screen.getByText('All Songs')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders playlist header when a playlist is selected', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: { id: 'p1', title: 'Chill Beats', playlistSongs: [] },
    });
    render(<Provider store={store}><SongList /></Provider>);
    expect(screen.getByText('Playlist')).toBeInTheDocument();
    expect(screen.getByText('Chill Beats')).toBeInTheDocument();
    expect(screen.getByText('0 songs')).toBeInTheDocument();
  });

  it('renders table headers in list view', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: { id: 'p1', title: 'Rock', playlistSongs: [] },
    });
    render(<Provider store={store}><SongList /></Provider>);
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Album')).toBeInTheDocument();
    expect(screen.getByText('Date Added')).toBeInTheDocument();
  });

  it('renders ArtistView when filter type is artist with a value', () => {
    const store = createStore({}, { filter: { type: 'artist', value: 'Queen' } });
    render(<Provider store={store}><SongList /></Provider>);
    expect(screen.getByTestId('artist-view')).toBeInTheDocument();
  });

  it('does not render ArtistView when filter value is empty', () => {
    const store = createStore({}, { filter: { type: 'artist', value: '' } });
    render(<Provider store={store}><SongList /></Provider>);
    expect(screen.queryByTestId('artist-view')).toBeNull();
    expect(screen.getByText('All Songs')).toBeInTheDocument();
  });

  it('renders song items in playlist', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: {
        id: 'p1',
        title: 'Favorites',
        playlistSongs: [
          { id: 'ps1', position: 1, addedAt: '2024-01-01', song: { id: 's1', title: 'Song A', artist: 'A', album: 'AA', duration: 200, thumbnail: '' } },
          { id: 'ps2', position: 2, addedAt: '2024-01-02', song: { id: 's2', title: 'Song B', artist: 'B', album: 'BB', duration: 300, thumbnail: '' } },
        ],
      },
    });
    render(<Provider store={store}><SongList /></Provider>);
    expect(screen.getByText(/^2 songs/)).toBeInTheDocument();
    expect(screen.getByTestId('song-s1')).toBeInTheDocument();
    expect(screen.getByTestId('song-s2')).toBeInTheDocument();
  });

  // ── Play / Shuffle — All Songs ──────────────────────────────────────────────

  it('play all dispatches queue and track from All Songs', () => {
    const songs = [
      { id: 's1', title: 'T1', artist: 'A', album: '', duration: 100, uploadedAt: '', coverImageUrl: '', thumbnail: '' },
      { id: 's2', title: 'T2', artist: 'A', album: '', duration: 100, uploadedAt: '', coverImageUrl: '', thumbnail: '' },
    ];
    const store = createStore({}, { songs });
    render(<Provider store={store}><SongList /></Provider>);
    fireEvent.click(screen.getAllByLabelText('Play all')[0]);
    const state = store.getState().player;
    expect(state.queue).toHaveLength(2);
    expect(state.currentTrack?.id).toBe('s1');
    expect(state.shuffle).toBe(false);
  });

  it('shuffle all sets shuffle=true and plays', () => {
    const songs = [
      { id: 's1', title: 'T1', artist: 'A', album: '', duration: 100, uploadedAt: '', coverImageUrl: '', thumbnail: '' },
    ];
    const store = createStore({}, { songs });
    render(<Provider store={store}><SongList /></Provider>);
    fireEvent.click(screen.getAllByLabelText('Shuffle')[0]);
    const state = store.getState().player;
    expect(state.shuffle).toBe(true);
    expect(state.queue).toHaveLength(1);
  });

  it('play all buttons are disabled when songs list is empty', () => {
    render(<Provider store={createStore()}><SongList /></Provider>);
    screen.getAllByLabelText('Play all').forEach(btn => expect(btn).toBeDisabled());
    screen.getAllByLabelText('Shuffle').forEach(btn => expect(btn).toBeDisabled());
  });

  // ── Play / Shuffle — Playlist ────────────────────────────────────────────────

  it('play playlist dispatches queue and track from playlist songs', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: {
        id: 'p1',
        title: 'Mix',
        playlistSongs: [
          { id: 'ps1', position: 1, addedAt: '', song: { id: 's1', title: 'T1', artist: 'A', album: '', duration: 100, thumbnail: '' } },
          { id: 'ps2', position: 2, addedAt: '', song: { id: 's2', title: 'T2', artist: 'A', album: '', duration: 100, thumbnail: '' } },
        ],
      },
    });
    render(<Provider store={store}><SongList /></Provider>);
    fireEvent.click(screen.getAllByLabelText('Play all')[0]);
    const state = store.getState().player;
    expect(state.queue).toHaveLength(2);
    expect(state.currentTrack?.id).toBe('s1');
    expect(state.shuffle).toBe(false);
  });

  it('shuffle playlist sets shuffle=true', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: {
        id: 'p1',
        title: 'Mix',
        playlistSongs: [
          { id: 'ps1', position: 1, addedAt: '', song: { id: 's1', title: 'T1', artist: 'A', album: '', duration: 100, thumbnail: '' } },
        ],
      },
    });
    render(<Provider store={store}><SongList /></Provider>);
    fireEvent.click(screen.getAllByLabelText('Shuffle')[0]);
    expect(store.getState().player.shuffle).toBe(true);
  });

  it('playlist play buttons are disabled when playlist is empty', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: { id: 'p1', title: 'Empty', playlistSongs: [] },
    });
    render(<Provider store={store}><SongList /></Provider>);
    screen.getAllByLabelText('Play all').forEach(btn => expect(btn).toBeDisabled());
  });

  // ── View Toggle ──────────────────────────────────────────────────────────────

  it('switches to grid view when grid button is clicked', () => {
    render(<Provider store={createStore()}><SongList /></Provider>);
    expect(screen.queryByRole('table')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Grid view'));
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('switches back to list view when list button is clicked', () => {
    render(<Provider store={createStore()}><SongList /></Provider>);
    fireEvent.click(screen.getByLabelText('Grid view'));
    fireEvent.click(screen.getByLabelText('List view'));
    expect(screen.queryByRole('table')).toBeInTheDocument();
  });
});
