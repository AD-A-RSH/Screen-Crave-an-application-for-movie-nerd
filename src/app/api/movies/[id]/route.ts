import { getMovieById, movieIdParamSchema } from "../../../../lib/movies";
import { ok, fail } from "../../../../lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = movieIdParamSchema.safeParse(id);
  if (!parsed.success) return fail(400, "VALIDATION_ERROR", "Invalid movie id");

  try {
    const movie = await getMovieById(parsed.data);
    if (!movie) return fail(404, "NOT_FOUND", "Movie not found");
    return ok(movie);
  } catch (err) {
    return fail(500, "INTERNAL_ERROR", err instanceof Error ? err.message : "Unexpected error");
  }
}
