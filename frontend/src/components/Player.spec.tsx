import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('should toggle shuffle on click', async () => {
    renderPlayer({ shuffle: false });
    fireEvent.click(screen.getByTitle('Shuffle: Off'));
    await waitFor(() => {
      expect(screen.getByTitle('Shuffle: On')).toBeInTheDocument();
    });
  });

  it('should cycle repeat mode on click', async () => {
    renderPlayer({ repeat: 'off' });
    fireEvent.click(screen.getByTitle('Repeat: off'));
    await waitFor(() => {
      expect(screen.getByTitle('Repeat: one')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Repeat: one'));
    await waitFor(() => {
      expect(screen.getByTitle('Repeat: all')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Repeat: all'));
    await waitFor(() => {
      expect(screen.getByTitle('Repeat: off')).toBeInTheDocument();
    });
  });

  it('should go to next track on next click', async () => {
    renderPlayer();
    fireEvent.click(screen.getByTitle('Next'));
    await waitFor(() => {
      expect(screen.getByText('Next Song')).toBeInTheDocument();
    });
  });

  it('should go to previous track on prev click', async () => {
    renderPlayer({
      currentTrack: { id: 's2', title: 'Next Song', artist: 'Other Artist', streamUrl: '' },
    });
    fireEvent.click(screen.getByTitle('Previous'));
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });
  });

  it('should wrap to first track on next at end with repeat all', async () => {
    renderPlayer({
      currentTrack: { id: 's2', title: 'Next Song', artist: 'Other Artist', streamUrl: '' },
      repeat: 'all',
    });
    fireEvent.click(screen.getByTitle('Next'));
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });
  });

  it('should wrap to last track on prev at start with repeat all', async () => {
    renderPlayer({
      currentTrack: { id: 's1', title: 'Test Song', artist: 'Test Artist', streamUrl: '' },
      repeat: 'all',
    });
    fireEvent.click(screen.getByTitle('Previous'));
    await waitFor(() => {
      expect(screen.getByText('Next Song')).toBeInTheDocument();
    });
  });

  it('should seek on progress bar click', () => {
    renderPlayer();
    vi.clearAllMocks();
    const progressBar = document.querySelector('.cursor-pointer')!;
    Object.defineProperty(progressBar, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 200, top: 0, height: 10, right: 200, bottom: 10, x: 0, y: 0, toJSON: () => ({}) }),
      configurable: true,
    });
    fireEvent.click(progressBar, { clientX: 100 });
    expect(mockSeek).toHaveBeenCalledWith(90); // 50% of 180
  });

  it('should change volume on slider input', () => {
    renderPlayer();
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0.5' } });
    expect(mockAudioRef.current.volume).toBe(0.5);
  });

  it('should seek to start and play when track ends with repeat one', () => {
    renderPlayer({ repeat: 'one' });
    vi.clearAllMocks();
    const audio = document.querySelector('audio')!;
    fireEvent(audio, new Event('ended'));
    expect(mockSeek).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalled();
  });

  it('should go to next track when track ends without repeat one', async () => {
    renderPlayer({ repeat: 'off' });
    vi.clearAllMocks();
    const audio = document.querySelector('audio')!;
    fireEvent(audio, new Event('ended'));
    await waitFor(() => {
      expect(screen.getByText('Next Song')).toBeInTheDocument();
    });
  });

  it('should render cover image when coverUrl exists', () => {
    renderPlayer({
      currentTrack: { id: 's1', title: 'Test Song', artist: 'Test Artist', coverUrl: 'http://example.com/cover.jpg', streamUrl: '' },
    });
    const img = screen.getByAltText('cover');
    expect(img).toHaveAttribute('src', 'http://example.com/cover.jpg');
  });

  it('should not change track on next when queue is empty', () => {
    renderPlayer({ queue: [], currentTrack: { id: 's1', title: 'Test Song', artist: 'Test Artist', streamUrl: '' } });
    fireEvent.click(screen.getByTitle('Next'));
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });
});
