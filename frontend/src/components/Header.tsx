import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store/store';
import AddMenu from './AddMenu';

export default function Header() {
  const user = useSelector((state: RootState) => state.auth.user);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const avatarSrc = user?.avatarUrl
    ? `${apiBase.replace('/api', '')}/${user.avatarUrl}`
    : '/default-avatar.png';

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
        <Link to="/settings" aria-label="Settings">
          <img
            src={avatarSrc}
            alt="avatar"
            className="w-8 h-8 rounded-full border-2 border-amethyst object-cover hover:opacity-80 transition"
          />
        </Link>
      </div>
    </header>
  );
}
