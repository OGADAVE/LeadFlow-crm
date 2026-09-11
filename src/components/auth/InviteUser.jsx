import { useState } from 'react';
import { callWorker } from '../../lib/api';
import Topbar from '../layout/Topbar';

const ROLES = [
  { value: 'consultant', label: 'Consultant' },
  { value: 'marketer', label: 'Marketer' },
  { value: 'admin', label: 'Admin' }
];

export default function InviteUser() {
  const [form, setForm] = useState({ name: '', email: '', role: 'consultant' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');
  const [fallbackLink, setFallbackLink] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    setFallbackLink('');

    try {
      const result = await callWorker('/api/invite-user', form);
      setStatus('sent');
      if (result.emailSent === false && result.resetLink) {
        setFallbackLink(result.resetLink);
      }
      setForm({ name: '', email: '', role: 'consultant' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Could not send the invite. Try again.');
    }
  }

  return (
    <div>
      <Topbar title="Invite Team" subtitle="Add a consultant, marketer, or admin to your workspace" />
      <div className="p-8 max-w-md">
        <form onSubmit={handleSubmit} className="border border-border bg-card rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">FULL NAME</label>
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
            <label className="text-xs text-subtle uppercase tracking-wide block mb-2">ROLE</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {status === 'error' && <p className="text-danger text-xs">{errorMsg}</p>}
          {status === 'sent' && !fallbackLink && (
            <p className="text-success text-xs">Invite sent. They'll receive an email to set their password.</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-brand-gradient text-white text-sm py-2.5 rounded-lg font-medium mt-2 hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending invite…' : 'Send invite'}
          </button>
        </form>

        {fallbackLink && (
          <div className="mt-4 border border-brand bg-card rounded-xl p-4">
            <p className="text-xs text-subtle uppercase tracking-wide mb-2">Email failed — share this link manually</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={fallbackLink}
                className="flex-1 bg-navy border border-border rounded-lg px-3 py-2 text-xs text-ink outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(fallbackLink)}
                className="text-xs border border-brand text-brand rounded-lg px-3 hover:bg-brand-gradient hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
