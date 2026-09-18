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

const STEPS = [
  { id: 1, label: "Item Type" },
  { id: 2, label: "Basic Info" },
  { id: 3, label: "Photo" },
  { id: 4, label: "Private Details" },
];

function StepIndicator({ current, type }: { current: number; type: "LOST" | "FOUND" }) {
  const steps = type === "LOST" ? STEPS : STEPS.slice(0, 3);
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                current >= step.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {current > step.id ? (
                <span className="material-symbols-outlined text-[16px]">check</span>
              ) : (
                step.id
              )}
            </div>
            <span
              className={`text-[10px] font-medium whitespace-nowrap hidden sm:block ${
                current >= step.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 transition-all ${
                current > step.id ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "FOUND" ? "FOUND" : "LOST";

  const [currentStep, setCurrentStep] = useState(1);
  const [type, setType] = useState<"LOST" | "FOUND">(initialType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics & Gear");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [privateDetails, setPrivateDetails] = useState<string[]>(["", "", ""]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const totalSteps = type === "LOST" ? 4 : 3;

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

  const updatePrivateDetail = (index: number, value: string) => {
    setPrivateDetails((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const canProceedStep1 = !!type;
  const canProceedStep2 = !!title.trim() && !!location.trim() && !!description.trim();
  const canProceedStep3 = true; // photo is optional
  const canSubmit =
    type === "FOUND"
      ? canProceedStep2
      : privateDetails.filter((d) => d.trim()).length >= 2;

  const handleNext = () => {
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep((s) => s - 1);
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

      const filledPrivateDetails =
        type === "LOST"
          ? privateDetails.map((d) => d.trim()).filter(Boolean)
          : [];

      const res = await createItem({
        title,
        description,
        category,
        type,
        location: location ? `${location} (Date: ${date})` : `Date: ${date}`,
        image_url: imageUrl,
        private_details: filledPrivateDetails,
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
      }, 1800);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1800);
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
            Sign In
          </Link>
        </div>
      )}

      {success ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Item Reported Successfully!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {type === "LOST"
              ? "Your lost item has been posted. If someone finds it and claims it, they'll need to verify ownership privately."
              : "Your found item has been posted to the public feed."}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <StepIndicator current={currentStep} type={type} />

          {/* ── STEP 1: Item Type ── */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  What happened?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("LOST")}
                    className={`py-4 px-4 rounded-xl text-sm font-semibold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
                      type === "LOST"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200 dark:shadow-rose-900"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">search</span>
                    <span>I Lost Something</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("FOUND")}
                    className={`py-4 px-4 rounded-xl text-sm font-semibold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
                      type === "FOUND"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200 dark:shadow-emerald-900"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">add_circle</span>
                    <span>I Found Something</span>
                  </button>
                </div>
              </div>

              {type === "LOST" && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px] mt-0.5">lock</span>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                    <strong>Tip:</strong> In Step 4 you'll add secret ownership details. Anyone who claims this item must correctly identify these private details before you can accept their claim.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Basic Info ── */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  Item Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., iPhone 15 with Blue Case, Brown Leather Wallet"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                />
              </div>

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
                    placeholder="e.g., Library 2nd Floor, Campus Cafeteria"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  Public Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe color, condition, brand, or any other publicly visible details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm resize-none"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Photo ── */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  Photo <span className="text-slate-400 font-normal text-xs">(optional but recommended)</span>
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
                        <span className="material-symbols-outlined text-[36px] text-slate-400">
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

              <div className="flex justify-between pt-2">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                {type === "FOUND" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {isSubmitting ? <span>Publishing...</span> : <><span>Submit Report</span><span className="material-symbols-outlined text-[16px]">send</span></>}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedStep3}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Private Details (LOST only) ── */}
          {currentStep === 4 && type === "LOST" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] mt-0.5">lock</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      Secret Ownership Details (Private)
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                      These details are <strong>never shown publicly</strong>. They are used to verify that the person claiming your item is truly the owner. Add unique details that only you would know.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Examples: <em>"Small scratch near the charging port"</em>, <em>"Sticker with my initials inside the cover"</em>, <em>"Contains a ₹500 note and a library card"</em>
                </p>

                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Private Detail #{i + 1}{" "}
                      {i < 2 ? (
                        <span className="text-rose-500">*</span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">(optional)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={privateDetails[i]}
                      onChange={(e) => updatePrivateDetail(i, e.target.value)}
                      required={i < 2}
                      placeholder={
                        i === 0
                          ? "e.g., Small scratch on the bottom-left corner"
                          : i === 1
                          ? "e.g., Red sticker on the back"
                          : "e.g., Contains a ₹50 note and two business cards"
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Publishing...</span>
                  ) : (
                    <>
                      <span>Submit Lost Report</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
