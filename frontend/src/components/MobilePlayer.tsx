import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  MdPlayArrow, MdPause, MdSkipNext, MdSkipPrevious,
  MdShuffle, MdRepeat, MdRepeatOne, MdFavorite, MdFavoriteBorder,
  MdExpandMore, MdQueueMusic,
} from 'react-icons/md';
import { IoMusicalNotes } from 'react-icons/io5';

import { RootState } from '../store/store';
import { setTrack, setRepeat, setShuffle, toggleQueue } from '../store/playerSlice';
import { likeSong, unlikeSong } from '../store/songSlice';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useIsMobile } from '../hooks/useIsMobile';

export default function MobilePlayer() {
  const dispatch = useDispatch();
  const { currentTrack, queue, repeat, shuffle } = useSelector((state: RootState) => state.player);
  const token = useSelector((state: RootState) => state.auth.token);
  const likedSongIds = useSelector((state: RootState) => state.songs.likedSongIds);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const streamUrl = `${apiBase}/songs/${currentTrack?.id}/stream`;

  const { audioRef, isPlaying, play, pause, progress, duration, seek, blobUrl } =
    useAudioPlayer((isMobile && currentTrack?.id) ? streamUrl : '', token ?? '');

  const isLiked = currentTrack ? likedSongIds.includes(currentTrack.id) : false;
  // The exact currentTrack reference at first mount (from localStorage hydration).
  // Autoplay is skipped only for that reference to avoid NotAllowedError on page
  // load. Any subsequent setTrack dispatch creates a new reference → plays, even
  // when the id matches (e.g. Play All on the already-loaded track).
  const hydratedTrackRef = useRef(currentTrack);

  const formatTime = (sec: number) =>
    isNaN(sec) ? '0:00' : `${Math.floor(sec / 60)}:${('0' + Math.floor(sec % 60)).slice(-2)}`;

  const toggleRepeat = useCallback(() => {
    dispatch(setRepeat(repeat === 'off' ? 'one' : repeat === 'one' ? 'all' : 'off'));
  }, [dispatch, repeat]);

  const handleNext = useCallback(() => {
    if (!queue.length) return;
    let idx = queue.findIndex((t) => t.id === currentTrack?.id) + 1;
    if (shuffle) idx = Math.floor(Math.random() * queue.length);
    else if (idx >= queue.length) idx = repeat === 'all' ? 0 : queue.length - 1;
    dispatch(setTrack(queue[idx]));
  }, [dispatch, queue, currentTrack, shuffle, repeat]);

  const handlePrev = useCallback(() => {
    if (!queue.length) return;
    let idx = queue.findIndex((t) => t.id === currentTrack?.id) - 1;
    if (shuffle) idx = Math.floor(Math.random() * queue.length);
    else if (idx < 0) idx = repeat === 'all' ? queue.length - 1 : 0;
    dispatch(setTrack(queue[idx]));
  }, [dispatch, queue, currentTrack, shuffle, repeat]);

  const handleEnded = useCallback(() => {
    if (repeat === 'one') { seek(0); play(); } else handleNext();
  }, [repeat, seek, play, handleNext]);

  useEffect(() => {
    if (!blobUrl || !audioRef.current) return;
    if (currentTrack === hydratedTrackRef.current) return;
    // Rewind so re-dispatching setTrack on the already-loaded song (e.g. Play All
    // on a playlist whose first track is the current one) visibly restarts.
    if (audioRef.current.readyState >= 1) {
      audioRef.current.currentTime = 0;
    }
    play();
  }, [blobUrl, currentTrack]);

  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  if (!currentTrack) return null;

  const coverSrc = currentTrack.coverUrl
    ? `${apiBase.replace('/api', '')}/${currentTrack.coverUrl}`
    : null;

  return (
    <>
      {blobUrl && (
        <audio ref={audioRef} src={blobUrl} preload="auto" onEnded={handleEnded} />
      )}

      {/* ── Mini bar (always visible on mobile when track loaded) ── */}
      {!expanded && (
        <div
          className="lg:hidden fixed bottom-14 left-0 right-0 bg-shadow border-t border-white/10 z-20 flex items-center px-3 py-2 gap-3 cursor-pointer"
          onClick={() => setExpanded(true)}
          role="button"
          aria-label="Open player"
        >
          <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
            {coverSrc
              ? <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover" />
              : <IoMusicalNotes size={18} className="text-amethyst" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
            <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
          </div>
          {/* Stop propagation so tapping play/pause doesn't open full-screen */}
          <button
            onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : play(); }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="p-1 text-white"
          >
            {isPlaying ? <MdPause size={28} /> : <MdPlayArrow size={28} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            aria-label="Next"
            className="p-1 text-silver"
          >
            <MdSkipNext size={26} />
          </button>
        </div>
      )}

      {/* ── Full-screen player overlay ── */}
      {expanded && (
        <div className="lg:hidden fixed inset-0 bg-midnight z-30 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-10 pb-2 shrink-0">
            <button onClick={() => setExpanded(false)} aria-label="Collapse player" className="text-silver p-2">
              <MdExpandMore size={30} />
            </button>
            <div className="text-center">
              <p className="text-xs text-silver uppercase tracking-widest">Now Playing</p>
            </div>
            <div className="w-10" /> {/* spacer */}
          </div>

          {/* Cover art — square, takes most of the screen */}
          <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
            <div className="w-full aspect-square max-h-full rounded-2xl overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
              {coverSrc
                ? <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover" />
                : <IoMusicalNotes size={80} className="text-amethyst" />}
            </div>
          </div>

          {/* Bottom section — fixed height */}
          <div className="px-6 pb-10 shrink-0 space-y-5">
            {/* Track info + like */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <p className="text-xl font-bold text-white truncate">{currentTrack.title}</p>
                <p className="text-sm text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => dispatch(isLiked ? unlikeSong(currentTrack.id) : likeSong(currentTrack.id))}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                className="p-2 shrink-0"
              >
                {isLiked
                  ? <MdFavorite size={26} className="text-red-400" />
                  : <MdFavoriteBorder size={26} className="text-silver" />}
              </button>
            </div>

            {/* Progress bar */}
            <div>
              <div
                className="w-full h-8 flex items-center cursor-pointer"
                onClick={handleSeekBar}
                role="slider"
                aria-label="Seek"
              >
                <div className="w-full bg-white/20 h-1 rounded-full relative">
                  <div
                    className="bg-white h-1 rounded-full absolute top-0 left-0"
                    style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-silver -mt-1">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch(setShuffle(!shuffle))}
                className={`p-2 ${shuffle ? 'text-amethyst' : 'text-silver'}`}
                aria-label="Shuffle"
              >
                <MdShuffle size={24} />
              </button>
              <button onClick={handlePrev} className="p-2 text-white" aria-label="Previous">
                <MdSkipPrevious size={40} />
              </button>
              <button
                onClick={isPlaying ? pause : play}
                className="bg-white rounded-full p-3 text-midnight shadow-lg"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <MdPause size={40} /> : <MdPlayArrow size={40} />}
              </button>
              <button onClick={handleNext} className="p-2 text-white" aria-label="Next">
                <MdSkipNext size={40} />
              </button>
              <button
                onClick={toggleRepeat}
                className={`p-2 ${repeat !== 'off' ? 'text-amethyst' : 'text-silver'}`}
                aria-label="Repeat"
              >
                {repeat === 'one' ? <MdRepeatOne size={24} /> : <MdRepeat size={24} />}
              </button>
            </div>

            {/* Queue icon */}
            <div className="flex justify-end">
              <button
                onClick={() => dispatch(toggleQueue())}
                aria-label="Show queue"
                className="p-1 text-silver/50 hover:text-silver transition-colors"
              >
                <MdQueueMusic size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
