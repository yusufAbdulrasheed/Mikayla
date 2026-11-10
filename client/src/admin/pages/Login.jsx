import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api.js';

export default function Login({ onDone, expired }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.login(password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm adm-center">
      <form className="adm-login" onSubmit={submit}>
        <p className="adm-login__brand">Mikayla<i>.</i></p>
        <h1>Welcome back</h1>
        <p className="adm-login__sub">{expired ? 'Your session ended. Please sign in again.' : 'Sign in to edit your website.'}</p>
        <label className="adm-field">
          <span className="adm-label">Password</span>
          <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/" className="adm-link adm-login__back">← Back to the website</Link>
      </form>
    </div>
  );
}
