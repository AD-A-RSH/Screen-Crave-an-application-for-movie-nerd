-- ============================================================================
-- 0004_genres_lookup.sql
--
-- Fixes a real timeout found while testing M3: `get_distinct_genres()`
-- (SELECT DISTINCT unnest(genres) FROM movies) takes ~1.2s over a direct
-- connection, but the anon/authenticated API role hits its statement
-- timeout calling it via PostgREST/supabase-js .rpc(), well under 1.2s.
--
-- Fix: precompute the (small, fixed) list of distinct genre names into a
-- tiny lookup table, populated once here. `movies.genres` stays exactly as
-- it is (a plain text[] column, no join table, no FK from movies) -- this
-- table exists purely to make GET /api/genres fast, not to normalize movie
-- data. It never needs to be touched again after this one-time import.
-- ============================================================================

drop function if exists get_distinct_genres();

create table if not exists genres (
  name text primary key
);

insert into genres (name)
select distinct unnest(genres) from movies
on conflict do nothing;

alter table genres enable row level security;
create policy "genres_select_all" on genres for select using (true);
