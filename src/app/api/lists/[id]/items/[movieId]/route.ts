import { removeListItem } from "../../../../../../lib/lists";
import { movieIdParamSchema } from "../../../../../../lib/movies";
import { getAuthedUser, noContent, fail, handleDataError } from "../../../../../../lib/api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; movieId: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const { id, movieId } = await params;
  const parsed = movieIdParamSchema.safeParse(movieId);
  if (!parsed.success) return fail(400, "VALIDATION_ERROR", "Invalid movie id");

  try {
    const removed = await removeListItem(id, parsed.data);
    if (!removed) return fail(404, "NOT_FOUND", "List item not found");
    return noContent();
  } catch (err) {
    return handleDataError(err);
  }
}
