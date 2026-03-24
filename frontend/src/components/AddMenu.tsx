import { useState, useRef, useEffect, useCallback } from 'react';
import { useUploadSong } from './UploadSongModal';

const menuItems = [
  { id: 'upload-song', label: 'Upload Song', icon: '🎵' },
  { id: 'create-playlist', label: 'Create Playlist', icon: '📁' },
] as const;

type MenuItemId = (typeof menuItems)[number]['id'];

export default function AddMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showUploadSong } = useUploadSong();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  const handleSelect = useCallback((id: MenuItemId) => {
    setOpen(false);
    switch (id) {
      case 'upload-song':
        showUploadSong();
        break;
      case 'create-playlist':
        // TODO: wire create playlist
        console.log('Create Playlist');
        break;
    }
  }, [showUploadSong]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-8 h-8 flex justify-center rounded-full bg-amethyst hover:bg-amethyst/80 text-white text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amethyst/50"
        aria-label="Add new"
      >
        +
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-shadow border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[9999] animate-scale-up">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-amethyst/20 transition-colors text-left"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
