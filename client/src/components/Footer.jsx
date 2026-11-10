import { Link } from 'react-router-dom';
import { useSite } from '../lib/SiteContext.jsx';

export default function Footer() {
  const { brand, social, footer } = useSite();
  return (
    <footer className="footer">
      <div className="wrap footer__in">
        <Link to="/" className="nav__brand">{brand.first}<span>.</span></Link>
        <p>{footer.note}</p>
        <div className="footer__links">
          {social.map((s) => (
            <a key={s.platform + s.url} href={s.url} target="_blank" rel="noreferrer">{s.platform} ↗</a>
          ))}
          <a href={`mailto:${brand.email}`}>Email ↗</a>
        </div>
      </div>
      <div className="footer__bar">
        <div className="wrap footer__bar-in">
          <span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
          <span>Developed by <strong>Abdulrasheed Yusuf</strong></span>
        </div>
      </div>
    </footer>
  );
}
