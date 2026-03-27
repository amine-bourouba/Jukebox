import { IoAlbums } from 'react-icons/io5';
import SongListItem from './SongListItem';

export interface PlaylistSongShape {
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
}

interface AlbumSectionProps {
  albumName: string;
  songs: PlaylistSongShape[];
  onPlay: (song: any) => void;
}

export default function AlbumSection({ albumName, songs, onPlay }: AlbumSectionProps) {
  return (
    <>
      <tr>
        <td colSpan={5} className="pt-6 pb-2 px-0">
          <div className="flex items-center gap-2">
            <IoAlbums size={16} className="text-amethyst shrink-0" />
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              {albumName}
            </span>
            <div className="flex-1 h-px bg-white/10 ml-2" />
          </div>
        </td>
      </tr>
      {songs.map((playlistSong) => (
        <SongListItem
          key={playlistSong.id}
          playlistSong={playlistSong}
          onPlay={onPlay}
        />
      ))}
    </>
  );
}
