import { useSelector, useDispatch } from 'react-redux';
import { useState, useCallback, useEffect } from 'react';

import { RootState } from '../store/store';
import { setTrack, setRepeat, setShuffle } from '../store/playerSlice';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

import {
  MdShuffle,
  MdSkipPrevious,
  MdPlayArrow,
  MdPause,
  MdSkipNext,
  MdRepeat,
  MdRepeatOne,
  MdQueueMusic,
  MdVolumeUp,
} from 'react-icons/md';

export default function Player() {
  const dispatch = useDispatch();
  const { currentTrack, queue, repeat, shuffle } = useSelector((state: RootState) => state.player);
  const token = useSelector((state: RootState) => state.auth.token);
  const streamUrl = `${import.meta.env.VITE_API_URL}/songs/${currentTrack?.id}/stream`;

  const {
    audioRef,
    isPlaying,
    play,
    pause,
    progress,
    duration,
    seek,
    blobUrl,
  } = useAudioPlayer(currentTrack?.id ? streamUrl : '' , token ?? '');

  const [volume, setVolume] = useState(1);

  // Repeat/Shuffle Handlers
  const toggleRepeat = useCallback(() => {
    dispatch(setRepeat(repeat === 'off' ? 'one' : repeat === 'one' ? 'all' : 'off'));
  }, [dispatch, repeat]);

  const toggleShuffle = useCallback(() => {
    dispatch(setShuffle(!shuffle));
  }, [dispatch, shuffle]);

  // Next/Prev logic with shuffle/repeat
  const handleNext = useCallback(() => {
    if (!queue.length) return;
    let nextIndex = queue.findIndex(t => t.id === currentTrack?.id) + 1;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = repeat === 'all' ? 0 : queue.length - 1;
    }
    dispatch(setTrack(queue[nextIndex]));
  }, [dispatch, queue, currentTrack, shuffle, repeat]);

  const handlePrev = useCallback(() => {
    if (!queue.length) return;
    let prevIndex = queue.findIndex(t => t.id === currentTrack?.id) - 1;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else if (prevIndex < 0) {
      prevIndex = repeat === 'all' ? queue.length - 1 : 0;
    }
    dispatch(setTrack(queue[prevIndex]));
  }, [dispatch, queue, currentTrack, shuffle, repeat]);

  // On track end, handle repeat/shuffle
  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      seek(0);
      play();
    } else {
      handleNext();
    }
  }, [repeat, seek, play, handleNext]);

  // Format time helper
  const formatTime = (sec: number) =>
    isNaN(sec) ? '0:00' : `${Math.floor(sec / 60)}:${('0' + Math.floor(sec % 60)).slice(-2)}`;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
    if (audioRef.current) {
      audioRef.current.volume = Number(e.target.value);
    }
  };

  useEffect(() => {
    if (blobUrl && audioRef.current) {
      play();
    }
  }, [blobUrl]);

  return (
    <footer className="fixed bottom-0 w-4/5 bg-shadow bg-opacity-95 flex items-center justify-between px-6 py-4">
      {/* Audio element */}
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          preload="auto"
          onEnded={handleEnded}
        />
      )}

      {/* Track Info */}
      <div className="flex items-center gap-4 min-w-[200px]">
        {currentTrack?.coverUrl ? (
          <img src={currentTrack.coverUrl} alt="cover" className="w-12 h-12 rounded-lg shadow" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-shadow flex items-center justify-center text-amethyst">🎵</div>
        )}
        <div>
          <div className="text-silver font-semibold">{currentTrack?.title || 'No Track'}</div>
          <div className="text-amethyst text-sm">{currentTrack?.artist || ''}</div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col items-center flex-1 mx-4">
        <div className="flex items-center gap-6 mb-2">
          {/* Shuffle Button */}
          <button
            className={`hover:text-amethyst ${shuffle ? 'text-amethyst' : 'text-white'}`}
            onClick={toggleShuffle}
            title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
          >
            <MdShuffle size={28} />
          </button>
          <button className="text-silver hover:text-amethyst" onClick={handlePrev} title="Previous">
            <MdSkipPrevious size={32} />
          </button>
          {isPlaying ? (
            <button className="bg-amethyst text-moon rounded-full p-2 shadow-lg" onClick={pause} title="Pause">
              <MdPause size={40} />
            </button>
          ) : (
            <button className="bg-amethyst text-moon rounded-full p-2 shadow-lg" onClick={play} title="Play">
              <MdPlayArrow size={40} />
            </button>
          )}
          <button className="text-silver hover:text-amethyst" onClick={handleNext} title="Next">
            <MdSkipNext size={32} />
          </button>
          {/* Repeat Button */}
          <button
            className={`hover:text-amethyst ${repeat !== 'off' ? 'text-amethyst' : 'text-white'}`}
            onClick={toggleRepeat}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <MdRepeatOne size={28} /> : <MdRepeat size={28} />}
          </button>
        </div>
        {/* Progress Bar */}
        <div className="flex items-center w-full gap-2">
          <span className="text-silver text-xs">{formatTime(progress)}</span>
          <div className="flex-1 mx-2 cursor-pointer" onClick={handleSeek}>
            <div className="bg-shadow h-2 rounded-full relative">
              <div
                className="bg-amethyst h-2 rounded-full absolute top-0 left-0"
                style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <span className="text-silver text-xs">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Queue */}
      <div className="flex items-center gap-6 min-w-[180px] justify-end">
        <div className="flex items-center gap-2">
          <MdVolumeUp size={24} className="text-amethyst" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolume}
            className="w-20 h-1 accent-amethyst"
          />
        </div>
        <button className="text-silver hover:text-amethyst" title="Queue">
          <MdQueueMusic size={28} />
        </button>
      </div>
    </footer>
  );
}