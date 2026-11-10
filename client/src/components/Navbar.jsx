import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSite } from '../lib/SiteContext.jsx';

const links = [
  { to: '/#about', label: 'About' },
  { to: '/#work', label: 'Work' },
  { to: '/writing', label: 'Writing' },
  { to: '/#nursing', label: 'Nursing' },
];

export default function Navbar() {
  const { brand } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const solid = scrolled || pathname !== '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`nav ${solid ? 'nav--solid' : ''}`}>
      <Link to="/" className="nav__brand" onClick={() => setOpen(false)}>
        {brand.first}<span>.</span>
      </Link>
      <button className="nav__toggle" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
        <span /><span />
      </button>
      <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
        {links.map((l) => (l.to.includes('#')
          ? <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
          : <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</NavLink>))}
        <Link className="nav__cta" to="/#contact" onClick={() => setOpen(false)}>Let’s work ↗</Link>
      </nav>
    </header>
  );
}
