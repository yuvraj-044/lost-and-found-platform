"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Claim,
  ClaimStatus,
  ClaimWithClaimant,
  ClaimWithItem,
  Item,
  User,
} from "@/types/database";

// ─── Create Claim (registers intent, no message needed) ─────
export async function createClaim(
  item_id: string
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
    .eq("id", item_id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((item as any)?.reporter_id === user.id) {
    return { data: null, error: "You cannot claim your own item." };
  }

  // Prevent duplicate claims on the same item
  const { data: existingClaim } = await supabase
    .from("claims")
    .select("id")
    .eq("item_id", item_id)
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
      item_id,
      claimant_id: user.id,
      status: "PENDING",
      verification_status: "pending",
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

// ─── Get Incoming Claims On All Items Reported By User ────────
export async function getIncomingClaims(): Promise<{
  data: (Claim & { item: Item; claimant: User })[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  // Find user's reported item IDs
  const { data: myItems, error: itemsError } = await supabase
    .from("items")
    .select("id")
    .eq("reporter_id", user.id);

  if (itemsError || !myItems || myItems.length === 0) {
    return { data: [], error: null };
  }

  const myItemIds = myItems.map((i) => i.id);

  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select("*, item:items!item_id(*), claimant:users!claimant_id(*)")
    .in("item_id", myItemIds)
    .order("created_at", { ascending: false });

  if (claimsError) {
    return { data: [], error: claimsError.message };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: ((claims as any[]) ?? []).map((c) => ({
      ...c,
      item: c.item as Item,
      claimant: c.claimant as User,
    })),
    error: null,
  };
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  // 1. Verify that user is reporter of this item
  const { data: claim, error: claimErr } = await supabase
    .from("claims")
    .select("*, item:items!item_id(*)")
    .eq("id", claimId)
    .single();

  if (claimErr || !claim) {
    return { data: null, error: "Claim not found" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = (claim as any).item;
  if (item.reporter_id !== user.id) {
    return {
      data: null,
      error: "Forbidden: Only the item reporter can accept or reject claims",
    };
  }

  // 2. Ownership verification check: Lost items REQUIRE passed verification before acceptance
  if (status === "ACCEPTED" && item.type === "LOST" && claim.verification_status !== "passed") {
    return {
      data: null,
      error: "Cannot accept claim: Claimant has not passed Secret Detail Verification.",
    };
  }

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

  const updatedClaim = data as Claim | null;

  // If claim is accepted, resolve the parent item automatically and reject other pending claims
  if (status === "ACCEPTED" && updatedClaim) {
    await supabase
      .from("items")
      .update({
        status: "RESOLVED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    await supabase
      .from("claims")
      .update({
        status: "REJECTED",
        updated_at: new Date().toISOString(),
      })
      .eq("item_id", item.id)
      .neq("id", claimId)
      .eq("status", "PENDING");
  }

  return { data: updatedClaim, error: null };
}

// ─── Submit Verification Answers (server-side check) ─────────
export async function submitVerification(
  claimId: string,
  answers: string[]
): Promise<{
  passed: boolean;
  matched: number;
  required: number;
  total: number;
  message: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      passed: false,
      matched: 0,
      required: 0,
      total: 0,
      message: "Not authenticated",
      error: "Not authenticated",
    };
  }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return {
      passed: false,
      matched: 0,
      required: 0,
      total: 0,
      message: "Verification answers are required",
      error: "Verification answers are required",
    };
  }

  try {
    const admin = createAdminClient();

    const { data: claim, error: claimError } = await admin
      .from("claims")
      .select("id, claimant_id, item_id, verification_status, status")
      .eq("id", claimId)
      .single();

    if (claimError || !claim) {
      return {
        passed: false,
        matched: 0,
        required: 0,
        total: 0,
        message: "Claim not found",
        error: "Claim not found",
      };
    }

    if (claim.claimant_id !== user.id) {
      return {
        passed: false,
        matched: 0,
        required: 0,
        total: 0,
        message: "Forbidden: This is not your claim",
        error: "Forbidden",
      };
    }

    if (claim.verification_status !== "pending") {
      return {
        passed: false,
        matched: 0,
        required: 0,
        total: 0,
        message: "This claim has already been verified",
        error: "Already verified",
      };
    }

    const { data: item, error: itemError } = await admin
      .from("items")
      .select("private_details, type")
      .eq("id", claim.item_id)
      .single();

    if (itemError || !item) {
      return {
        passed: false,
        matched: 0,
        required: 0,
        total: 0,
        message: "Item not found",
        error: "Item not found",
      };
    }

    const privateDetails: string[] = (item.private_details as string[]) || [];

    const normalise = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    let matched = 0;
    for (const answer of answers) {
      const normAnswer = normalise(answer);
      if (normAnswer.length < 2) continue;
      const isMatch = privateDetails.some((detail) => {
        const normDetail = normalise(detail);
        return (
          normDetail.includes(normAnswer) || normAnswer.includes(normDetail)
        );
      });
      if (isMatch) matched++;
    }

    const requiredMatches = Math.max(1, Math.ceil(privateDetails.length * 0.5));
    const passed = matched >= requiredMatches;
    const verificationStatus = passed ? "passed" : "failed";

    await admin
      .from("claims")
      .update({
        verification_status: verificationStatus,
        verification_answers: answers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    return {
      passed,
      matched,
      required: requiredMatches,
      total: privateDetails.length,
      message: passed
        ? "Verification passed! The item reporter will be notified and can now accept your claim."
        : `Verification failed. Only ${matched} of ${requiredMatches} required details matched. Please try again with more specific details.`,
    };
  } catch (err: any) {
    return {
      passed: false,
      matched: 0,
      required: 0,
      total: 0,
      message: err?.message || "Verification processing error",
      error: err?.message,
    };
  }
}
