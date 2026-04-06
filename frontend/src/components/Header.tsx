import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AddMenu from './AddMenu';
import UserMenu from './UserMenu';

export default function Header() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <header className="flex items-center justify-between bg-sapphire text-moon px-4 py-3 shadow">
      <span className="font-bold tracking-widest text-lg">JKX</span>

      {/* Search + AddMenu — desktop only */}
      <div className="hidden md:flex items-center gap-3 w-1/2">
        <input
          type="text"
          placeholder="Search music, artists..."
          className="bg-shadow text-silver px-4 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-amethyst"
        />
        <AddMenu />
      </div>

      <div className="flex items-center gap-3">
        {/* AddMenu visible on mobile only */}
        <div className="md:hidden">
          <AddMenu />
        </div>
        <span className="hidden md:inline font-semibold">{user?.displayName || 'User'}</span>
        <UserMenu />
      </div>
    </header>
  );
}
