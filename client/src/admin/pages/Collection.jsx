import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, uploadFile } from '../../lib/api.js';
import { collectionsConfig } from '../configs.js';
import { FieldRenderer, useToast } from '../ui.jsx';

export default function Collection({ colKey }) {
  const cfg = collectionsConfig[colKey];
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bulk, setBulk] = useState(null);
  const bulkInput = useRef();

  const load = useCallback(() => adminApi.list(colKey).then(setItems).catch((e) => toast(e.message, 'err')), [colKey, toast]);
  useEffect(() => { setItems(null); setEditing(null); load(); }, [load]);

  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => e.key === 'Escape' && setEditing(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  async function save() {
    setBusy(true);
    try {
      if (editing.id) await adminApi.update(colKey, editing.id, editing.data);
      else await adminApi.create(colKey, editing.data);
      toast('Saved ✓');
      setEditing(null);
      load();
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${cfg.name(item)}”? This can’t be undone.`)) return;
    try { await adminApi.remove(colKey, item.id); toast('Deleted'); load(); } catch (e) { toast(e.message, 'err'); }
  }

  async function toggle(item) {
    try { await adminApi.update(colKey, item.id, { ...item, published: !item.published }); load(); } catch (e) { toast(e.message, 'err'); }
  }

  async function move(index, delta) {
    const j = index + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    try { await adminApi.reorder(colKey, next.map((i) => i.id)); } catch (e) { toast(e.message, 'err'); load(); }
  }

  async function bulkUpload(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    let done = 0;
    let failed = 0;
    for (const file of files) {
      setBulk({ done, total: files.length });
      try {
        const { url } = await uploadFile(file, 'image');
        await adminApi.create(colKey, { ...cfg.bulk.defaults, [cfg.bulk.field]: url, caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
        done += 1;
      } catch (err) {
        failed += 1;
        toast(`${file.name}: ${err.message}`, 'err');
      }
    }
    setBulk(null);
    if (done) toast(`${done} photo${done > 1 ? 's' : ''} added. Add captions below ✓${failed ? ` (${failed} failed)` : ''}`);
    load();
  }

  const hasPublished = cfg.fields.some((f) => f.key === 'published');
  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>{cfg.title}</h1>
          <p>{cfg.intro}</p>
        </div>
        <div className="adm-head__actions">
          {cfg.bulk && (
            <>
              <button className="adm-btn adm-btn--soft" onClick={() => bulkInput.current.click()} disabled={!!bulk}>
                {bulk ? `Uploading ${bulk.done + 1} of ${bulk.total}…` : '⇪ Upload photos'}
              </button>
              <input ref={bulkInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden onChange={bulkUpload} />
            </>
          )}
          <button className="adm-btn adm-btn--primary" onClick={() => setEditing({ data: cfg.blank() })}>+ Add {cfg.singular}</button>
        </div>
      </header>

      {items === null && <p className="adm-muted">Loading…</p>}
      {items?.length === 0 && (
        <div className="adm-empty">
          <span>{cfg.icon}</span>
          <h2>No {cfg.title.toLowerCase()} yet</h2>
          <p>Click “Add {cfg.singular}” to create your first one.</p>
        </div>
      )}

      <ul className="adm-list">
        {items?.map((item, i) => (
          <li key={item.id} className={`adm-row ${hasPublished && item.published === false ? 'is-hidden' : ''}`}>
            {cfg.thumb && (
              <div className="adm-row__thumb">{cfg.thumb(item) ? <img src={cfg.thumb(item)} alt="" loading="lazy" /> : <span>{cfg.icon}</span>}</div>
            )}
            <div className="adm-row__main">
              <b>{cfg.name(item)}</b>
              <small>{cfg.sub(item)}</small>
              {hasPublished && <span className={`adm-badge ${item.published === false ? 'adm-badge--off' : ''}`}>{item.published === false ? 'Hidden' : 'Live'}</span>}
            </div>
            <div className="adm-row__actions">
              {cfg.sortable && (
                <>
                  <button aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
                </>
              )}
              {hasPublished && <button onClick={() => toggle(item)}>{item.published === false ? 'Show' : 'Hide'}</button>}
              {cfg.viewUrl && item.published !== false && <a href={cfg.viewUrl(item)} target="_blank" rel="noreferrer">View ↗</a>}
              <button className="adm-btn adm-btn--soft adm-btn--sm" onClick={() => setEditing({ id: item.id, data: { ...item } })}>Edit</button>
              <button className="adm-x" aria-label={`Delete ${cfg.name(item)}`} onClick={() => remove(item)}>✕</button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="adm-drawer-back" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={`${editing.id ? 'Edit' : 'Add'} ${cfg.singular}`}>
            <header>
              <h2>{editing.id ? 'Edit' : 'Add'} {cfg.singular}</h2>
              <button className="adm-x" aria-label="Close" onClick={() => setEditing(null)}>✕</button>
            </header>
            <div className="adm-drawer__body adm-form">
              {cfg.fields.map((f) => (
                <FieldRenderer key={f.key} field={f} value={editing.data[f.key]} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, [f.key]: v } }))} />
              ))}
            </div>
            <footer>
              <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
