export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const apiUrl = (path) => `${API_BASE}/api${path}`;

const TOKEN_KEY = 'mk_admin_token';
const readToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const saveToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { } };
const authHeaders = () => { const t = readToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(path, options = {}) {
  const method = options.method || 'GET';
  let res;
  for (let attempt = 0; ; attempt += 1) {
    try {
      res = await fetch(apiUrl(path), {
        credentials: 'same-origin',
        ...options,
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
      });
      break;
    } catch {
      if (method !== 'GET' || attempt >= 3) throw Object.assign(new Error('Can’t reach the website server right now. If it has been idle it may need a minute to wake up. Please try again.'), { status: 0 });
      await wait(2500 * (attempt + 1));
    }
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path.startsWith('/admin') && path !== '/admin/login') {
    saveToken('');
    window.dispatchEvent(new Event('adm-unauth'));
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}
const send = (method, path, body) => request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export const getSite = () => request('/site');
export const getPosts = () => request('/posts');
export const getPost = (slug) => request(`/posts/${slug}`);
export const getServices = () => request('/services');
export const getGallery = () => request('/gallery');
export const getVideos = () => request('/videos');
export const getBooks = () => request('/books');
export const getVersion = () => request('/version');
export const sendMessage = (payload) => send('POST', '/contact', payload);

export const adminApi = {
  me: () => request('/admin/me'),
  login: async (password) => {
    const res = await send('POST', '/admin/login', { password });
    saveToken(res.token);
    return res;
  },
  logout: async () => {
    saveToken('');
    return send('POST', '/admin/logout').catch(() => ({}));
  },
  changePassword: (current, next) => send('POST', '/admin/password', { current, next }),
  stats: () => request('/admin/stats'),
  getSettings: () => request('/admin/settings'),
  saveSettings: (settings) => send('PUT', '/admin/settings', settings),
  list: (col) => request(`/admin/c/${col}`),
  create: (col, item) => send('POST', `/admin/c/${col}`, item),
  update: (col, id, item) => send('PUT', `/admin/c/${col}/${id}`, item),
  remove: (col, id) => send('DELETE', `/admin/c/${col}/${id}`),
  reorder: (col, ids) => send('PUT', `/admin/c/${col}/order`, { ids }),
  messages: () => request('/admin/messages'),
  markRead: (id, read) => send('PATCH', `/admin/messages/${id}`, { read }),
  removeMessage: (id) => send('DELETE', `/admin/messages/${id}`),
  media: () => request('/admin/media'),
  removeMedia: (kind, id) => send('DELETE', `/admin/media?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`),
  storage: () => request('/admin/storage'),
  migrateMedia: () => send('POST', '/admin/migrate-media'),
};

export function uploadFile(file, kind, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl(`/admin/upload?kind=${kind}`));
    const token = readToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { }
      if (xhr.status === 401) { saveToken(''); window.dispatchEvent(new Event('adm-unauth')); }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(Object.assign(new Error(data.error || 'Upload failed.'), { status: xhr.status }));
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}
