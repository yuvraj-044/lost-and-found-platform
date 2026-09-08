import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/items - List & filter active items
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, category, search, status = "ACTIVE", limit = "50", offset = "0" } = req.query;

    let query = supabase
      .from("items")
      .select("*, reporter:users!reporter_id(*)")
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (type && (type === "LOST" || type === "FOUND")) {
      query = query.eq("type", type);
    }
    if (category && category !== "All Categories") {
      query = query.eq("category", category);
    }
    if (search && typeof search === "string") {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({
      data: data || [],
      count: data?.length || 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /api/items/:id - Get item by ID
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: item, error } = await supabase
      .from("items")
      .select("*, reporter:users!reporter_id(*)")
      .eq("id", id)
      .single();

    if (error || !item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    // Get claim count
    const { count: claimsCount } = await supabase
      .from("claims")
      .select("*", { count: "exact", head: true })
      .eq("item_id", id);

    res.json({
      data: {
        ...item,
        claims_count: claimsCount ?? 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// POST /api/items - Create a new item report (Protected)
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;
    const { title, description, type, category, location, date_of_incident, image_url } = req.body;

    if (!title || !description || !type) {
      res.status(400).json({ error: "Fields 'title', 'description', and 'type' are required" });
      return;
    }

    const { data: item, error } = await client
      .from("items")
      .insert({
        title: title.trim(),
        description: description.trim(),
        type,
        category: category || "Other",
        location: location || "Campus",
        date_of_incident: date_of_incident || new Date().toISOString().split("T")[0],
        reporter_id: userId,
        image_url: image_url || null,
        status: "ACTIVE",
      })
      .select("*, reporter:users!reporter_id(*)")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      data: item,
      message: "Item reported successfully",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create item" });
  }
});

// PATCH /api/items/:id - Update item (Protected: Reporter only)
router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;

    // Verify ownership
    const { data: item } = await supabaseAdmin
      .from("items")
      .select("reporter_id")
      .eq("id", id)
      .single();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (item.reporter_id !== userId) {
      res.status(403).json({ error: "Forbidden: You can only update your own items" });
      return;
    }

    const allowed = ["title", "description", "status", "category", "location", "image_url"];
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const { data: updated, error } = await client
      .from("items")
      .update(updateData)
      .eq("id", id)
      .select("*, reporter:users!reporter_id(*)")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ data: updated, message: "Item updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// DELETE /api/items/:id - Delete item (Protected: Reporter only)
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const client = req.supabaseUserClient || supabase;

    const { data: item } = await supabaseAdmin
      .from("items")
      .select("reporter_id")
      .eq("id", id)
      .single();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (item.reporter_id !== userId) {
      res.status(403).json({ error: "Forbidden: You can only delete your own items" });
      return;
    }

    const { error } = await client.from("items").delete().eq("id", id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: "Item deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
