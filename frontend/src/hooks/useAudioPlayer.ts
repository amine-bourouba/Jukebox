import { useRef, useState, useEffect } from 'react';

export function useAudioPlayer(streamUrl: string, token?: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (streamUrl && token) {
      fetch(streamUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch audio');
          return res.blob();
        })
        .then(blob => {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        })
        .catch(err => {
          setBlobUrl(null);
          console.error('Audio fetch error:', err);
        });
    } else {
      setBlobUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [streamUrl, token]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

    const updateProgress = () => setProgress(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
    };
  }, [blobUrl]);

  const play = () => {
    const audio = audioRef.current;
    if (audio && blobUrl) {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error("Audio play error:", err);
        setIsPlaying(false);
      });
    }
  };

  const pause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (audio && duration) {
      audio.currentTime = time;
      setProgress(time);
    }
  };

  return {
    audioRef,
    isPlaying,
    play,
    pause,
    progress,
    duration,
    seek,
    blobUrl,
  };
}