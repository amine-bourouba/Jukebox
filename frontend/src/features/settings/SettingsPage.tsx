import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { updateUser } from '../../store/authSlice';
import { snackbar } from '../../services/snackbar';
import api from '../../services/api';
import Header from '../../components/Header';

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/users/me', { displayName });
      dispatch(updateUser({ displayName: res.data.displayName }));
      snackbar.show({ message: 'Profile updated', color: 'bg-green-500' });
    } catch {
      snackbar.show({ message: 'Failed to update profile', color: 'bg-red-500' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      snackbar.show({ message: 'Passwords do not match', color: 'bg-red-500' });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      snackbar.show({ message: 'Password updated', color: 'bg-green-500' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update password';
      snackbar.show({ message: msg, color: 'bg-red-500' });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateUser({ avatarUrl: res.data.avatarUrl }));
      snackbar.show({ message: 'Avatar updated', color: 'bg-green-500' });
    } catch {
      snackbar.show({ message: 'Failed to upload avatar', color: 'bg-red-500' });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  const avatarSrc = user?.avatarUrl
    ? `${apiBase.replace('/api', '')}/${user.avatarUrl}`
    : '/default-avatar.png';

  return (
    <div className="h-screen bg-gradient-to-br from-midnight via-sapphire to-amethyst flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        {/* Profile section */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-silver uppercase tracking-widest mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <img
              src={avatarSrc}
              alt="avatar"
              className="w-16 h-16 rounded-full border-2 border-amethyst object-cover"
            />
            <div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-sm text-amethyst hover:text-white transition-colors disabled:opacity-50"
              >
                {avatarUploading ? 'Uploading…' : 'Change avatar'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs text-silver mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-shadow text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amethyst"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 bg-amethyst text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm font-medium"
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        <div className="border-t border-white/10 mb-8" />

        {/* Password section */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-silver uppercase tracking-widest mb-4">Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-xs text-silver mb-1">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-shadow text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amethyst"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-xs text-silver mb-1">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-shadow text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amethyst"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs text-silver mb-1">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-shadow text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amethyst"
              />
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 bg-amethyst text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm font-medium"
            >
              {passwordSaving ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </section>

        <div className="border-t border-white/10 mb-8" />

        {/* Preferences section — placeholder */}
        <section>
          <h2 className="text-sm font-bold text-silver uppercase tracking-widest mb-4">Preferences</h2>
          <p className="text-xs text-gray-500 italic">More options coming soon.</p>
        </section>
      </main>
    </div>
  );
}
