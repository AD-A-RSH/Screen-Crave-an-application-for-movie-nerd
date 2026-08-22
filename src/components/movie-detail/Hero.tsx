import Image from "next/image";
import type { ReactNode } from "react";

type HeroMovie = {
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
};

function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function Hero({ movie, actions }: { movie: HeroMovie; actions: ReactNode }) {
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const runtime = formatRuntime(movie.runtime);
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-poster.svg";

  return (
    <section className="md-hero">
      {/* Backdrop gets its own clipped layer so it doesn't clip sibling
          content (e.g. the Add to List dropdown) the way a single
          overflow-hidden wrapper around the whole hero would. */}
      {backdropUrl && (
        <div className="md-hero-backdrop">
          <Image src={backdropUrl} alt="" fill priority sizes="100vw" />
        </div>
      )}

      <div className="md-hero-inner">
        <div className="md-poster">
          <Image src={posterUrl} alt={movie.title} width={200} height={300} priority />
        </div>

        <div className="md-hero-content">
          <h1 className="md-title">{movie.title}</h1>

          <div className="md-badges">
            {year && <span className="md-badge">{year}</span>}
            {runtime && <span className="md-badge">{runtime}</span>}
          </div>

          <div className="md-actions">{actions}</div>
        </div>
      </div>
    </section>
  );
}
