import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFilteredSongs } from '../../../store/songSlice';
import { setTrack, setQueue, setShuffle } from '../../../store/playerSlice';
import { RootState, AppDispatch } from '../../../store/store';
import SongListElement from './SongListItem';
import ArtistView from './ArtistView';
import SongCard from '../../../components/SongCard';
import ViewToggle, { useViewMode } from '../../../components/ViewToggle';
import PlayShuffleButtons from '../../../components/PlayShuffleButtons';
import { useContextMenu } from '../../../components/ContextMenu/useContextMenu';
import { shuffleArray } from '../../../utils/shuffleArray';

import { MdAccessTime } from 'react-icons/md';
import { TbPlaylist } from 'react-icons/tb';
import { IoMusicalNotes } from 'react-icons/io5';

export default function SongList() {
  const dispatch = useDispatch<AppDispatch>();
  const { filter, songs } = useSelector((state: RootState) => state.songs);
  const { selectedPlaylistId, selectedPlaylist } = useSelector((state: RootState) => state.player);
  const { showContextMenu } = useContextMenu();
  const [viewMode, setViewMode] = useViewMode();

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
    const allTracks = selectedPlaylistId && selectedPlaylist?.playlistSongs
      ? selectedPlaylist.playlistSongs.map((ps: any) => normaliseTrack(ps.song))
      : songs.map(normaliseTrack);
    dispatch(setQueue(allTracks));
    dispatch(setTrack(track));
  };

  // All Songs play/shuffle
  const handlePlayAll = () => {
    if (!songs.length) return;
    const tracks = songs.map(normaliseTrack);
    dispatch(setShuffle(false));
    dispatch(setQueue(tracks));
    dispatch(setTrack(tracks[0]));
  };

  const handleShuffleAll = () => {
    if (!songs.length) return;
    const shuffled = shuffleArray(songs.map(normaliseTrack));
    dispatch(setShuffle(true));
    dispatch(setQueue(shuffled));
    dispatch(setTrack(shuffled[0]));
  };

  // Playlist play/shuffle
  const handlePlayPlaylist = () => {
    const pSongs = selectedPlaylist?.playlistSongs;
    if (!pSongs?.length) return;
    const tracks = pSongs.map((ps: any) => normaliseTrack(ps.song));
    dispatch(setShuffle(false));
    dispatch(setQueue(tracks));
    dispatch(setTrack(tracks[0]));
  };

  const handleShufflePlaylist = () => {
    const pSongs = selectedPlaylist?.playlistSongs;
    if (!pSongs?.length) return;
    const shuffled = shuffleArray(pSongs.map((ps: any) => normaliseTrack(ps.song)));
    dispatch(setShuffle(true));
    dispatch(setQueue(shuffled));
    dispatch(setTrack(shuffled[0]));
  };

  if (filter.type === 'artist' && !!filter.value) {
    return <ArtistView />;
  }

  if (selectedPlaylistId) {
    const playlistSongs = selectedPlaylist?.playlistSongs ?? [];
    const playlistTotal = playlistSongs.reduce((acc: number, ps: any) => acc + (ps.song?.duration ?? 0), 0);

    return (
      <div className="flex flex-col h-full overflow-hidden pt-8">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <TbPlaylist size={64} className="text-amethyst shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-silver uppercase tracking-widest">Playlist</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-2xl sm:text-4xl font-extrabold text-white truncate">
                  {selectedPlaylist?.title}
                </p>
                {/* Mobile: compact round buttons next to title */}
                <div className="lg:hidden">
                  <PlayShuffleButtons compact onPlay={handlePlayPlaylist} onShuffle={handleShufflePlaylist} disabled={!playlistSongs.length} />
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
                {playlistTotal > 0 ? ` • ${formatTotalDuration(playlistTotal)}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: desktop = play/shuffle + toggle, mobile = toggle only */}
        <div className="flex justify-end lg:justify-between px-4 sm:px-6 lg:px-8 pt-4 pb-2 shrink-0">
          <div className="hidden lg:block">
            <PlayShuffleButtons onPlay={handlePlayPlaylist} onShuffle={handleShufflePlaylist} disabled={!playlistSongs.length} />
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'list' ? (
            <div className="px-4 sm:px-6 lg:px-8">
              <table className="relative min-w-full divide-y divide-gray-300">
                <thead className="sticky top-0">
                  <tr>
                    <th scope="col" className="hidden md:table-cell py-4 w-8 text-left text-sm font-semibold text-white">#</th>
                    <th scope="col" className="pl-1 py-4 w-1/3 text-left text-sm font-semibold text-white">Title</th>
                    <th scope="col" className="hidden md:table-cell pl-3 py-4 w-1/3 text-left text-sm font-semibold text-white">Album</th>
                    <th scope="col" className="hidden md:table-cell pl-3 py-4 text-left text-sm font-semibold text-white">Date Added</th>
                    <th scope="col" className="py-4 pl-3 pr-4 sm:pr-0">
                      <MdAccessTime size={20} className="text-white hidden md:block" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-transparent">
                  {playlistSongs.map((ps: any) => (
                    <SongListElement key={ps.id} playlistSong={ps} onPlay={handlePlaySong} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 sm:px-6 lg:px-8 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlistSongs.map((ps: any) => (
                <SongCard
                  key={ps.id}
                  title={ps.song.title}
                  artist={ps.song.artist}
                  thumbnail={ps.song.thumbnail || ps.song.coverImageUrl || ''}
                  onClick={() => handlePlaySong(ps.song)}
                  onContextMenu={(e) => showContextMenu(e, 'playlist-song', ps)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // All Songs view
  const allTotal = songs.reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden pt-8">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <IoMusicalNotes size={64} className="text-amethyst shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-silver uppercase tracking-widest">Library</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-2xl sm:text-4xl font-extrabold text-white">All Songs</p>
              {/* Mobile: compact round buttons next to title */}
              <div className="lg:hidden">
                <PlayShuffleButtons compact onPlay={handlePlayAll} onShuffle={handleShuffleAll} disabled={!songs.length} />
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              {allTotal > 0 ? ` • ${formatTotalDuration(allTotal)}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: desktop = play/shuffle + toggle, mobile = toggle only */}
      <div className="flex justify-end lg:justify-between px-4 sm:px-6 lg:px-8 pt-4 pb-2 shrink-0">
        <div className="hidden lg:block">
          <PlayShuffleButtons onPlay={handlePlayAll} onShuffle={handleShuffleAll} disabled={!songs.length} />
        </div>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          <div className="px-4 sm:px-6 lg:px-8">
            <table className="relative min-w-full divide-y divide-gray-300">
              <thead className="sticky top-0">
                <tr>
                  <th scope="col" className="hidden md:table-cell py-4 w-8 text-left text-sm font-semibold text-white">#</th>
                  <th scope="col" className="pl-1 py-4 w-1/3 text-left text-sm font-semibold text-white">Title</th>
                  <th scope="col" className="hidden md:table-cell pl-3 py-4 w-1/3 text-left text-sm font-semibold text-white">Album</th>
                  <th scope="col" className="hidden md:table-cell pl-3 py-4 text-left text-sm font-semibold text-white">Date Added</th>
                  <th scope="col" className="py-4 pl-3 pr-4 sm:pr-0">
                    <MdAccessTime size={20} className="text-white hidden md:block" />
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
                      song: { ...song, thumbnail: song.coverImageUrl || song.thumbnail || '' },
                    }}
                    onPlay={handlePlaySong}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {songs.map((song, index) => (
              <SongCard
                key={song.id}
                title={song.title}
                artist={song.artist}
                thumbnail={song.coverImageUrl || song.thumbnail || ''}
                onClick={() => handlePlaySong(song)}
                onContextMenu={(e) => showContextMenu(e, 'playlist-song', {
                  id: song.id,
                  position: index + 1,
                  addedAt: song.uploadedAt,
                  song: { ...song, thumbnail: song.coverImageUrl || song.thumbnail || '' },
                })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
