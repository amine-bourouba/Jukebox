import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import playerReducer, { setTrack } from '../store/playerSlice';
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

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => true),
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

  it('does NOT autoplay on initial mount (hydrated from localStorage)', () => {
    renderPlayer();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('autoplays when setTrack dispatches the SAME id after hydration (Play All bug)', async () => {
    // Regression: the autoplay guard used to compare track ids, so dispatching
    // setTrack with a matching id was skipped forever. Now compares references,
    // so any new dispatch plays.
    const store = createStore();
    render(
      <Provider store={store}>
        <MobilePlayer />
      </Provider>
    );
    expect(mockPlay).not.toHaveBeenCalled();
    act(() => {
      store.dispatch(setTrack({ ...track }));
    });
    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });
  });

  it('rewinds to 0 when setTrack re-fires on the already-loaded song', async () => {
    // Regression: Play All on a playlist whose first track is the already-playing
    // song must visibly restart, since the same blobUrl means the <audio> element
    // doesn't reset on its own.
    const store = createStore();
    render(
      <Provider store={store}>
        <MobilePlayer />
      </Provider>
    );
    // React assigned the real <audio> element to the ref on mount.
    const audio = mockAudioRef.current as HTMLAudioElement;
    Object.defineProperty(audio, 'readyState', { get: () => 2, configurable: true });
    audio.currentTime = 42;
    act(() => {
      store.dispatch(setTrack({ ...track }));
    });
    await waitFor(() => {
      expect(audio.currentTime).toBe(0);
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });
  });

  it('autoplays when setTrack dispatches a different id after hydration', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <MobilePlayer />
      </Provider>
    );
    expect(mockPlay).not.toHaveBeenCalled();
    act(() => {
      store.dispatch(setTrack({ id: 's2', title: 'Other', artist: 'Other', coverUrl: '' }));
    });
    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });
  });
});
