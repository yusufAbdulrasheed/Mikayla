import { Fragment } from 'react';

export function Lines({ text = '' }) {
  const parts = String(text).split('\n');
  return parts.map((line, i) => (
    <Fragment key={i}>{line}{i < parts.length - 1 && <br />}</Fragment>
  ));
}

export function Heading({ heading, emphasis, as: Tag = 'h2', className = 'display' }) {
  return <Tag className={className}>{heading} {emphasis && <em>{emphasis}</em>}</Tag>;
}

export const paragraphs = (text = '') => String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function embedSrc(url = '') {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') || u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { }
  return null;
}

export function cdn(url, width) {
  if (!url) return url;
  const m = String(url).match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!f_auto)(.*)$/);
  if (!m) return url;
  return `${m[1]}f_auto,q_auto${width ? `,w_${width}` : ''}/${m[2]}`;
}
