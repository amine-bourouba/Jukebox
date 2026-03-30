import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../../store/playerSlice';
import songsReducer from '../../../store/songSlice';
import artistReducer from '../../../store/artistSlice';
import { groupByAlbum } from './ArtistView';

// ── Mocks ────────────────────────────────────────────────────────────────────

import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };
const mockApiSongs = (songs: any[]) => mockApi.get.mockResolvedValue({ data: songs });

vi.mock('./ArtistHeader', () => ({
  default: ({ artist, songCount, onPlay, onShuffle }: any) => (
    <div data-testid="artist-hero">
      <span data-testid="hero-name">{artist?.name ?? ''}</span>
      <span data-testid="hero-count">{songCount}</span>
      <button data-testid="btn-play-all" onClick={onPlay}>Play All</button>
      <button data-testid="btn-shuffle" onClick={onShuffle}>Shuffle</button>
    </div>
  ),
}));

vi.mock('./AlbumCard', () => ({
  default: ({ albumName, songCount, coverUrl, onClick }: any) => (
    <button
      data-testid={`card-${albumName}`}
      data-cover={coverUrl ?? ''}
      onClick={onClick}
    >
      {albumName} ({songCount})
    </button>
  ),
}));

vi.mock('./SongListItem', () => ({
  default: ({ playlistSong, onPlay }: any) => (
    <tr data-testid={`song-row-${playlistSong.song.id}`}>
      <td>
        <button data-testid={`play-song-${playlistSong.song.id}`} onClick={() => onPlay(playlistSong.song)}>
          {playlistSong.song.title}
        </button>
      </td>
    </tr>
  ),
}));

vi.mock('../../../components/ContextMenu/useContextMenu', () => ({
  useContextMenu: () => ({ showContextMenu: vi.fn(), showContextMenuAt: vi.fn() }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSong(id: string, title: string, album?: string, coverImageUrl?: string) {
  return {
    id,
    title,
    artist: 'Queen',
    album: album ?? null,
    coverImageUrl: coverImageUrl ?? null,
    thumbnail: '',
    uploadedAt: '2024-01-01',
    duration: 200,
  };
}

const QUEEN_ID = 'artist-queen';

function createStore(songs: any[] = [], selectedArtistId = QUEEN_ID) {
  return configureStore({
    reducer: { player: playerReducer, songs: songsReducer, artists: artistReducer },
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
        filter: { type: 'artist', value: 'Queen' },
        songs,
        likedSongIds: [],
      },
      artists: {
        artists: [{ id: QUEEN_ID, name: 'Queen', _count: { songs: songs.length, followers: 0 } }],
        selectedArtistId,
        followedArtistIds: [],
        loading: false,
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
    const songs = [makeSong('s1', 'T1', 'Album'), makeSong('s2', 'T2', 'Album')];
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

  it('extracts coverUrl from the first song with art', () => {
    const songs = [
      makeSong('s1', 'T1', 'Album'),
      makeSong('s2', 'T2', 'Album', '/cover.jpg'),
    ];
    const groups = groupByAlbum(songs);
    expect(groups[0].coverUrl).toBe('/cover.jpg');
  });

  it('leaves coverUrl undefined when no song has art', () => {
    const songs = [makeSong('s1', 'T1', 'Album')];
    const groups = groupByAlbum(songs);
    expect(groups[0].coverUrl).toBeUndefined();
  });
});

// ── ArtistView component tests ───────────────────────────────────────────────

describe('ArtistView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiSongs([]);
  });

  it('renders ArtistHeader with correct artist name', () => {
    const store = createStore('artist-radiohead');
    // Override the artists list with Radiohead
    const s = configureStore({
      reducer: { player: playerReducer, songs: songsReducer, artists: artistReducer },
      preloadedState: {
        player: { currentTrack: null, queue: [], repeat: 'off' as const, shuffle: false, playlists: [], selectedPlaylistId: null, selectedPlaylist: null },
        songs: { filterOptions: { artist: [] }, filter: { type: 'artist', value: 'Radiohead' }, songs: [], likedSongIds: [] },
        artists: { artists: [{ id: 'artist-radiohead', name: 'Radiohead', _count: { songs: 0, followers: 0 } }], selectedArtistId: 'artist-radiohead', followedArtistIds: [], loading: false },
      },
    });
    render(<Provider store={s}><ArtistView /></Provider>);
    expect(screen.getByTestId('hero-name').textContent).toBe('Radiohead');
  });

  it('passes correct song count to ArtistHeader', async () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'A')];
    mockApiSongs(songs);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('hero-count').textContent).toBe('2'));
  });

  it('renders an AlbumCard for each distinct album', async () => {
    const songs = [makeSong('s1', 'T1', 'Album A'), makeSong('s2', 'T2', 'Album B'), makeSong('s3', 'T3', 'Album A')];
    mockApiSongs(songs);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('card-Album A')).toBeInTheDocument());
    expect(screen.getByTestId('card-Album B')).toBeInTheDocument();
  });

  it('renders a "Singles" card for songs with no album', async () => {
    mockApiSongs([makeSong('s1', 'Solo Track')]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('card-Singles')).toBeInTheDocument());
  });

  it('passes coverUrl to the AlbumCard', async () => {
    mockApiSongs([makeSong('s1', 'T1', 'Album A', '/cover.jpg')]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('card-Album A').getAttribute('data-cover')).toBe('/cover.jpg'));
  });

  it('shows album song list when a card is clicked', async () => {
    mockApiSongs([makeSong('s1', 'Track One', 'Debut')]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => screen.getByTestId('card-Debut'));
    fireEvent.click(screen.getByTestId('card-Debut'));
    expect(screen.getByTestId('song-row-s1')).toBeInTheDocument();
    expect(screen.queryByTestId('card-Debut')).toBeNull();
  });

  it('shows album name and song count in detail view heading', async () => {
    mockApiSongs([makeSong('s1', 'T1', 'Debut'), makeSong('s2', 'T2', 'Debut')]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => screen.getByTestId('card-Debut'));
    fireEvent.click(screen.getByTestId('card-Debut'));
    expect(screen.getByText('Debut')).toBeInTheDocument();
    expect(screen.getByText('2 songs')).toBeInTheDocument();
  });

  it('returns to card grid when Back is clicked', async () => {
    mockApiSongs([makeSong('s1', 'T1', 'Debut')]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => screen.getByTestId('card-Debut'));
    fireEvent.click(screen.getByTestId('card-Debut'));
    fireEvent.click(screen.getByLabelText('Back to discography'));
    expect(screen.getByTestId('card-Debut')).toBeInTheDocument();
  });

  it('dispatches setQueue and setTrack (shuffle=false) when Play All is clicked', async () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'A')];
    mockApiSongs(songs);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('hero-count').textContent).toBe('2'));
    fireEvent.click(screen.getByTestId('btn-play-all'));
    const state = store.getState().player;
    expect(state.shuffle).toBe(false);
    expect(state.queue).toHaveLength(2);
    expect(state.currentTrack?.id).toBe('s1');
  });

  it('does nothing when Play All is clicked with no songs', () => {
    mockApiSongs([]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    fireEvent.click(screen.getByTestId('btn-play-all'));
    expect(store.getState().player.currentTrack).toBeNull();
  });

  it('dispatches setShuffle(true) and plays when Shuffle is clicked', async () => {
    const songs = [makeSong('s1', 'T1', 'A'), makeSong('s2', 'T2', 'B')];
    mockApiSongs(songs);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('hero-count').textContent).toBe('2'));
    fireEvent.click(screen.getByTestId('btn-shuffle'));
    const state = store.getState().player;
    expect(state.shuffle).toBe(true);
    expect(state.queue).toHaveLength(2);
    expect(state.currentTrack).not.toBeNull();
  });

  it('does nothing when Shuffle is clicked with no songs', () => {
    mockApiSongs([]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    fireEvent.click(screen.getByTestId('btn-shuffle'));
    expect(store.getState().player.currentTrack).toBeNull();
  });

  it('queues only album songs when a song is played from detail view', async () => {
    const songs = [makeSong('s1', 'Album A Track', 'Album A'), makeSong('s2', 'Album B Track', 'Album B')];
    mockApiSongs(songs);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => screen.getByTestId('card-Album A'));
    fireEvent.click(screen.getByTestId('card-Album A'));
    fireEvent.click(screen.getByTestId('play-song-s1'));
    const state = store.getState().player;
    expect(state.currentTrack?.id).toBe('s1');
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].id).toBe('s1');
  });

  it('normalises coverUrl from coverImageUrl when playing', async () => {
    const song = { ...makeSong('s1', 'T1', 'A'), coverImageUrl: '/cover.jpg' };
    mockApiSongs([song]);
    const store = createStore();
    render(<Provider store={store}><ArtistView /></Provider>);
    await waitFor(() => expect(screen.getByTestId('hero-count').textContent).toBe('1'));
    fireEvent.click(screen.getByTestId('btn-play-all'));
    const track = store.getState().player.currentTrack as any;
    expect(track.coverUrl).toBe('/cover.jpg');
  });
});
