-- ============================================================================
-- 0003_movies_fk_and_cleanup.sql  (Phase B)
--
-- Run only after the dataset import (scripts/import-movies.mjs) has
-- populated `movies`. Removes any rows in the ScreenCrave-owned tables
-- that reference a movie id which didn't survive the import's filters,
-- then adds the FK constraints that Phase A deliberately deferred.
--
-- As of this write-up, the only real orphan across the whole database is
-- one favorite referencing movie 1273221 ("Untitled Scary Movie Reboot") --
-- a mislabeled row in the source CSV (status says "Released" but it has
-- zero votes and no poster, i.e. it's actually unreleased/placeholder
-- data). Everything else -- including every other pre-existing favorite,
-- rating, review, and list item -- already has a matching row in the
-- newly-imported `movies` table.
-- ============================================================================

delete from favorites  where movie_id not in (select id from movies);
delete from watchlist  where movie_id not in (select id from movies);
delete from ratings    where movie_id not in (select id from movies);
delete from reviews    where movie_id not in (select id from movies);
delete from list_items where movie_id not in (select id from movies);

alter table favorites  add constraint favorites_movie_id_fkey  foreign key (movie_id) references movies(id) on delete cascade;
alter table watchlist  add constraint watchlist_movie_id_fkey  foreign key (movie_id) references movies(id) on delete cascade;
alter table ratings    add constraint ratings_movie_id_fkey    foreign key (movie_id) references movies(id) on delete cascade;
alter table reviews    add constraint reviews_movie_id_fkey    foreign key (movie_id) references movies(id) on delete cascade;
alter table list_items add constraint list_items_movie_id_fkey foreign key (movie_id) references movies(id) on delete cascade;
