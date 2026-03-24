import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TbPlaylist } from "react-icons/tb";

import { fetchPlaylists } from '../store/playerSlice';
import { setSongFilter, fetchFilterOptions, fetchLikedSongs } from '../store/songSlice';
import { fetchSelectedPlaylist, setSelectedPlaylist } from '../store/playerSlice';
import { RootState } from '../store/store';
import { useContextMenu } from './ContextMenu/useContextMenu';

const pills = [
  { label: 'Songs', value: 'all' },
  { label: 'Playlist', value: 'playlist' },
  { label: 'Artist', value: 'artist' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.player.playlists);
  const selectedPlaylistId = useSelector((state: RootState) => state.player.selectedPlaylistId);
  const filterOptions = useSelector((state: RootState) => state.songs.filterOptions);
  const [selectedPill, setSelectedPill] = useState('playlist');
  const [selectedOption, setSelectedOption] = useState('');

  const { showContextMenu } = useContextMenu();

  useEffect(() => {
    dispatch(fetchPlaylists());
    dispatch(fetchLikedSongs());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPill === 'artist') {
      dispatch(fetchFilterOptions(selectedPill));
    }
  }, [dispatch, selectedPill]);

  // Handle pill selection
  const handlePillClick = (pill: string) => {
    setSelectedPill(pill);
    setSelectedOption('');
    if (pill !== 'playlist') {
      dispatch(setSelectedPlaylist(null));
    }
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

  const handleContextMenu = (event: React.MouseEvent, playlist: any) => {
    showContextMenu(event, 'sidebar-playlist', playlist);
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
      {/* TODO: Implement generic listing component to handle remaing filtering results */}

      {/* Filter options (artist/genre) */}
      {selectedPill === 'artist' && (
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
            .map(pl => (
              <div 
                key={pl.id} 
                className={`flex items-center text-left px-3 py-1 h-16 rounded transition
                  ${selectedPlaylistId === pl.id
                    ? 'bg-amethyst shadow-lg'
                    : 'bg-shadow hover:bg-amethyst/40'}
                `}
                // onClick={() => handlePlaylistClick(pl.id)}
                onClick={() => {handlePlaylistClick(pl.id); }}
                onContextMenu={(e) => handleContextMenu(e, pl)}
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