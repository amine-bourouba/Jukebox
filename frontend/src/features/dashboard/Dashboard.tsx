import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Player from '../../components/Player';
import SongList from './songs/SongList';
import SongPreview from './songs/SongPreview';
import { RootState } from '../store/store';

import { useSelector } from 'react-redux';

export default function Dashboard() {
  const { currentTrack } = useSelector((state: RootState) => state.player);

  return (
    <div className="h-screen bg-gradient-to-br from-midnight via-sapphire to-amethyst flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-row overflow-hidden min-h-0 pb-20">
            <div className={`${currentTrack ? 'basis-3/4' : 'flex-1'} overflow-hidden`}>
              <SongList />
            </div>
            {currentTrack && (
              <div className="basis-1/4 overflow-hidden">
                <SongPreview currentTrack={currentTrack} />
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Player lives outside overflow-hidden containers so fixed positioning is never clipped */}
      <Player />
    </div>
  );
}