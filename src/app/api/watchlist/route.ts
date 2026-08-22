import { listMovieRefs, addMovieRef, movieRefSchema } from "../../../lib/movieRefs";
import { getAuthedUser, ok, created, fail, validationError, handleDataError } from "../../../lib/api";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  try {
    const data = await listMovieRefs("watchlist", user.id);
    return ok(data);
  } catch (err) {
    return handleDataError(err);
  }
}

export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Login required");

  const parsed = movieRefSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await addMovieRef("watchlist", user.id, parsed.data.movie_id);
    if (result.alreadyExists) return ok({ movie_id: parsed.data.movie_id });
    return created({ movie_id: parsed.data.movie_id });
  } catch (err) {
    return handleDataError(err);
  }
}
