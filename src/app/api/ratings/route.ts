import { upsertRating, rateMovieSchema } from "../../../lib/ratings";
import { getAuthedUser, ok, fail, validationError, handleDataError } from "../../../lib/api";

export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = rateMovieSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  try {
    await upsertRating(user.id, parsed.data.movie_id, parsed.data.rating);
    return ok({ movie_id: parsed.data.movie_id, rating: parsed.data.rating });
  } catch (err) {
    return handleDataError(err);
  }
}
