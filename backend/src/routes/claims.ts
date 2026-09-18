import { Router, Response } from "express";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/claims - Fetch user's claims and incoming claims (Protected)
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;

    // Claims made by this user (strip private_details from item)
    const { data: myClaims, error: claimsErr } = await client
      .from("claims")
      .select("*, item:items!item_id(id, title, type, category, location, status, image_url, created_at)")
      .eq("claimant_id", userId)
      .order("created_at", { ascending: false });

    if (claimsErr) {
      res.status(400).json({ error: claimsErr.message });
      return;
    }

    // Claims received on items reported by this user
    const { data: myItems } = await client
      .from("items")
      .select("id")
      .eq("reporter_id", userId);

    const myItemIds = (myItems || []).map((i: any) => i.id);

    let incomingClaims: any[] = [];
    if (myItemIds.length > 0) {
      const { data: incoming } = await client
        .from("claims")
        .select(
          "*, item:items!item_id(id, title, type, category, location, status, image_url, created_at), claimant:users!claimant_id(*)"
        )
        .in("item_id", myItemIds)
        .order("created_at", { ascending: false });

      incomingClaims = incoming || [];
    }

    res.json({
      my_claims: myClaims || [],
      incoming_claims: incomingClaims,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// POST /api/claims - Submit an initial claim (no message, just registers intent) (Protected)
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;
    const { item_id } = req.body;

    if (!item_id) {
      res.status(400).json({ error: "Field 'item_id' is required" });
      return;
    }

    // Check item exists and caller is not the reporter
    const { data: item } = await supabase
      .from("items")
      .select("id, reporter_id, status, type")
      .eq("id", item_id)
      .single();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (item.reporter_id === userId) {
      res.status(400).json({ error: "You cannot claim an item you reported yourself" });
      return;
    }

    if (item.status !== "ACTIVE") {
      res.status(400).json({ error: "This item is no longer active" });
      return;
    }

    // Check duplicate
    const { data: existing } = await client
      .from("claims")
      .select("id")
      .eq("item_id", item_id)
      .eq("claimant_id", userId)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ error: "You have already submitted a claim for this item" });
      return;
    }

    const { data: newClaim, error } = await client
      .from("claims")
      .insert({
        item_id,
        claimant_id: userId,
        status: "PENDING",
        verification_status: "pending",
      })
      .select("*, item:items!item_id(id, title, type, category, location, status)")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      data: newClaim,
      message: "Claim registered. Please complete the ownership verification.",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// POST /api/claims/:id/verify - Submit ownership verification answers (Protected)
// The verification is server-side: private_details are fetched by admin client and NEVER sent to frontend
router.post("/:id/verify", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { answers } = req.body; // string[] from the claimant

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: "Verification answers are required" });
      return;
    }

    // Fetch the claim via admin (bypass RLS)
    const { data: claim } = await supabaseAdmin
      .from("claims")
      .select("id, claimant_id, item_id, verification_status, status")
      .eq("id", id)
      .single();

    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }

    if (claim.claimant_id !== userId) {
      res.status(403).json({ error: "Forbidden: This is not your claim" });
      return;
    }

    if (claim.verification_status !== "pending") {
      res.status(400).json({ error: "This claim has already been verified" });
      return;
    }

    // Fetch the private_details from the item using admin client (NEVER exposed to frontend)
    const { data: item } = await supabaseAdmin
      .from("items")
      .select("private_details, type")
      .eq("id", claim.item_id)
      .single();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const privateDetails: string[] = (item.private_details as string[]) || [];

    // Verification logic: check if each submitted answer loosely matches any private detail
    // A "pass" requires at least 2 out of the total details to match
    const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    let matched = 0;
    for (const answer of answers) {
      const normAnswer = normalise(answer);
      if (normAnswer.length < 2) continue;
      const isMatch = privateDetails.some((detail) => {
        const normDetail = normalise(detail);
        return normDetail.includes(normAnswer) || normAnswer.includes(normDetail);
      });
      if (isMatch) matched++;
    }

    const requiredMatches = Math.max(1, Math.ceil(privateDetails.length * 0.5));
    const passed = matched >= requiredMatches;
    const verificationStatus = passed ? "passed" : "failed";

    // Update the claim with the result (store submitted answers for admin review)
    await supabaseAdmin
      .from("claims")
      .update({
        verification_status: verificationStatus,
        verification_answers: answers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    res.json({
      passed,
      matched,
      required: requiredMatches,
      total: privateDetails.length,
      message: passed
        ? "Verification passed! The item reporter will be notified and can now accept your claim."
        : `Verification failed. Only ${matched} of ${requiredMatches} required details matched. Please try again or contact the reporter.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// PATCH /api/claims/:id - Accept/Reject a claim (Protected: Item reporter only)
router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;
    const { status } = req.body;

    if (!status || (status !== "ACCEPTED" && status !== "REJECTED")) {
      res.status(400).json({ error: "Field 'status' must be either 'ACCEPTED' or 'REJECTED'" });
      return;
    }

    // Verify reporter ownership of the item
    const { data: claim } = await supabaseAdmin
      .from("claims")
      .select("*, item:items!item_id(*)")
      .eq("id", id)
      .single();

    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }

    const item = claim.item as any;
    if (item.reporter_id !== userId) {
      res.status(403).json({ error: "Forbidden: Only the item reporter can update this claim" });
      return;
    }

    // Only allow accepting claims that passed verification
    if (status === "ACCEPTED" && claim.verification_status !== "passed") {
      res.status(400).json({
        error: "Cannot accept a claim that has not passed ownership verification",
      });
      return;
    }

    const { data: updated, error } = await client
      .from("claims")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, item:items!item_id(id, title, type, status)")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // If accepted, resolve item and reject others
    if (status === "ACCEPTED") {
      await supabaseAdmin
        .from("items")
        .update({ status: "RESOLVED", updated_at: new Date().toISOString() })
        .eq("id", item.id);

      await supabaseAdmin
        .from("claims")
        .update({ status: "REJECTED", updated_at: new Date().toISOString() })
        .eq("item_id", item.id)
        .neq("id", id)
        .eq("status", "PENDING");
    }

    res.json({
      data: updated,
      message: `Claim successfully marked as ${status}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
