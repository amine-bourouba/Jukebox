import { MdPlayArrow, MdShuffle } from 'react-icons/md';

interface PlayShuffleButtonsProps {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
  /** compact=true → round icon-only buttons (mobile). compact=false → pill with text (desktop). */
  compact?: boolean;
}

export default function PlayShuffleButtons({ onPlay, onShuffle, disabled = false, compact = false }: PlayShuffleButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPlay}
        disabled={disabled}
        aria-label="Play all"
        className={`flex items-center justify-center bg-amethyst text-moon rounded-full transition-colors hover:bg-amethyst/80 disabled:opacity-40 disabled:cursor-not-allowed ${
          compact
            ? 'w-9 h-9'
            : 'h-9 px-2'
        }`}
      >
        <MdPlayArrow size={20} />
      </button>
      <button
        onClick={onShuffle}
        disabled={disabled}
        aria-label="Shuffle"
        className={`flex items-center justify-center border border-amethyst/60 text-amethyst rounded-full transition-colors hover:bg-amethyst/10 disabled:opacity-40 disabled:cursor-not-allowed ${
          compact
            ? 'w-9 h-9'
            : 'h-9 px-2'
        }`}
      >
        <MdShuffle size={18} />
      </button>
    </div>
  );
}
