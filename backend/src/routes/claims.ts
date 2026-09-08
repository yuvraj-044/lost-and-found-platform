import { Router, Response } from "express";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/claims - Fetch user's claims and incoming claims (Protected)
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;

    // Claims made by this user
    const { data: myClaims, error: claimsErr } = await client
      .from("claims")
      .select("*, item:items!item_id(*)")
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
        .select("*, item:items!item_id(*), claimant:users!claimant_id(*)")
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

// POST /api/claims - Submit a new claim (Protected)
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;
    const { item_id, message } = req.body;

    if (!item_id || !message) {
      res.status(400).json({ error: "Fields 'item_id' and 'message' are required" });
      return;
    }

    // Check item exists and caller is not the reporter
    const { data: item } = await supabase
      .from("items")
      .select("id, reporter_id, status")
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
        message: message.trim(),
        status: "PENDING",
      })
      .select("*, item:items!item_id(*)")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      data: newClaim,
      message: "Claim submitted successfully",
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

    const { data: updated, error } = await client
      .from("claims")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, item:items!item_id(*)")
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
