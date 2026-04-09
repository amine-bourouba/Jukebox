import { useState } from 'react';
import { MdFormatListBulleted, MdGridView } from 'react-icons/md';

export type ViewMode = 'list' | 'grid';

const STORAGE_KEY = 'viewMode';

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'list'
  );
  const set = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
  };
  return [mode, set];
}

export default function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
      <button
        onClick={() => onChange('list')}
        aria-label="List view"
        className={`p-1.5 rounded transition-colors ${mode === 'list' ? 'bg-amethyst text-moon' : 'text-silver hover:text-white'}`}
      >
        <MdFormatListBulleted size={18} />
      </button>
      <button
        onClick={() => onChange('grid')}
        aria-label="Grid view"
        className={`p-1.5 rounded transition-colors ${mode === 'grid' ? 'bg-amethyst text-moon' : 'text-silver hover:text-white'}`}
      >
        <MdGridView size={18} />
      </button>
    </div>
  );
}
