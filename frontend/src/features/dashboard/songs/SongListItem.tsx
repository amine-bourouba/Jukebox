import React, { useState } from 'react';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { IoMusicalNotes } from 'react-icons/io5';
import { useContextMenu } from '../../../components/ContextMenu/useContextMenu';

interface SongListElementProps {
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
}

export default function SongListElement({
  playlistSong,
  onPlay,
}: SongListElementProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { showContextMenu, showContextMenuAt } = useContextMenu();

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
    if (h > 0) return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
    return [m, s].map((v) => v.toString().padStart(2, '0')).join(':');
  };

  const handleRowClick = () => onPlay(playlistSong.song);
  const handleContextMenu = (event: React.MouseEvent) =>
    showContextMenu(event, 'playlist-song', playlistSong);

  const handleMenuButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    showContextMenuAt(rect.left, rect.bottom + 4, 'playlist-song', playlistSong);
  };

  return (
    <tr
      className="h-14 group cursor-pointer hover:bg-white/5 transition-colors duration-200"
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Position — desktop only */}
      <td className="hidden md:table-cell whitespace-nowrap pr-2 text-sm">
        <span className="text-white">{playlistSong.position}</span>
      </td>

      {/* Title & Artist */}
      <td className="whitespace-nowrap pl-2 pr-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 rounded overflow-hidden bg-white/10 flex items-center justify-center">
            {playlistSong.song.thumbnail ? (
              <img
                alt={`${playlistSong.song.title} thumbnail`}
                src={playlistSong.song.thumbnail}
                className="size-10 object-cover"
              />
            ) : (
              <IoMusicalNotes size={16} className="text-amethyst" />
            )}
          </div>
          <div>
            <div className="font-medium text-white leading-tight">{playlistSong.song.title}</div>
            <div className="text-gray-400 text-xs mt-0.5">{playlistSong.song.artist}</div>
          </div>
        </div>
      </td>

      {/* Album — desktop only */}
      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm">
        <span className="text-white">{playlistSong.song.album}</span>
      </td>

      {/* Date Added — desktop only */}
      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm">
        <span className="text-white">{formatDate(playlistSong.addedAt)}</span>
      </td>

      {/* Duration + Menu */}
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <div className="flex items-center justify-end gap-2">
          <span className="text-white hidden md:inline">{formatDuration(playlistSong.song.duration)}</span>
          {/* On mobile: always visible. On desktop: hover-only */}
          <button
            className={`p-1.5 rounded-full transition-all duration-200 hover:bg-white/10 focus:bg-white/10 focus:outline-none
              md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto`}
            onClick={handleMenuButtonClick}
            aria-label="More options"
          >
            <HiOutlineDotsHorizontal className="text-xl text-white" />
          </button>
        </div>
      </td>
    </tr>
  );
}
