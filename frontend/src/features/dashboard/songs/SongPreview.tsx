import { useSelector, useDispatch } from 'react-redux';
import { MdMusicNote, MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { IoMusicalNotes } from 'react-icons/io5';

import { RootState, AppDispatch } from '../../../store/store';
import { setTrack } from '../../../store/playerSlice';
import { likeSong, unlikeSong } from '../../../store/songSlice';
import { useImageColor } from '../../../hooks/useImageColor';
import { useContextMenu } from '../../../components/ContextMenu/useContextMenu';

export default function SongPreview({ currentTrack }: { currentTrack: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const { queue } = useSelector((state: RootState) => state.player);
  const likedSongIds = useSelector((state: RootState) => state.songs.likedSongIds);
  const accentColor = useImageColor(currentTrack.coverUrl);
  const { showContextMenuAt } = useContextMenu();

  const isLiked = likedSongIds.includes(currentTrack.id);

  const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
  const upNext = currentIndex >= 0 ? queue.slice(currentIndex + 1) : [];

  const panelStyle = accentColor
    ? { background: `linear-gradient(to bottom, ${accentColor}bb 0%, #0f0f1a55 100%)` }
    : undefined;

  const nowPlayingData = {
    song: { ...currentTrack, thumbnail: currentTrack.coverUrl || '' },
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    showContextMenuAt(rect.left, rect.bottom + 4, 'now-playing', nowPlayingData);
  };

  return (
    <div
      className="rounded-md bg-gradient-to-b from-shadow/70 to-shadow/30 pt-3 px-3 mx-2 mt-3.5 h-full flex flex-col overflow-hidden transition-[background] duration-700"
      style={panelStyle}
    >
      {/* Cover art */}
      <div className="flex justify-center items-center mb-4 rounded-md h-52 w-full text-white overflow-hidden shrink-0">
        {currentTrack.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <MdMusicNote size={140} />
        )}
      </div>

      {/* Track info + action buttons */}
      <div className="flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <p className="text-xl font-bold text-white truncate">{currentTrack.title}</p>
          <p className="text-sm text-gray-400 font-medium truncate">{currentTrack.artist}</p>
          {currentTrack.album && (
            <p className="text-xs text-gray-500 truncate">{currentTrack.album}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={() => dispatch(isLiked ? unlikeSong(currentTrack.id) : likeSong(currentTrack.id))}
            aria-label={isLiked ? 'Unlike song' : 'Like song'}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            {isLiked
              ? <MdFavorite size={20} className="text-red-400" />
              : <MdFavoriteBorder size={20} className="text-silver" />
            }
          </button>
          <button
            onClick={handleMenuClick}
            aria-label="More options"
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <HiOutlineDotsHorizontal size={20} className="text-silver" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-3 shrink-0" />

      {/* Up Next */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <p className="text-xs font-bold text-silver uppercase tracking-widest mb-2">Up Next</p>
        {upNext.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Queue is empty</p>
        ) : (
          <ul className="space-y-1">
            {upNext.map((track, i) => (
              <li key={`${track.id}-${i}`}>
                <button
                  onClick={() => dispatch(setTrack(track))}
                  className="w-full flex items-center gap-2 px-1 py-1.5 rounded hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <IoMusicalNotes size={14} className="text-amethyst" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate group-hover:text-amethyst transition-colors">
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
