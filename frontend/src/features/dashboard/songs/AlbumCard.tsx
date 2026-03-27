import { IoAlbums } from 'react-icons/io5';
import { MdPlayArrow } from 'react-icons/md';

interface AlbumCardProps {
  albumName: string;
  songCount: number;
  coverUrl?: string;
  onClick: () => void;
}

export default function AlbumCard({ albumName, songCount, coverUrl, onClick }: AlbumCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left group w-full rounded-lg p-2 hover:bg-white/5 transition-colors"
    >
      {/* Album art */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-shadow mb-3">
        {coverUrl ? (
          <img src={coverUrl} alt={albumName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoAlbums size={56} className="text-amethyst/50" />
          </div>
        )}

        {/* Play button slides up on hover */}
        <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <div className="bg-amethyst rounded-full p-2 shadow-lg">
            <MdPlayArrow size={20} className="text-moon" />
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="px-1">
        <div className="text-white font-semibold text-sm truncate">{albumName}</div>
        <div className="text-silver text-xs mt-0.5">
          {songCount} {songCount === 1 ? 'song' : 'songs'} • Album
        </div>
      </div>
    </button>
  );
}
