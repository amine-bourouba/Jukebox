import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../store/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import PageWrapper from '../../components/PageWrapper';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  return (
    <PageWrapper>
      <form
        onSubmit={e => { e.preventDefault(); dispatch(login({ email, password })); }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-amethyst text-center mb-2">Sign In</h2>
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
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <div className="text-center mt-2">
          <Link to="/register" className="text-amethyst hover:underline text-sm">
            Don't have an account? Register
          </Link>
        </div>
      </form>
    </PageWrapper>
  );
}