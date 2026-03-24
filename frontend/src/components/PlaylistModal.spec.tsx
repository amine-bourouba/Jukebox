import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../store/playerSlice';
import songReducer from '../store/songSlice';
import { PlaylistModalProvider, usePlaylistModal } from './PlaylistModal';

const mockPost = vi.fn().mockResolvedValue({ data: { id: 'p1', title: 'New Playlist' } });
const mockPut = vi.fn().mockResolvedValue({ data: { id: 'p1', title: 'Updated' } });

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../services/snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

function createStore() {
  return configureStore({
    reducer: { player: playerReducer, songs: songReducer },
    preloadedState: {
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off' as const,
        shuffle: false,
        playlists: [],
        selectedPlaylistId: null,
        selectedPlaylist: null,
      },
      songs: {
        filterOptions: { artist: [], genre: [] },
        filter: { type: 'all', value: '' },
        songs: [],
        likedSongIds: [],
      },
    },
  });
}

function CreateTestComponent() {
  const { showCreatePlaylist } = usePlaylistModal();
  return <button onClick={showCreatePlaylist}>Open Create</button>;
}

function EditTestComponent() {
  const { showEditPlaylist } = usePlaylistModal();
  return (
    <button onClick={() => showEditPlaylist({ id: 'p1', title: 'My Playlist', description: 'A great playlist' })}>
      Open Edit
    </button>
  );
}

describe('PlaylistModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if usePlaylistModal is used outside provider', () => {
    expect(() => {
      const Broken = () => {
        usePlaylistModal();
        return null;
      };
      render(<Broken />);
    }).toThrow('usePlaylistModal must be used within a PlaylistModalProvider');
  });

  it('should not show modal initially', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <CreateTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    expect(screen.queryByText('Create Playlist')).not.toBeInTheDocument();
  });

  it('should open in create mode with empty fields', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <CreateTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Create'));
    expect(screen.getByText('Create Playlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('');
    expect(screen.getByText('Create')).toBeDisabled();
  });

  it('should open in edit mode with pre-filled fields', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <EditTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Edit'));
    expect(screen.getByText('Edit Playlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('My Playlist');
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('A great playlist');
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('should close modal when Cancel is clicked', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <CreateTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Create'));
    expect(screen.getByText('Create Playlist')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Playlist')).not.toBeInTheDocument();
  });

  it('should enable Create button when title is entered', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <CreateTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Create'));
    expect(screen.getByText('Create')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Playlist' } });
    expect(screen.getByText('Create')).not.toBeDisabled();
  });

  it('should dispatch createPlaylist on Create click', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <CreateTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Create'));

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My New Playlist' } });
    fireEvent.change(screen.getByLabelText('Description (optional)'), { target: { value: 'Some description' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/playlists', {
        title: 'My New Playlist',
        description: 'Some description',
      });
    });
  });

  it('should dispatch updatePlaylist on Save click', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <EditTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Edit'));

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/playlists/p1', {
        title: 'Updated Title',
        description: 'A great playlist',
      });
    });
  });

  it('should close modal after successful create', async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlaylistModalProvider>
          <CreateTestComponent />
        </PlaylistModalProvider>
      </Provider>
    );
    fireEvent.click(screen.getByText('Open Create'));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.queryByText('Create Playlist')).not.toBeInTheDocument();
    });
  });
});
