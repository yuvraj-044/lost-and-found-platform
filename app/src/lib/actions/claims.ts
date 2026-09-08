"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Claim,
  ClaimInsert,
  ClaimStatus,
  ClaimWithClaimant,
  ClaimWithItem,
  Item,
  User,
} from "@/types/database";

// ─── Create Claim ────────────────────────────────────────────
export async function createClaim(
  payload: ClaimInsert
): Promise<{ data: Claim | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Prevent users from claiming their own items
  const { data: item } = await supabase
    .from("items")
    .select("reporter_id")
    .eq("id", payload.item_id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((item as any)?.reporter_id === user.id) {
    return { data: null, error: "You cannot claim your own item." };
  }

  // Prevent duplicate claims on the same item
  const { data: existingClaim } = await supabase
    .from("claims")
    .select("id")
    .eq("item_id", payload.item_id)
    .eq("claimant_id", user.id)
    .maybeSingle();

  if (existingClaim) {
    return {
      data: null,
      error: "You have already submitted a claim for this item.",
    };
  }

  const { data, error } = await supabase
    .from("claims")
    .insert({
      item_id: payload.item_id,
      claimant_id: user.id,
      message: payload.message ?? null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Claim | null, error: null };
}

// ─── Get Claims For an Item (Reporter's View) ────────────────
export async function getClaimsForItem(
  itemId: string
): Promise<{ data: ClaimWithClaimant[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .select("*, claimant:users!claimant_id(*)")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const claims: ClaimWithClaimant[] = ((data as any[]) ?? []).map((row) => {
    const { claimant, ...claim } = row;
    return { ...claim, claimant: claimant as User } as ClaimWithClaimant;
  });

  return { data: claims, error: null };
}

// ─── Get My Claims (Claimant's View) ─────────────────────────
export async function getMyClaims(): Promise<{
  data: ClaimWithItem[];
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
    .from("claims")
    .select("*, item:items!item_id(*)")
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const claims: ClaimWithItem[] = ((data as any[]) ?? []).map((row) => {
    const { item, ...claim } = row;
    return { ...claim, item: item as Item } as ClaimWithItem;
  });

  return { data: claims, error: null };
}

// ─── Update Claim Status (Accept / Reject) ───────────────────
export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus
): Promise<{ data: Claim | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const claim = data as Claim | null;

  // If claim is accepted, resolve the parent item automatically
  if (status === "ACCEPTED" && claim) {
    await supabase
      .from("items")
      .update({
        status: "RESOLVED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.item_id);
  }

  return { data: claim, error: null };
}
