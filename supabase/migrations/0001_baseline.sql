-- ============================================================================
-- 0001_baseline.sql
--
-- The actual schema already running in the live ScreenCrave Supabase project,
-- as provided directly by the project owner (not inferred from app code).
-- This supersedes any earlier guesswork -- treat this file as ground truth
-- for what exists today.
--
-- Notable things this confirms/corrects vs. earlier assumptions:
--   - `profiles` already exists (id, username, avatar_url), auto-populated
--     via an `on_auth_user_created` trigger on auth.users. The app doesn't
--     read from it yet (MovieDetail.tsx currently reads
--     user.user_metadata.display_name instead) -- wiring the app to use
--     `profiles.username` is in-scope for the Community Reviews milestone.
--   - `watchlist` is its OWN dedicated table (profiles <-> movies), not a
--     specially-flagged `lists` row. Simpler than originally proposed --
--     drop the "watchlist as a special list" idea from the roadmap.
--   - `movies.tmdb_id` is `integer` (not `bigint`) and has a `cached_at`
--     column.
--   - Every table already has RLS enabled with real policies (see below) --
--     this is confirmed, not unknown as previously assumed.
--   - `movies` allows insert/update from any authenticated client (not just
--     a server-only role) -- matches the existing client-side upsert-before-
--     insert pattern in MovieContext.tsx/ListContext.tsx.
-- ============================================================================

-- ---------- profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- movies (local TMDB cache) ----------
create table if not exists movies (
  tmdb_id integer primary key,
  title text not null,
  poster_path text,
  release_date date,
  cached_at timestamptz not null default now()
);

-- ---------- favorites (M:N profiles <-> movies) ----------
create table if not exists favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  tmdb_id integer not null references movies(tmdb_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

-- ---------- watchlist (M:N profiles <-> movies) ----------
create table if not exists watchlist (
  user_id uuid not null references profiles(id) on delete cascade,
  tmdb_id integer not null references movies(tmdb_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

-- ---------- ratings (M:N profiles <-> movies, +rating value) ----------
create table if not exists ratings (
  user_id uuid not null references profiles(id) on delete cascade,
  tmdb_id integer not null references movies(tmdb_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

-- ---------- reviews (M:N profiles <-> movies, +body text) ----------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tmdb_id integer not null references movies(tmdb_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- lists (1:N profiles -> lists) ----------
create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- list_items (M:N lists <-> movies) ----------
create table if not exists list_items (
  list_id uuid not null references lists(id) on delete cascade,
  tmdb_id integer not null references movies(tmdb_id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, tmdb_id)
);

-- helpful indexes for the reverse-lookup direction (movie -> users)
create index if not exists favorites_tmdb_id_idx on favorites(tmdb_id);
create index if not exists watchlist_tmdb_id_idx on watchlist(tmdb_id);
create index if not exists ratings_tmdb_id_idx on ratings(tmdb_id);
create index if not exists reviews_tmdb_id_idx on reviews(tmdb_id);
create index if not exists list_items_tmdb_id_idx on list_items(tmdb_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table movies enable row level security;
alter table favorites enable row level security;
alter table watchlist enable row level security;
alter table ratings enable row level security;
alter table reviews enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;

-- profiles: readable by everyone, editable only by owner
create policy "profiles_select_all" on profiles
  for select using (true);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- movies: public read (it's just a TMDB cache), any signed-in user can cache new entries
create policy "movies_select_all" on movies
  for select using (true);
create policy "movies_insert_authenticated" on movies
  for insert with check (auth.role() = 'authenticated');
create policy "movies_update_authenticated" on movies
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- favorites: fully private to the owner
create policy "favorites_select_own" on favorites
  for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on favorites
  for delete using (auth.uid() = user_id);

-- watchlist: fully private to the owner
create policy "watchlist_select_own" on watchlist
  for select using (auth.uid() = user_id);
create policy "watchlist_insert_own" on watchlist
  for insert with check (auth.uid() = user_id);
create policy "watchlist_delete_own" on watchlist
  for delete using (auth.uid() = user_id);

-- ratings: readable by everyone (needed for avg-rating aggregates), writable only by owner
create policy "ratings_select_all" on ratings
  for select using (true);
create policy "ratings_insert_own" on ratings
  for insert with check (auth.uid() = user_id);
create policy "ratings_update_own" on ratings
  for update using (auth.uid() = user_id);
create policy "ratings_delete_own" on ratings
  for delete using (auth.uid() = user_id);

-- reviews: readable by everyone, writable only by owner
create policy "reviews_select_all" on reviews
  for select using (true);
create policy "reviews_insert_own" on reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on reviews
  for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on reviews
  for delete using (auth.uid() = user_id);

-- lists: fully private to the owner
create policy "lists_select_own" on lists
  for select using (auth.uid() = user_id);
create policy "lists_insert_own" on lists
  for insert with check (auth.uid() = user_id);
create policy "lists_update_own" on lists
  for update using (auth.uid() = user_id);
create policy "lists_delete_own" on lists
  for delete using (auth.uid() = user_id);

-- list_items: access follows the parent list's ownership
create policy "list_items_select_own" on list_items
  for select using (
    exists (select 1 from lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
  );
create policy "list_items_insert_own" on list_items
  for insert with check (
    exists (select 1 from lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
  );
create policy "list_items_delete_own" on list_items
  for delete using (
    exists (select 1 from lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
  );
