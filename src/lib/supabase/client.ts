import { createBrowserClient } from "@supabase/ssr";

// Used inside "use client" components -- only for auth itself (sign in/up/out,
// onAuthStateChange). Everything else goes through this app's own /api/*
// routes instead of talking to Supabase directly from the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}