import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { IoMusicalNotes, IoPersonCircle } from 'react-icons/io5';
import { TbPlaylist } from 'react-icons/tb';
import { MdSettings } from 'react-icons/md';

const items = [
  { to: '/dashboard', label: 'Library', Icon: IoMusicalNotes },
  { to: '/dashboard?view=playlists', label: 'Playlists', Icon: TbPlaylist },
  { to: '/dashboard?view=artists', label: 'Artists', Icon: IoPersonCircle },
  { to: '/settings', label: 'Settings', Icon: MdSettings },
] as const;

export default function BottomNav() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-midnight border-t border-white/10 z-20 flex">
      {items.map(({ to, label, Icon }) => {
        const [toPath, toQuery] = to.split('?');
        const toView = toQuery ? new URLSearchParams(toQuery).get('view') : null;
        const active =
          pathname === toPath &&
          (toView === null ? view === null : view === toView);
        return (
          <Link
            key={label}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
              active ? 'text-amethyst' : 'text-silver hover:text-white'
            }`}
            aria-label={label}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
