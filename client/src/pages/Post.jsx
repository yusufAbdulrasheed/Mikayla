import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPost } from '../lib/api.js';
import { useRev } from '../lib/SiteContext.jsx';
import { cdn } from '../lib/text.jsx';

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(false);

  const rev = useRev();

  useEffect(() => { setPost(null); setError(false); }, [slug]);
  useEffect(() => {
    let alive = true;
    getPost(slug).then((p) => { if (alive) { setPost(p); setError(false); } }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [slug, rev]);

  if (error) return <div className="wrap page-pad"><h1 className="display">Story not found</h1><Link className="link-u" to="/writing">← Back to writing</Link></div>;
  if (!post) return <div className="wrap page-pad"><p className="muted">Loading…</p></div>;

  return (
    <article className="post">
      <div className="wrap page-pad post__head">
        <Link className="link-u" to="/writing">← All writing</Link>
        <p className="kicker">{post.category} · {post.readTime} min read</p>
        <h1 className="display display--xl">{post.title}</h1>
        <p className="post__lede">{post.excerpt}</p>
      </div>
      {post.cover && <img className="post__cover" src={cdn(post.cover, 1600)} alt="" />}
      <div className="post__body">
        {post.body?.map((para, i) => (<p key={i}>{para}</p>))}
      </div>
    </article>
  );
}
