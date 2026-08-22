import Link from "next/link";
import MovieCard from "../components/MovieCard";
import MovieRefButton from "../components/movie-detail/MovieRefButton";
import { createClient } from "../lib/supabase/server";
import { listMovieRefs } from "../lib/movieRefs";
import type { Movie } from "../types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Welcome to ScreenCrave</h2>
          <p>
            <Link href="/login">Log in</Link> or{" "}
            <Link href="/signup">sign up</Link> to build your watchlist and
            start your movie journey.
          </p>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "there";

  const rows = await listMovieRefs("watchlist", user.id);
  const watchlist: Movie[] = rows.map((row) => {
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
        <h1 className="page-title">{greeting()}, {displayName}</h1>
        <p className="page-subtitle">Welcome back to ScreenCrave. Continue your movie journey.</p>
      </div>

      <section>
        <h2 className="section-title">Your Watchlist</h2>
        {watchlist.length > 0 ? (
          <div className="movies-grid">
            {watchlist.map((movie) => (
              <div className="list-item-wrapper" key={movie.id}>
                <MovieCard movie={movie} />
                <MovieRefButton kind="watchlist" movieId={movie.id} initialActive={true} isLoggedIn={true} />
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-inline">
            No movies in your watchlist yet.
            <br />
            Start exploring and add your first movie.
          </p>
        )}
      </section>
    </div>
  );
}
