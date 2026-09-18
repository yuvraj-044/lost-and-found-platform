import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Verification answers are required" },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for private details and claim checking
    const admin = createAdminClient();

    const { data: claim, error: claimError } = await admin
      .from("claims")
      .select("id, claimant_id, item_id, verification_status, status")
      .eq("id", id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.claimant_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: This is not your claim" },
        { status: 403 }
      );
    }

    if (claim.verification_status !== "pending") {
      return NextResponse.json(
        { error: "This claim has already been verified" },
        { status: 400 }
      );
    }

    // Fetch private_details of the item (NEVER exposed to frontend)
    const { data: item, error: itemError } = await admin
      .from("items")
      .select("private_details, type")
      .eq("id", claim.item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const privateDetails: string[] = (item.private_details as string[]) || [];

    // Verification algorithm
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
      .eq("id", id);

    return NextResponse.json({
      passed,
      matched,
      required: requiredMatches,
      total: privateDetails.length,
      message: passed
        ? "Verification passed! The item reporter will be notified and can now accept your claim."
        : `Verification failed. Only ${matched} of ${requiredMatches} required details matched. Please try again with more specific details.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
