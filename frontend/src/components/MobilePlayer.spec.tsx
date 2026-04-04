import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import playerReducer from '../store/playerSlice';
import songsReducer from '../store/songSlice';

const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockSeek = vi.fn();
const mockAudioRef = { current: document.createElement('audio') };

vi.mock('../hooks/useAudioPlayer', () => ({
  useAudioPlayer: vi.fn(() => ({
    audioRef: mockAudioRef,
    isPlaying: false,
    play: mockPlay,
    pause: mockPause,
    progress: 30,
    duration: 180,
    seek: mockSeek,
    blobUrl: 'blob:http://localhost/audio',
  })),
}));

import MobilePlayer from './MobilePlayer';

const track = { id: 's1', title: 'Test Song', artist: 'Test Artist', coverUrl: '' };

function createStore(playerOverrides: any = {}, songsOverrides: any = {}) {
  return configureStore({
    reducer: { auth: authReducer, player: playerReducer, songs: songsReducer },
    preloadedState: {
      auth: { user: null, token: 'jwt', refreshToken: null, loading: false, error: null },
      player: {
        currentTrack: track,
        queue: [track],
        repeat: 'off',
        shuffle: false,
        showQueue: true,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
        ...playerOverrides,
      },
      songs: {
        filter: { type: 'all', value: '' },
        songs: [],
        likedSongIds: [],
        filterOptions: {},
        ...songsOverrides,
      },
    },
  });
}

function renderPlayer(store = createStore()) {
  return render(
    <Provider store={store}>
      <MobilePlayer />
    </Provider>
  );
}

describe('MobilePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no track is loaded', () => {
    const store = createStore({ currentTrack: null });
    const { container } = renderPlayer(store);
    expect(container.firstChild).toBeNull();
  });

  it('renders the mini bar with track title and artist', () => {
    renderPlayer();
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('expands to full-screen player when mini bar is clicked', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Open player' }));
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
  });

  it('collapses back to mini bar when collapse button is pressed', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Open player' }));
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse player' }));
    expect(screen.queryByText('Now Playing')).not.toBeInTheDocument();
  });

  it('calls play when play button is pressed in mini bar', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(mockPlay).toHaveBeenCalled();
  });

  it('shows liked state when song is in likedSongIds', () => {
    const store = createStore({}, { likedSongIds: [track.id] });
    renderPlayer(store);
    fireEvent.click(screen.getByRole('button', { name: 'Open player' }));
    expect(screen.getByRole('button', { name: 'Unlike' })).toBeInTheDocument();
  });

  it('shows unliked state when song is not in likedSongIds', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Open player' }));
    expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument();
  });
});
