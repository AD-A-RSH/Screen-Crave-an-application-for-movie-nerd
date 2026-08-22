import Link from "next/link";
import { notFound } from "next/navigation";
import MovieCard from "../../../components/MovieCard";
import RemoveFromListButton from "../../../components/RemoveFromListButton";
import { createClient } from "../../../lib/supabase/server";
import { getListWithItems } from "../../../lib/lists";
import type { Movie } from "../../../types";

type Props = { params: Promise<{ id: string }> };

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Log in to see this list</h2>
          <p>
            <Link href="/login">Log in</Link> or{" "}
            <Link href="/signup">sign up</Link> to view your lists.
          </p>
        </div>
      </div>
    );
  }

  const list = await getListWithItems(user.id, id);
  if (!list) notFound();

  const movies: Movie[] = list.items.map((item) => {
    const movieData = Array.isArray(item.movies) ? item.movies[0] : item.movies;
    return {
      id: item.movie_id,
      title: movieData?.title ?? "",
      poster_path: movieData?.poster_path ?? "",
      release_date: movieData?.release_date ?? undefined,
    };
  });

  return (
    <div className="page">
      <Link href="/lists" className="list-detail-back">&larr; Back to Lists</Link>

      <div className="page-header">
        <h1 className="page-title">{list.name}</h1>
      </div>

      {movies.length > 0 ? (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div className="list-item-wrapper" key={movie.id}>
              <MovieCard movie={movie} />
              <RemoveFromListButton listId={id} movieId={movie.id} />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-inline">
          No movies in this list yet — use the &quot;Add to List&quot; button on any movie&apos;s page to add one.
        </p>
      )}
    </div>
  );
}
