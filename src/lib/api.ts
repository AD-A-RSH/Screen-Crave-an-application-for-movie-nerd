import "server-only";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

// ── Auth ────────────────────────────────────────────────────────────────

export async function getAuthedUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// ── Response envelope helpers ──────────────────────────────────────────
// Every Route Handler uses these so every endpoint returns the same shape:
// success = { data, meta? }, error = { error: { code, message, details? } }.

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json(meta ? { data, meta } : { data });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function validationError(error: ZodError) {
  return fail(400, "VALIDATION_ERROR", "Invalid request", error.flatten());
}

// Postgres error code surfaced via the `cause` on errors thrown by the
// data-access functions (see e.g. upsertRating in lib/ratings.ts) -- lets
// route handlers turn a foreign-key violation (referencing a movie_id that
// doesn't exist) into a clean 404 instead of a raw 500.
function pgErrorCode(err: unknown): string | undefined {
  if (err instanceof Error && err.cause && typeof err.cause === "object" && "code" in err.cause) {
    return (err.cause as { code?: string }).code;
  }
  return undefined;
}

export function handleDataError(err: unknown) {
  const code = pgErrorCode(err);
  if (code === "23503") {
    return fail(404, "NOT_FOUND", "Referenced movie does not exist");
  }
  if (code === "42501") {
    // RLS rejected the write -- e.g. adding an item to a list owned by
    // someone else. Reported as 404 rather than 403 so existence of
    // another user's resource isn't leaked.
    return fail(404, "NOT_FOUND", "Not found");
  }
  return fail(500, "INTERNAL_ERROR", err instanceof Error ? err.message : "Unexpected error");
}
