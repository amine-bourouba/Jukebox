import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFilteredSongs } from '../../store/songSlice';
import { setTrack } from '../../store/playerSlice';
import { RootState, AppDispatch } from '../../store/store';

import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { MdAccessTime } from "react-icons/md";
import { TbPlaylist } from "react-icons/tb";

export default function SongList() {
  const dispatch = useDispatch<AppDispatch>();
  const { filter } = useSelector((state: RootState) => state.songs);
  const { selectedPlaylistId, selectedPlaylist } = useSelector((state: RootState) => state.player);

  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchFilteredSongs(filter));
  }, [dispatch, filter]);

  const handlePlaySong = (songObj: any) => {
    dispatch(setTrack(songObj));
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10); // yyyy-mm-dd
  }

  function formatDuration(seconds: number | string): string {
    let sec = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
    if (isNaN(sec) || sec < 0) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    // If hours are zero, omit them
    if (h > 0) {
      return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    }
    return [m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
  if (selectedPlaylistId) {
    return (
      <div className="pt-8 overflow-y-auto h-full">
        <div className="px-4 sm:px-6 lg:px-8">
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
                  <p className="mt-1 text-gray-500">{selectedPlaylist?.playlistSongs.length} song(s)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="relative min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-4 text-left text-sm font-semibold sm:pl-0 text-white"
                      >
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
                    {selectedPlaylist?.playlistSongs.map((el) => (
                      <tr key={el.id}
                        onClick={() => handlePlaySong(el.song)}
                        className="h-16 group"
                        onMouseEnter={() => setHoveredRow(el.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="whitespace-nowrap pr-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-white">{el.position}</span>
                        </td>
                        <td className="whitespace-nowrap pl-4 pr-3 text-sm sm:pl-0">
                          <div className="flex items-center">
                            <div className="size-8 shrink-0">
                              <img
                                alt=""
                                src={el.song.thumbnail}
                                className="size-8 rounded-full dark:outline dark:outline-white/10"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-white">{el.song.title}</div>
                              <div className="mt-1 text-gray-500 dark:text-gray-400">{el.song.artist}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-white">{el.song.album}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-white">{formatDate(el.addedAt)}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-400 relative">
                          <span className="flex items-center gap-2">
                            <span className="text-white">{formatDuration(el.song.duration)}</span>
                            <button
                              className={`
                                p-1 rounded-full transition-opacity duration-200
                                ${hoveredRow === el.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                              `}
                              onClick={e => {
                                e.stopPropagation();
                                // handle menu open here
                              }}
                              tabIndex={hoveredRow === el.id ? 0 : -1}
                              style={{ minWidth: 32, minHeight: 32 }}
                            >
                              <HiOutlineDotsHorizontal className="text-xl text-white" />
                            </button>
                          </span>
                        </td>
                      </tr>
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
}