import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../../store/playerSlice';
import songsReducer from '../../../store/songSlice';
import { groupByAlbum } from './ArtistView';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('./ArtistHeader', () => ({
  default: ({ artistName, songCount, onPlay, onShuffle }: any) => (
    <div data-testid="artist-hero">
      <span data-testid="hero-name">{artistName}</span>
      <span data-testid="hero-count">{songCount}</span>
      <button data-testid="btn-play-all" onClick={onPlay}>Play All</button>
      <button data-testid="btn-shuffle" onClick={onShuffle}>Shuffle</button>
    </div>
  ),
}));

vi.mock('./AlbumSection', () => ({
  default: ({ albumName, songs, onPlay }: any) => (
    <tr data-testid={`album-${albumName}`}>
      <td>
        {songs.map((s: any) => (
          <button
            key={s.id}
            data-testid={`play-song-${s.song.id}`}
            onClick={() => onPlay(s.song)}
          >
            {s.song.title}
          </button>
        ))}
      </td>
    </tr>
  ),
}));

vi.mock('../../../components/ContextMenu/useContextMenu', () => ({
  useContextMenu: () => ({ showContextMenu: vi.fn(), showContextMenuAt: vi.fn() }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSong(id: string, title: string, album?: string) {
  return {
    id,
    title,
    artist: 'Queen',
    album: album ?? null,
    coverImageUrl: null,
    thumbnail: '',
    uploadedAt: '2024-01-01',
    duration: 200,
  };
}

function createStore(songs: any[] = [], artistName = 'Queen') {
  return configureStore({
    reducer: { player: playerReducer, songs: songsReducer },
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
        filterOptions: { artist: [] },
        filter: { type: 'artist', value: artistName },
        songs,
        likedSongIds: [],
      },
    },
  });
}

import ArtistView from './ArtistView';

// ── groupByAlbum unit tests ──────────────────────────────────────────────────

describe('groupByAlbum', () => {
  it('groups songs by album name', () => {
    const songs = [
      makeSong('s1', 'Track 1', 'Album A'),
      makeSong('s2', 'Track 2', 'Album B'),
      makeSong('s3', 'Track 3', 'Album A'),
    ];
    const groups = groupByAlbum(songs);
    expect(groups).toHaveLength(2);
    const albumA = groups.find(g => g.albumName === 'Album A')!;
    expect(albumA.songs).toHaveLength(2);
  });

  it('places songs without album into "Singles"', () => {
    const songs = [makeSong('s1', 'Lone Track', null as any)];
    const groups = groupByAlbum(songs);
    expect(groups[0].albumName).toBe('Singles');
  });

  it('trims whitespace from album name before grouping', () => {
    const songs = [
      makeSong('s1', 'A', '  Space Album  '),
      makeSong('s2', 'B', 'Space Album'),
    ];
    // Both map to same trimmed key — should be one group
    const groups = groupByAlbum(songs);
    expect(groups).toHaveLength(1);
    expect(groups[0].songs).toHaveLength(2);
  });

  it('sorts albums alphabetically', () => {
    const songs = [
      makeSong('s1', 'Z', 'Zebra'),
      makeSong('s2', 'A', 'Alpha'),
      makeSong('s3', 'M', 'Middle'),
    ];
    const groups = groupByAlbum(songs);
    expect(groups.map(g => g.albumName)).toEqual(['Alpha', 'Middle', 'Zebra']);
  });

  it('assigns 1-based position within each album', () => {
    const songs = [
      makeSong('s1', 'T1', 'Album'),
      makeSong('s2', 'T2', 'Album'),
    ];
    const groups = groupByAlbum(songs);
    expect(groups[0].songs[0].position).toBe(1);
    expect(groups[0].songs[1].position).toBe(2);
  });

  it('returns empty array for empty input', () => {
    expect(groupByAlbum([])).toEqual([]);
  });

  it('uses coverImageUrl as thumbnail when present', () => {
    const song = { ...makeSong('s1', 'T'), coverImageUrl: '/cover.jpg' };
    const groups = groupByAlbum([song]);
    expect(groups[0].songs[0].song.thumbnail).toBe('/cover.jpg');
  });

  it('falls back to song.thumbnail when coverImageUrl is absent', () => {
    const song = { ...makeSong('s1', 'T'), coverImageUrl: null, thumbnail: '/thumb.jpg' };
    const groups = groupByAlbum([song]);
    expect(groups[0].songs[0].song.thumbnail).toBe('/thumb.jpg');
  });
});

// ── ArtistView component tests ───────────────────────────────────────────────

describe('ArtistView', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders ArtistHeader with correct artist name', () => {
    const store = createStore([], 'Radiohead');
    render(<Provider store={store}><ArtistView /></Provider>);
    expect(screen.getByTestId('hero-name').textContent).toBe('Radiohead');
  });

  it('passes correct song count to ArtistHeader', () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'A')];
    const store = createStore(songs);
    render(<Provider store={store}><ArtistView /></Provider>);
    expect(screen.getByTestId('hero-count').textContent).toBe('2');
  });

  it('renders an AlbumSection for each distinct album', () => {
    const songs = [
      makeSong('s1', 'T1', 'Album A'),
      makeSong('s2', 'T2', 'Album B'),
      makeSong('s3', 'T3', 'Album A'),
    ];
    const store = createStore(songs);
    render(<Provider store={store}><ArtistView /></Provider>);
    expect(screen.getByTestId('album-Album A')).toBeInTheDocument();
    expect(screen.getByTestId('album-Album B')).toBeInTheDocument();
  });

  it('renders a "Singles" section for songs with no album', () => {
    const store = createStore([makeSong('s1', 'Solo Track')]);
    render(<Provider store={store}><ArtistView /></Provider>);
    expect(screen.getByTestId('album-Singles')).toBeInTheDocument();
  });

  it('renders table column headers', () => {
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Album')).toBeInTheDocument();
    expect(screen.getByText('Date Added')).toBeInTheDocument();
  });

  it('dispatches setQueue and setTrack (shuffle=false) when Play All is clicked', () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'A')];
    const store = createStore(songs);
    render(<Provider store={store}><ArtistView /></Provider>);

    fireEvent.click(screen.getByTestId('btn-play-all'));

    const state = store.getState().player;
    expect(state.shuffle).toBe(false);
    expect(state.queue).toHaveLength(2);
    expect(state.currentTrack).not.toBeNull();
    expect(state.currentTrack?.id).toBe('s1');
  });

  it('does nothing when Play All is clicked with no songs', () => {
    const store = createStore([]);
    render(<Provider store={store}><ArtistView /></Provider>);
    fireEvent.click(screen.getByTestId('btn-play-all'));
    expect(store.getState().player.currentTrack).toBeNull();
  });

  it('dispatches setQueue, setTrack, and setShuffle(true) when Shuffle is clicked', () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'B')];
    const store = createStore(songs);
    render(<Provider store={store}><ArtistView /></Provider>);

    fireEvent.click(screen.getByTestId('btn-shuffle'));

    const state = store.getState().player;
    expect(state.shuffle).toBe(true);
    expect(state.queue).toHaveLength(2);
    expect(state.currentTrack).not.toBeNull();
  });

  it('does nothing when Shuffle is clicked with no songs', () => {
    const store = createStore([]);
    render(<Provider store={store}><ArtistView /></Provider>);
    fireEvent.click(screen.getByTestId('btn-shuffle'));
    expect(store.getState().player.currentTrack).toBeNull();
  });

  it('dispatches setQueue and setTrack when a song row is played', () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'A')];
    const store = createStore(songs);
    render(<Provider store={store}><ArtistView /></Provider>);

    fireEvent.click(screen.getByTestId('play-song-s1'));

    const state = store.getState().player;
    expect(state.currentTrack?.id).toBe('s1');
    expect(state.queue).toHaveLength(2);
  });

  it('normalises coverUrl from coverImageUrl when playing', () => {
    const song = { ...makeSong('s1', 'T1', 'A'), coverImageUrl: '/cover.jpg' };
    const store = createStore([song]);
    render(<Provider store={store}><ArtistView /></Provider>);

    fireEvent.click(screen.getByTestId('btn-play-all'));

    const track = store.getState().player.currentTrack as any;
    expect(track.coverUrl).toBe('/cover.jpg');
  });
});
