import "server-only";
import { createClient } from "@supabase/supabase-js";

// Stateless client for fully public, non-personalized reads (the movies
// dataset, genres) -- no cookies. Next's Cache Components forbid dynamic
// APIs like cookies() inside a "use cache" function, which is exactly what
// the cookie-bound server client (lib/supabase/server.ts) depends on, so
// anything that wants to be cached needs this client instead.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
