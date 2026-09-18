"use client";

import { useState } from "react";
import type { DisplayItem } from "@/lib/mockData";
import { createClaim, submitVerification } from "@/lib/actions/claims";

interface ClaimModalProps {
  item: DisplayItem | null;
  onClose: () => void;
}

type Step = "intro" | "answers" | "result";

export default function ClaimModal({ item, onClose }: ClaimModalProps) {
  const [step, setStep] = useState<Step>("intro");
  const [claimId, setClaimId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    passed: boolean;
    matched: number;
    required: number;
    total: number;
    message: string;
  } | null>(null);

  if (!item) return null;

  const isFound = item.type === "FOUND";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);

  // ── Step 1: Register claim intent ──────────────────────────
  const handleStartClaim = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isUuid) {
        const res = await createClaim(item.id);
        if (res.error) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }
        setClaimId(res.data?.id ?? null);
      }
      setStep("answers");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Submit answers for server-side verification ────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const filledAnswers = answers.filter((a) => a.trim().length > 0);
    if (filledAnswers.length < 2) {
      setError("Please provide at least 2 ownership details.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      if (isUuid && claimId) {
        const result = await submitVerification(claimId, filledAnswers);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
        setVerificationResult(result);
      } else {
        // Demo fallback
        setVerificationResult({
          passed: true,
          matched: 2,
          required: 2,
          total: 3,
          message: "Verification passed! (Demo mode)",
        });
      }
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {step === "intro" && (isFound ? "Claim This Item" : "Report a Sighting")}
              {step === "answers" && "Ownership Verification"}
              {step === "result" && (verificationResult?.passed ? "Verification Passed ✓" : "Verification Failed")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === "intro" && "Prove you are the owner by answering secret questions."}
              {step === "answers" && "Your answers are verified privately — never shown publicly."}
              {step === "result" && verificationResult?.message}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Item Quick Preview */}
          <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-14 h-14 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
            )}
            <div className="min-w-0">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  item.type === "FOUND"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {item.type}
              </span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{item.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                <span className="truncate">{item.location}</span>
              </p>
            </div>
          </div>

          {/* ── STEP: INTRO ────────────────────────────────── */}
          {step === "intro" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] mt-0.5">lock</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      Ownership Verification Required
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                      To prevent fraud, you'll need to answer <strong>2–3 private questions</strong> about unique details of this item. Only the true owner would know these details. Your answers are checked securely on our server — never visible to others.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: "search", text: "Step 1 — Register your claim" },
                  { icon: "lock", text: "Step 2 — Answer secret ownership questions" },
                  { icon: "verified", text: "Step 3 — Results verified privately on server" },
                  { icon: "handshake", text: "Step 4 — Reporter reviews & approves" },
                ].map((s) => (
                  <div key={s.text} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px] text-blue-500">{s.icon}</span>
                    {s.text}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800/50">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartClaim}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Start Verification</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: ANSWERS ──────────────────────────────── */}
          {step === "answers" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                <span>
                  Describe <strong>unique private details</strong> only the true owner would know — like a scratch, sticker, engraving, contents, or a distinctive marking.
                </span>
              </div>

              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ownership Detail #{i + 1} {i < 2 && <span className="text-rose-500">*</span>}
                    {i === 2 && <span className="text-slate-400 font-normal text-xs ml-1">(optional)</span>}
                  </label>
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                    required={i < 2}
                    placeholder={
                      i === 0
                        ? "e.g. Small scratch on the bottom-left corner"
                        : i === 1
                        ? "e.g. Red sticker inside the back cover"
                        : "e.g. Contains a ₹50 note and a metro card"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm transition-all"
                  />
                </div>
              ))}

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800/50">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("intro")}
                  className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || answers.filter((a) => a.trim()).length < 2}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Submit & Verify</span>
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP: RESULT ───────────────────────────────── */}
          {step === "result" && verificationResult && (
            <div className="py-4 text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  verificationResult.passed
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                }`}
              >
                <span className="material-symbols-outlined text-[36px]">
                  {verificationResult.passed ? "verified" : "cancel"}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {verificationResult.passed ? "Verification Successful!" : "Verification Failed"}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {verificationResult.passed
                    ? "Your ownership details matched. The item reporter has been notified and will review your claim."
                    : `Only ${verificationResult.matched} of ${verificationResult.required} required details matched. Please try again with more specific details.`}
                </p>
              </div>

              {/* Score indicator */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: verificationResult.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < verificationResult.matched
                        ? verificationResult.passed
                          ? "bg-emerald-500"
                          : "bg-amber-400"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-2 pt-2">
                {!verificationResult.passed && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers(["", "", ""]);
                      setError(null);
                      setStep("answers");
                    }}
                    className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    verificationResult.passed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
