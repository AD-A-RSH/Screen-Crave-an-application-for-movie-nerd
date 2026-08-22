import { getReviewsForMovie, listReviewsQuerySchema } from "../../../../../lib/reviews";
import { movieIdParamSchema } from "../../../../../lib/movies";
import { ok, fail, validationError, handleDataError } from "../../../../../lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idParsed = movieIdParamSchema.safeParse(id);
  if (!idParsed.success) return fail(400, "VALIDATION_ERROR", "Invalid movie id");

  const { searchParams } = new URL(request.url);
  const parsed = listReviewsQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { data, meta } = await getReviewsForMovie(idParsed.data, parsed.data);
    return ok(data, meta);
  } catch (err) {
    return handleDataError(err);
  }
}
