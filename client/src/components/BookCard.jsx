import { cdn } from '../lib/text.jsx';

const STATUS = { available: 'Available now', 'coming-soon': 'Coming soon', free: 'Free to read' };

export default function BookCard({ book }) {
  const ext = book.file ? book.file.split('.').pop().toUpperCase() : '';
  return (
    <article className="book reveal">
      <div className="book__cover">
        {book.cover
          ? <img src={cdn(book.cover, 500)} alt={`Cover of ${book.title}`} loading="lazy" />
          : <span className="book__placeholder"><b>{book.title}</b></span>}
        <span className={`book__status book__status--${book.status}`}>{STATUS[book.status]}</span>
      </div>
      <div className="book__body">
        {book.year && <p className="book__year">{book.year}</p>}
        <h3>{book.title}</h3>
        {book.subtitle && <p className="book__sub">{book.subtitle}</p>}
        {book.description && <p>{book.description}</p>}
        <div className="book__actions">
          {book.buyUrl && <a className="btn" href={book.buyUrl} target="_blank" rel="noreferrer">{book.status === 'free' ? 'Read it' : 'Get the book'} ↗</a>}
          {book.file && <a className="link-u" href={book.file} download>{book.fileLabel || `Download ${ext}`}</a>}
        </div>
      </div>
    </article>
  );
}
