import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../api/authApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser } from '../features/auth/authSlice';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginMutation, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(setUser(result.user));
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  // Don't show login form if already authenticated
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary-text">TaskFlow</h1>
          <p className="mt-2 opacity-70">Team Task Management</p>
        </div>

        <form onSubmit={handleSubmit} className="neo-card p-8">
          <h2 className="mb-6 text-2xl font-bold text-primary-text">Login</h2>

          {error && (
            <div className="neo-input mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-primary-text">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neo-input w-full rounded-xl px-10 py-3 outline-none transition-all focus:shadow-neo-pressed-sm"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-primary-text">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-input w-full rounded-xl px-10 py-3 outline-none transition-all focus:shadow-neo-pressed-sm"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="neo-button flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                <LogIn size={18} />
                Login
              </>
            )}
          </button>

          <p className="mt-4 text-center text-sm opacity-70">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}