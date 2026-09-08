"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClaimModal from "@/components/explore/ClaimModal";
import { getItems } from "@/lib/actions/items";
import type { DisplayItem } from "@/lib/mockData";

const CATEGORIES = [
  "All Categories",
  "Electronics & Gear",
  "Keys & Fobs",
  "Wallets & Cards",
  "Bags & Luggage",
  "Pets & Animals",
  "Jewelry & Watches",
  "Documents & IDs",
  "Clothing & Apparel",
  "Other",
];

export default function HomePage() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<DisplayItem | null>(null);

  // Load real items from database
  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        const res = await getItems();
        if (res.data && res.data.length > 0) {
          const mapped: DisplayItem[] = res.data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category || "Other",
            type: item.type,
            status: item.status,
            location: item.location || "Community Campus",
            imageUrl: item.image_url || "",
            imageAlt: item.title,
            createdAtText: new Date(item.created_at).toLocaleDateString(),
            reporter: {
              name: item.reporter?.full_name || "Community Member",
              initials: (item.reporter?.full_name || "CM")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase(),
              roleTag: item.type === "FOUND" ? "Found by" : "Reported by",
            },
          }));
          setItems(mapped);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Failed to load items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  // Filtered items computation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (selectedType === "LOST" && item.type !== "LOST") return false;
      if (selectedType === "FOUND" && item.type !== "FOUND") return false;

      // Category filter
      if (selectedCategory !== "All Categories" && item.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
      }

      return true;
    });
  }, [items, selectedType, selectedCategory, searchQuery]);

  const lostCount = useMemo(() => items.filter((i) => i.type === "LOST").length, [items]);
  const foundCount = useMemo(() => items.filter((i) => i.type === "FOUND").length, [items]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar onSearch={(q) => setSearchQuery(q)} />

      <main className="pt-20 pb-16 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6">
        {/* Simple & Welcoming Hero Section */}
        <div className="py-10 text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Simple Lost &amp; Found Platform
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Find What&apos;s Lost, Return What&apos;s Found
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            A quick and easy way to report missing items or help connect found belongings with their rightful owners.
          </p>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/report?type=LOST"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>I Lost Something</span>
            </Link>
            <Link
              href="/report?type=FOUND"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>I Found Something</span>
            </Link>
          </div>
        </div>

        {/* Clean Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 space-y-4">
          {/* Top row: Search input */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[22px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or location..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>

          {/* Bottom row: Type tabs & Category filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Filter Tabs */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedType("ALL")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedType === "ALL"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                All Items ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("LOST")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedType === "LOST"
                    ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Lost ({lostCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("FOUND")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedType === "FOUND"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Found ({foundCount})
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <span className="material-symbols-outlined text-[32px]">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No items found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All Categories" || selectedType !== "ALL"
                ? "Try clearing your search or filters to see more results."
                : "No items have been reported yet. Be the first to report!"}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              {(searchQuery || selectedCategory !== "All Categories" || selectedType !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedType("ALL");
                    setSelectedCategory("All Categories");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/report"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                + Report New Item
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isFound = item.type === "FOUND";
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Media Header */}
                    <div className="relative w-full aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                          <span className="material-symbols-outlined text-[36px]">
                            inventory_2
                          </span>
                          <span className="text-xs">{item.category}</span>
                        </div>
                      )}

                      {/* Type Badge */}
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                          isFound
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {item.type}
                      </span>

                      {/* Category Badge */}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md text-white">
                        {item.category}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {item.createdAtText}
                        </span>
                        <span className="truncate max-w-[140px] text-right">
                          {item.reporter.roleTag} {item.reporter.name}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-blue-500 shrink-0">
                          location_on
                        </span>
                        <span className="truncate">{item.location}</span>
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedItemForClaim(item)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isFound
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <span>{isFound ? "Claim This Item" : "I Found This / Help"}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Claim Dialog */}
      <ClaimModal
        item={selectedItemForClaim}
        onClose={() => setSelectedItemForClaim(null)}
      />

      <Footer />
    </div>
  );
}
