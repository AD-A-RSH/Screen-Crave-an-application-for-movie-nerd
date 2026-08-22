import Link from "next/link";
import MovieCard from "../../components/MovieCard";
import MovieRefButton from "../../components/movie-detail/MovieRefButton";
import { createClient } from "../../lib/supabase/server";
import { listMovieRefs } from "../../lib/movieRefs";
import type { Movie } from "../../types";

export default async function FavouritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Log in to see your favorites</h2>
          <p>
            <Link href="/login">Log in</Link> or{" "}
            <Link href="/signup">sign up</Link> to start saving favorites.
          </p>
        </div>
      </div>
    );
  }

  const rows = await listMovieRefs("favorites", user.id);
  const favorites: Movie[] = rows.map((row) => {
    const movieData = Array.isArray(row.movies) ? row.movies[0] : row.movies;
    return {
      id: row.movie_id,
      title: movieData?.title ?? "",
      poster_path: movieData?.poster_path ?? "",
      release_date: movieData?.release_date ?? undefined,
    };
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Your Favorites</h1>
        <p className="page-subtitle">Movies you've marked as favorites.</p>
      </div>

      {favorites.length > 0 ? (
        <div className="movies-grid">
          {favorites.map((movie) => (
            <div className="list-item-wrapper" key={movie.id}>
              <MovieCard movie={movie} />
              <MovieRefButton kind="favorites" movieId={movie.id} initialActive={true} isLoggedIn={true} />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-inline">
          No favorite movies yet.
          <br />
          Start adding movies to your favorites and they&apos;ll appear here.
        </p>
      )}
    </div>
  );
}
