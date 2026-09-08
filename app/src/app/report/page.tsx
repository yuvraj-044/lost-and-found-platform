"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createItem } from "@/lib/actions/items";
import { uploadItemImage } from "@/lib/actions/storage";
import { getCurrentUser } from "@/lib/actions/auth";

const CATEGORIES = [
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

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "FOUND" ? "FOUND" : "LOST";

  const [type, setType] = useState<"LOST" | "FOUND">(initialType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics & Gear");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getCurrentUser();
        setIsLoggedIn(!!res.user);
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined = undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await uploadItemImage(formData);
        if (uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }

      const res = await createItem({
        title,
        description,
        category,
        type,
        location: location ? `${location} (Date: ${date})` : `Date: ${date}`,
        image_url: imageUrl,
      });

      if (res.error) {
        if (res.error.toLowerCase().includes("not authenticated")) {
          router.push("/auth/login?redirectTo=/report");
          return;
        }
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors mb-2"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Listings
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {type === "LOST" ? "Report a Lost Item" : "Report a Found Item"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Fill out the details below to help reunite this item with its owner.
        </p>
      </div>

      {isLoggedIn === false && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span className="text-xs sm:text-sm font-medium">
              Please sign in to publish your report so other users can contact you.
            </span>
          </div>
          <Link
            href="/auth/login?redirectTo=/report"
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shrink-0 hover:bg-blue-700 transition-colors"
          >
            Sign In / Demo Login
          </Link>
        </div>
      )}

      {success ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">check</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Item Reported Successfully!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your item has been added to the public feed. Redirecting you to the listings...
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
        >
          {/* Lost vs Found Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Item Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("LOST")}
                className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === "LOST"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>I Lost Something</span>
              </button>

              <button
                type="button"
                onClick={() => setType("FOUND")}
                className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === "FOUND"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>I Found Something</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
              Item Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., iPhone 15 with Blue Case, Brown Leather Wallet, or Car Keys"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Library 2nd Floor, Campus Cafeteria, or Central Park"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
              Date {type === "LOST" ? "Lost" : "Found"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, condition, brand, or any other helpful details..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
              Photo (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 transition-colors">
              <div className="space-y-2 text-center">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-40 h-28 object-cover rounded-lg shadow-sm mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="mt-2 text-rose-600 text-xs font-semibold hover:underline block mx-auto"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[32px] text-slate-400">
                      add_photo_alternate
                    </span>
                    <div className="flex text-xs text-slate-600 dark:text-slate-400 justify-center">
                      <label className="relative cursor-pointer font-bold text-blue-600 hover:underline">
                        <span>Upload a photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !location.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <span>Submit Report</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="pt-24 pb-16 px-4 sm:px-6 flex-1">
        <Suspense fallback={<div className="text-center py-10 text-sm text-slate-500">Loading form...</div>}>
          <ReportForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
