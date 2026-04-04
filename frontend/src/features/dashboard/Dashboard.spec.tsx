import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/authSlice';
import playerReducer from '../../store/playerSlice';
import songsReducer from '../../store/songSlice';
import historyReducer from '../../store/historySlice';

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));
vi.mock('../../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock('../../components/Player', () => ({
  default: () => <div data-testid="player">Player</div>,
}));
vi.mock('../../components/BottomNav', () => ({
  default: () => <div data-testid="bottom-nav">BottomNav</div>,
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
    reducer: { auth: authReducer, player: playerReducer, songs: songsReducer, history: historyReducer },
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
      songs: { filterOptions: {}, filter: { type: 'all', value: '' }, songs: [], likedSongIds: [] },
    },
  });
}

function renderDashboard(store = createStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>
  );
}

describe('Dashboard', () => {
  it('should render Header, Sidebar, Player, and SongList', () => {
    renderDashboard();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('player')).toBeInTheDocument();
    expect(screen.getByTestId('song-list')).toBeInTheDocument();
  });

  it('should NOT render SongPreview when no current track', () => {
    renderDashboard();
    expect(screen.queryByTestId('song-preview')).not.toBeInTheDocument();
  });

  it('should render SongPreview when a track is playing', () => {
    const track = { id: 's1', title: 'Now Playing', artist: 'Artist', streamUrl: '' };
    renderDashboard(createStore({ currentTrack: track }));
    expect(screen.getByTestId('song-preview')).toBeInTheDocument();
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
  });

  it('should always give SongList flex-1', () => {
    renderDashboard();
    const wrapper = screen.getByTestId('song-list').parentElement!;
    expect(wrapper.className).toContain('flex-1');
  });

  it('should add md:basis-3/4 class to SongList wrapper when track is playing', () => {
    const track = { id: 's1', title: 'Track', artist: 'A', streamUrl: '' };
    renderDashboard(createStore({ currentTrack: track }));
    const wrapper = screen.getByTestId('song-list').parentElement!;
    expect(wrapper.className).toContain('md:basis-3/4');
  });
});
