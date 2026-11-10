import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../lib/api.js';
import { useReloadSite } from '../../lib/SiteContext.jsx';
import { FieldRenderer, useToast } from '../ui.jsx';
import { getPath, setPath, settingsTabs } from '../configs.js';

export default function SiteEditor() {
  const toast = useToast();
  const reloadSite = useReloadSite();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState(settingsTabs[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { adminApi.getSettings().then((s) => { setSaved(s); setDraft(s); }).catch((e) => setError(e.message)); }, []);

  const dirty = useMemo(() => saved && draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    setBusy(true);
    try {
      const next = await adminApi.saveSettings(draft);
      setSaved(next);
      setDraft(next);
      reloadSite();
      toast('Saved. Your website is updated ✓');
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="adm-page"><p className="adm-error">{error}</p></div>;
  if (!draft) return <div className="adm-page"><p className="adm-muted">Loading…</p></div>;

  const current = settingsTabs.find((t) => t.id === tab);
  return (
    <div className="adm-page">
      <header className="adm-head adm-head--sticky">
        <div>
          <h1>Website text & cover</h1>
          <p>Change what visitors read on your website.</p>
        </div>
        <div className="adm-head__actions">
          {dirty && <span className="adm-pill">Unsaved changes</span>}
          <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </header>

      <div className="adm-tabs" role="tablist">
        {settingsTabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === tab} className={t.id === tab ? 'is-active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <section className="adm-card adm-form" role="tabpanel">
        {current.fields.map((f) => (
          <FieldRenderer key={f.path} field={f} value={getPath(draft, f.path)} onChange={(v) => setDraft((d) => setPath(d, f.path, v))} />
        ))}
      </section>
    </div>
  );
}
