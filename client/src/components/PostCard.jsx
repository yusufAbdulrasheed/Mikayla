import { Link } from 'react-router-dom';
import { cdn } from '../lib/text.jsx';

export default function PostCard({ post, large }) {
  const date = new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <article className={`card reveal ${large ? 'card--large' : ''}`}>
      <Link to={`/writing/${post.slug}`} className="card__img">
        {post.cover && <img src={cdn(post.cover, 900)} alt="" loading="lazy" />}
        <span className="card__cat">{post.category}</span>
      </Link>
      <div className="card__body">
        <p className="card__meta">{date} · {post.readTime} min read</p>
        <h3><Link to={`/writing/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <Link to={`/writing/${post.slug}`} className="link-u">Read ↗</Link>
      </div>
    </article>
  );
}
