import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiUrl, getSite } from './api.js';

const Ctx = createContext(null);

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

export function SiteProvider({ children }) {
  const [site, setSite] = useState(null);
  const [error, setError] = useState(false);
  const [rev, setRev] = useState(0);
  const [slow, setSlow] = useState(false);
  const lastServerRev = useRef(null);
  const timer = useRef();

  const reload = useCallback(() => getSite().then((s) => { setSite(s); setError(false); }).catch(() => setError(true)), []);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (site) return undefined; const t = setTimeout(() => setSlow(true), 6000); return () => clearTimeout(t); }, [site]);

  useEffect(() => { if (rev > 0) reload(); }, [rev, reload]);

  useEffect(() => {
    const changed = (serverRev) => {
      if (serverRev != null && serverRev === lastServerRev.current) return;
      lastServerRev.current = serverRev ?? lastServerRev.current;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRev((r) => r + 1), 250);
    };
    const first = (serverRev) => { if (lastServerRev.current == null) lastServerRev.current = serverRev; else changed(serverRev); };

    let es;
    if (typeof EventSource !== 'undefined') {
      es = new EventSource(apiUrl('/events'));
      es.addEventListener('hello', (e) => first(JSON.parse(e.data).rev));
      es.addEventListener('content', (e) => changed(JSON.parse(e.data).rev));
    }

    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      try { const { rev: serverRev } = await (await fetch(apiUrl('/version'))).json(); first(serverRev); } catch { }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { es?.close(); document.removeEventListener('visibilitychange', onVisible); clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (!site) return;
    if (!location.pathname.startsWith('/admin')) document.title = site.seo.title;
    setMeta('description', site.seo.description);
  }, [site]);

  if (error && !site) {
    return (
      <div className="boot">
        <p>We couldn’t load the site just now.</p>
        <button className="btn btn--light" onClick={reload}>Try again</button>
      </div>
    );
  }
  if (!site) return <div className="boot" aria-label="Loading"><span>Mikayla<i>.</i></span>{slow && <p>Waking the website up… this can take up to a minute after a quiet spell.</p>}</div>;
  return <Ctx.Provider value={{ site, reload, rev }}>{children}</Ctx.Provider>;
}

export const useSite = () => useContext(Ctx).site;
export const useReloadSite = () => useContext(Ctx).reload;
export const useRev = () => useContext(Ctx).rev;
