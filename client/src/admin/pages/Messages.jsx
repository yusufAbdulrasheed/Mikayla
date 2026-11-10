import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api.js';
import { useToast } from '../ui.jsx';

const when = (m) => new Date(m.sentAt || m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Messages({ onChange }) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null);

  const load = () => adminApi.messages().then(setItems).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  async function toggleOpen(m) {
    const next = open === m.id ? null : m.id;
    setOpen(next);
    if (next && !m.read) {
      await adminApi.markRead(m.id, true).catch(() => {});
      setItems((list) => list.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
      onChange?.();
    }
  }
  async function remove(m) {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    await adminApi.removeMessage(m.id).catch((e) => toast(e.message, 'err'));
    load();
    onChange?.();
  }

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Messages</h1>
          <p>Notes visitors send you from the contact form. Reply by email.</p>
        </div>
      </header>

      {items === null && <p className="adm-muted">Loading…</p>}
      {items?.length === 0 && <div className="adm-empty"><span>✉</span><h2>No messages yet</h2><p>When someone uses the contact form, it shows up here.</p></div>}

      <ul className="adm-list">
        {items?.map((m) => (
          <li key={m.id} className={`adm-msg ${m.read ? '' : 'is-unread'}`}>
            <button className="adm-msg__head" onClick={() => toggleOpen(m)} aria-expanded={open === m.id}>
              <span className="adm-dot" aria-hidden="true" />
              <b>{m.name}</b>
              <span className="adm-msg__subject">{m.subject || m.message.slice(0, 70)}</span>
              <small>{when(m)}</small>
            </button>
            {open === m.id && (
              <div className="adm-msg__body">
                <p className="adm-msg__meta">From <b>{m.name}</b> · <a href={`mailto:${m.email}`}>{m.email}</a></p>
                {m.subject && <p><b>{m.subject}</b></p>}
                <p className="adm-msg__text">{m.message}</p>
                <div className="adm-msg__actions">
                  <a className="adm-btn adm-btn--primary adm-btn--sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'your message'}`)}`}>Reply by email</a>
                  <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => remove(m)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
