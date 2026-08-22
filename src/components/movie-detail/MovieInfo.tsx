type InfoMovie = {
  overview: string | null;
  release_date: string | null;
  runtime: number | null;
  original_language: string | null;
  genres: string[];
};

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="md-info-label">{label}</div>
      <div className="md-info-value">{value}</div>
    </div>
  );
}

export default function MovieInfo({ movie }: { movie: InfoMovie }) {
  return (
    <>
      {movie.overview && (
        <section className="md-section">
          <h2 className="section-title">Story</h2>
          <p className="md-story">{movie.overview}</p>
        </section>
      )}
      <section className="md-section">
        <h2 className="section-title">Movie Information</h2>
        <div className="md-info-grid">
          <Field label="Release Date" value={movie.release_date} />
          <Field label="Runtime" value={movie.runtime ? `${movie.runtime} min` : null} />
          <Field label="Original Language" value={movie.original_language?.toUpperCase() ?? null} />
          <Field label="Genres" value={movie.genres.length ? movie.genres.join(", ") : null} />
        </div>
      </section>
    </>
  );
}
