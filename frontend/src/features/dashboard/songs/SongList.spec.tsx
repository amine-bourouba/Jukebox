import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../../store/playerSlice';
import songsReducer from '../../../store/songSlice';

// Mock API
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock the SongListItem to simplify testing
vi.mock('./SongListItem', () => ({
  default: ({ playlistSong }: any) => (
    <tr data-testid={`song-${playlistSong.song.id}`}>
      <td>{playlistSong.song.title}</td>
    </tr>
  ),
}));

// Mock ArtistView so SongList routing tests stay isolated
vi.mock('./ArtistView', () => ({
  default: () => <div data-testid="artist-view">ArtistView</div>,
}));

// Mock ContextMenu hook
vi.mock('../../../components/ContextMenu/useContextMenu', () => ({
  useContextMenu: () => ({
    showContextMenu: vi.fn(),
    showContextMenuAt: vi.fn(),
  }),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render All Songs view when no playlist is selected', () => {
    const { container } = render(
      <Provider store={createStore()}>
        <SongList />
      </Provider>
    );
    expect(screen.getByText('All Songs')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should render playlist header when a playlist is selected', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: {
        id: 'p1',
        title: 'Chill Beats',
        playlistSongs: [],
      },
    });

    render(
      <Provider store={store}>
        <SongList />
      </Provider>
    );

    expect(screen.getByText('Playlist')).toBeInTheDocument();
    expect(screen.getByText('Chill Beats')).toBeInTheDocument();
    expect(screen.getByText('0 song(s)')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: {
        id: 'p1',
        title: 'Rock',
        playlistSongs: [],
      },
    });

    render(
      <Provider store={store}>
        <SongList />
      </Provider>
    );

    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Album')).toBeInTheDocument();
    expect(screen.getByText('Date Added')).toBeInTheDocument();
  });

  it('should render ArtistView when filter type is artist with a value', () => {
    const store = createStore({}, { filter: { type: 'artist', value: 'Queen' } });
    render(
      <Provider store={store}>
        <SongList />
      </Provider>
    );
    expect(screen.getByTestId('artist-view')).toBeInTheDocument();
  });

  it('should NOT render ArtistView when filter type is artist but value is empty', () => {
    const store = createStore({}, { filter: { type: 'artist', value: '' } });
    render(
      <Provider store={store}>
        <SongList />
      </Provider>
    );
    expect(screen.queryByTestId('artist-view')).toBeNull();
    expect(screen.getByText('All Songs')).toBeInTheDocument();
  });

  it('should render Library label in all-songs view', () => {
    render(
      <Provider store={createStore()}>
        <SongList />
      </Provider>
    );
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should render song items', () => {
    const store = createStore({
      selectedPlaylistId: 'p1',
      selectedPlaylist: {
        id: 'p1',
        title: 'Favorites',
        playlistSongs: [
          {
            id: 'ps1',
            position: 1,
            addedAt: '2024-01-01',
            song: { id: 's1', title: 'Song A', artist: 'A', album: 'AA', duration: 200, thumbnail: '' },
          },
          {
            id: 'ps2',
            position: 2,
            addedAt: '2024-01-02',
            song: { id: 's2', title: 'Song B', artist: 'B', album: 'BB', duration: 300, thumbnail: '' },
          },
        ],
      },
    });

    render(
      <Provider store={store}>
        <SongList />
      </Provider>
    );

    expect(screen.getByText('2 song(s)')).toBeInTheDocument();
    expect(screen.getByTestId('song-s1')).toBeInTheDocument();
    expect(screen.getByTestId('song-s2')).toBeInTheDocument();
  });
});
