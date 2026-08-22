import { getListWithItems, updateList, deleteList, updateListSchema } from "../../../../lib/lists";
import { getAuthedUser, ok, noContent, fail, validationError, handleDataError } from "../../../../lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const { id } = await params;
  try {
    const list = await getListWithItems(user.id, id);
    if (!list) return fail(404, "NOT_FOUND", "List not found");
    return ok(list);
  } catch (err) {
    return handleDataError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = updateListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await params;
  try {
    const list = await updateList(user.id, id, parsed.data.name);
    if (!list) return fail(404, "NOT_FOUND", "List not found");
    return ok(list);
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
    const list = await deleteList(user.id, id);
    if (!list) return fail(404, "NOT_FOUND", "List not found");
    return noContent();
  } catch (err) {
    return handleDataError(err);
  }
}
