import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  MdPlayArrow, MdPause, MdSkipNext, MdSkipPrevious,
  MdShuffle, MdRepeat, MdRepeatOne, MdFavorite, MdFavoriteBorder,
  MdExpandMore, MdQueueMusic,
} from 'react-icons/md';
import { IoMusicalNotes } from 'react-icons/io5';

import { RootState } from '../store/store';
import { setTrack, setRepeat, setShuffle } from '../store/playerSlice';
import { likeSong, unlikeSong } from '../store/songSlice';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

export default function MobilePlayer() {
  const dispatch = useDispatch();
  const { currentTrack, queue, repeat, shuffle } = useSelector((state: RootState) => state.player);
  const token = useSelector((state: RootState) => state.auth.token);
  const likedSongIds = useSelector((state: RootState) => state.songs.likedSongIds);
  const [expanded, setExpanded] = useState(false);

  const streamUrl = `${import.meta.env.VITE_API_URL}/songs/${currentTrack?.id}/stream`;

  const { audioRef, isPlaying, play, pause, progress, duration, seek, blobUrl } =
    useAudioPlayer(currentTrack?.id ? streamUrl : '', token ?? '');

  const isLiked = currentTrack ? likedSongIds.includes(currentTrack.id) : false;

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

  useEffect(() => { if (blobUrl && audioRef.current) play(); }, [blobUrl]);

  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  if (!currentTrack) return null;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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
          className="md:hidden fixed bottom-14 left-0 right-0 bg-shadow border-t border-white/10 z-20 flex items-center px-3 py-2 gap-3 cursor-pointer"
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
        <div className="md:hidden fixed inset-0 bg-midnight z-30 flex flex-col px-6 pt-10 pb-8 overflow-y-auto">
          {/* Collapse handle */}
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 left-1/2 -translate-x-1/2 text-silver"
            aria-label="Collapse player"
          >
            <MdExpandMore size={36} />
          </button>

          {/* Cover art */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
              {coverSrc
                ? <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover" />
                : <IoMusicalNotes size={80} className="text-amethyst" />}
            </div>
          </div>

          {/* Track info + like */}
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <p className="text-xl font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
            <button
              onClick={() => dispatch(isLiked ? unlikeSong(currentTrack.id) : likeSong(currentTrack.id))}
              aria-label={isLiked ? 'Unlike' : 'Like'}
              className="p-2 shrink-0"
            >
              {isLiked
                ? <MdFavorite size={24} className="text-red-400" />
                : <MdFavoriteBorder size={24} className="text-silver" />}
            </button>
          </div>

          {/* Progress bar — taller touch target */}
          <div className="mb-2">
            <div
              className="w-full h-6 flex items-center cursor-pointer"
              onClick={handleSeekBar}
              role="slider"
              aria-label="Seek"
            >
              <div className="w-full bg-white/10 h-1 rounded-full relative">
                <div
                  className="bg-amethyst h-1 rounded-full absolute top-0 left-0"
                  style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-silver">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => dispatch(setShuffle(!shuffle))}
              className={shuffle ? 'text-amethyst' : 'text-silver'}
              aria-label="Shuffle"
            >
              <MdShuffle size={26} />
            </button>
            <button onClick={handlePrev} className="text-white" aria-label="Previous">
              <MdSkipPrevious size={36} />
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="bg-amethyst rounded-full p-3 text-white shadow-lg"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <MdPause size={40} /> : <MdPlayArrow size={40} />}
            </button>
            <button onClick={handleNext} className="text-white" aria-label="Next">
              <MdSkipNext size={36} />
            </button>
            <button
              onClick={toggleRepeat}
              className={repeat !== 'off' ? 'text-amethyst' : 'text-silver'}
              aria-label="Repeat"
            >
              {repeat === 'one' ? <MdRepeatOne size={26} /> : <MdRepeat size={26} />}
            </button>
          </div>

          {/* Queue hint */}
          <div className="flex justify-center">
            <MdQueueMusic size={20} className="text-silver/40" />
          </div>
        </div>
      )}
    </>
  );
}
