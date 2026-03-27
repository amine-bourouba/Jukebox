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

import Sidebar, { groupByLetter } from './Sidebar';

function createStore(playlists: any[] = [], filterOptions: any = {}, songs: any[] = [], currentTrack: any = null) {
  return configureStore({
    reducer: { player: playerReducer, songs: songsReducer },
    preloadedState: {
      player: {
        currentTrack,
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
        songs,
        likedSongIds: [],
      },
    },
  });
}

function renderSidebar(playlists: any[] = [], filterOptions: any = {}, songs: any[] = [], currentTrack: any = null) {
  const store = createStore(playlists, filterOptions, songs, currentTrack);
  return { store, ...render(<Provider store={store}><Sidebar /></Provider>) };
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filter pills', () => {
    renderSidebar();
    expect(screen.getByText('Songs')).toBeInTheDocument();
    expect(screen.getByText('Playlist')).toBeInTheDocument();
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });

  it('should render "Your Playlists" section only when Playlist pill is active', () => {
    renderSidebar(); // default selectedPill is 'playlist'
    expect(screen.getByText('Your Playlists')).toBeInTheDocument();
  });

  it('should NOT render "Your Playlists" section when Songs pill is active', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Songs'));
    expect(screen.queryByText('Your Playlists')).not.toBeInTheDocument();
  });

  it('should NOT render "Your Playlists" section when Artist pill is active', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Artist'));
    expect(screen.queryByText('Your Playlists')).not.toBeInTheDocument();
  });

  it('should render playlist items', () => {
    const playlists = [
      { id: 'p1', title: 'Chill Vibes',  _count: { playlistSongs: 3 } },
      { id: 'p2', title: 'Workout Mix',  _count: { playlistSongs: 0 } },
    ];
    renderSidebar(playlists);
    expect(screen.getByText('Chill Vibes')).toBeInTheDocument();
    expect(screen.getByText('Workout Mix')).toBeInTheDocument();
  });

  it('should show song count for playlists with songs', () => {
    const playlists = [
      { id: 'p1', title: 'Chill Vibes', _count: { playlistSongs: 5 } },
    ];
    renderSidebar(playlists);
    expect(screen.getByText('5 songs')).toBeInTheDocument();
  });

  it('should use singular "song" when count is 1', () => {
    const playlists = [
      { id: 'p1', title: 'Solo', _count: { playlistSongs: 1 } },
    ];
    renderSidebar(playlists);
    expect(screen.getByText('1 song')).toBeInTheDocument();
  });

  it('should show "No songs" when playlist has no songs', () => {
    const playlists = [
      { id: 'p1', title: 'Empty', _count: { playlistSongs: 0 } },
    ];
    renderSidebar(playlists);
    expect(screen.getByText('No songs')).toBeInTheDocument();
  });

  it('should show "No songs" when _count is absent', () => {
    const playlists = [{ id: 'p1', title: 'Legacy' }];
    renderSidebar(playlists);
    expect(screen.getByText('No songs')).toBeInTheDocument();
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

  it('should render artist items with a circular icon avatar', () => {
    const filterOptions = { artist: ['Adele'] };
    renderSidebar([], filterOptions);

    fireEvent.click(screen.getByText('Artist'));

    // The circular avatar container is aria-hidden and wraps the icon
    const artistButton = screen.getByText('Adele').closest('button')!;
    const avatar = artistButton.querySelector('[aria-hidden="true"]');
    expect(avatar).toBeInTheDocument();
    expect(avatar!.className).toContain('rounded-full');
  });

  it('should truncate long artist names', () => {
    const filterOptions = { artist: ['A Very Long Artist Name That Should Be Truncated'] };
    renderSidebar([], filterOptions);

    fireEvent.click(screen.getByText('Artist'));

    const nameSpan = screen.getByText('A Very Long Artist Name That Should Be Truncated');
    expect(nameSpan.className).toContain('truncate');
  });

  it('should apply active styles to selected artist', () => {
    const filterOptions = { artist: ['Drake', 'Adele'] };
    renderSidebar([], filterOptions);

    fireEvent.click(screen.getByText('Artist'));
    fireEvent.click(screen.getByText('Drake'));

    const drakeBtn = screen.getByText('Drake').closest('button')!;
    expect(drakeBtn.className).toContain('bg-amethyst');
  });

  it('should apply inactive styles to unselected artists', () => {
    const filterOptions = { artist: ['Drake', 'Adele'] };
    renderSidebar([], filterOptions);

    fireEvent.click(screen.getByText('Artist'));

    const adeleBtn = screen.getByText('Adele').closest('button')!;
    expect(adeleBtn.className).toContain('bg-shadow');
  });

  // ── Songs pill ───────────────────────────────────────────────────────────

  it('should show "Songs" section header when Songs pill is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Songs'));
    expect(screen.getAllByText('Songs').length).toBeGreaterThanOrEqual(2);
  });

  it('should render all song items when Songs pill is active', () => {
    const songs = [
      { id: 's1', title: 'Alpha', artist: 'Artist A', coverImageUrl: null, thumbnail: '' },
      { id: 's2', title: 'Beta', artist: 'Artist B', coverImageUrl: null, thumbnail: '' },
    ];
    renderSidebar([], {}, songs);
    fireEvent.click(screen.getByText('Songs'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('should render letter dividers for each leading letter', () => {
    const songs = [
      { id: 's1', title: 'Alpha', artist: 'A', coverImageUrl: null, thumbnail: '' },
      { id: 's2', title: 'Beta',  artist: 'B', coverImageUrl: null, thumbnail: '' },
      { id: 's3', title: 'Amber', artist: 'A', coverImageUrl: null, thumbnail: '' },
    ];
    renderSidebar([], {}, songs);
    fireEvent.click(screen.getByText('Songs'));
    // Only one "A" divider even though two songs start with A
    expect(document.querySelectorAll('[data-letter="A"]').length).toBe(1);
    expect(document.querySelectorAll('[data-letter="B"]').length).toBe(1);
  });

  it('should group songs with non-alpha titles under "#"', () => {
    const songs = [
      { id: 's1', title: '99 Problems', artist: 'Jay-Z', coverImageUrl: null, thumbnail: '' },
    ];
    renderSidebar([], {}, songs);
    fireEvent.click(screen.getByText('Songs'));
    expect(document.querySelector('[data-letter="#"]')).toBeInTheDocument();
    expect(screen.getByText('99 Problems')).toBeInTheDocument();
  });

  it('should render letter dividers in alphabetical order with "#" last', () => {
    const songs = [
      { id: 's1', title: 'Zebra',      artist: 'Z', coverImageUrl: null, thumbnail: '' },
      { id: 's2', title: '1 Hit',      artist: '#', coverImageUrl: null, thumbnail: '' },
      { id: 's3', title: 'Apple',      artist: 'A', coverImageUrl: null, thumbnail: '' },
    ];
    renderSidebar([], {}, songs);
    fireEvent.click(screen.getByText('Songs'));
    const dividers = Array.from(document.querySelectorAll('[data-letter]')).map(el => el.getAttribute('data-letter'));
    expect(dividers).toEqual(['A', 'Z', '#']);
  });

  it('should NOT show songs list when Playlist pill is active', () => {
    const songs = [
      { id: 's1', title: 'Alpha', artist: 'Artist A', coverImageUrl: null, thumbnail: '' },
    ];
    renderSidebar([], {}, songs); // default is playlist pill
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('should dispatch setQueue and setTrack when a song is clicked', () => {
    const songs = [
      { id: 's1', title: 'Alpha', artist: 'Artist A', coverImageUrl: null, thumbnail: '' },
      { id: 's2', title: 'Beta', artist: 'Artist B', coverImageUrl: null, thumbnail: '' },
    ];
    const { store } = renderSidebar([], {}, songs);
    fireEvent.click(screen.getByText('Songs'));
    fireEvent.click(screen.getByText('Alpha'));

    const state = store.getState().player;
    expect(state.currentTrack?.id).toBe('s1');
    expect(state.queue).toHaveLength(2);
  });

  it('should highlight the currently playing song', () => {
    const songs = [
      { id: 's1', title: 'Alpha', artist: 'Artist A', coverImageUrl: null, thumbnail: '' },
    ];
    const currentTrack = { id: 's1', title: 'Alpha', artist: 'Artist A', streamUrl: '' };
    renderSidebar([], {}, songs, currentTrack);
    fireEvent.click(screen.getByText('Songs'));

    const btn = screen.getByText('Alpha').closest('button')!;
    expect(btn.className).toContain('bg-amethyst');
  });

  it('should show cover image thumbnail when song has one', () => {
    const songs = [
      { id: 's1', title: 'Alpha', artist: 'Artist A', coverImageUrl: '/cover.jpg', thumbnail: '' },
    ];
    renderSidebar([], {}, songs);
    fireEvent.click(screen.getByText('Songs'));

    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('/cover.jpg');
  });

  // ── Artists pill – letter grouping ────────────────────────────────────────

  it('should render letter dividers for artists', () => {
    const filterOptions = { artist: ['Adele', 'Arctic Monkeys', 'Beck', 'Drake'] };
    renderSidebar([], filterOptions);
    fireEvent.click(screen.getByText('Artist'));
    expect(document.querySelector('[data-letter="A"]')).toBeInTheDocument();
    expect(document.querySelector('[data-letter="B"]')).toBeInTheDocument();
    expect(document.querySelector('[data-letter="D"]')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-letter="A"]').length).toBe(1);
  });

  it('should group artist names starting with non-alpha under "#"', () => {
    const filterOptions = { artist: ['2Pac', 'Adele'] };
    renderSidebar([], filterOptions);
    fireEvent.click(screen.getByText('Artist'));
    expect(document.querySelector('[data-letter="#"]')).toBeInTheDocument();
    expect(document.querySelector('[data-letter="A"]')).toBeInTheDocument();
  });

  it('should render artist letter dividers in alphabetical order with "#" last', () => {
    const filterOptions = { artist: ['Zara Larsson', '50 Cent', 'Adele'] };
    renderSidebar([], filterOptions);
    fireEvent.click(screen.getByText('Artist'));
    const dividers = Array.from(document.querySelectorAll('[data-letter]')).map(el => el.getAttribute('data-letter'));
    expect(dividers).toEqual(['A', 'Z', '#']);
  });
});

// ── groupByLetter unit tests ──────────────────────────────────────────────────

describe('groupByLetter', () => {
  it('groups items by first letter of the label', () => {
    const result = groupByLetter(['Apple', 'Avocado', 'Banana'], s => s);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ letter: 'A', items: ['Apple', 'Avocado'] });
    expect(result[1]).toEqual({ letter: 'B', items: ['Banana'] });
  });

  it('places non-alpha items under "#"', () => {
    const result = groupByLetter(['99 Red Balloons', 'Adele'], s => s);
    expect(result[0].letter).toBe('A');
    expect(result[1].letter).toBe('#');
  });

  it('sorts letters A-Z with "#" always last', () => {
    const result = groupByLetter(['Zebra', '1 hit', 'Apple'], s => s);
    expect(result.map(g => g.letter)).toEqual(['A', 'Z', '#']);
  });

  it('works with objects via a getLabel callback', () => {
    const songs = [
      { id: 1, title: 'Alpha' },
      { id: 2, title: 'Beta' },
      { id: 3, title: 'Atom' },
    ];
    const result = groupByLetter(songs, s => s.title);
    expect(result[0].letter).toBe('A');
    expect(result[0].items).toHaveLength(2);
    expect(result[1].letter).toBe('B');
    expect(result[1].items).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(groupByLetter([], s => s)).toEqual([]);
  });
});
