import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Logo from '../layout/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Email or password not recognized. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo />
          <p className="text-xs text-subtle uppercase tracking-wide mt-2">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-border bg-card rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gradient text-white text-sm py-2.5 rounded-lg font-medium mt-2 hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-xs text-subtle text-center pt-2">
            New here?{' '}
            <Link to="/signup" className="text-brand hover:underline">Create a workspace</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
