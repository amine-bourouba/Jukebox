import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { MdAccessTime, MdArrowBack, MdChevronRight } from 'react-icons/md';
import { IoAlbums } from 'react-icons/io5';

function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} hr ${m} min`;
  if (m > 0) return `${m} min ${s} sec`;
  return `${s} sec`;
}

import { RootState, AppDispatch } from '../../../store/store';
import { setTrack, setQueue, setShuffle } from '../../../store/playerSlice';
import ArtistHeader from './ArtistHeader';
import AlbumCard from './AlbumCard';
import SongListItem from './SongListItem';
import SongCard from '../../../components/SongCard';
import ViewToggle, { useViewMode } from '../../../components/ViewToggle';
import PlayShuffleButtons from '../../../components/PlayShuffleButtons';
import { useContextMenu } from '../../../components/ContextMenu/useContextMenu';
import { shuffleArray } from '../../../utils/shuffleArray';
import type { PlaylistSongShape } from './AlbumSection';
import api from '../../../services/api';
import { useImageColor } from '../../../hooks/useImageColor';

export interface AlbumGroup {
  albumName: string;
  coverUrl?: string;
  songs: PlaylistSongShape[];
}

export function groupByAlbum(songs: any[]): AlbumGroup[] {
  const map = new Map<string, { songs: PlaylistSongShape[]; coverUrl?: string }>();

  songs.forEach((song) => {
    const album = song.album?.trim() || 'Singles';
    if (!map.has(album)) map.set(album, { songs: [] });
    const bucket = map.get(album)!;
    if (!bucket.coverUrl && (song.coverImageUrl || song.thumbnail)) {
      bucket.coverUrl = song.coverImageUrl || song.thumbnail;
    }
    bucket.songs.push({
      id: `${song.id}-${album}`,
      position: bucket.songs.length + 1,
      addedAt: song.uploadedAt || '',
      song: { ...song, thumbnail: song.coverImageUrl || song.thumbnail || '' },
    });
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([albumName, { songs, coverUrl }]) => ({ albumName, coverUrl, songs }));
}

function normaliseTrack(song: any) {
  return { ...song, coverUrl: song.coverImageUrl || song.thumbnail || song.coverUrl || '' };
}

export default function ArtistView({ onBack }: { onBack?: () => void } = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const { showContextMenu } = useContextMenu();
  const selectedArtistId = useSelector((state: RootState) => state.artists.selectedArtistId);
  const artist = useSelector((state: RootState) =>
    state.artists.artists.find(a => a.id === selectedArtistId) ?? null
  );

  const accentColor = useImageColor(artist?.imageUrl);
  const [viewMode, setViewMode] = useViewMode();
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedArtistId) return;
    setSongs([]);
    setSelectedAlbum(null);
    api.get(`/artists/${selectedArtistId}/songs`).then(res => setSongs(res.data));
  }, [selectedArtistId]);

  const albumGroups = groupByAlbum(songs);
  const selectedGroup = selectedAlbum
    ? albumGroups.find(g => g.albumName === selectedAlbum)
    : null;

  // Artist-level play/shuffle (passed to ArtistHeader)
  const handlePlayAll = useCallback(() => {
    if (!songs.length) return;
    const tracks = songs.map(normaliseTrack);
    dispatch(setShuffle(false));
    dispatch(setQueue(tracks));
    dispatch(setTrack(tracks[0]));
  }, [dispatch, songs]);

  const handleShuffle = useCallback(() => {
    if (!songs.length) return;
    const shuffled = shuffleArray(songs.map(normaliseTrack));
    dispatch(setShuffle(true));
    dispatch(setQueue(shuffled));
    dispatch(setTrack(shuffled[0]));
  }, [dispatch, songs]);

  // Album-level play/shuffle
  const handlePlayAlbum = useCallback((albumSongs: PlaylistSongShape[]) => {
    if (!albumSongs.length) return;
    const tracks = albumSongs.map(ps => normaliseTrack(ps.song));
    dispatch(setShuffle(false));
    dispatch(setQueue(tracks));
    dispatch(setTrack(tracks[0]));
  }, [dispatch]);

  const handleShuffleAlbum = useCallback((albumSongs: PlaylistSongShape[]) => {
    if (!albumSongs.length) return;
    const shuffled = shuffleArray(albumSongs.map(ps => normaliseTrack(ps.song)));
    dispatch(setShuffle(true));
    dispatch(setQueue(shuffled));
    dispatch(setTrack(shuffled[0]));
  }, [dispatch]);

  const handlePlayAlbumSong = useCallback(
    (song: any, albumSongs: PlaylistSongShape[]) => {
      const tracks = albumSongs.map(ps => normaliseTrack(ps.song));
      dispatch(setQueue(tracks));
      dispatch(setTrack(normaliseTrack(song)));
    },
    [dispatch]
  );

  const headerGradient = accentColor
    ? { background: `linear-gradient(to bottom, ${accentColor}44 0%, transparent 45%)` }
    : undefined;

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-[background] duration-700 ${onBack ? 'pt-2' : 'pt-8'}`}
      style={headerGradient}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-silver hover:text-moon transition-colors text-sm px-4 sm:px-6 py-2 shrink-0"
          aria-label="Back to artists"
        >
          <MdArrowBack size={18} />
          Artists
        </button>
      )}
      <ArtistHeader
        artist={artist}
        songCount={songs.length}
        onPlay={handlePlayAll}
        onShuffle={handleShuffle}
      />

      <div className="flex-1 overflow-y-auto">
        {selectedGroup ? (
          /* ── Album detail view ── */
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Back nav */}
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-1 text-silver hover:text-moon transition-colors text-sm mb-6"
              aria-label="Back to discography"
            >
              <MdArrowBack size={18} />
              Discography
            </button>

            {/* Album header */}
            <div className="flex items-end gap-5 mb-4">
              <div className="w-36 h-36 shrink-0 rounded-md overflow-hidden bg-shadow flex items-center justify-center">
                {selectedGroup.coverUrl ? (
                  <img src={selectedGroup.coverUrl} alt={selectedGroup.albumName} className="w-full h-full object-cover" />
                ) : (
                  <IoAlbums size={56} className="text-amethyst/50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-silver uppercase tracking-widest mb-1">Album</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-4xl font-extrabold text-white truncate">{selectedGroup.albumName}</p>
                  {/* Mobile: compact round buttons next to title */}
                  <div className="lg:hidden">
                    <PlayShuffleButtons compact onPlay={() => handlePlayAlbum(selectedGroup.songs)} onShuffle={() => handleShuffleAlbum(selectedGroup.songs)} disabled={!selectedGroup.songs.length} />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {artist?.name && <span className="text-white font-medium">{artist.name} · </span>}
                  {selectedGroup.songs.length} {selectedGroup.songs.length === 1 ? 'song' : 'songs'}
                  {(() => {
                    const total = selectedGroup.songs.reduce((acc, ps) => acc + ((ps.song as any).duration ?? 0), 0);
                    return total > 0 ? ` · ${formatTotalDuration(total)}` : '';
                  })()}
                </p>
              </div>
            </div>

            {/* Toolbar: desktop = play/shuffle + toggle, mobile = toggle only */}
            <div className="flex justify-end lg:justify-between py-2 mb-1">
              <div className="hidden lg:block">
                <PlayShuffleButtons onPlay={() => handlePlayAlbum(selectedGroup.songs)} onShuffle={() => handleShuffleAlbum(selectedGroup.songs)} disabled={!selectedGroup.songs.length} />
              </div>
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {viewMode === 'list' ? (
              <table className="relative min-w-full divide-y divide-gray-300">
                <thead className="sticky top-0">
                  <tr>
                    <th scope="col" className="py-4 w-8 text-left text-sm font-semibold text-white">#</th>
                    <th scope="col" className="pl-3 py-4 w-1/2 text-left text-sm font-semibold text-white">Title</th>
                    <th scope="col" className="pl-3 py-4 text-left text-sm font-semibold text-white">Date Added</th>
                    <th scope="col" className="py-4 pl-3 pr-4 sm:pr-0">
                      <MdAccessTime size={20} className="text-white" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-transparent">
                  {selectedGroup.songs.map(ps => (
                    <SongListItem
                      key={ps.id}
                      playlistSong={ps}
                      onPlay={song => handlePlayAlbumSong(song, selectedGroup.songs)}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {selectedGroup.songs.map(ps => (
                  <SongCard
                    key={ps.id}
                    title={ps.song.title}
                    artist={ps.song.artist}
                    thumbnail={ps.song.thumbnail}
                    onClick={() => handlePlayAlbumSong(ps.song, selectedGroup.songs)}
                    onContextMenu={(e) => showContextMenu(e, 'playlist-song', ps)}
                  />
                ))}
              </div>
            )}

            {/* More by this artist */}
            {albumGroups.filter(g => g.albumName !== selectedGroup.albumName).length > 0 && (
              <div className="mt-8 mb-4">
                <p className="text-sm font-bold text-white mb-4">
                  More by {artist?.name ?? 'this artist'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {albumGroups
                    .filter(g => g.albumName !== selectedGroup.albumName)
                    .map(({ albumName, songs: albumSongs, coverUrl }) => (
                      <AlbumCard
                        key={albumName}
                        albumName={albumName}
                        songCount={albumSongs.length}
                        coverUrl={coverUrl}
                        onClick={() => setSelectedAlbum(albumName)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Discography view ── */
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Toolbar: view toggle only (play/shuffle already in ArtistHeader above) */}
            <div className="flex justify-end py-2 mb-1">
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pb-4">
                {albumGroups.map(({ albumName, songs: albumSongs, coverUrl }) => (
                  <AlbumCard
                    key={albumName}
                    albumName={albumName}
                    songCount={albumSongs.length}
                    coverUrl={coverUrl}
                    onClick={() => setSelectedAlbum(albumName)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/10 pb-4">
                {albumGroups.map(({ albumName, songs: albumSongs, coverUrl }) => (
                  <button
                    key={albumName}
                    onClick={() => setSelectedAlbum(albumName)}
                    className="flex items-center gap-4 py-3 hover:bg-white/5 transition-colors rounded px-2 text-left group"
                  >
                    <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-shadow flex items-center justify-center">
                      {coverUrl
                        ? <img src={coverUrl} alt={albumName} className="w-full h-full object-cover" />
                        : <IoAlbums size={22} className="text-amethyst/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{albumName}</p>
                      <p className="text-xs text-silver mt-0.5">
                        {albumSongs.length} {albumSongs.length === 1 ? 'song' : 'songs'} · Album
                      </p>
                    </div>
                    <MdChevronRight size={20} className="text-silver/50 shrink-0 group-hover:text-silver transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
