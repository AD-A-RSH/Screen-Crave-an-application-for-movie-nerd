import { removeMovieRef } from "../../../../lib/movieRefs";
import { movieIdParamSchema } from "../../../../lib/movies";
import { getAuthedUser, noContent, fail, handleDataError } from "../../../../lib/api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const { id } = await params;
  const parsed = movieIdParamSchema.safeParse(id);
  if (!parsed.success) return fail(400, "VALIDATION_ERROR", "Invalid movie id");

  try {
    const removed = await removeMovieRef("watchlist", user.id, parsed.data);
    if (!removed) return fail(404, "NOT_FOUND", "Watchlist entry not found");
    return noContent();
  } catch (err) {
    return handleDataError(err);
  }
}
