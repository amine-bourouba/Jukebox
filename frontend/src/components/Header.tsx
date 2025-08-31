import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function Header() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <header className="flex items-center justify-between bg-sapphire text-moon px-4 py-3 shadow">
      <span>JKX</span>
      <input
        type="text"
        placeholder="Search music, artists..."
        className="bg-shadow text-silver px-4 py-2 rounded-lg w-1/2 focus:outline-none focus:ring-2 focus:ring-amethyst"
      />
      <div className="flex items-center gap-4">
        <button className="text-amethyst hover:text-moon transition">🔔</button>
        <span className="font-semibold">{user?.displayName || 'User'}</span>
        <img
          src={user?.avatarUrl || '/default-avatar.png'}
          alt="avatar"
          className="w-8 h-8 rounded-full border-2 border-amethyst"
          />
      </div>
    </header>
  );
}