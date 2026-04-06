import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { MdSettings, MdLogout } from 'react-icons/md';
import { IoPersonCircle } from 'react-icons/io5';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';

export default function UserMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const avatarSrc = user?.avatarUrl
    ? `${apiBase.replace('/api', '')}/${user.avatarUrl}`
    : null;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-amethyst overflow-hidden hover:opacity-80 transition"
      >
        {avatarSrc
          ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
          : <IoPersonCircle size={32} className="text-amethyst" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-shadow border border-white/10 rounded-lg shadow-xl z-50 py-1">
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-amethyst/20 transition-colors"
          >
            <MdSettings size={18} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <MdLogout size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
