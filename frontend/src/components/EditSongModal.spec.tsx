import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import songReducer from '../store/songSlice';
import playerReducer from '../store/playerSlice';
import { EditSongModalProvider, useEditSong } from './EditSongModal';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
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
        songs: [{ id: 's1', title: 'Old Title', artist: 'Old Artist', album: 'Old Album', explicit: false }],
        likedSongIds: [],
      },
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off',
        shuffle: false,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
      },
    },
  });
}

function TestComponent() {
  const { showEditSong } = useEditSong();
  return (
    <button
      onClick={() =>
        showEditSong({
          id: 's1',
          title: 'Old Title',
          artist: 'Old Artist',
          album: 'Old Album',
          explicit: false,
        })
      }
    >
      Open Edit
    </button>
  );
}

describe('EditSongModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if useEditSong is used outside provider', () => {
    expect(() => {
      const Broken = () => {
        useEditSong();
        return null;
      };
      render(<Broken />);
    }).toThrow('useEditSong must be used within an EditSongModalProvider');
  });

  it('should not show modal initially', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <EditSongModalProvider>
          <TestComponent />
        </EditSongModalProvider>
      </Provider>
    );

    expect(screen.queryByText('Edit Song Details')).not.toBeInTheDocument();
  });

  it('should open modal when showEditSong is called', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <EditSongModalProvider>
          <TestComponent />
        </EditSongModalProvider>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open Edit'));

    expect(screen.getByText('Edit Song Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Artist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Album')).toBeInTheDocument();
  });

  it('should close modal when Cancel is clicked', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <EditSongModalProvider>
          <TestComponent />
        </EditSongModalProvider>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open Edit'));
    expect(screen.getByText('Edit Song Details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Edit Song Details')).not.toBeInTheDocument();
  });

  it('should update form fields', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <EditSongModalProvider>
          <TestComponent />
        </EditSongModalProvider>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open Edit'));

    const titleInput = screen.getByDisplayValue('Old Title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
  });

  it('should dispatch updateSong and close modal on Save', async () => {
    const api = (await import('../services/api')).default;
    (api.put as any).mockResolvedValue({ data: { id: 's1', title: 'New Title', artist: 'Old Artist', album: 'Old Album', explicit: false } });

    const store = createStore();
    render(
      <Provider store={store}>
        <EditSongModalProvider>
          <TestComponent />
        </EditSongModalProvider>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open Edit'));

    const titleInput = screen.getByDisplayValue('Old Title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    fireEvent.click(screen.getByText('Save'));

    // Modal should close after save
    await vi.waitFor(() => {
      expect(screen.queryByText('Edit Song Details')).not.toBeInTheDocument();
    });

    expect(api.put).toHaveBeenCalledWith('/songs/s1', expect.objectContaining({ title: 'New Title' }));
  });
});
