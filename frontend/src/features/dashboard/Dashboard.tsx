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
    <div className="min-h-screen bg-gradient-to-br from-midnight via-sapphire to-amethyst flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-row">
            <div className={`${currentTrack ? 'basis-3/4' : 'flex-1'}`}>
              <SongList />
            </div>
            {currentTrack && <div className="basis-1/4">
              <SongPreview currentTrack={currentTrack}/>
            </div>}
          </div>
          <div className="mt-34">
            <Player />
          </div>
        </main>
      </div>
    </div>
  );
}