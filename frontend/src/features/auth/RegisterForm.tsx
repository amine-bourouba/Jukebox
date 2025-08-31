import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';

export default function RegisterForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Redirect to dashboard after successful registration
  if (token) {
    navigate('/dashboard');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(register({ displayName, email, password }));
  };

  return (
    <PageWrapper>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-amethyst text-center mb-2">Create Account</h2>
        <p className="text-silver text-center mb-4">Sign up to start your music journey</p>
        <input
          className="w-full px-4 py-3 rounded-lg bg-shadow text-moon placeholder-silver focus:outline-none focus:ring-2 focus:ring-amethyst"
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-3 rounded-lg bg-shadow text-moon placeholder-silver focus:outline-none focus:ring-2 focus:ring-amethyst"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-3 rounded-lg bg-shadow text-moon placeholder-silver focus:outline-none focus:ring-2 focus:ring-amethyst"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full py-3 rounded-lg bg-amethyst hover:bg-sapphire text-moon font-semibold text-lg transition"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <div className="text-center mt-2">
          <Link to="/login" className="text-amethyst hover:underline text-sm">
            Already have an account? Login
          </Link>
        </div>
      </form>
    </PageWrapper>
  );
}