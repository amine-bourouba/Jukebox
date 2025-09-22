import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TbPlaylist } from "react-icons/tb";

import { fetchPlaylists } from '../store/playerSlice';
import { setSongFilter, fetchFilterOptions } from '../store/songSlice';
import { fetchSelectedPlaylist, setSelectedPlaylist } from '../store/playerSlice';
import { RootState } from '../store/store';

const pills = [
  { label: 'Playlist', value: 'playlist' },
  { label: 'Artist', value: 'artist' },
  { label: 'Genre', value: 'genre' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.player.playlists);
  const selectedPlaylistId = useSelector((state: RootState) => state.player.selectedPlaylistId);
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
              <div 
                key={pl.id} 
                className={`flex items-center text-left px-3 py-1 h-16 rounded transition
                  ${selectedPlaylistId === pl.id
                    ? 'bg-amethyst shadow-lg'
                    : 'bg-shadow hover:bg-amethyst/40'}
                `}
                onClick={() => handlePlaylistClick(pl.id)}
              >
                <TbPlaylist size={24} className="text-white mr-2" />
                <div className="ml-1">
                  <div className="font-medium text-white">{pl.title}</div>
                  {/* <div className="mt-1 text-gray-500 dark:text-gray-400">{pl.artist}</div> */}
                  <div className={`text-sm ${selectedPlaylistId === pl.id ? 'text-gray-200' : 'text-gray-400'}`}>
                    zehahaha
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </aside>
  );
}