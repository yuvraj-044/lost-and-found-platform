import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/items ──────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "ACTIVE";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("items")
      .select("*, reporter:users!reporter_id(*)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (type && (type === "LOST" || type === "FOUND")) {
      query = query.eq("type", type);
    }

    if (category && category !== "All Categories") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: data || [],
      count: data?.length || 0,
      offset,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/items ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to report an item" },
        { status: 401 }
      );
    }

    // 2. Validate payload
    const body = await request.json();
    const { title, description, type, category, location, date_of_incident, image_url } = body;

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, and type are mandatory" },
        { status: 400 }
      );
    }

    if (type !== "LOST" && type !== "FOUND") {
      return NextResponse.json(
        { error: "Field 'type' must be either 'LOST' or 'FOUND'" },
        { status: 400 }
      );
    }

    // 3. Ensure user profile exists
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      await supabase.from("users").insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Community Member",
        avatar_url: null,
      });
    }

    // 4. Insert item
    const { data: item, error: insertError } = await supabase
      .from("items")
      .insert({
        title: title.trim(),
        description: description.trim(),
        type,
        category: category || "Other",
        location: location || "Campus",
        date_of_incident: date_of_incident || new Date().toISOString().split("T")[0],
        reporter_id: user.id,
        image_url: image_url || null,
        status: "ACTIVE",
      })
      .select("*, reporter:users!reporter_id(*)")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json(
      { data: item, message: "Item reported successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create item" },
      { status: 500 }
    );
  }
}
