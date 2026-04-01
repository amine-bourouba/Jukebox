import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updateSong } from '../store/songSlice';

interface EditSongContextType {
  showEditSong: (song: any) => void;
}

interface FormData {
  title: string;
  artist: string;
  album: string;
}

const EditSongContext = createContext<EditSongContextType | null>(null);

export function EditSongModalProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [songId, setSongId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    artist: '',
    album: '',
  });

  const showEditSong = useCallback((song: any) => {
    setSongId(song.id);
    setFormData({
      title: song.title || '',
      artist: song.artist || '',
      album: song.album || '',
    });
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSongId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!songId) return;
    await dispatch(updateSong({ songId, data: formData }) as any);
    setIsOpen(false);
    setSongId(null);
  }, [dispatch, songId, formData]);

  const handleChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <EditSongContext.Provider value={{ showEditSong }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative bg-gradient-to-br from-midnight via-sapphire to-amethyst border border-white/10 rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">Edit Song Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Artist</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={e => handleChange('artist', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Album</label>
                <input
                  type="text"
                  value={formData.album}
                  onChange={e => handleChange('album', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst"
                />
              </div>

            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-amethyst hover:bg-amethyst/80 text-white font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </EditSongContext.Provider>
  );
}

export function useEditSong() {
  const context = useContext(EditSongContext);
  if (!context) {
    throw new Error('useEditSong must be used within an EditSongModalProvider');
  }
  return context;
}
