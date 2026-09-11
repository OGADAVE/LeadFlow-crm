import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { callWorker } from '../../lib/api';
import Logo from '../layout/Logo';

export default function Signup() {
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let createdAuthUser = false;

    try {
      // 1. Create their own Firebase Auth account client-side — this is
      //    normal self-service signup, no privileged operation needed.
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      createdAuthUser = true;

      // 2. Ask the Worker to create the company + make them its first admin.
      //    The Worker verifies their ID token itself — the client can't fake
      //    who it is here.
      await callWorker('/api/company-signup', {
        companyName: form.companyName,
        name: form.name
      });

      navigate('/');
    } catch (err) {
      if (createdAuthUser && auth.currentUser) {
        await signOut(auth).catch(() => {});
      }
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'That email is already registered. Try signing in instead.'
          : err.message || 'Could not create your workspace. Check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo />
          <p className="text-xs text-subtle uppercase tracking-wide mt-2">Create your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-border bg-card rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">COMPANY NAME</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
              placeholder="PeakNova Realty"
            />
          </div>
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">YOUR NAME</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">EMAIL</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">PASSWORD</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gradient text-white text-sm py-2.5 rounded-lg font-medium mt-2 hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>

          <p className="text-xs text-subtle text-center pt-2">
            Already have a workspace?{' '}
            <Link to="/login" className="text-brand hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
