import "server-only";
import { z } from "zod";
import { createClient } from "./supabase/server";

// ── Validation ──────────────────────────────────────────────────────────

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateListSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const addListItemSchema = z.object({
  movie_id: z.coerce.number().int().positive(),
});

// ── Data access ─────────────────────────────────────────────────────────

export async function listLists(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listLists failed: ${error.message}`, { cause: error });
  return data ?? [];
}

export async function createList(userId: string, name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .insert({ user_id: userId, name })
    .select("id, name, created_at")
    .single();
  if (error) throw new Error(`createList failed: ${error.message}`, { cause: error });
  return data;
}

export async function getListWithItems(userId: string, listId: string) {
  const supabase = await createClient();
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id, name, created_at")
    .eq("id", listId)
    .eq("user_id", userId)
    .maybeSingle();
  if (listError) throw new Error(`getListWithItems failed: ${listError.message}`, { cause: listError });
  if (!list) return null;

  const { data: items, error: itemsError } = await supabase
    .from("list_items")
    .select("movie_id, added_at, movies(id, title, poster_path, release_date)")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });
  if (itemsError) throw new Error(`getListWithItems items failed: ${itemsError.message}`, { cause: itemsError });

  return { ...list, items: items ?? [] };
}

export async function updateList(userId: string, listId: string, name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .update({ name })
    .eq("id", listId)
    .eq("user_id", userId)
    .select("id, name, created_at")
    .maybeSingle();
  if (error) throw new Error(`updateList failed: ${error.message}`, { cause: error });
  return data;
}

export async function deleteList(userId: string, listId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`deleteList failed: ${error.message}`, { cause: error });
  return data;
}

// list ownership is enforced by list_items' own RLS policy (checks the
// parent list's user_id), so no extra ownership check is needed here --
// an insert/delete against a list the caller doesn't own is simply
// rejected by Postgres, surfacing as a Postgrest error.
export async function addListItem(listId: string, movieId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("list_items").insert({ list_id: listId, movie_id: movieId });
  if (error) {
    if (error.code === "23505") return { alreadyExists: true as const };
    throw new Error(`addListItem failed: ${error.message}`, { cause: error });
  }
  return { alreadyExists: false as const };
}

export async function removeListItem(listId: string, movieId: number) {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("list_items")
    .delete({ count: "exact" })
    .eq("list_id", listId)
    .eq("movie_id", movieId);
  if (error) throw new Error(`removeListItem failed: ${error.message}`, { cause: error });
  return (count ?? 0) > 0;
}
