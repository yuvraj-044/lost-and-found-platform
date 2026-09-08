import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      authId: authUser.id,
      email: authUser.email,
      profile: profile || null,
      error: profileError ? profileError.message : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch user session" },
      { status: 500 }
    );
  }
}
