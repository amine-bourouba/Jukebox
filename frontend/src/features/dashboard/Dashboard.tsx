import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { TbPlaylist } from 'react-icons/tb';
import { IoPersonCircle } from 'react-icons/io5';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Player from '../../components/Player';
import BottomNav from '../../components/BottomNav';
import SongList from './songs/SongList';
import SongPreview from './songs/SongPreview';
import { RootState, AppDispatch } from '../../store/store';
import { fetchPlaylists, fetchSelectedPlaylist, setSelectedPlaylist } from '../../store/playerSlice';
import { fetchArtists, setSelectedArtistId, Artist } from '../../store/artistSlice';
import { setSongFilter } from '../../store/songSlice';
import { useIsMobile } from '../../hooks/useIsMobile';

function MobilePlaylistsView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const playlists = useSelector((state: RootState) => state.player.playlists);

  const handlePlaylistClick = (playlistId: string) => {
    dispatch(setSelectedPlaylist(playlistId));
    dispatch(fetchSelectedPlaylist(playlistId));
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pt-8 px-4">
      <p className="text-xs font-bold text-silver uppercase tracking-widest mb-4">Playlists</p>
      <div className="flex flex-col gap-2">
        {(playlists ?? []).map(pl => (
          <button
            key={pl.id}
            onClick={() => handlePlaylistClick(pl.id)}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition"
          >
            <TbPlaylist size={32} className="text-amethyst shrink-0" />
            <div>
              <p className="text-white font-medium">{pl.title}</p>
              <p className="text-gray-400 text-sm">
                {pl._count?.playlistSongs ?? 0} {pl._count?.playlistSongs === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </button>
        ))}
        {(playlists ?? []).length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">No playlists yet</p>
        )}
      </div>
    </div>
  );
}

function MobileArtistsView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const artists = useSelector((state: RootState) => state.artists.artists);

  const handleArtistClick = (artist: Artist) => {
    dispatch(setSelectedArtistId(artist.id));
    dispatch(setSongFilter({ type: 'artist', value: artist.name }));
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pt-8 px-4">
      <p className="text-xs font-bold text-silver uppercase tracking-widest mb-4">Artists</p>
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
                : <IoPersonCircle size={28} className="text-amethyst" />}
            </div>
            <div>
              <p className="text-white font-medium">{artist.name}</p>
              <p className="text-gray-400 text-sm">
                {artist._count?.songs ?? 0} {artist._count?.songs === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </button>
        ))}
        {(artists ?? []).length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">No artists yet</p>
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
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* pb-20 on mobile: space for mini-player + bottom nav (both fixed) */}
          <div className="flex-1 flex flex-row overflow-hidden min-h-0 pb-20 md:pb-20">
            <div className={`${showPanel ? 'md:basis-3/4' : ''} flex-1 overflow-hidden`}>
              {mainContent}
            </div>
            {/* SongPreview panel — desktop only */}
            {showPanel && (
              <div className="hidden md:block md:basis-1/4 overflow-hidden">
                <SongPreview currentTrack={currentTrack} />
              </div>
            )}
          </div>
        </main>
      </div>
      <Player />
      <BottomNav />
    </div>
  );
}
