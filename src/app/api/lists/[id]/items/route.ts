import { addListItem, addListItemSchema } from "../../../../../lib/lists";
import { getAuthedUser, ok, created, fail, validationError, handleDataError } from "../../../../../lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = addListItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await params;
  try {
    const result = await addListItem(id, parsed.data.movie_id);
    if (result.alreadyExists) return ok({ list_id: id, movie_id: parsed.data.movie_id });
    return created({ list_id: id, movie_id: parsed.data.movie_id });
  } catch (err) {
    return handleDataError(err);
  }
}
