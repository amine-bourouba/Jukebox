import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { createPlaylist, updatePlaylist } from '../store/playerSlice';
import { AppDispatch } from '../store/store';

interface PlaylistModalContextType {
  showCreatePlaylist: () => void;
  showEditPlaylist: (playlist: { id: string; title: string; description?: string }) => void;
}

interface FormData {
  title: string;
  description: string;
}

const PlaylistModalContext = createContext<PlaylistModalContextType | null>(null);

export function PlaylistModalProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ title: '', description: '' });

  const showCreatePlaylist = useCallback(() => {
    setMode('create');
    setPlaylistId(null);
    setFormData({ title: '', description: '' });
    setIsOpen(true);
  }, []);

  const showEditPlaylist = useCallback((playlist: { id: string; title: string; description?: string }) => {
    setMode('edit');
    setPlaylistId(playlist.id);
    setFormData({
      title: playlist.title || '',
      description: playlist.description || '',
    });
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPlaylistId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) return;
    if (mode === 'create') {
      await dispatch(createPlaylist({
        title: formData.title.trim(),
        ...(formData.description.trim() && { description: formData.description.trim() }),
      }));
    } else if (playlistId) {
      await dispatch(updatePlaylist({
        playlistId,
        data: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        },
      }));
    }
    setIsOpen(false);
    setPlaylistId(null);
  }, [dispatch, mode, playlistId, formData]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <PlaylistModalContext.Provider value={{ showCreatePlaylist, showEditPlaylist }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-stretch md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative bg-gradient-to-br from-midnight via-sapphire to-amethyst border border-white/10 shadow-2xl w-full p-6 animate-scale-up rounded-none h-full overflow-y-auto md:rounded-lg md:max-w-md md:mx-4 md:h-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {mode === 'create' ? 'Create Playlist' : 'Edit Playlist'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="playlist-title" className="block text-sm text-gray-300 mb-1">Title</label>
                <input
                  id="playlist-title"
                  type="text"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Playlist name"
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst"
                />
              </div>

              <div>
                <label htmlFor="playlist-description" className="block text-sm text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  id="playlist-description"
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Add a description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst resize-none"
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
                disabled={!formData.title.trim()}
                className="px-4 py-2 rounded-md bg-amethyst hover:bg-amethyst/80 text-white font-medium transition-colors disabled:opacity-50"
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PlaylistModalContext.Provider>
  );
}

export function usePlaylistModal() {
  const context = useContext(PlaylistModalContext);
  if (!context) {
    throw new Error('usePlaylistModal must be used within a PlaylistModalProvider');
  }
  return context;
}
