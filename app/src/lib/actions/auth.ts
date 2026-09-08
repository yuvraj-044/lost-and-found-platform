"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@/types/database";

// ─── Sign Up ─────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Signup failed. Please try again." };
  }

  // Profile creation is automatically handled by the PostgreSQL 
  // 'on_auth_user_created' trigger using SECURITY DEFINER permissions.
  // We do not do a manual client-side insert here because without an active session,
  // it would violate Row Level Security (auth.uid() is null before confirmation).

  return {
    success: true,
    requiresConfirmation: !authData.session,
  };
}

// ─── Sign In ─────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Email not confirmed yet. Please check your inbox, or in your Supabase Dashboard go to Authentication > Providers > Email and toggle 'Confirm email' to OFF for instant logins.",
      };
    }
    return { error: error.message };
  }

  return { success: true };
}

// ─── Sign Out ────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ─── Get Current User (Session + Profile) ────────────────────
export async function getCurrentUser(): Promise<{
  user: User | null;
  authId: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { user: null, authId: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const userObj = profile
    ? { ...profile, email: (profile as any).email || authUser.email }
    : { id: authUser.id, full_name: authUser.user_metadata?.full_name || "User", email: authUser.email, avatar_url: null, created_at: authUser.created_at };

  return { user: userObj as User, authId: authUser.id };
}
