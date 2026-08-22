// One-off dataset import: streams dataset/TMDB_movie_dataset_v11.csv,
// applies lightweight filters, and batch-inserts into the `movies` table.
// Not part of the running app -- run manually, once:
//   node --env-file=.env.local scripts/import-movies.mjs --dry-run   (count only, no writes)
//   node --env-file=.env.local scripts/import-movies.mjs             (real import)
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import pg from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const CSV_PATH = new URL("../dataset/TMDB_movie_dataset_v11.csv", import.meta.url);
const BATCH_SIZE = 500;
const MIN_VOTE_COUNT = 20;
const UPCOMING_STATUSES = new Set(["Planned", "In Production", "Post Production", "Canceled"]);

function toIntOrNull(value) {
  if (value === undefined || value === null || value.trim() === "") return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function toFloatOrNull(value) {
  if (value === undefined || value === null || value.trim() === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function toDateOrNull(value) {
  if (!value || value.trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : value;
}

function toArray(value) {
  if (!value || value.trim() === "") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function passesFilters(row) {
  if (row.adult === "True") return false;
  if (!row.title || row.title.trim() === "") return false;

  if (row.status === "Released") {
    // Established catalog entries: require real posters and a real
    // audience (vote_count) -- the "actually seen by real people" bar.
    if (!row.poster_path || row.poster_path.trim() === "") return false;
    const voteCount = toIntOrNull(row.vote_count) ?? 0;
    return voteCount >= MIN_VOTE_COUNT;
  }

  // Unreleased/anticipated movies (Planned, In Production, Post Production,
  // Canceled) have no votes yet by definition, and often no poster released
  // yet either -- MovieCard already falls back to a placeholder image for
  // missing posters, so poster/vote_count aren't required here. Still
  // excludes the vast majority of junk rows (Rumored and anything else).
  return UPCOMING_STATUSES.has(row.status);
}

function mapRow(row) {
  return {
    id: toIntOrNull(row.id),
    title: row.title.trim(),
    overview: row.overview || null,
    release_date: toDateOrNull(row.release_date),
    runtime: toIntOrNull(row.runtime),
    genres: toArray(row.genres),
    popularity: toFloatOrNull(row.popularity),
    poster_path: row.poster_path || null,
    backdrop_path: row.backdrop_path || null,
    original_language: row.original_language || null,
  };
}

// Only the columns ScreenCrave's UI actually reads. `status` and
// `vote_count` above are still read from the raw CSV row for filtering
// (passesFilters) even though they're not inserted -- the dataset carries
// far more TMDB metadata than this app displays.
const COLUMNS = [
  "id", "title", "overview", "release_date", "runtime", "genres",
  "popularity", "poster_path", "backdrop_path", "original_language",
];

function buildInsert(batch) {
  const values = [];
  const rowsSql = batch.map((movie, i) => {
    const offset = i * COLUMNS.length;
    COLUMNS.forEach((col) => values.push(movie[col]));
    const placeholders = COLUMNS.map((_, j) => `$${offset + j + 1}`).join(", ");
    return `(${placeholders})`;
  });
  const sql = `insert into movies (${COLUMNS.join(", ")}) values ${rowsSql.join(", ")} on conflict (id) do nothing`;
  return { sql, values };
}

async function main() {
  if (!DRY_RUN && !process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (expected in .env.local).");
    process.exit(1);
  }

  const pool = DRY_RUN
    ? null
    : new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  let read = 0;
  let kept = 0;
  let inserted = 0;
  const seenIds = new Set();
  let batch = [];

  const parser = createReadStream(CSV_PATH).pipe(
    parse({ columns: true, relax_quotes: true, skip_empty_lines: true }),
  );

  const flush = async () => {
    if (batch.length === 0) return;
    if (!DRY_RUN) {
      const { sql, values } = buildInsert(batch);
      const result = await pool.query(sql, values);
      inserted += result.rowCount;
    }
    batch = [];
  };

  for await (const row of parser) {
    read++;
    if (read % 200000 === 0) {
      console.log(`...${read} rows read, ${kept} kept so far`);
    }

    if (!passesFilters(row)) continue;

    const id = toIntOrNull(row.id);
    if (id === null || seenIds.has(id)) continue;
    seenIds.add(id);

    kept++;
    batch.push(mapRow(row));

    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }
  await flush();

  console.log(`\nDone. ${read} rows read -> ${kept} kept.`);
  if (DRY_RUN) {
    console.log("Dry run -- no rows written. Re-run without --dry-run to import for real.");
  } else {
    console.log(`${inserted} rows inserted into movies.`);
  }

  if (pool) await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
