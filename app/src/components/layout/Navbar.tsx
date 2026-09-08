"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const [navSearch, setNavSearch] = useState("");
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function syncUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          const { data: profile } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .single();

          const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
          setUserFullName(name);
        } else {
          setIsLoggedIn(false);
          setUserFullName(null);
        }
      } catch {
        setIsLoggedIn(false);
        setUserFullName(null);
      }
    }

    syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(navSearch);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all">
      <div className="h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">explore</span>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Findr
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
              Lost &amp; Found
            </span>
          </div>
        </Link>

        {/* Search in navbar if needed */}
        {onSearch && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs relative">
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              value={navSearch}
              onChange={(e) => {
                setNavSearch(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Quick search..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs border border-transparent focus:border-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </form>
        )}

        {/* Center & Right Navigation Links */}
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/report"
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
          >
            + Report Item
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
          >
            My Dashboard
          </Link>

          {/* User Status / Login */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="hidden sm:inline-block text-xs font-medium text-slate-700 dark:text-slate-300">
                {userFullName}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Sign In / Demo
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
