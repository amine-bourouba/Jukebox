import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFilteredSongs } from '../../../store/songSlice';
import { setTrack, setQueue } from '../../../store/playerSlice';
import { RootState, AppDispatch } from '../../../store/store';
import SongListElement from './SongListItem';
import ArtistView from './ArtistView';

import { MdAccessTime } from "react-icons/md";
import { TbPlaylist } from "react-icons/tb";
import { IoMusicalNotes } from "react-icons/io5";

export default function SongList() {
  const dispatch = useDispatch<AppDispatch>();
  const { filter, songs } = useSelector((state: RootState) => state.songs);
  const { selectedPlaylistId, selectedPlaylist } = useSelector((state: RootState) => state.player);

  useEffect(() => {
    if (!selectedPlaylistId) {
      dispatch(fetchFilteredSongs(filter));
    }
  }, [dispatch, filter, selectedPlaylistId]);


  const formatTotalDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} hr ${m} min`;
    if (m > 0) return `${m} min ${s} sec`;
    return `${s} sec`;
  };

  const normaliseTrack = (s: any) => ({
    ...s,
    coverUrl: s.coverImageUrl || s.thumbnail || s.coverUrl || '',
  });

  const handlePlaySong = (song: any) => {
    const track = normaliseTrack(song);

    let allTracks;
    if (selectedPlaylistId && selectedPlaylist?.playlistSongs) {
      allTracks = selectedPlaylist.playlistSongs.map((ps: any) => normaliseTrack(ps.song));
    } else {
      allTracks = songs.map(normaliseTrack);
    }

    dispatch(setQueue(allTracks));
    dispatch(setTrack(track));
  };

  const isArtistView = filter.type === 'artist' && !!filter.value;

  if (isArtistView) {
    return <ArtistView />;
  }

  if (selectedPlaylistId) {
    return (
      <div className="flex flex-col h-full overflow-hidden pt-8">
        <div className="px-4 sm:px-6 lg:px-8 flex-shrink-0">
          {/* Playlist Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex">
              <div className="shrink-0 mr-4 -mb-4">
                <TbPlaylist size={175} className="text-amethyst" />
              </div>
              <div className="flex flex-col justify-between">
                <div/>
                <div>
                  <p className="text-sm font-bold text-white">Playlist</p>
                  <p className="mt-1 text-5xl font-extrabold text-white">
                    {selectedPlaylist?.title}
                  </p>
                  <p className="mt-1 text-gray-500">
                    {(() => {
                      const songs = selectedPlaylist?.playlistSongs ?? [];
                      const total = songs.reduce((acc: number, ps: any) => acc + (ps.song?.duration ?? 0), 0);
                      return `${songs.length} ${songs.length === 1 ? 'song' : 'songs'}${total > 0 ? ` • ${formatTotalDuration(total)}` : ''}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Songs Table - Scrollable */}
        <div className="flex-1 overflow-y-auto mt-8">
          <div className="px-4 sm:px-6 lg:px-8">
            <table className="relative min-w-full divide-y divide-gray-300">
              <thead className="sticky top-0">
                <tr>
                  <th scope="col" className="py-4 w-8 text-left text-sm font-semibold text-white">
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
                {selectedPlaylist?.playlistSongs.map((playlistSong) => (
                  <SongListElement
                    key={playlistSong.id}
                    playlistSong={playlistSong}
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

  // Filtered / All Songs view
  const heading = 'All Songs';

  return (
    <div className="flex flex-col h-full overflow-hidden pt-8">
      <div className="px-4 sm:px-6 lg:px-8 flex-shrink-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex">
            <div className="shrink-0 mr-4 -mb-4">
              <IoMusicalNotes size={175} className="text-amethyst" />
            </div>
            <div className="flex flex-col justify-between">
              <div/>
              <div>
                <p className="text-sm font-bold text-white">Library</p>
                <p className="mt-1 text-5xl font-extrabold text-white">
                  {heading}
                </p>
                <p className="mt-1 text-gray-500">
                  {(() => {
                    const total = songs.reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0);
                    return `${songs.length} ${songs.length === 1 ? 'song' : 'songs'}${total > 0 ? ` • ${formatTotalDuration(total)}` : ''}`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <table className="relative min-w-full divide-y divide-gray-300">
            <thead className="sticky top-0">
              <tr>
                <th scope="col" className="py-4 w-8 text-left text-sm font-semibold text-white">
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
              {songs.map((song, index) => (
                <SongListElement
                  key={song.id}
                  playlistSong={{
                    id: song.id,
                    position: index + 1,
                    addedAt: song.uploadedAt,
                    song: {
                      ...song,
                      thumbnail: song.coverImageUrl || song.thumbnail || '',
                    },
                  }}
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