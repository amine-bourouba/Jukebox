import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Player from '../../components/Player';
import BottomNav from '../../components/BottomNav';
import SongList from './songs/SongList';
import SongPreview from './songs/SongPreview';
import { RootState } from '../../store/store';

import { useSelector } from 'react-redux';

export default function Dashboard() {
  const { currentTrack, showQueue } = useSelector((state: RootState) => state.player);
  const showPanel = !!currentTrack && showQueue;

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
              <SongList />
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