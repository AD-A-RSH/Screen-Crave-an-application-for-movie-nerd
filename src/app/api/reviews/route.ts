import { createReview, createReviewSchema } from "../../../lib/reviews";
import { getAuthedUser, created, fail, validationError, handleDataError } from "../../../lib/api";

export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = createReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await createReview(user.id, parsed.data.movie_id, parsed.data.body);
    if (result.conflict) {
      return fail(409, "ALREADY_EXISTS", "You've already reviewed this movie", {
        existing_review_id: result.existingId,
      });
    }
    return created(result.review);
  } catch (err) {
    return handleDataError(err);
  }
}
