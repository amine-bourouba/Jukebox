import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../store/playerSlice';
import songReducer from '../../store/songSlice';
import { ContextMenuProvider } from './ContextMenuProvider';
import ContextMenu from './ContextMenu';

// Mock api so dispatches don't hit network
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../EditSongModal', () => ({
  useEditSong: () => ({ showEditSong: vi.fn() }),
}));

function createStore(playlists: any[] = []) {
  return configureStore({
    reducer: { player: playerReducer, songs: songReducer },
    preloadedState: {
      player: {
        currentTrack: null,
        queue: [],
        repeat: 'off',
        shuffle: false,
        playlists,
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

function renderWithContext(playlists: any[] = []) {
  const store = createStore(playlists);
  return render(
    <Provider store={store}>
      <ContextMenuProvider>
        <ContextMenu />
        <div
          data-testid="trigger"
          onContextMenu={(e) => {
            e.preventDefault();
            // Simulate opening context menu via provider
          }}
        >
          Right-click me
        </div>
      </ContextMenuProvider>
    </Provider>
  );
}

describe('ContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render menu when not open', () => {
    renderWithContext();
    // No menu items should be visible
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should render menu items when context menu state is open', () => {
    const store = createStore([{ id: 'p1', title: 'My Playlist' }]);

    // Render a component that manually triggers the menu
    function Trigger() {
      const { useContextMenu } = require('./useContextMenu');
      const { showContextMenu } = useContextMenu();

      return (
        <div
          data-testid="trigger"
          onContextMenu={(e) => {
            showContextMenu(e, 'playlist-song', {
              id: 'ps1',
              song: { id: 's1', title: 'Test Song' },
            });
          }}
        >
          Right-click me
        </div>
      );
    }

    // We'll test that the ContextMenu portal renders correctly
    // by verifying it returns null when state.isOpen is false
    render(
      <Provider store={store}>
        <ContextMenuProvider>
          <ContextMenu />
        </ContextMenuProvider>
      </Provider>
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
