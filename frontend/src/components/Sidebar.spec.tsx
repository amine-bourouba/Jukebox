import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../store/playerSlice';
import songsReducer from '../store/songSlice';

// Mock ContextMenu hook
const mockShowContextMenu = vi.fn();
vi.mock('./ContextMenu/useContextMenu', () => ({
  useContextMenu: () => ({
    showContextMenu: mockShowContextMenu,
  }),
}));

// Mock API calls dispatched in useEffect
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import Sidebar from './Sidebar';

function createStore(playlists: any[] = [], filterOptions: any = {}) {
  return configureStore({
    reducer: { player: playerReducer, songs: songsReducer },
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
        filterOptions,
        filter: { type: 'all', value: '' },
        songs: [],
      },
    },
  });
}

function renderSidebar(playlists: any[] = [], filterOptions: any = {}) {
  return render(
    <Provider store={createStore(playlists, filterOptions)}>
      <Sidebar />
    </Provider>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filter pills', () => {
    renderSidebar();
    expect(screen.getByText('Playlist')).toBeInTheDocument();
    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();
  });

  it('should render "Your Playlists" section', () => {
    renderSidebar();
    expect(screen.getByText('Your Playlists')).toBeInTheDocument();
  });

  it('should render playlist items', () => {
    const playlists = [
      { id: 'p1', title: 'Chill Vibes' },
      { id: 'p2', title: 'Workout Mix' },
    ];
    renderSidebar(playlists);
    expect(screen.getByText('Chill Vibes')).toBeInTheDocument();
    expect(screen.getByText('Workout Mix')).toBeInTheDocument();
  });

  it('should show filter options when a pill other than "all" is selected', () => {
    const filterOptions = { artist: ['Adele', 'Drake'] };
    renderSidebar([], filterOptions);
    
    // Click "Artist" pill
    fireEvent.click(screen.getByText('Artist'));
    
    expect(screen.getByText('Adele')).toBeInTheDocument();
    expect(screen.getByText('Drake')).toBeInTheDocument();
  });

  it('should highlight selected playlist', () => {
    const playlists = [
      { id: 'p1', title: 'Favorites' },
      { id: 'p2', title: 'Rock' },
    ];
    renderSidebar(playlists);

    // Click on "Favorites"
    fireEvent.click(screen.getByText('Favorites'));

    // After clicking, the playlist div should have the active class
    const playlistEl = screen.getByText('Favorites').closest('[class*="bg-amethyst"]');
    expect(playlistEl).toBeTruthy();
  });

  it('should render empty playlists section gracefully', () => {
    renderSidebar([]);
    expect(screen.getByText('Your Playlists')).toBeInTheDocument();
  });

  it('should pass playlist data on right-click context menu', () => {
    const playlists = [{ id: 'p1', title: 'Chill Vibes' }];
    renderSidebar(playlists);

    fireEvent.contextMenu(screen.getByText('Chill Vibes'));

    expect(mockShowContextMenu).toHaveBeenCalledWith(
      expect.any(Object),
      'sidebar-playlist',
      expect.objectContaining({ id: 'p1', title: 'Chill Vibes' })
    );
  });
});
