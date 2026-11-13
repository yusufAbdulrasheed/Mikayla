export class ValidationError extends Error {}

const safeMedia = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^\/uploads\/(image|video|doc)\/[\w.\-]+$/.test(s)) return s;
  if (/^https?:\/\/[^\s]+$/i.test(s) && s.length < 1000) return s;
  throw new ValidationError('A file or link is not valid. Use an upload or a full https:// address.');
};
const safeLink = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^(https?:\/\/|mailto:|\/)[^\s]*$/i.test(s) && s.length < 1000) return s;
  throw new ValidationError('A link is not valid. Use a full https:// address.');
};

const t = {
  str: (max = 200) => ({ t: 'str', max }),
  text: (max = 5000) => ({ t: 'text', max }),
  media: { t: 'media' },
  link: { t: 'link' },
  bool: { t: 'bool' },
  num: (min, max) => ({ t: 'num', min, max }),
  date: { t: 'date' },
  enum: (values) => ({ t: 'enum', values }),
  paras: { t: 'paras' },
  lines: (max = 30, len = 80) => ({ t: 'lines', max, len }),
  obj: (fields) => ({ t: 'obj', fields }),
  list: (of, max = 30) => ({ t: 'list', of, max }),
};

export function clean(schema, value) {
  switch (schema.t) {
    case 'str': return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, schema.max);
    case 'text': return String(value ?? '').replace(/\r\n/g, '\n').trim().slice(0, schema.max);
    case 'media': return safeMedia(value);
    case 'link': return safeLink(value);
    case 'bool': return value === true || value === 'true';
    case 'num': {
      const n = Number(value);
      if (!Number.isFinite(n)) return schema.min ?? 0;
      return Math.min(schema.max ?? n, Math.max(schema.min ?? n, Math.round(n)));
    }
    case 'date': {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
    }
    case 'enum': return schema.values.includes(value) ? value : schema.values[0];
    case 'paras': {
      const arr = Array.isArray(value) ? value : String(value ?? '').split(/\n\s*\n/);
      return arr.map((p) => String(p).replace(/\r\n/g, '\n').trim()).filter(Boolean).slice(0, 80).map((p) => p.slice(0, 5000));
    }
    case 'lines': {
      const arr = Array.isArray(value) ? value : String(value ?? '').split('\n');
      return arr.map((p) => String(p).trim().slice(0, schema.len)).filter(Boolean).slice(0, schema.max);
    }
    case 'obj': {
      const src = value && typeof value === 'object' ? value : {};
      return Object.fromEntries(Object.entries(schema.fields).map(([k, s]) => [k, clean(s, src[k])]));
    }
    case 'list': {
      const arr = Array.isArray(value) ? value : [];
      return arr.slice(0, schema.max).map((v) => clean(schema.of, v));
    }
    default: return undefined;
  }
}

const heading = { kicker: t.str(80), heading: t.str(120), emphasis: t.str(120) };
const count = t.num(0, 100000000000);
const gain = t.num(-100000000000, 100000000000);
const metrics = t.obj({ views: count, likes: count, comments: count, gained: gain });
const rangeSet = t.obj({ instagram: metrics, tiktok: metrics, x: metrics, medium: metrics });
const platform = t.obj({ handle: t.str(60), followers: count });

export const settingsSchema = t.obj({
  brand: t.obj({ name: t.str(80), first: t.str(40), email: t.str(160) }),
  seo: t.obj({ title: t.str(120), description: t.str(300) }),
  social: t.list(t.obj({ platform: t.str(40), url: t.link }), 12),
  hero: t.obj({
    issue: t.str(30), date: t.str(40), label: t.str(60), mast: t.str(24), tag: t.str(120),
    photo: t.media, quote: t.text(200), badge: t.text(40), ctaLabel: t.str(40),
    leftLines: t.list(t.obj({ k: t.str(40), t: t.str(120) }), 4),
    rightLines: t.list(t.obj({ k: t.str(40), t: t.str(120) }), 4),
  }),
  marquee: t.lines(14, 40),
  about: t.obj({
    ...heading, body: t.text(3000), photo: t.media, stamp: t.text(60),
    stats: t.list(t.obj({ value: t.str(12), label: t.str(40) }), 4),
  }),
  work: t.obj(heading),
  writing: t.obj(heading),
  videos: t.obj(heading),
  moments: t.obj(heading),
  books: t.obj(heading),
  reviews: t.obj(heading),
  analytics: t.obj({ show: t.bool, ...heading, period: t.str(60), instagram: platform, tiktok: platform, x: platform, medium: platform, ranges: t.obj({ d7: rangeSet, d30: rangeSet, d90: rangeSet, y1: rangeSet }) }),
  nursing: t.obj({ ...heading, body: t.text(2000), photo: t.media, label: t.str(60), ctaLabel: t.str(40) }),
  contact: t.obj({ ...heading, text: t.text(500) }),
  footer: t.obj({ note: t.str(160) }),
});

export const collections = {
  posts: {
    required: ['title', 'excerpt'],
    schema: t.obj({
      title: t.str(160), slug: t.str(120), excerpt: t.text(500), category: t.str(40), cover: t.media,
      readTime: t.num(1, 120), publishedAt: t.date, featured: t.bool, published: t.bool, body: t.paras,
    }),
  },
  services: { required: ['title'], schema: t.obj({ title: t.str(80), blurb: t.text(300), icon: t.str(8) }) },
  gallery: {
    required: ['src'],
    schema: t.obj({ src: t.media, alt: t.str(160), caption: t.str(160), published: t.bool }),
  },
  videos: {
    required: ['title'],
    schema: t.obj({
      title: t.str(140), description: t.text(600), file: t.media, poster: t.media, embedUrl: t.link, published: t.bool,
    }),
  },
  books: {
    required: ['title'],
    schema: t.obj({
      title: t.str(140), subtitle: t.str(180), description: t.text(1200), cover: t.media,
      status: t.enum(['available', 'coming-soon', 'free']), buyUrl: t.link, file: t.media, fileLabel: t.str(40),
      year: t.str(8), published: t.bool,
    }),
  },
  reviews: {
    required: ['title'],
    schema: t.obj({
      title: t.str(160), author: t.str(120), cover: t.media, rating: t.num(1, 5), genre: t.str(60),
      reviewedAt: t.date, verdict: t.str(180), review: t.paras, reviewUrl: t.link, published: t.bool,
    }),
  },
};

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'story';
