import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/items/[id] ─────────────────────────────────────
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: item, error } = await supabase
      .from("items")
      .select("*, reporter:users!reporter_id(*)")
      .eq("id", id)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Also get active claims count if any
    const { count: claimsCount } = await supabase
      .from("claims")
      .select("*", { count: "exact", head: true })
      .eq("item_id", id);

    return NextResponse.json({
      data: {
        ...item,
        claims_count: claimsCount ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/items/[id] ───────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: item } = await supabase
      .from("items")
      .select("reporter_id")
      .eq("id", id)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.reporter_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own items" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedUpdates = ["title", "description", "status", "category", "location", "image_url"];
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", id)
      .select("*, reporter:users!reporter_id(*)")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ data: updatedItem, message: "Item updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/items/[id] ──────────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { data: item } = await supabase
      .from("items")
      .select("reporter_id")
      .eq("id", id)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.reporter_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own items" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
