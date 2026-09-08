import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── PATCH /api/claims/[id] ──────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || (status !== "ACCEPTED" && status !== "REJECTED")) {
      return NextResponse.json(
        { error: "Field 'status' must be either 'ACCEPTED' or 'REJECTED'" },
        { status: 400 }
      );
    }

    // 1. Fetch claim and verify that the caller is the reporter of the item
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("*, item:items!item_id(*)")
      .eq("id", id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const item = claim.item as any;
    if (item.reporter_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the reporter of the item can review this claim" },
        { status: 403 }
      );
    }

    // 2. Update claim status
    const { data: updatedClaim, error: updateError } = await supabase
      .from("claims")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, item:items!item_id(*)")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 3. If claim was ACCEPTED, automatically mark item as RESOLVED and reject other claims
    if (status === "ACCEPTED") {
      await supabase
        .from("items")
        .update({
          status: "RESOLVED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      // Reject all other pending claims on this item
      await supabase
        .from("claims")
        .update({
          status: "REJECTED",
          updated_at: new Date().toISOString(),
        })
        .eq("item_id", item.id)
        .neq("id", id)
        .eq("status", "PENDING");
    }

    return NextResponse.json({
      data: updatedClaim,
      message: `Claim successfully marked as ${status}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
