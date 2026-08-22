import "server-only";
import { z } from "zod";
import { createClient } from "./supabase/server";

// Shared implementation for favorites and watchlist -- both tables have the
// exact same shape (user_id, movie_id, created_at) and the exact same
// add/remove/list semantics, just against different tables.

// ── Validation ──────────────────────────────────────────────────────────
// Shared by both favorites and watchlist POST bodies -- both are just { movie_id }.

export const movieRefSchema = z.object({
  movie_id: z.coerce.number().int().positive(),
});

// ── Data access ─────────────────────────────────────────────────────────

type RefTable = "favorites" | "watchlist";

export async function listMovieRefs(table: RefTable, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("movie_id, created_at, movies(id, title, poster_path, release_date)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`list${table} failed: ${error.message}`, { cause: error });
  return data ?? [];
}

export async function hasMovieRef(table: RefTable, userId: string, movieId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("movie_id")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .maybeSingle();
  if (error) throw new Error(`has${table} failed: ${error.message}`, { cause: error });
  return !!data;
}

export async function addMovieRef(table: RefTable, userId: string, movieId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ user_id: userId, movie_id: movieId });
  if (error) {
    if (error.code === "23505") return { alreadyExists: true as const };
    throw new Error(`add${table} failed: ${error.message}`, { cause: error });
  }
  return { alreadyExists: false as const };
}

export async function removeMovieRef(table: RefTable, userId: string, movieId: number) {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("movie_id", movieId);
  if (error) throw new Error(`remove${table} failed: ${error.message}`, { cause: error });
  return (count ?? 0) > 0;
}
