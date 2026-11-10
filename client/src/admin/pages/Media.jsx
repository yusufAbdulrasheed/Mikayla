import { useEffect, useRef, useState } from 'react';
import { adminApi, uploadFile } from '../../lib/api.js';
import { StorageNote, mb, useConfirm, useToast } from '../ui.jsx';

const FILTERS = [['all', 'All'], ['image', 'Photos'], ['video', 'Videos'], ['doc', 'Books & files']];
const guessKind = (file) => (file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'doc');
const absolute = (url) => (url.startsWith('http') ? url : `${location.origin}${url}`);
const niceName = (name) => name.replace(/^[a-z0-9]+-[a-f0-9]{6,8}-/, '');

export default function Media() {
  const toast = useToast();
  const confirm = useConfirm();
  const input = useRef();
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [progress, setProgress] = useState(null);

  const load = () => adminApi.media().then((list) => { setFiles(list); setError(''); }).catch((e) => { setFiles([]); setError(e.message); });
  useEffect(() => { load(); }, []);

  async function upload(e) {
    const list = [...(e.target.files || [])];
    e.target.value = '';
    for (const file of list) {
      setProgress({ name: file.name, pct: 0 });
      try { await uploadFile(file, guessKind(file), (pct) => setProgress({ name: file.name, pct })); } catch (err) { toast(`${file.name}: ${err.message}`, 'err'); }
    }
    setProgress(null);
    load();
  }

  async function remove(f) {
    const message = f.inUse ? 'This file is used on your website. Deleting it will leave a gap there.' : 'It will be removed permanently.';
    if (!(await confirm({ title: 'Delete this file?', message, confirmLabel: 'Delete' }))) return;
    try { await adminApi.removeMedia(f.kind, f.id); toast('Deleted'); load(); } catch (err) { toast(err.message, 'err'); }
  }

  async function copy(f) {
    try { await navigator.clipboard.writeText(absolute(f.url)); toast('Link copied ✓'); } catch { toast(absolute(f.url)); }
  }

  const shown = files?.filter((f) => filter === 'all' || f.kind === filter);
  const total = files?.reduce((n, f) => n + (f.size || 0), 0) || 0;

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Media library</h1>
          <p>Everything you’ve uploaded{files ? ` (${files.length} files, ${mb(total)})` : ''}. You can also upload while editing a story, photo or book.</p>
        </div>
        <div className="adm-head__actions">
          <button className="adm-btn adm-btn--primary" onClick={() => input.current.click()} disabled={!!progress}>
            {progress ? `Uploading ${progress.pct}%` : '⇪ Upload files'}
          </button>
          <input ref={input} type="file" multiple hidden onChange={upload} accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,application/pdf,application/epub+zip,.epub" />
        </div>
      </header>

      <StorageNote />
      {error && <p className="adm-error" role="alert">{error}</p>}

      <div className="adm-tabs">
        {FILTERS.map(([k, label]) => (<button key={k} className={filter === k ? 'is-active' : ''} onClick={() => setFilter(k)}>{label}</button>))}
      </div>

      {files === null && <p className="adm-muted">Loading…</p>}
      {shown?.length === 0 && !error && <div className="adm-empty"><span>▣</span><h2>Nothing here yet</h2><p>Uploaded photos, videos and files show up here.</p></div>}

      <ul className="adm-media-grid">
        {shown?.map((f) => (
          <li key={f.url} className="adm-file">
            <div className="adm-file__thumb">
              {f.kind === 'image' && <img src={f.url} alt="" loading="lazy" />}
              {f.kind === 'video' && <video src={f.url} preload="metadata" muted />}
              {f.kind === 'doc' && <span>📄</span>}
            </div>
            <div className="adm-file__info">
              <b title={f.name}>{niceName(f.name)}</b>
              <small>{mb(f.size || 0)} · {f.inUse ? 'In use' : 'Not used'}</small>
            </div>
            <div className="adm-file__actions">
              <a href={f.url} target="_blank" rel="noreferrer">Open</a>
              <button onClick={() => copy(f)}>Copy link</button>
              <button className="adm-danger" onClick={() => remove(f)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
