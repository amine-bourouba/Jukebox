import { IoMusicalNotes } from 'react-icons/io5';

interface SongCardProps {
  title: string;
  artist: string;
  thumbnail: string;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function SongCard({ title, artist, thumbnail, onClick, onContextMenu }: SongCardProps) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="group flex flex-col bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors text-left w-full"
    >
      <div className="aspect-square w-full overflow-hidden bg-white/10 flex items-center justify-center">
        {thumbnail
          ? <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <IoMusicalNotes size={40} className="text-amethyst" />}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{artist}</p>
      </div>
    </button>
  );
}
