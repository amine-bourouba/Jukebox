import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import playerReducer from '../store/playerSlice';

// Mock useAudioPlayer hook
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockSeek = vi.fn();
const mockAudioRef = { current: { volume: 1 } };

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

// Must import after mock setup
import Player from './Player';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

function createStore(playerState: any = {}, authState: any = {}) {
  return configureStore({
    reducer: { auth: authReducer, player: playerReducer },
    preloadedState: {
      auth: {
        user: null,
        token: 'jwt-token',
        refreshToken: null,
        loading: false,
        error: null,
        ...authState,
      },
      player: {
        currentTrack: { id: 's1', title: 'Test Song', artist: 'Test Artist', streamUrl: '' },
        queue: [
          { id: 's1', title: 'Test Song', artist: 'Test Artist', streamUrl: '' },
          { id: 's2', title: 'Next Song', artist: 'Other Artist', streamUrl: '' },
        ],
        repeat: 'off',
        shuffle: false,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
        ...playerState,
      },
    },
  });
}

function renderPlayer(playerState: any = {}, authState: any = {}) {
  return render(
    <Provider store={createStore(playerState, authState)}>
      <Player />
    </Provider>
  );
}

describe('Player', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render track title and artist', () => {
    renderPlayer();
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('should render "No Track" when no currentTrack', () => {
    renderPlayer({ currentTrack: null });
    expect(screen.getByText('No Track')).toBeInTheDocument();
  });

  it('should render play button when not playing', () => {
    vi.mocked(useAudioPlayer).mockReturnValue({
      audioRef: mockAudioRef as any,
      isPlaying: false,
      play: mockPlay,
      pause: mockPause,
      progress: 0,
      duration: 0,
      seek: mockSeek,
      blobUrl: '',
    });
    renderPlayer();
    expect(screen.getByTitle('Play')).toBeInTheDocument();
  });

  it('should render pause button when playing', () => {
    vi.mocked(useAudioPlayer).mockReturnValue({
      audioRef: mockAudioRef as any,
      isPlaying: true,
      play: mockPlay,
      pause: mockPause,
      progress: 30,
      duration: 180,
      seek: mockSeek,
      blobUrl: 'blob:http://localhost/audio',
    });

    renderPlayer();
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
  });

  it('should call pause when pause button is clicked', () => {
    vi.mocked(useAudioPlayer).mockReturnValue({
      audioRef: mockAudioRef as any,
      isPlaying: true,
      play: mockPlay,
      pause: mockPause,
      progress: 30,
      duration: 180,
      seek: mockSeek,
      blobUrl: 'blob:http://localhost/audio',
    });
    renderPlayer();
    fireEvent.click(screen.getByTitle('Pause'));
    expect(mockPause).toHaveBeenCalled();
  });

  it('should display formatted progress and duration', () => {
    renderPlayer();
    // progress=30 → "0:30", duration=180 → "3:00"
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('should render shuffle and repeat buttons', () => {
    renderPlayer();
    expect(screen.getByTitle('Shuffle: Off')).toBeInTheDocument();
    expect(screen.getByTitle('Repeat: off')).toBeInTheDocument();
  });

  it('should render previous and next buttons', () => {
    renderPlayer();
    expect(screen.getByTitle('Previous')).toBeInTheDocument();
    expect(screen.getByTitle('Next')).toBeInTheDocument();
  });

  it('should render volume slider', () => {
    renderPlayer();
    const volumeSlider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(volumeSlider).toBeTruthy();
    expect(volumeSlider.min).toBe('0');
    expect(volumeSlider.max).toBe('1');
  });

  it('should render audio element with blob src', () => {
    renderPlayer();
    const audioEl = document.querySelector('audio') as HTMLAudioElement;
    expect(audioEl).toBeTruthy();
    expect(audioEl.src).toBe('blob:http://localhost/audio');
  });
});
