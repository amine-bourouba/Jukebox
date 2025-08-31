import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaylists } from '../store/playerSlice';
import { setSongFilter, fetchFilterOptions } from '../store/songSlice';
import { fetchSelectedPlaylist, setSelectedPlaylist } from '../store/playerSlice';

import { RootState } from '../store/store';

const pills = [
  { label: 'Genre', value: 'genre' },
  { label: 'Artist', value: 'artist' },
  { label: 'All', value: 'all' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.player.playlists);
  const filterOptions = useSelector((state: RootState) => state.songs.filterOptions);
  const [selectedPill, setSelectedPill] = useState('all');
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    dispatch(fetchPlaylists());
    dispatch(fetchFilterOptions(selectedPill));
  }, [dispatch, selectedPill]);

  // Handle pill selection
  const handlePillClick = (pill: string) => {
    setSelectedPill(pill);
    setSelectedOption('');
    dispatch(setSongFilter({ type: pill, value: '' }));
  };

  // Handle filter option selection (artist/genre)
  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    dispatch(setSongFilter({ type: selectedPill, value: option }));
  };

  // Handle playlist selection
  const handlePlaylistClick = (playlistId: string) => {
    dispatch(setSelectedPlaylist(playlistId));
    dispatch(fetchSelectedPlaylist(playlistId));
  };

  return (
    <aside className="w-1/5 bg-midnight flex flex-col py-6 px-4 shadow-lg">
      {/* Pills */}
      <div className="flex gap-2 mb-4">
        {pills.map(pill => (
          <button
            key={pill.value}
            className={`px-3 rounded-full font-medium transition ${
              selectedPill === pill.value ? 'bg-amethyst text-moon' : 'bg-shadow text-silver'
            }`}
            onClick={() => handlePillClick(pill.value)}
          >
            {pill.label}
          </button>
        ))}
      </div>
      {/* Filter options (artist/genre) */}
      {selectedPill !== 'all' && (
        <div className="mb-6">
          <div className="text-silver mb-2 text-xs uppercase">{selectedPill}s</div>
          <div className="flex flex-col gap-1">
            {[...(filterOptions[selectedPill] ?? [])]
              .sort()
              .map(option => (
                <button
                  key={option}
                  className={`text-left px-3 py-1 rounded transition ${
                    selectedOption === option ? 'bg-amethyst text-moon' : 'bg-shadow text-silver'
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      <div>
        <div className="text-silver mb-2 text-xs uppercase">Your Playlists</div>
        <div className="flex flex-col gap-1">
          {[...(playlists ?? [])]
            .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
            .map(pl => (
              <button
                key={pl.id}
                className="text-left px-3 py-1 rounded bg-shadow text-silver hover:bg-amethyst hover:text-moon transition"
                onClick={() => handlePlaylistClick(pl.id)}
              >
                {pl.title}
              </button>
            ))}
        </div>
      </div>
    </aside>
  );
}