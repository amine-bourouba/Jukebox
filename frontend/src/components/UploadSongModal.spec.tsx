import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import songReducer from '../store/songSlice';
import playerReducer from '../store/playerSlice';
import { UploadSongModalProvider, useUploadSong } from './UploadSongModal';

const mockPost = vi.fn().mockResolvedValue({ data: { id: 'new-1', title: 'Test Song', artist: 'Test Artist' } });

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: (...args: any[]) => mockPost(...args),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../services/snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

function createStore() {
  return configureStore({
    reducer: { songs: songReducer, player: playerReducer },
    preloadedState: {
      songs: {
        filterOptions: { artist: [], genre: [] },
        filter: { type: 'all', value: '' },
        songs: [],
        likedSongIds: [],
      },
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off' as const,
        shuffle: false,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
      },
    },
  });
}

function TestComponent() {
  const { showUploadSong } = useUploadSong();
  return <button onClick={showUploadSong}>Open Upload</button>;
}

describe('UploadSongModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if useUploadSong is used outside provider', () => {
    expect(() => {
      const Broken = () => {
        useUploadSong();
        return null;
      };
      render(<Broken />);
    }).toThrow('useUploadSong must be used within an UploadSongModalProvider');
  });

  it('should not show modal initially', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
  });

  it('should open modal when showUploadSong is called', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Upload'));
    expect(screen.getByText('Upload Song')).toBeInTheDocument();
    expect(screen.getByText('Choose audio file…')).toBeInTheDocument();
    expect(screen.getByText('Choose cover image…')).toBeInTheDocument();
  });

  it('should close modal when Cancel is clicked', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Upload'));
    expect(screen.getByText('Upload Song')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
  });

  it('should disable Upload button when no audio file is selected', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Upload'));
    expect(screen.getByText('Upload')).toBeDisabled();
  });

  it('should enable Upload button after selecting an audio file', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Upload'));

    const fileInput = document.querySelector('input[type="file"][accept="audio/*"]') as HTMLInputElement;
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('Upload')).not.toBeDisabled();
    expect(screen.getByText('song.mp3')).toBeInTheDocument();
  });

  it('should dispatch uploadSong with FormData on Upload click', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Upload'));

    // Select audio file
    const fileInput = document.querySelector('input[type="file"][accept="audio/*"]') as HTMLInputElement;
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Fill in optional fields
    fireEvent.change(screen.getByPlaceholderText('Leave blank for auto-detection'), {
      target: { value: 'My Song' },
    });

    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/songs/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
    });
  });

  it('should close modal after successful upload', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <UploadSongModalProvider>
          <TestComponent />
        </UploadSongModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Upload'));

    const fileInput = document.querySelector('input[type="file"][accept="audio/*"]') as HTMLInputElement;
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
    });
  });
});
