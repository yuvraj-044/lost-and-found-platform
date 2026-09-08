import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses Row Level Security (RLS) for backend administrative tasks.
 * NEVER expose this key to the browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey || serviceRoleKey.includes("your_service_role_key")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured properly in .env");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
