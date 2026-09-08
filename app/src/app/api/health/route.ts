import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "error",
          error: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      service: "Findr API Backend",
      database: "connected",
      totalItems: count ?? 0,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err?.message || "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
