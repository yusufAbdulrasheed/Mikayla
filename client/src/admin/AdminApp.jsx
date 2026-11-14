import { useCallback, useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { adminApi } from '../lib/api.js';
import { useSite } from '../lib/SiteContext.jsx';
import { ToastProvider } from './ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SiteEditor from './pages/SiteEditor.jsx';
import Collection from './pages/Collection.jsx';
import Messages from './pages/Messages.jsx';
import Media from './pages/Media.jsx';
import Account from './pages/Account.jsx';
import './admin.css';

const nav = [
  { to: '', end: true, icon: '⌂', label: 'Dashboard' },
  { to: 'site', icon: '✦', label: 'Website text & cover' },
  { to: 'stories', icon: '✎', label: 'Stories' },
  { to: 'photos', icon: '▣', label: 'Photos' },
  { to: 'videos', icon: '▶', label: 'Videos' },
  { to: 'books', icon: '❡', label: 'Books' },
  { to: 'reviews', icon: '★', label: 'Book editing' },
  { to: 'analytics', icon: '◔', label: 'Social analytics' },
  { to: 'services', icon: '✧', label: 'Services' },
  { to: 'messages', icon: '✉', label: 'Messages', badge: true },
  { to: 'media', icon: '⇪', label: 'Media library' },
  { to: 'account', icon: '⚙', label: 'Account' },
];

function Shell({ onLogout }) {
  const { brand } = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => adminApi.stats().then((s) => setUnread(s.unread)).catch(() => {}), []);
  useEffect(() => { refresh(); setOpen(false); }, [pathname, refresh]);

  return (
    <div className="adm adm-shell">
      <header className="adm-topbar">
        <button className="adm-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>
        <b>{brand.first}<i>.</i> <small>admin</small></b>
      </header>

      <aside className={`adm-side ${open ? 'is-open' : ''}`}>
        <div className="adm-side__brand">{brand.first}<i>.</i><small>Website editor</small></div>
        <nav aria-label="Admin">
          {nav.map((n) => (
            <NavLink key={n.label} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              <span aria-hidden="true">{n.icon}</span>{n.label}
              {n.badge && unread > 0 && <em>{unread}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side__foot">
          <a href="/" target="_blank" rel="noreferrer">View website ↗</a>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}

      <main className="adm-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="site" element={<SiteEditor />} />
          <Route path="stories" element={<Collection colKey="posts" />} />
          <Route path="photos" element={<Collection colKey="gallery" />} />
          <Route path="videos" element={<Collection colKey="videos" />} />
          <Route path="books" element={<Collection colKey="books" />} />
          <Route path="reviews" element={<Collection colKey="reviews" />} />
          <Route path="analytics" element={<SiteEditor only="analytics" />} />
          <Route path="services" element={<Collection colKey="services" />} />
          <Route path="messages" element={<Messages onChange={refresh} />} />
          <Route path="media" element={<Media />} />
          <Route path="account" element={<Account onLogout={onLogout} />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AdminApp() {
  const [state, setState] = useState('checking');

  useEffect(() => {
    document.title = 'Admin — Website editor';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    adminApi.me().then(() => setState('in')).catch(() => setState('out'));
    const expire = () => setState('expired');
    window.addEventListener('adm-unauth', expire);
    return () => { window.removeEventListener('adm-unauth', expire); meta.remove(); };
  }, []);

  const logout = async () => { await adminApi.logout().catch(() => {}); setState('out'); };

  if (state === 'checking') return <div className="adm adm-center"><p className="adm-muted">Loading…</p></div>;
  if (state === 'out' || state === 'expired') return <Login expired={state === 'expired'} onDone={() => setState('in')} />;
  return <ToastProvider><Shell onLogout={logout} /></ToastProvider>;
}
