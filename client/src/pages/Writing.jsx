import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard.jsx';
import useReveal from '../lib/useReveal.js';
import { getPosts } from '../lib/api.js';
import { useRev } from '../lib/SiteContext.jsx';

export default function Writing() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const rev = useRev();
  useEffect(() => {
    getPosts().then((p) => { setPosts(p); setError(false); }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [rev]);
  useReveal([posts]);

  return (
    <div className="wrap page-pad">
      <p className="kicker">The archive</p>
      <h1 className="display display--xl">All the <em>writing.</em></h1>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="muted">Couldn’t load stories right now.</p>}
      <div className="writing__grid writing__grid--all">
        {posts.map((p) => (<PostCard key={p.slug} post={p} />))}
      </div>
    </div>
  );
}
