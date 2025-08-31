import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Player from '../../components/Player';
import SongList from './SongList';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight via-sapphire to-amethyst flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <SongList />
          <Player />
        </main>
      </div>
    </div>
  );
}