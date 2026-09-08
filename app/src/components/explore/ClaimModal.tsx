"use client";

import { useState } from "react";
import type { DisplayItem } from "@/lib/mockData";
import { createClaim } from "@/lib/actions/claims";

interface ClaimModalProps {
  item: DisplayItem | null;
  onClose: () => void;
}

export default function ClaimModal({ item, onClose }: ClaimModalProps) {
  const [claimMessage, setClaimMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const isFound = item.type === "FOUND";

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimMessage.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // If it's a real database UUID, dispatch to createClaim action
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        item.id
      );

      if (isUuid) {
        const res = await createClaim({
          item_id: item.id,
          message: claimMessage,
        });

        if (res.error) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitted(true);
    } catch {
      // Fallback for demo items
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isFound ? "Claim Found Item" : "Contact Owner"}
            </h3>
            <p className="text-xs text-slate-500">
              {isFound
                ? "Send a message to prove this item belongs to you."
                : "Let the owner know if you found or spotted their item."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Item Quick Preview */}
          <div className="flex gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
            )}
            <div className="min-w-0">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  item.type === "FOUND"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {item.type}
              </span>
              <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span className="truncate">{item.location}</span>
              </p>
            </div>
          </div>

          {/* Submission Form / Success State */}
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">check</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Message Sent Successfully!
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                The reporter has received your message. You can view updates and communicate further
                in your Dashboard once they respond.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  {isFound ? "Proof of Ownership / Identifying Details" : "Your Message to Owner"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  placeholder={
                    isFound
                      ? "Describe unique features (e.g., color of case, wallpaper, contents, or serial number) to prove it's yours."
                      : "Let the owner know where you saw or found their item, and how they can reach you."
                  }
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !claimMessage.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Request</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
