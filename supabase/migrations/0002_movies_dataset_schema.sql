-- ============================================================================
-- 0002_movies_dataset_schema.sql  (Phase A)
--
-- Replaces the TMDB-cache-shaped `movies` table with a dataset-backed,
-- TMDB-independent schema. Run BEFORE the dataset import (scripts/import-
-- movies.mjs) -- `movies` is intentionally left empty here. Do NOT add FK
-- constraints from favorites/watchlist/ratings/reviews/list_items back to
-- movies in this file: those tables may already hold rows pointing at old
-- movie ids, and constraining them against an empty table would either
-- fail outright or require deciding what to do with orphaned rows before
-- we even know which rows survive the dataset import's filters. That
-- cleanup + FK step is 0003_movies_fk_and_cleanup.sql, run only after the
-- import (Milestone 2).
--
-- Also tears down the abandoned TMDB-cache-aside architecture's tables --
-- those migrations (long since deleted from the repo) were actually
-- applied to this live database before the project pivoted away from any
-- TMDB dependency, so they're real leftover clutter here, not just files.
-- ============================================================================

drop table if exists movie_cast cascade;
drop table if exists movie_crew cascade;
drop table if exists movie_genres cascade;
drop table if exists movie_production_companies cascade;
drop table if exists movie_images cascade;
drop table if exists movie_videos cascade;
drop table if exists genres cascade;
drop table if exists people cascade;
drop table if exists production_companies cascade;
drop table if exists collections cascade;

drop table if exists movies cascade;  -- cascade only drops FK constraints pointing here, not favorites/etc. themselves or their rows

create table movies (
  id                    integer primary key,     -- TMDB's original id, sourced from the CSV
  title                 text not null,
  original_title        text,
  overview              text,
  tagline               text,
  release_date          date,
  runtime               int,
  status                text,
  genres                text[] not null default '{}',
  keywords              text[] not null default '{}',
  popularity            numeric,
  vote_average          numeric,
  vote_count            int,
  poster_path           text,
  backdrop_path         text,
  production_companies  text[] not null default '{}',
  production_countries  text[] not null default '{}',
  spoken_languages       text[] not null default '{}',
  original_language     text,
  homepage              text,
  imdb_id               text,
  budget                bigint,
  revenue               bigint,
  imported_at           timestamptz not null default now()
);

alter table favorites  rename column tmdb_id to movie_id;
alter table watchlist  rename column tmdb_id to movie_id;
alter table ratings    rename column tmdb_id to movie_id;
alter table reviews    rename column tmdb_id to movie_id;
alter table list_items rename column tmdb_id to movie_id;

-- fixes the missing one-review-per-user-per-movie constraint (previously
-- only enforced by app-level upsert logic, not the DB)
alter table reviews add constraint reviews_user_movie_unique unique (user_id, movie_id);

create table recently_viewed (
  user_id   uuid not null references profiles(id) on delete cascade,
  movie_id  integer not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);
create index recently_viewed_user_viewed_idx on recently_viewed(user_id, viewed_at desc);

-- ── indexes for the read API (search, filter, sort) ────────────────────────
create extension if not exists pg_trgm;
create index movies_title_trgm_idx   on movies using gin (title gin_trgm_ops);
create index movies_genres_gin_idx   on movies using gin (genres);
create index movies_popularity_idx   on movies (popularity desc);
create index movies_vote_average_idx on movies (vote_average desc);
create index movies_release_date_idx on movies (release_date desc);

-- backs GET /api/genres without a separate genres table -- movies.genres
-- never changes after the one-time import, so there's no sync/staleness
-- problem to a lookup table would otherwise introduce.
create or replace function get_distinct_genres()
returns table (genre text) as $$
  select distinct unnest(genres) as genre from movies order by 1;
$$ language sql stable;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table movies enable row level security;
create policy "movies_select_all" on movies for select using (true);
-- Deliberately no insert/update/delete policy for anon/authenticated: the
-- dataset is loaded once via a direct DATABASE_URL connection (bypasses
-- RLS entirely, since it connects as the postgres role, not through the
-- anon/authenticated Supabase API roles). The running app never writes to
-- `movies`.

alter table recently_viewed enable row level security;
create policy "recently_viewed_select_own" on recently_viewed for select using (auth.uid() = user_id);
create policy "recently_viewed_upsert_own" on recently_viewed for insert with check (auth.uid() = user_id);
create policy "recently_viewed_update_own" on recently_viewed for update using (auth.uid() = user_id);
create policy "recently_viewed_delete_own" on recently_viewed for delete using (auth.uid() = user_id);

-- ── handle_new_user() fix ───────────────────────────────────────────────
-- Previously hardcoded username = email regardless of the display_name
-- passed at signup, which is what Signup.tsx actually sends. This is why
-- profiles.username has been wrong even though Signup.tsx/NavBar.tsx's own
-- client-side logic was already correct.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- one-time backfill for existing accounts where username still equals their email
update profiles p set username = u.raw_user_meta_data->>'display_name'
  from auth.users u
  where p.id = u.id and p.username = u.email and u.raw_user_meta_data->>'display_name' is not null;
