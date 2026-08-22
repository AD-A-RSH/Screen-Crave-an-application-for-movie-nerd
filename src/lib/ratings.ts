import "server-only";
import { z } from "zod";
import { createClient } from "./supabase/server";

// ── Validation ──────────────────────────────────────────────────────────

export const rateMovieSchema = z.object({
  movie_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
});

// ── Data access ─────────────────────────────────────────────────────────

export async function getUserRating(userId: string, movieId: number): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .maybeSingle();
  if (error) throw new Error(`getUserRating failed: ${error.message}`, { cause: error });
  return data?.rating ?? null;
}

export async function upsertRating(userId: string, movieId: number, rating: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ratings")
    .upsert(
      { user_id: userId, movie_id: movieId, rating, updated_at: new Date().toISOString() },
      { onConflict: "user_id,movie_id" },
    );
  if (error) throw new Error(`upsertRating failed: ${error.message}`, { cause: error });
}
