import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/claims ─────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch claims submitted by this user
    const { data: myClaims, error: claimsError } = await supabase
      .from("claims")
      .select("*, item:items!item_id(*)")
      .eq("claimant_id", user.id)
      .order("created_at", { ascending: false });

    if (claimsError) {
      return NextResponse.json({ error: claimsError.message }, { status: 400 });
    }

    // 2. Fetch claims received on items reported by this user
    const { data: myItems } = await supabase
      .from("items")
      .select("id")
      .eq("reporter_id", user.id);

    const myItemIds = (myItems || []).map((i) => i.id);

    let incomingClaims: any[] = [];
    if (myItemIds.length > 0) {
      const { data: incoming } = await supabase
        .from("claims")
        .select("*, item:items!item_id(*), claimant:users!claimant_id(*)")
        .in("item_id", myItemIds)
        .order("created_at", { ascending: false });

      incomingClaims = incoming || [];
    }

    return NextResponse.json({
      my_claims: myClaims || [],
      incoming_claims: incomingClaims,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/claims ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to claim an item" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { item_id, message } = body;

    if (!item_id || !message) {
      return NextResponse.json(
        { error: "Fields 'item_id' and 'message' (verification answer) are required" },
        { status: 400 }
      );
    }

    // Check if item exists and isn't reported by claimant
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, reporter_id, status")
      .eq("id", item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.reporter_id === user.id) {
      return NextResponse.json(
        { error: "You cannot claim an item you reported yourself" },
        { status: 400 }
      );
    }

    if (item.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This item is no longer active" },
        { status: 400 }
      );
    }

    // Check if user already claimed this item
    const { data: existingClaim } = await supabase
      .from("claims")
      .select("id")
      .eq("item_id", item_id)
      .eq("claimant_id", user.id)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already submitted a claim for this item" },
        { status: 400 }
      );
    }

    // Insert claim
    const { data: newClaim, error: insertError } = await supabase
      .from("claims")
      .insert({
        item_id,
        claimant_id: user.id,
        message: message.trim(),
        status: "PENDING",
      })
      .select("*, item:items!item_id(*)")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json(
      { data: newClaim, message: "Claim submitted successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
