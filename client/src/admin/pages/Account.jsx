import { useState } from 'react';
import { adminApi } from '../../lib/api.js';
import { Text, useToast } from '../ui.jsx';

export default function Account({ onLogout }) {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', again: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.next.length < 10) return setError('Use at least 10 characters for the new password.');
    if (form.next !== form.again) return setError('The two new passwords don’t match.');
    setBusy(true);
    try {
      await adminApi.changePassword(form.current, form.next);
      setForm({ current: '', next: '', again: '' });
      toast('Password changed ✓');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-page">
      <header className="adm-head"><div><h1>Account</h1><p>Keep your admin password private. Anyone with it can change your website.</p></div></header>
      <form className="adm-card adm-form adm-narrow" onSubmit={submit}>
        <h2>Change password</h2>
        <Text label="Current password" type="password" value={form.current} onChange={set('current')} />
        <Text label="New password" type="password" value={form.next} onChange={set('next')} help="At least 10 characters. A few random words is great." />
        <Text label="New password again" type="password" value={form.again} onChange={set('again')} />
        {error && <p className="adm-error" role="alert">{error}</p>}
        <div><button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button></div>
      </form>
      <section className="adm-card adm-narrow">
        <h2>Sign out</h2>
        <p className="adm-muted">Do this on shared or public computers.</p>
        <button className="adm-btn adm-btn--ghost" onClick={onLogout}>Sign out</button>
      </section>
    </div>
  );
}
