import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieById } from "../../../lib/movies";
import { getReviewsForMovie } from "../../../lib/reviews";
import { getUserRating } from "../../../lib/ratings";
import { hasMovieRef } from "../../../lib/movieRefs";
import { listLists } from "../../../lib/lists";
import { createClient } from "../../../lib/supabase/server";

import Hero from "../../../components/movie-detail/Hero";
import MovieInfo from "../../../components/movie-detail/MovieInfo";
import CommunityRating from "../../../components/movie-detail/CommunityRating";
import CommunityReviews from "../../../components/movie-detail/CommunityReviews";
import MovieRefButton from "../../../components/movie-detail/MovieRefButton";
import AddToListButton from "../../../components/movie-detail/AddToListButton";

type Props = { params: Promise<{ id: string }> };

function parseMovieId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movieId = parseMovieId(id);
  const movie = movieId ? await getMovieById(movieId) : null;
  if (!movie) return { title: "Movie Not Found — ScreenCrave" };
  return {
    title: `${movie.title} — ScreenCrave`,
    //description: movie.overview?.slice(0, 160) || `Discover ${movie.title} on ScreenCrave.`,
  };
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (!movieId) notFound();

  const movie = await getMovieById(movieId);
  if (!movie) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const [reviewsResult, userRating, isFavorite, isInWatchlist, lists] = await Promise.all([
    getReviewsForMovie(movieId, { page: 1, limit: 20 }),
    user ? getUserRating(user.id, movieId) : Promise.resolve(null),
    user ? hasMovieRef("favorites", user.id, movieId) : Promise.resolve(false),
    user ? hasMovieRef("watchlist", user.id, movieId) : Promise.resolve(false),
    user ? listLists(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="md-page">
      <Hero
        movie={movie}
        actions={
          <>
            <MovieRefButton kind="favorites" movieId={movieId} initialActive={isFavorite} isLoggedIn={isLoggedIn} />
            <MovieRefButton kind="watchlist" movieId={movieId} initialActive={isInWatchlist} isLoggedIn={isLoggedIn} />
            <AddToListButton movieId={movieId} lists={lists} isLoggedIn={isLoggedIn} />
          </>
        }
      />
      <div className="md-container">
        <MovieInfo movie={movie} />
        <CommunityRating
          movieId={movieId}
          average={movie.community_rating.average}
          count={movie.community_rating.count}
          initialUserRating={userRating}
          isLoggedIn={isLoggedIn}
        />
        <CommunityReviews
          movieId={movieId}
          initialReviews={reviewsResult.data}
          currentUserId={user?.id ?? null}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
