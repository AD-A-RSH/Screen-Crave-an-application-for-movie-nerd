# ScreenCrave API — Bruno collection

Covers every endpoint in the REST API. Open this folder (`api-tests/`) as a
collection in [Bruno](https://www.usebruno.com/), select the **Local**
environment, and run requests individually or as a folder.

## Public endpoints (no auth needed)

`movies/` (list, get one, search, genres) work immediately against the
**Local** environment once `npm run dev` is running.

## Authenticated endpoints

`ratings/`, `reviews/`, `favorites/`, `watchlist/`, and `lists/` all require
a logged-in session. This app uses Supabase's cookie-based auth
(`@supabase/ssr`), not a bearer token, so authenticating a request here
means copying your real browser session's cookie:

1. Log in to the app at `http://localhost:3000/login` in your browser.
2. Open DevTools → Application/Storage → Cookies → `http://localhost:3000`.
3. Copy the full cookie string (or just the `sb-<project-ref>-auth-token`
   cookie and any `sb-<project-ref>-auth-token.0`/`.1` continuation
   cookies if it's chunked) as `name=value; name2=value2`.
4. Paste it into the **Local** environment's `cookie` variable.

Every authenticated request in this collection sends `Cookie: {{cookie}}`.
If a request comes back `401 UNAUTHENTICATED`, the cookie has expired or
wasn't copied correctly — repeat the steps above.

## Response shape

Every endpoint returns one of:
- `{ "data": ..., "meta"?: { page, limit, total } }` on success
- `{ "error": { "code", "message", "details"? } }` on failure

Status codes: `200`/`201` success, `204` no body (deletes), `400`
validation, `401` unauthenticated, `404` not found (or not yours — this
API never distinguishes "doesn't exist" from "isn't yours" for owned
resources, to avoid leaking existence), `409` conflict (duplicate
review), `500` unexpected error.
