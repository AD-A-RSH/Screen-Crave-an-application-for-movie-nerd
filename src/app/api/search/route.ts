import type { NextRequest } from "next/server";
import { searchMovies, searchQuerySchema } from "../../../lib/movies";
import { ok, fail, validationError } from "../../../lib/api";

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams);
  // `query` is the param name the existing Home page search bar already uses
  if (raw.query && !raw.q) raw.q = raw.query;

  const parsed = searchQuerySchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { data, meta } = await searchMovies(parsed.data.q, parsed.data);
    return ok(data, meta);
  } catch (err) {
    return fail(500, "INTERNAL_ERROR", err instanceof Error ? err.message : "Unexpected error");
  }
}
