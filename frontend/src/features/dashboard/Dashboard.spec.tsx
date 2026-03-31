import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/authSlice';
import playerReducer from '../../store/playerSlice';
import songsReducer from '../../store/songSlice';

// Mock child components to isolate Dashboard layout logic
vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));
vi.mock('../../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock('../../components/Player', () => ({
  default: () => <div data-testid="player">Player</div>,
}));
vi.mock('./songs/SongList', () => ({
  default: () => <div data-testid="song-list">SongList</div>,
}));
vi.mock('./songs/SongPreview', () => ({
  default: ({ currentTrack }: any) => (
    <div data-testid="song-preview">{currentTrack.title}</div>
  ),
}));

import Dashboard from './Dashboard';

function createStore(playerOverrides: any = {}) {
  return configureStore({
    reducer: { auth: authReducer, player: playerReducer, songs: songsReducer },
    preloadedState: {
      auth: { user: null, token: 'jwt', refreshToken: null, loading: false, error: null },
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off',
        shuffle: false,
        showQueue: true,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
        ...playerOverrides,
      },
      songs: { filterOptions: {}, filter: { type: 'all', value: '' }, songs: [] },
    },
  });
}

describe('Dashboard', () => {
  it('should render Header, Sidebar, Player, and SongList', () => {
    render(
      <Provider store={createStore()}>
        <Dashboard />
      </Provider>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('player')).toBeInTheDocument();
    expect(screen.getByTestId('song-list')).toBeInTheDocument();
  });

  it('should NOT render SongPreview when no current track', () => {
    render(
      <Provider store={createStore()}>
        <Dashboard />
      </Provider>
    );

    expect(screen.queryByTestId('song-preview')).not.toBeInTheDocument();
  });

  it('should render SongPreview when a track is playing', () => {
    const track = { id: 's1', title: 'Now Playing', artist: 'Artist', streamUrl: '' };
    render(
      <Provider store={createStore({ currentTrack: track })}>
        <Dashboard />
      </Provider>
    );

    expect(screen.getByTestId('song-preview')).toBeInTheDocument();
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
  });

  it('should give SongList full width when no track is playing', () => {
    const { container } = render(
      <Provider store={createStore()}>
        <Dashboard />
      </Provider>
    );

    // When no track: the SongList wrapper gets 'flex-1'
    const songListWrapper = screen.getByTestId('song-list').parentElement!;
    expect(songListWrapper.className).toContain('flex-1');
    expect(songListWrapper.className).not.toContain('basis-3/4');
  });

  it('should give SongList 3/4 width when track is playing', () => {
    const track = { id: 's1', title: 'Track', artist: 'A', streamUrl: '' };
    const { container } = render(
      <Provider store={createStore({ currentTrack: track })}>
        <Dashboard />
      </Provider>
    );

    const songListWrapper = screen.getByTestId('song-list').parentElement!;
    expect(songListWrapper.className).toContain('basis-3/4');
  });
});
