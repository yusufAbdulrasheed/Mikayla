import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api.js';
import { useSite } from '../../lib/SiteContext.jsx';
import { StorageNote } from '../ui.jsx';

const tiles = [
  { to: 'site', icon: '✦', title: 'Website text & cover', text: 'Your name, cover photo, about, links and every heading.' },
  { to: 'stories', icon: '✎', title: 'Stories', text: 'Write and publish essays and articles.', stat: 'posts', label: 'stories' },
  { to: 'photos', icon: '▣', title: 'Photos', text: 'Add and caption your gallery photos.', stat: 'gallery', label: 'photos' },
  { to: 'videos', icon: '▶', title: 'Videos', text: 'Upload videos or link YouTube and Vimeo.', stat: 'videos', label: 'videos' },
  { to: 'books', icon: '❡', title: 'Books', text: 'Covers, buy links and downloadable PDFs.', stat: 'books', label: 'books' },
  { to: 'reviews', icon: '★', title: 'Book editing', text: 'Log every book you have edited, with covers and notes.', stat: 'reviews', label: 'books edited' },
  { to: 'analytics', icon: '◔', title: 'Social analytics', text: 'Followers, views, likes and comments for Instagram, TikTok, X and Medium.' },
  { to: 'services', icon: '✧', title: 'Services', text: 'What brands can hire you for.', stat: 'services', label: 'services' },
];

export default function Dashboard() {
  const { brand } = useSite();
  const [stats, setStats] = useState(null);
  useEffect(() => { adminApi.stats().then(setStats).catch(() => {}); }, []);

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Hi {brand.first} ♡</h1>
          <p>Everything on your website can be changed from here. Changes go live as soon as you save.</p>
        </div>
        <a className="adm-btn adm-btn--soft" href="/" target="_blank" rel="noreferrer">View website ↗</a>
      </header>

      <StorageNote />

      {stats?.unread > 0 && (
        <Link to="messages" className="adm-callout">
          <b>✉ You have {stats.unread} new message{stats.unread > 1 ? 's' : ''}</b>
          <span>Read them →</span>
        </Link>
      )}

      <div className="adm-tiles">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="adm-tile">
            <span className="adm-tile__icon">{t.icon}</span>
            <h2>{t.title}</h2>
            <p>{t.text}</p>
            {t.stat && stats && <span className="adm-tile__count">{stats[t.stat]} {stats[t.stat] === 1 ? t.label.replace(/s$/, '') : t.label}</span>}
          </Link>
        ))}
      </div>

      <section className="adm-card adm-tips">
        <h2>Quick tips</h2>
        <ul>
          <li><b>Photos:</b> use clear, bright pictures. Big photos are fine, they’re uploaded as they are, so very large files can load slowly for visitors.</li>
          <li><b>Videos:</b> for long videos, upload to YouTube and paste the link. It loads faster than a file.</li>
          <li><b>Hide, don’t delete:</b> turn off “Show on the website” to keep something as a private draft.</li>
          <li><b>Check your work:</b> open “View website” in another tab, then refresh it after saving.</li>
        </ul>
      </section>
    </div>
  );
}
