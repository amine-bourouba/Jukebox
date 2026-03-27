import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TbPlaylist } from "react-icons/tb";
import { IoMusicalNotes } from "react-icons/io5";

import { fetchPlaylists, setTrack, setQueue } from '../store/playerSlice';
import { setSongFilter, fetchFilterOptions, fetchLikedSongs, fetchFilteredSongs } from '../store/songSlice';
import { fetchSelectedPlaylist, setSelectedPlaylist } from '../store/playerSlice';
import { RootState } from '../store/store';
import { useContextMenu } from './ContextMenu/useContextMenu';

export function groupByLetter<T>(items: T[], getLabel: (item: T) => string): { letter: string; items: T[] }[] {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const first = getLabel(item)?.[0]?.toUpperCase() ?? '#';
    const key = /[A-Z]/.test(first) ? first : '#';
    (groups[key] ??= []).push(item);
  }
  return Object.keys(groups)
    .sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(letter => ({ letter, items: groups[letter] }));
}

function LetterDivider({ letter }: { letter: string }) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-2 py-1 bg-midnight/95"
      data-letter={letter}
    >
      <span className="text-amethyst font-bold text-xs w-5 text-center shrink-0">{letter}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

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
  const songs = useSelector((state: RootState) => state.songs.songs);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
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
    if (selectedPill === 'all') {
      dispatch(fetchFilteredSongs({ type: 'all', value: '' }));
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

  const handleSongClick = (song: any) => {
    const tracks = songs.map((s: any) => ({
      ...s,
      coverUrl: s.coverImageUrl || s.thumbnail || s.coverUrl || '',
    }));
    dispatch(setQueue(tracks));
    dispatch(setTrack({ ...song, coverUrl: song.coverImageUrl || song.thumbnail || song.coverUrl || '' }));
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
      {/* Songs list */}
      {selectedPill === 'all' && (
        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="text-silver mb-2 text-xs uppercase shrink-0">Songs</div>
          {groupByLetter(songs, s => s.title).map(({ letter, items: group }) => (
            <div key={letter}>
              <LetterDivider letter={letter} />
              <div className="flex flex-col gap-1 mb-1">
                {group.map((song: any) => (
                  <button
                    key={song.id}
                    onClick={() => handleSongClick(song)}
                    className={`flex items-center text-left px-3 py-2 h-12 rounded transition ${
                      currentTrack?.id === song.id
                        ? 'bg-amethyst text-moon'
                        : 'bg-shadow text-silver hover:bg-amethyst/40'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded shrink-0 mr-2 flex items-center justify-center overflow-hidden ${
                        currentTrack?.id === song.id ? 'bg-white/20' : 'bg-white/10'
                      }`}
                      aria-hidden="true"
                    >
                      {song.coverImageUrl || song.thumbnail ? (
                        <img
                          src={song.coverImageUrl || song.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IoMusicalNotes size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{song.title}</div>
                      <div className={`truncate text-xs ${currentTrack?.id === song.id ? 'text-moon/70' : 'text-gray-500'}`}>
                        {song.artist}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter options (artist) */}
      {selectedPill === 'artist' && (
        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="text-silver mb-2 text-xs uppercase shrink-0">Artists</div>
          {groupByLetter([...(filterOptions[selectedPill] ?? [])], a => a).map(({ letter, items: group }) => (
            <div key={letter}>
              <LetterDivider letter={letter} />
              <div className="flex flex-col gap-1 mb-1">
                {group.map((option: string) => (
                  <button
                    key={option}
                    className={`flex items-center text-left px-3 py-2 h-12 rounded transition ${
                      selectedOption === option
                        ? 'bg-amethyst text-moon'
                        : 'bg-shadow text-silver hover:bg-amethyst/40'
                    }`}
                    onClick={() => handleOptionClick(option)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${
                        selectedOption === option ? 'bg-white/20' : 'bg-white/10'
                      }`}
                      aria-hidden="true"
                    >
                      <IoMusicalNotes size={16} />
                    </div>
                    <span className="truncate">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playlists */}
      {selectedPill === 'playlist' && <div>
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
                    {(pl._count?.playlistSongs ?? 0) > 0
                      ? `${pl._count.playlistSongs} song${pl._count.playlistSongs === 1 ? '' : 's'}`
                      : 'No songs'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>}
    </aside>
  );
}