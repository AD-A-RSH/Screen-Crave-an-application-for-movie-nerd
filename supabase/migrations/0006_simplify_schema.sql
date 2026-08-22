-- ============================================================================
-- 0006_simplify_schema.sql
--
-- Learning-project simplification pass. Drops schema that no longer backs
-- any feature after the Home/Movie-Details simplification:
--
--   - `genres` (lookup table): only ever fed GET /api/genres, which had no
--     UI caller (no genre-filter feature was ever built). movies.genres
--     (the text[] column, used to display genres on Movie Details) is
--     untouched.
--   - 13 `movies` columns carried over from the TMDB CSV import but never
--     read by any route or component after Movie Details was trimmed to
--     poster/title/overview/genres/release date/runtime/original language.
--     Dropping vote_average also drops the now-pointless
--     movies_vote_average_idx index (Postgres drops indexes on a column
--     automatically when the column is dropped).
--   - movies_genres_gin_idx / movies_release_date_idx (from
--     0002_movies_dataset_schema.sql): only ever backed the old
--     genre-filter / sort-by-release-date options on GET /api/movies,
--     which was removed along with the whole public movie-listing feature.
--     No remaining query filters or sorts by genres/release_date -- search
--     only filters by title (movies_title_trgm_idx, still used) and sorts
--     by popularity (movies_popularity_idx, still used).
-- ============================================================================

drop table if exists genres;

alter table movies
  drop column if exists original_title,
  drop column if exists tagline,
  drop column if exists status,
  drop column if exists keywords,
  drop column if exists vote_average,
  drop column if exists vote_count,
  drop column if exists production_companies,
  drop column if exists production_countries,
  drop column if exists spoken_languages,
  drop column if exists homepage,
  drop column if exists imdb_id,
  drop column if exists budget,
  drop column if exists revenue;

drop index if exists movies_genres_gin_idx;
drop index if exists movies_release_date_idx;
