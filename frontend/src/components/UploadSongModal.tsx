import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { uploadSong } from '../store/songSlice';

interface UploadSongContextType {
  showUploadSong: () => void;
}

interface FormFields {
  title: string;
  artist: string;
}

const UploadSongContext = createContext<UploadSongContextType | null>(null);

export function UploadSongModalProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFields>({ title: '', artist: '' });
  const [uploading, setUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const showUploadSong = useCallback(() => {
    setFields({ title: '', artist: '' });
    setAudioFile(null);
    setThumbnailFile(null);
    setUploading(false);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (uploading) return;
    setIsOpen(false);
  }, [uploading]);

  const handleUpload = useCallback(async () => {
    if (!audioFile || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', audioFile);
      if (thumbnailFile) formData.append('files', thumbnailFile);
      if (fields.title.trim()) formData.append('title', fields.title.trim());
      if (fields.artist.trim()) formData.append('artist', fields.artist.trim());
      await dispatch(uploadSong(formData) as any);
      setIsOpen(false);
    } finally {
      setUploading(false);
    }
  }, [dispatch, audioFile, thumbnailFile, fields, uploading]);

  const handleFieldChange = useCallback((field: keyof FormFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <UploadSongContext.Provider value={{ showUploadSong }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-stretch md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative bg-gradient-to-br from-midnight via-sapphire to-amethyst border border-white/10 shadow-2xl w-full p-6 animate-scale-up rounded-none h-full overflow-y-auto md:rounded-lg md:max-w-md md:mx-4 md:h-auto">
            <h3 className="text-xl font-bold text-white mb-4">Upload Song</h3>

            <div className="space-y-4">
              {/* Audio file */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Audio File *</label>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-left text-sm transition-colors hover:bg-white/15 focus:outline-none focus:border-amethyst"
                >
                  <span className={audioFile ? 'text-white' : 'text-gray-400'}>
                    {audioFile ? audioFile.name : 'Choose audio file…'}
                  </span>
                </button>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Cover Image (optional)</label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => setThumbnailFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-left text-sm transition-colors hover:bg-white/15 focus:outline-none focus:border-amethyst"
                >
                  <span className={thumbnailFile ? 'text-white' : 'text-gray-400'}>
                    {thumbnailFile ? thumbnailFile.name : 'Choose cover image…'}
                  </span>
                </button>
              </div>

              {/* Title hint */}
              <div>
                <label htmlFor="upload-title" className="block text-sm text-gray-300 mb-1">Title (optional — auto-detected)</label>
                <input
                  id="upload-title"
                  type="text"
                  value={fields.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  placeholder="Leave blank for auto-detection"
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst"
                />
              </div>

              {/* Artist hint */}
              <div>
                <label htmlFor="upload-artist" className="block text-sm text-gray-300 mb-1">Artist (optional — auto-detected)</label>
                <input
                  id="upload-artist"
                  type="text"
                  value={fields.artist}
                  onChange={e => handleFieldChange('artist', e.target.value)}
                  placeholder="Leave blank for auto-detection"
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amethyst"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleClose}
                disabled={uploading}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!audioFile || uploading}
                className="px-4 py-2 rounded-md bg-amethyst hover:bg-amethyst/80 text-white font-medium transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UploadSongContext.Provider>
  );
}

export function useUploadSong() {
  const context = useContext(UploadSongContext);
  if (!context) {
    throw new Error('useUploadSong must be used within an UploadSongModalProvider');
  }
  return context;
}
