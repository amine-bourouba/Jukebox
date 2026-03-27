import { MdPlayArrow, MdShuffle } from 'react-icons/md';
import { IoPersonCircleOutline } from 'react-icons/io5';

interface ArtistHeroProps {
  artistName: string;
  songCount: number;
  onPlay: () => void;
  onShuffle: () => void;
}

export default function ArtistHero({ artistName, songCount, onPlay, onShuffle }: ArtistHeroProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 flex-shrink-0 pb-6">
      <div className="flex items-end gap-6">
        {/* Avatar placeholder — replaced with real image in Phase 3 */}
        <div className="shrink-0 w-44 h-44 rounded-full bg-shadow/80 flex items-center justify-center text-amethyst shadow-2xl">
          <IoPersonCircleOutline size={120} />
        </div>

        {/* Artist info + actions */}
        <div className="flex flex-col gap-2 pb-2">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Artist</p>
          <h1 className="text-6xl font-extrabold text-white leading-tight">{artistName}</h1>
          <p className="text-silver text-sm">
            {songCount} {songCount === 1 ? 'song' : 'songs'}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onPlay}
              aria-label="Play all songs"
              className="bg-amethyst hover:bg-amethyst/80 active:scale-95 text-moon rounded-full p-3 shadow-lg transition-transform hover:scale-105"
            >
              <MdPlayArrow size={32} />
            </button>
            <button
              onClick={onShuffle}
              aria-label="Shuffle songs"
              className="text-silver hover:text-moon transition-colors"
            >
              <MdShuffle size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
