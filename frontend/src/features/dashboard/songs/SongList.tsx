import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFilteredSongs } from '../../../store/songSlice';
import { setTrack } from '../../../store/playerSlice';
import { RootState, AppDispatch } from '../../../store/store';
import SongListElement from './SongListItem';

import { MdAccessTime } from "react-icons/md";
import { TbPlaylist } from "react-icons/tb";

export default function SongList() {
  const dispatch = useDispatch<AppDispatch>();
  const { filter } = useSelector((state: RootState) => state.songs);
  const { selectedPlaylistId, selectedPlaylist } = useSelector((state: RootState) => state.player);

  useEffect(() => {
    dispatch(fetchFilteredSongs(filter));
  }, [dispatch, filter]);


  const handlePlaySong = (song: any) => {
    dispatch(setTrack(song));
  };

  const handleMenuClick = (songId: string, event: React.MouseEvent) => {
    console.log('Menu clicked for song:', songId);
  };

  if (selectedPlaylistId) {
    return (
      <div className="pt-8 overflow-y-auto h-full">
        <div className="px-4 sm:px-6 lg:px-8">
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
                    {selectedPlaylist?.playlistSongs.length} song(s)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Songs Table */}
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="relative min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-4 text-left text-sm font-semibold text-white">
                        #
                      </th>
                      <th scope="col" className="pl-1 py-4 text-left text-sm font-semibold text-white">
                        Title
                      </th>
                      <th scope="col" className="pl-3 py-4 text-left text-sm font-semibold text-white">
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
                        onMenuClick={handleMenuClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}