import React, { useState } from 'react';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';


interface SongListItemProps {
  playlistSong: {
    id: string;
    position: number;
    addedAt: string;
    song: {
      id: string;
      title: string;
      artist: string;
      album: string;
      duration: number | string;
      thumbnail: string;
    };
  };
  onPlay: (song: any) => void;
  onMenuClick?: (songId: string, event: React.MouseEvent) => void;
}

export default function SongListItem({ 
  playlistSong, 
  onPlay, 
  onMenuClick 
}: SongListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const formatDuration = (seconds: number | string): string => {
    let sec = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
    if (isNaN(sec) || sec < 0) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    
    if (h > 0) {
      return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    }
    return [m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };


  const handleRowClick = () => {
    onPlay(playlistSong.song);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking menu button
    onMenuClick?.(playlistSong.id, e);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <tr
      className="h-16 group cursor-pointer hover:bg-white/5 transition-colors duration-200"
      onClick={handleRowClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Position Column */}
      <td className="whitespace-nowrap pr-3 text-sm">
        <span className="text-white">{playlistSong.position}</span>
      </td>

      {/* Title & Artist Column */}
      <td className="whitespace-nowrap pl-4 pr-3 text-sm sm:pl-0">
        <div className="flex items-center">
          <div className="size-8 shrink-0">
            <img
              alt={`${playlistSong.song.title} thumbnail`}
              src={playlistSong.song.thumbnail}
              className="size-8 rounded-full dark:outline dark:outline-white/10"
            />
          </div>
          <div className="ml-4">
            <div className="font-medium text-white">{playlistSong.song.title}</div>
            <div className="mt-1 text-gray-400">{playlistSong.song.artist}</div>
          </div>
        </div>
      </td>

      {/* Album Column */}
      <td className="whitespace-nowrap px-3 py-5 text-sm">
        <span className="text-white">{playlistSong.song.album}</span>
      </td>

      {/* Date Added Column */}
      <td className="whitespace-nowrap px-3 py-5 text-sm">
        <span className="text-white">{formatDate(playlistSong.addedAt)}</span>
      </td>

      {/* Duration & Menu Column */}
      <td className="whitespace-nowrap px-3 py-5 text-sm relative">
        <div className="flex items-center justify-between">
          <span className="text-white">{formatDuration(playlistSong.song.duration)}</span>

          <button
            className={`
              ml-2 p-1 rounded-full transition-all duration-200
              hover:bg-white/10
              ${isHovered 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
              }
            `}
            onClick={handleMenuClick}
            aria-label="More options"
            tabIndex={isHovered ? 0 : -1}
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <HiOutlineDotsHorizontal className="text-xl text-white" />
          </button>
        </div>
      </td>
    </tr>
  );
}