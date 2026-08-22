import MovieCard from "../../components/MovieCard";
import { searchMovies } from "../../lib/movies";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const { data: movies } = query
    ? await searchMovies(query, { page: 1, limit: 20 })
    : { data: [] };

  return (
    <div className="page">
      <form className="pill-form" action="/search" method="GET">
        <input
          type="text"
          name="q"
          placeholder="Search for a movie..."
          defaultValue={query}
        />
        <button className="btn-primary" type="submit">Search</button>
      </form>

      {!query && <p className="empty-inline">Search for a movie to get started.</p>}

      {query && movies.length === 0 && (
        <p className="empty-inline">No movies found for &quot;{query}&quot;.</p>
      )}

      {movies.length > 0 && (
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      )}
    </div>
  );
}
