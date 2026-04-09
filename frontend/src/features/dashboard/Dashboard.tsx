import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { TbPlaylist } from 'react-icons/tb';
import { IoPersonCircle as IoPersonCircleIcon } from 'react-icons/io5';
import { MdExpandMore } from 'react-icons/md';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Player from '../../components/Player';
import SongList from './songs/SongList';
import SongPreview from './songs/SongPreview';
import ViewToggle, { useViewMode } from '../../components/ViewToggle';
import { RootState, AppDispatch } from '../../store/store';
import { fetchPlaylists, fetchSelectedPlaylist, setSelectedPlaylist, toggleQueue } from '../../store/playerSlice';
import { fetchArtists, setSelectedArtistId, Artist } from '../../store/artistSlice';
import { setSongFilter } from '../../store/songSlice';
import { useIsMobile } from '../../hooks/useIsMobile';

function MobilePlaylistsView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const playlists = useSelector((state: RootState) => state.player.playlists);
  const [viewMode, setViewMode] = useViewMode();

  const handlePlaylistClick = (playlistId: string) => {
    dispatch(setSelectedPlaylist(playlistId));
    dispatch(fetchSelectedPlaylist(playlistId));
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pt-8">
      {/* Header */}
      <div className="px-4 shrink-0">
        <p className="text-xs font-bold text-silver uppercase tracking-widest">Playlists</p>
      </div>

      {/* Toggle bar */}
      <div className="flex justify-end px-4 pt-4 pb-2 shrink-0">
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {(playlists ?? []).length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8">No playlists yet</p>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {(playlists ?? []).map(pl => (
              <button
                key={pl.id}
                onClick={() => handlePlaylistClick(pl.id)}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition"
              >
                <TbPlaylist size={32} className="text-amethyst shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{pl.title}</p>
                  <p className="text-gray-400 text-sm">
                    {pl._count?.playlistSongs ?? 0} {pl._count?.playlistSongs === 1 ? 'song' : 'songs'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(playlists ?? []).map(pl => (
              <button
                key={pl.id}
                onClick={() => handlePlaylistClick(pl.id)}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-center"
              >
                <TbPlaylist size={40} className="text-amethyst" />
                <p className="text-white text-sm font-medium truncate w-full">{pl.title}</p>
                <p className="text-gray-400 text-xs">
                  {pl._count?.playlistSongs ?? 0} {pl._count?.playlistSongs === 1 ? 'song' : 'songs'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileArtistsView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const artists = useSelector((state: RootState) => state.artists.artists);
  const [viewMode, setViewMode] = useViewMode();

  const handleArtistClick = (artist: Artist) => {
    dispatch(setSelectedArtistId(artist.id));
    dispatch(setSongFilter({ type: 'artist', value: artist.name }));
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pt-8">
      {/* Header */}
      <div className="px-4 shrink-0">
        <p className="text-xs font-bold text-silver uppercase tracking-widest">Artists</p>
      </div>

      {/* Toggle bar */}
      <div className="flex justify-end px-4 pt-4 pb-2 shrink-0">
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {(artists ?? []).length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8">No artists yet</p>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {(artists ?? []).map(artist => (
              <button
                key={artist.id}
                onClick={() => handleArtistClick(artist)}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {artist.imageUrl
                    ? <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    : <IoPersonCircleIcon size={28} className="text-amethyst" />}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{artist.name}</p>
                  <p className="text-gray-400 text-sm">
                    {artist._count?.songs ?? 0} {artist._count?.songs === 1 ? 'song' : 'songs'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(artists ?? []).map(artist => (
              <button
                key={artist.id}
                onClick={() => handleArtistClick(artist)}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {artist.imageUrl
                    ? <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    : <IoPersonCircleIcon size={40} className="text-amethyst" />}
                </div>
                <p className="text-white text-sm font-medium truncate w-full">{artist.name}</p>
                <p className="text-gray-400 text-xs">
                  {artist._count?.songs ?? 0} {artist._count?.songs === 1 ? 'song' : 'songs'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const view = isMobile ? searchParams.get('view') : null;

  const { currentTrack, showQueue } = useSelector((state: RootState) => state.player);
  const showPanel = !!currentTrack && showQueue;

  useEffect(() => {
    if (!isMobile) return;
    if (view === 'playlists') {
      dispatch(fetchPlaylists());
    } else if (view === 'artists') {
      dispatch(fetchArtists());
    } else {
      dispatch(setSongFilter({ type: 'all', value: '' }));
      dispatch(setSelectedPlaylist(null));
      dispatch(setSelectedArtistId(null));
    }
  }, [view, isMobile, dispatch]);

  const mainContent =
    view === 'playlists' ? <MobilePlaylistsView /> :
    view === 'artists'   ? <MobileArtistsView /> :
                           <SongList />;

  return (
    <div className="h-screen bg-gradient-to-br from-midnight via-sapphire to-amethyst flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* pb-20 on mobile: space for mini-player + bottom nav (both fixed) */}
          <div className="flex-1 flex flex-row overflow-hidden min-h-0 pb-20 lg:pb-0">
            <div className={`${showPanel ? 'lg:basis-3/4' : ''} flex-1 overflow-hidden`}>
              {mainContent}
            </div>
            {/* SongPreview panel — desktop sidebar */}
            {showPanel && (
              <div className="hidden lg:block lg:basis-1/4 overflow-hidden">
                <SongPreview currentTrack={currentTrack} />
              </div>
            )}
          </div>
        </main>
      </div>
      <Player />

      {/* SongPreview overlay — mobile/tablet full-screen */}
      {isMobile && showPanel && (
        <div className="lg:hidden fixed inset-0 z-40 bg-midnight flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-10 pb-2 shrink-0">
            <button
              onClick={() => dispatch(toggleQueue())}
              className="text-silver p-2"
              aria-label="Close queue"
            >
              <MdExpandMore size={30} />
            </button>
            <p className="text-xs text-silver uppercase tracking-widest">Queue</p>
            <div className="w-10" />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SongPreview currentTrack={currentTrack} />
          </div>
        </div>
      )}
    </div>
  );
}
