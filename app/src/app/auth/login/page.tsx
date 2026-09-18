"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleSignInWithCredentials = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPass,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setError("Email not confirmed. Please check your inbox for confirmation instructions.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Hard navigation ensures fresh cookies are sent on the initial request,
      // avoiding any Next.js stale router cache issues
      window.location.href = redirectTo;
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("load failed") || msg.toLowerCase().includes("failed to fetch")) {
        setError("Cannot connect to Supabase database. Your project may be paused in the Supabase dashboard (supabase.com), or the NEXT_PUBLIC_SUPABASE_URL in .env is unreachable.");
      } else {
        setError(msg || "An unexpected error occurred");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (!data.session) {
          setMessage(
            "Account created! Please check your email to confirm your account (or sign in if auto-confirmed)."
          );
          setIsSignUp(false);
          setLoading(false);
        } else {
          window.location.href = redirectTo;
        }
      } else {
        await handleSignInWithCredentials(email, password);
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("load failed") || msg.toLowerCase().includes("failed to fetch")) {
        setError("Cannot connect to Supabase database. Your project may be paused in the Supabase dashboard (supabase.com), or the NEXT_PUBLIC_SUPABASE_URL in .env is unreachable.");
      } else {
        setError(msg || "An unexpected error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface-container-lowest p-space-xl rounded-3xl shadow-lg border border-surface-container-high/60 space-y-space-md">
      {/* Brand */}
      <div className="text-center space-y-1">
        <Link href="/" className="inline-flex items-center gap-2 group mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">explore</span>
          </div>
          <span className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
            Findr
          </span>
        </Link>
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="font-body-sm text-body-sm text-outline">
          {isSignUp
            ? "Join the community recovery network"
            : "Sign in to manage your reports and claims"}
        </p>
      </div>

      {/* Auth Mode Toggle */}
      <div className="flex bg-surface-container-low p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
            !isSignUp
              ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
              : "text-outline hover:text-on-surface"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
            isSignUp
              ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
              : "text-outline hover:text-on-surface"
          }`}
        >
          Sign Up
        </button>
      </div>

      {error && (
        <div className="p-space-xs rounded-xl bg-error-container text-on-error-container font-body-sm text-body-sm font-medium text-center">
          {error}
        </div>
      )}

      {message && (
        <div className="p-space-xs rounded-xl bg-secondary-container text-on-secondary-container font-body-sm text-body-sm font-medium text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-space-sm">
        {isSignUp && (
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-surface-container-highest outline-none focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm text-on-surface transition-all"
            />
          </div>
        )}

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-surface-container-highest outline-none focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm text-on-surface transition-all"
          />
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-low border border-surface-container-highest outline-none focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm text-on-surface transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-space-md rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-label-lg text-label-lg shadow-sm transition-all cursor-pointer font-bold"
        >
          {loading ? "Signing in..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="pt-2 text-center">
        <Link
          href="/"
          className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors"
        >
          ← Back to Explore Feed
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={<div className="text-outline font-label-md">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
