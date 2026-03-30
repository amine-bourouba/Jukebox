import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { MdAccessTime, MdArrowBack } from 'react-icons/md';
import { IoAlbums } from 'react-icons/io5';

import { RootState, AppDispatch } from '../../../store/store';
import { setTrack, setQueue, setShuffle } from '../../../store/playerSlice';
import ArtistHeader from './ArtistHeader';
import AlbumCard from './AlbumCard';
import SongListItem from './SongListItem';
import type { PlaylistSongShape } from './AlbumSection';
import api from '../../../services/api';

export interface AlbumGroup {
  albumName: string;
  coverUrl?: string;
  songs: PlaylistSongShape[];
}

/** Groups a flat song array into sorted album buckets.
 *  Songs without an album fall into "Singles". */
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
      song: {
        ...song,
        thumbnail: song.coverImageUrl || song.thumbnail || '',
      },
    });
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([albumName, { songs, coverUrl }]) => ({ albumName, coverUrl, songs }));
}

function normaliseTrack(song: any) {
  return {
    ...song,
    coverUrl: song.coverImageUrl || song.thumbnail || song.coverUrl || '',
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ArtistView() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedArtistId = useSelector((state: RootState) => state.artists.selectedArtistId);
  const artist = useSelector((state: RootState) =>
    state.artists.artists.find(a => a.id === selectedArtistId) ?? null
  );

  const [songs, setSongs] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Fetch songs from Artist API endpoint
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

  const handlePlayAlbumSong = useCallback(
    (song: any, albumSongs: PlaylistSongShape[]) => {
      const tracks = albumSongs.map(ps => normaliseTrack(ps.song));
      dispatch(setQueue(tracks));
      dispatch(setTrack(normaliseTrack(song)));
    },
    [dispatch]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden pt-8">
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
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-1 text-silver hover:text-moon transition-colors text-sm"
                aria-label="Back to discography"
              >
                <MdArrowBack size={18} />
                Discography
              </button>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-2">
                <IoAlbums size={16} className="text-amethyst" />
                <span className="text-white font-semibold">{selectedGroup.albumName}</span>
                <span className="text-silver text-sm">
                  {selectedGroup.songs.length} {selectedGroup.songs.length === 1 ? 'song' : 'songs'}
                </span>
              </div>
            </div>

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
          </div>
        ) : (
          /* ── Album card grid ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 px-4 sm:px-6 lg:px-8 py-4">
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
        )}
      </div>
    </div>
  );
}
