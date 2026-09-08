"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getMyClaims, updateClaimStatus } from "@/lib/actions/claims";
import { getMyItems, updateItem, deleteItem } from "@/lib/actions/items";
import { getCurrentUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import type { Item, ClaimWithItem, User } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"reports" | "claims">("reports");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<ClaimWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userRes, itemsRes, claimsRes] = await Promise.all([
          getCurrentUser(),
          getMyItems(),
          getMyClaims(),
        ]);

        if (userRes.user) {
          setCurrentUser(userRes.user);
        } else {
          router.push("/auth/login?redirectTo=/dashboard");
          return;
        }

        if (itemsRes.data) {
          setMyItems(itemsRes.data);
        }

        if (claimsRes.data) {
          setMyClaims(claimsRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleToggleResolve = async (item: Item) => {
    const newStatus = item.status === "RESOLVED" ? "ACTIVE" : "RESOLVED";
    setActionLoading(item.id);
    try {
      const res = await updateItem(item.id, { status: newStatus });
      if (res.data) {
        setMyItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    setActionLoading(itemId);
    try {
      const res = await deleteItem(itemId);
      if (!res.error) {
        setMyItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const displayName = currentUser?.full_name || currentUser?.email?.split("@")[0] || "Community Member";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex-1">
        {/* User Profile Summary */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-xl flex items-center justify-center">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {displayName}
              </h1>
              <p className="text-xs text-slate-500">
                {currentUser?.email || "Demo Account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/report"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Report New Item</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "reports"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            My Reported Items ({myItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "claims"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            My Submitted Claims ({myClaims.length})
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading your items...</p>
          </div>
        ) : activeTab === "reports" ? (
          /* Reported Items Tab */
          <div className="space-y-4">
            {myItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">post_add</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No items reported yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Have you lost an item or found something that belongs to someone else? Report it to help get it returned.
                </p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  + Report An Item
                </Link>
              </div>
            ) : (
              myItems.map((item) => {
                const img = item.image_url || (item as any).imageUrl || (item as any).image;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {img ? (
                        <img
                          src={img}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.type === "FOUND"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "RESOLVED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs text-slate-400">{item.category}</span>
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{item.location}</span>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={() => handleToggleResolve(item)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        {item.status === "RESOLVED" ? "Mark Active" : "Mark Resolved"}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        title="Delete Report"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Submitted Claims Tab */
          <div className="space-y-4">
            {myClaims.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No claims submitted yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you find a lost item or submit a claim on a found item, it will show up here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Browse Listings
                </Link>
              </div>
            ) : (
              myClaims.map((claim) => {
                const claimImg = claim.item?.image_url || (claim.item as any)?.imageUrl;
                return (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {claimImg ? (
                          <img
                            src={claimImg}
                            alt={claim.item?.title || "Item"}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            Claim on: {claim.item?.title || "Reported Item"}
                          </h4>
                          {claim.item?.location && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[12px]">location_on</span>
                              <span>{claim.item.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          claim.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : claim.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                      <strong className="text-slate-700 dark:text-slate-200">Your Message: </strong>
                      {claim.message || "No message provided."}
                    </p>

                    {claim.status === "ACCEPTED" && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>
                          Your claim was accepted! Contact the reporter to arrange safe return.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
