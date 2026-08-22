import { updateReview, deleteReview, updateReviewSchema } from "../../../../lib/reviews";
import { getAuthedUser, ok, noContent, fail, validationError, handleDataError } from "../../../../lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = updateReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await params;
  try {
    const review = await updateReview(user.id, id, parsed.data.body);
    if (!review) return fail(404, "NOT_FOUND", "Review not found");
    return ok(review);
  } catch (err) {
    return handleDataError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const { id } = await params;
  try {
    const review = await deleteReview(user.id, id);
    if (!review) return fail(404, "NOT_FOUND", "Review not found");
    return noContent();
  } catch (err) {
    return handleDataError(err);
  }
}
