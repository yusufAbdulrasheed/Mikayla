import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import PostCard from '../components/PostCard.jsx';
import VideoCard from '../components/VideoCard.jsx';
import BookCard from '../components/BookCard.jsx';
import Analytics from '../components/Analytics.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import Contact from '../components/Contact.jsx';
import useReveal from '../lib/useReveal.js';
import { getPosts, getServices, getGallery, getVideos, getBooks, getReviews } from '../lib/api.js';
import { useRev, useSite } from '../lib/SiteContext.jsx';
import { Heading, Lines, cdn, paragraphs } from '../lib/text.jsx';

export default function Home() {
  const site = useSite();
  const [data, setData] = useState({ posts: [], services: [], gallery: [], videos: [], books: [], reviews: [] });
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const rev = useRev();
  useEffect(() => {
    Promise.all([getPosts(), getServices(), getGallery(), getVideos(), getBooks(), getReviews()])
      .then(([posts, services, gallery, videos, books, reviews]) => { setData({ posts: posts.slice(0, 3), services, gallery, videos, books, reviews }); setError(false); })
      .catch(() => setError(true));
  }, [rev]);

  useReveal([data, showAll]);

  const { about, nursing, work, writing, videos: vSec, moments, books: bSec, reviews: rSec, marquee, brand } = site;
  const reviewList = showAll ? data.reviews : data.reviews.slice(0, 6);
  const loop = marquee.length ? [...marquee, ...marquee, ...marquee] : [];

  return (
    <>
      <Hero />

      {loop.length > 0 && (
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {loop.map((m, i) => (<span key={i}>{m} <b>✳</b></span>))}
          </div>
        </div>
      )}

      <section className="about wrap" id="about">
        <div className="about__img reveal">
          <img src={cdn(about.photo, 900)} alt={`${brand.first}, natural and sunlit`} loading="lazy" />
          {about.stamp && <span className="about__stamp"><Lines text={about.stamp} /></span>}
        </div>
        <div className="about__copy reveal">
          <p className="kicker">{about.kicker}</p>
          <Heading heading={about.heading} emphasis={about.emphasis} />
          {paragraphs(about.body).map((p, i) => (<p key={i}>{p}</p>))}
          {about.stats.length > 0 && (
            <div className="about__stats">
              {about.stats.map((s) => (<div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>))}
            </div>
          )}
        </div>
      </section>

      <Analytics />

      {data.services.length > 0 && (
        <section className="work" id="work">
          <div className="wrap">
            <div className="head reveal">
              <p className="kicker">{work.kicker}</p>
              <Heading heading={work.heading} emphasis={work.emphasis} />
            </div>
            <div className="work__grid">
              {data.services.map((s) => (
                <div className="service reveal" key={s.id}>
                  <span className="service__n">{s.icon}</span>
                  <h3>{s.title}</h3>
                  <p>{s.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="writing wrap" id="writing">
        <div className="head head--row reveal">
          <div>
            <p className="kicker">{writing.kicker}</p>
            <Heading heading={writing.heading} emphasis={writing.emphasis} />
          </div>
          <Link to="/writing" className="link-u">All stories ↗</Link>
        </div>
        {error && <p className="muted">Stories are taking a nap. Please try again shortly.</p>}
        <div className="writing__grid">
          {data.posts.map((p, i) => (<PostCard key={p.slug} post={p} large={i === 0} />))}
        </div>
      </section>

      {data.videos.length > 0 && (
        <section className="videos" id="videos">
          <div className="wrap">
            <div className="head reveal">
              <p className="kicker kicker--light">{vSec.kicker}</p>
              <Heading heading={vSec.heading} emphasis={vSec.emphasis} className="display display--light" />
            </div>
            <div className="videos__grid">
              {data.videos.map((v) => (<VideoCard key={v.id} video={v} />))}
            </div>
          </div>
        </section>
      )}

      {data.gallery.length > 0 && (
        <section className="moments">
          <div className="wrap">
            <div className="head reveal">
              <p className="kicker">{moments.kicker}</p>
              <Heading heading={moments.heading} emphasis={moments.emphasis} />
            </div>
            <div className="moments__grid">
              {data.gallery.map((g, i) => (
                <figure className="moment reveal" key={g.id}>
                  <img src={cdn(g.src, 800)} alt={g.alt || g.caption} loading="lazy" />
                  {g.caption && <figcaption><span>{String(i + 1).padStart(2, '0')}</span>{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.books.length > 0 && (
        <section className="books wrap" id="books">
          <div className="head reveal">
            <p className="kicker">{bSec.kicker}</p>
            <Heading heading={bSec.heading} emphasis={bSec.emphasis} />
          </div>
          <div className="books__grid">
            {data.books.map((b) => (<BookCard key={b.id} book={b} />))}
          </div>
        </section>
      )}

      {data.reviews.length > 0 && (
        <section className="reviews" id="reviews">
          <div className="wrap">
            <div className="head head--row reveal">
              <div>
                <p className="kicker">{rSec.kicker}</p>
                <Heading heading={rSec.heading} emphasis={rSec.emphasis} />
              </div>
              <p className="reviews__count"><b>{data.reviews.length}</b> book{data.reviews.length === 1 ? '' : 's'} edited</p>
            </div>
            <div className="reviews__grid">
              {reviewList.map((r) => (<ReviewCard key={r.id} review={r} />))}
            </div>
            {data.reviews.length > 6 && (
              <div className="reviews__more">
                <button type="button" className="btn" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `Show all ${data.reviews.length} books`}</button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="nursing wrap" id="nursing">
        <div className="nursing__copy reveal">
          <p className="kicker">{nursing.kicker}</p>
          <Heading heading={nursing.heading} emphasis={nursing.emphasis} />
          <p>{nursing.body}</p>
          <a className="link-u" href={`mailto:${brand.email}?subject=Hello%20${encodeURIComponent(brand.first)}`}>{nursing.ctaLabel} ↗</a>
        </div>
        <div className="nursing__img reveal">
          <img src={cdn(nursing.photo, 1000)} alt="Compassionate care" loading="lazy" />
          {nursing.label && <span className="nursing__label">{nursing.label}</span>}
        </div>
      </section>

      <Contact />
    </>
  );
}
