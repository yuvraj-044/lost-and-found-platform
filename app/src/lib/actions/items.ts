"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Item,
  ItemInsert,
  ItemUpdate,
  ItemWithReporter,
  User,
} from "@/types/database";

// ─── Get Items (with optional filters) ───────────────────────
export async function getItems(filters?: {
  type?: "LOST" | "FOUND";
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: ItemWithReporter[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select("*, reporter:users!reporter_id(*)")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters?.limit) {
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: ItemWithReporter[] = ((data as any[]) ?? []).map((row) => {
    const { reporter, ...item } = row;
    return { ...item, reporter: reporter as User } as ItemWithReporter;
  });

  return { data: items, error: null };
}

// ─── Get Item By ID ──────────────────────────────────────────
export async function getItemById(
  id: string
): Promise<{ data: ItemWithReporter | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select("*, reporter:users!reporter_id(*)")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const { reporter, ...item } = row;
  return {
    data: { ...item, reporter: reporter as User } as ItemWithReporter,
    error: null,
  };
}

// ─── Get Items By Reporter (for Dashboard) ───────────────────
export async function getMyItems(): Promise<{
  data: Item[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as Item[], error: null };
}

// ─── Create Item ─────────────────────────────────────────────
export async function createItem(
  payload: ItemInsert
): Promise<{ data: Item | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      ...payload,
      reporter_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Item | null, error: null };
}

// ─── Update Item ─────────────────────────────────────────────
export async function updateItem(
  id: string,
  payload: ItemUpdate
): Promise<{ data: Item | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Item | null, error: null };
}

// ─── Delete Item ─────────────────────────────────────────────
export async function deleteItem(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
