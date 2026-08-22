import "server-only";
import { z } from "zod";
import { createClient } from "./supabase/server";

// ── Validation ──────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  movie_id: z.coerce.number().int().positive(),
  body: z.string().trim().min(1).max(5000),
});

export const updateReviewSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Data access ─────────────────────────────────────────────────────────

type ReviewProfile = { username: string | null; avatar_url: string | null };
type RawReviewRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: ReviewProfile | ReviewProfile[] | null;
};
type ReviewWithAuthor = Omit<RawReviewRow, "profiles"> & { profiles: ReviewProfile | null };

// supabase-js can't infer that reviews -> profiles is a to-one relation
// without a generated Database type (none exists in this project), so it
// types the embed as an array -- normalize it here once rather than at
// every call site.
function normalizeReviewRow(row: RawReviewRow): ReviewWithAuthor {
  return { ...row, profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles };
}

export async function getReviewsForMovie(
  movieId: number,
  { page, limit }: { page: number; limit: number },
) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("reviews")
    .select("id, user_id, body, created_at, updated_at, profiles(username, avatar_url)", { count: "exact" })
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`getReviewsForMovie failed: ${error.message}`, { cause: error });

  return {
    data: ((data ?? []) as unknown as RawReviewRow[]).map(normalizeReviewRow),
    meta: { page, limit, total: count ?? 0 },
  };
}

export async function createReview(userId: string, movieId: number, body: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .maybeSingle();
  if (existing) return { conflict: true as const, existingId: existing.id as string };

  const { data, error } = await supabase
    .from("reviews")
    .insert({ user_id: userId, movie_id: movieId, body })
    .select()
    .single();
  if (error) throw new Error(`createReview failed: ${error.message}`, { cause: error });

  return { conflict: false as const, review: data };
}

export async function updateReview(userId: string, reviewId: string, body: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(`updateReview failed: ${error.message}`, { cause: error });
  return data; // null when not found or not owned by this user
}

export async function deleteReview(userId: string, reviewId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(`deleteReview failed: ${error.message}`, { cause: error });
  return data; // null when not found or not owned by this user
}
