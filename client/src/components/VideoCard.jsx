import { cdn, embedSrc } from '../lib/text.jsx';

export default function VideoCard({ video }) {
  const embed = !video.file && video.embedUrl ? embedSrc(video.embedUrl) : null;

  return (
    <article className="video reveal">
      <div className="video__frame">
        {video.file && <video src={video.file} poster={cdn(video.poster, 1000) || undefined} controls preload="metadata" playsInline />}
        {embed && <iframe src={embed} title={video.title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
        {!video.file && !embed && video.embedUrl && (
          <a className="video__link" href={video.embedUrl} target="_blank" rel="noreferrer" style={video.poster ? { backgroundImage: `url(${cdn(video.poster, 1000)})` } : undefined}>
            <span>▶ Watch ↗</span>
          </a>
        )}
      </div>
      <h3>{video.title}</h3>
      {video.description && <p>{video.description}</p>}
    </article>
  );
}
