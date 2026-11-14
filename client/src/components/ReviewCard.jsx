import { useState } from 'react';
import { cdn } from '../lib/text.jsx';

export function Stars({ value }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (<i key={n} className={n <= value ? 'on' : ''} aria-hidden="true">★</i>))}
    </span>
  );
}

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '');

export default function ReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const paras = Array.isArray(review.review) ? review.review : [];
  return (
    <article className="review reveal">
      <div className="review__cover">
        {review.cover
          ? <img src={cdn(review.cover, 400)} alt={`Cover of ${review.title}`} loading="lazy" />
          : <span className="review__placeholder"><b>{review.title}</b></span>}
      </div>
      <div className="review__body">
        <Stars value={review.rating} />
        <h3>{review.title}</h3>
        <p className="review__meta">
          {[review.author && `by ${review.author}`, review.genre, fmt(review.reviewedAt)].filter(Boolean).join(' · ')}
        </p>
        {review.verdict && <p className="review__verdict">“{review.verdict}”</p>}
        {open && paras.map((p, i) => (<p className="review__text" key={i}>{p}</p>))}
        <div className="review__actions">
          {paras.length > 0 && (
            <button type="button" className="link-u" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Read more'}</button>
          )}
          {review.reviewUrl && <a className="link-u" href={review.reviewUrl} target="_blank" rel="noreferrer">View the book ↗</a>}
        </div>
      </div>
    </article>
  );
}
