import "server-only";
import { z } from "zod";
import { cacheLife } from "next/cache";
import { createPublicClient } from "./supabase/public";

// ── Validation ──────────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const movieIdParamSchema = z.coerce.number().int().positive();

// ── Data access ─────────────────────────────────────────────────────────
//
// getMovieById only ever reads fully public data (movies, ratings aggregate
// -- both "select using (true)" RLS), so it uses the stateless client and
// can be cached with Next's Cache Components. searchMovies stays uncached:
// arbitrary user-typed queries are a poor cache key (near-zero hit rate).

const LIST_COLUMNS = "id, title, poster_path, release_date, popularity";

export async function getMovieById(id: number) {
  "use cache";
  cacheLife("minutes");

  const supabase = createPublicClient();

  const { data: movie, error } = await supabase
    .from("movies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getMovieById failed: ${error.message}`);
  if (!movie) return null;

  const { data: ratingRows, error: ratingError } = await supabase
    .from("ratings")
    .select("rating")
    .eq("movie_id", id);
  if (ratingError) throw new Error(`getMovieById rating aggregate failed: ${ratingError.message}`);

  const count = ratingRows?.length ?? 0;
  const average = count > 0
    ? ratingRows.reduce((sum, r) => sum + r.rating, 0) / count
    : null;

  return { ...movie, community_rating: { average, count } };
}

export async function searchMovies(q: string, { page, limit }: { page: number; limit: number }) {
  const supabase = createPublicClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("movies")
    .select(LIST_COLUMNS, { count: "exact" })
    .ilike("title", `%${q}%`)
    .order("popularity", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`searchMovies failed: ${error.message}`);

  return { data: data ?? [], meta: { page, limit, total: count ?? 0 } };
}
