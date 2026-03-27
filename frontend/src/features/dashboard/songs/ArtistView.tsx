import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { MdAccessTime } from 'react-icons/md';

import { RootState, AppDispatch } from '../../../store/store';
import { setTrack, setQueue, setShuffle } from '../../../store/playerSlice';
import ArtistHeader from './ArtistHeader';
import AlbumSection from './AlbumSection';
import type { PlaylistSongShape } from './AlbumSection';

export interface AlbumGroup {
  albumName: string;
  songs: PlaylistSongShape[];
}

/** Groups a flat song array into sorted album buckets.
 *  Songs without an album fall into "Singles". */
export function groupByAlbum(songs: any[]): AlbumGroup[] {
  const map = new Map<string, PlaylistSongShape[]>();

  songs.forEach((song) => {
    const album = song.album?.trim() || 'Singles';
    if (!map.has(album)) map.set(album, []);
    const bucket = map.get(album)!;
    bucket.push({
      id: `${song.id}-${album}`,
      position: bucket.length + 1,
      addedAt: song.uploadedAt || '',
      song: {
        ...song,
        thumbnail: song.coverImageUrl || song.thumbnail || '',
      },
    });
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([albumName, songs]) => ({ albumName, songs }));
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
  const songs = useSelector((state: RootState) => state.songs.songs);
  const artistName = useSelector((state: RootState) => state.songs.filter.value);

  const handlePlaySong = useCallback(
    (song: any) => {
      const tracks = songs.map(normaliseTrack);
      dispatch(setQueue(tracks));
      dispatch(setTrack(normaliseTrack(song)));
    },
    [dispatch, songs]
  );

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

  const albumGroups = groupByAlbum(songs);

  return (
    <div className="flex flex-col h-full overflow-hidden pt-8">
      <ArtistHeader
        artistName={artistName}
        songCount={songs.length}
        onPlay={handlePlayAll}
        onShuffle={handleShuffle}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <table className="relative min-w-full divide-y divide-gray-300">
            <thead className="sticky top-0">
              <tr>
                <th scope="col" className="py-4 w-12 text-left text-sm font-semibold text-white">
                  #
                </th>
                <th scope="col" className="pl-1 py-4 w-1/3 text-left text-sm font-semibold text-white">
                  Title
                </th>
                <th scope="col" className="pl-3 py-4 w-1/3 text-left text-sm font-semibold text-white">
                  Album
                </th>
                <th scope="col" className="pl-3 py-4 text-left text-sm font-semibold text-white">
                  Date Added
                </th>
                <th scope="col" className="py-4 pl-3 pr-4 sm:pr-0">
                  <MdAccessTime size={20} className="text-white" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-transparent">
              {albumGroups.map(({ albumName, songs: albumSongs }) => (
                <AlbumSection
                  key={albumName}
                  albumName={albumName}
                  songs={albumSongs}
                  onPlay={handlePlaySong}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
