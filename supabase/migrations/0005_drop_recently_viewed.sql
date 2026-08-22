-- ============================================================================
-- 0005_drop_recently_viewed.sql
--
-- `recently_viewed` was created in 0002 for a "recently viewed movies" feature
-- that was never built -- zero references anywhere in application code
-- (confirmed via repo-wide search before writing this migration). Dropping it
-- as part of the architecture simplification pass: unused tables add to the
-- schema a reader has to understand for no benefit.
-- ============================================================================

drop table if exists recently_viewed;
