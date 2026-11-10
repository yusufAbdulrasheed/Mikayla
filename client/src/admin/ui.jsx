import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { adminApi, uploadFile } from '../lib/api.js';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const show = useCallback((msg, type = 'ok') => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && <div className={`adm-toast adm-toast--${toast.type}`} role="status">{toast.msg}</div>}
    </ToastCtx.Provider>
  );
}

export function Field({ label, help, children }) {
  return (
    <label className="adm-field">
      <span className="adm-label">{label}</span>
      {children}
      {help && <small className="adm-help">{help}</small>}
    </label>
  );
}

export const Text = ({ label, help, value, onChange, max, placeholder, type = 'text' }) => (
  <Field label={label} help={help}>
    <input type={type} value={value ?? ''} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </Field>
);

export const Area = ({ label, help, value, onChange, rows = 4, max, placeholder }) => (
  <Field label={label} help={help}>
    <textarea rows={rows} value={value ?? ''} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </Field>
);

export const Select = ({ label, help, value, onChange, options }) => (
  <Field label={label} help={help}>
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  </Field>
);

export function Toggle({ label, help, value, onChange }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-toggle__track" aria-hidden="true" />
      <span className="adm-toggle__text"><b>{label}</b>{help && <small>{help}</small>}</span>
    </label>
  );
}

const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
  video: 'video/mp4,video/webm,video/quicktime,.m4v',
  doc: 'application/pdf,application/epub+zip,.epub',
};
const LABEL = {
  image: 'JPG, PNG, WebP, GIF or AVIF',
  video: 'MP4, WebM or MOV',
  doc: 'PDF or EPUB',
};

let storagePromise;
const loadStorage = () => (storagePromise ||= adminApi.storage().catch(() => null));
export function useStorage() {
  const [info, setInfo] = useState(null);
  useEffect(() => { let on = true; loadStorage().then((v) => on && setInfo(v)); return () => { on = false; }; }, []);
  return info;
}

export function StorageNote() {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => adminApi.storage().then(setInfo).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  async function move() {
    setBusy(true);
    try {
      const r = await adminApi.migrateMedia();
      toast(r.failed.length ? `Moved ${r.moved} file${r.moved === 1 ? '' : 's'}. ${r.failed.length} couldn’t be moved.` : `Moved ${r.moved} file${r.moved === 1 ? '' : 's'} to Cloudinary ✓`, r.failed.length ? 'err' : 'ok');
      load();
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  if (!info) return null;
  if (info.provider === 'cloudinary' && !info.connected) {
    return <p className="adm-note adm-note--bad" role="alert">☁ Cloudinary can’t be reached right now: {info.error} Uploads won’t work until this is fixed.</p>;
  }
  if (info.provider === 'cloudinary') {
    return (
      <>
        <p className="adm-note adm-note--ok">☁ Your photos, videos and files are stored safely on Cloudinary.</p>
        {info.localFiles > 0 && (
          <p className="adm-note adm-note--warn">
            {info.localFiles} file{info.localFiles === 1 ? ' is' : 's are'} still saved on this computer (uploaded before Cloudinary was connected).{' '}
            <button type="button" className="adm-link" onClick={move} disabled={busy}>{busy ? 'Moving…' : 'Move them to Cloudinary'}</button>
          </p>
        )}
      </>
    );
  }
  return (
    <p className="adm-note adm-note--warn">
      ⚠ Files are currently saved on the computer running the website, not in the cloud. They can be lost if the website is moved or rebuilt.
      Add the Cloudinary keys to <b>server/.env</b> to store everything safely (see the README).
    </p>
  );
}

export const mb = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function MediaField({ label, help, value, onChange, kind = 'image' }) {
  const input = useRef();
  const toast = useToast();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [showLink, setShowLink] = useState(false);
  const storage = useStorage();

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      const { url } = await uploadFile(file, kind, setProgress);
      onChange(url);
      toast('Uploaded ✓');
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  }

  const name = value ? decodeURIComponent(value.split('/').pop()) : '';
  return (
    <div className="adm-field">
      <span className="adm-label">{label}</span>
      <div className="adm-media">
        {value ? (
          <div className="adm-media__preview">
            {kind === 'image' && <img src={value} alt="" />}
            {kind === 'video' && <video src={value} controls preload="metadata" />}
            {kind === 'doc' && <a href={value} target="_blank" rel="noreferrer">📄 {name}</a>}
          </div>
        ) : (
          <div className="adm-media__empty">No {kind === 'doc' ? 'file' : kind} yet</div>
        )}
        <div className="adm-media__actions">
          <button type="button" className="adm-btn adm-btn--soft" onClick={() => input.current.click()} disabled={progress !== null}>
            {progress !== null ? `Uploading ${progress}%` : value ? 'Replace' : `Upload ${kind === 'doc' ? 'file' : kind}`}
          </button>
          {value && <button type="button" className="adm-btn adm-btn--ghost" onClick={() => onChange('')}>Remove</button>}
          <button type="button" className="adm-link" onClick={() => setShowLink(!showLink)}>{showLink ? 'Hide link box' : 'or paste a link'}</button>
        </div>
        {progress !== null && <div className="adm-progress"><i style={{ width: `${progress}%` }} /></div>}
        {showLink && (
          <input className="adm-media__url" value={value ?? ''} placeholder="https://…" onChange={(e) => onChange(e.target.value)} />
        )}
        {error && <p className="adm-error" role="alert">{error}</p>}
        <input ref={input} type="file" accept={ACCEPT[kind]} onChange={pick} hidden />
      </div>
      <small className="adm-help">{help ? `${help} ` : ''}{LABEL[kind]}{storage?.limits ? `, up to ${storage.limits[kind]} MB` : ''}.</small>
    </div>
  );
}

export function Repeater({ label, help, items = [], onChange, fields, max = 20, addLabel = 'Add', blank }) {
  const set = (i, key, val) => onChange(items.map((it, n) => (n === i ? { ...it, [key]: val } : it)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="adm-field">
      <span className="adm-label">{label}</span>
      {help && <small className="adm-help adm-help--top">{help}</small>}
      <div className="adm-repeat">
        {items.map((it, i) => (
          <div className="adm-repeat__row" key={i}>
            <div className="adm-repeat__fields">
              {fields.map((f) => (
                <label key={f.key} className="adm-field adm-field--tight">
                  <span className="adm-label adm-label--sm">{f.label}</span>
                  <input value={it[f.key] ?? ''} placeholder={f.placeholder} maxLength={f.max} onChange={(e) => set(i, f.key, e.target.value)} />
                </label>
              ))}
            </div>
            <div className="adm-repeat__ctl">
              <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
              <button type="button" aria-label="Remove" className="adm-x" onClick={() => onChange(items.filter((_, n) => n !== i))}>✕</button>
            </div>
          </div>
        ))}
        {items.length < max && (
          <button type="button" className="adm-btn adm-btn--soft adm-btn--sm" onClick={() => onChange([...items, { ...blank }])}>+ {addLabel}</button>
        )}
      </div>
    </div>
  );
}

export function FieldRenderer({ field, value, onChange }) {
  const common = { label: field.label, help: field.help };
  switch (field.type) {
    case 'textarea': return <Area {...common} value={value} onChange={onChange} rows={field.rows || 4} max={field.max} placeholder={field.placeholder} />;
    case 'paras': return <Area {...common} value={Array.isArray(value) ? value.join('\n\n') : value} onChange={onChange} rows={field.rows || 12} placeholder={field.placeholder} />;
    case 'lines': return <Area {...common} value={Array.isArray(value) ? value.join('\n') : value} onChange={(v) => onChange(v.split('\n'))} rows={field.rows || 5} placeholder={field.placeholder} />;
    case 'number': return <Text {...common} type="number" value={value} onChange={(v) => onChange(v === '' ? '' : Number(v))} />;
    case 'date': return <Text {...common} type="date" value={value} onChange={onChange} />;
    case 'bool': return <Toggle {...common} value={value} onChange={onChange} />;
    case 'select': return <Select {...common} value={value} onChange={onChange} options={field.options} />;
    case 'image': case 'video': case 'doc': return <MediaField {...common} kind={field.type} value={value} onChange={onChange} />;
    case 'repeater': return <Repeater {...common} items={value} onChange={onChange} fields={field.fields} max={field.max} addLabel={field.addLabel} blank={field.blank} />;
    case 'link': return <Text {...common} value={value} onChange={onChange} placeholder={field.placeholder || 'https://…'} />;
    default: return <Text {...common} value={value} onChange={onChange} max={field.max} placeholder={field.placeholder} />;
  }
}
