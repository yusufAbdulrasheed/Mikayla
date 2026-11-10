import { Link } from 'react-router-dom';
import { useSite } from '../lib/SiteContext.jsx';
import { Lines, cdn } from '../lib/text.jsx';

export default function Hero() {
  const { brand, hero } = useSite();
  const [quoteFirst, ...quoteRest] = hero.quote.split('\n');
  const vw = Math.min(17.2, 120 / Math.max(hero.mast.length, 4));

  return (
    <section className="cover" aria-label="Cover">
      <div className="cover__bar">
        <span>Issue {hero.issue}</span>
        <span className="cover__bar-mid">{hero.label}</span>
        <span>{hero.date}</span>
      </div>

      <h1 className="cover__mast" aria-label={brand.name} style={{ fontSize: `clamp(56px, ${vw}vw, 300px)` }}>
        <span>{hero.mast}</span>
      </h1>
      <p className="cover__tag">{hero.tag}</p>

      <div className="cover__stage">
        <ul className="cover__lines cover__lines--l">
          {hero.leftLines.map((l) => (
            <li key={l.k}><b>{l.k}</b><span>{l.t}</span></li>
          ))}
        </ul>

        <figure className="cover__photo">
          <img src={cdn(hero.photo, 1200)} alt={`Portrait of ${brand.first}`} fetchpriority="high" />
          <figcaption className="cover__quote">
            “{quoteFirst}{quoteRest.length > 0 && <><br /><em>{quoteRest.join(' ')}</em></>}”
          </figcaption>
          {hero.badge && <span className="cover__badge"><Lines text={hero.badge} /></span>}
        </figure>

        <ul className="cover__lines cover__lines--r">
          {hero.rightLines.map((l) => (
            <li key={l.k}><b>{l.k}</b><span>{l.t}</span></li>
          ))}
          <li className="cover__cta">
            <Link to="/#contact" className="btn btn--light">{hero.ctaLabel} ↗</Link>
            <Link to="/writing" className="link-u link-u--light">Read the writing ↓</Link>
          </li>
        </ul>
      </div>

      <div className="cover__foot">
        <span className="cover__barcode" aria-hidden="true" />
        <span className="cover__scroll">Turn the page ↓</span>
      </div>
    </section>
  );
}
