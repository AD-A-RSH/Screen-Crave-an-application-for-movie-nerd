import { listLists, createList, createListSchema } from "../../../lib/lists";
import { getAuthedUser, ok, created, fail, validationError, handleDataError } from "../../../lib/api";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  try {
    const data = await listLists(user.id);
    return ok(data);
  } catch (err) {
    return handleDataError(err);
  }
}

export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = createListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const list = await createList(user.id, parsed.data.name);
    return created(list);
  } catch (err) {
    return handleDataError(err);
  }
}
