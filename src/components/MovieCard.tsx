import Link from "next/link";
import type { Movie } from "../types";

// Pure presentational card -- poster, title, year, link. Favoriting /
// watchlisting only happens via the buttons on the Movie Details page and
// the remove controls on the Favorites/Watchlist/List grids, so this card
// carries no state of its own and needs no client JS.
function MovieCard({ movie }: { movie: Movie }) {
    return (
        <Link href={`/movies/${movie.id}`} className="Movie-Card-Link">
            <div className="Movie-Card">
                <div className="Movie-Poster">
                    <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-poster.svg'}
                        alt={movie.title}
                    />
                </div>

                <div className="Movie-Info">
                    <h3>{movie.title}</h3>
                    <p>{movie.release_date?.split("-")[0]}</p>
                </div>
            </div>
        </Link>
    )
}

export default MovieCard
