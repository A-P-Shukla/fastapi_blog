"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getErrorMessage, resetPassword } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, newPw);
      router.push("/login");
    } catch (err: unknown) {
      setError(getErrorMessage(err as never));
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <p className="text-red-600 text-sm">Invalid or missing reset token. Please request a new link.</p>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="form-label" htmlFor="new-pw">New Password</label>
        <input id="new-pw" type="password" className="form-input" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
      </div>
      <div>
        <label className="form-label" htmlFor="confirm-pw">Confirm Password</label>
        <input id="confirm-pw" type="password" className="form-input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <section className="flex-1 min-w-0">
        <div className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-6 mb-4">
          <h2 className="font-heading text-xl font-semibold text-[#444] dark:text-[#f0f0f0] mb-5">Reset Password</h2>
          <Suspense fallback={<p className="text-gray-400 text-sm">Loading…</p>}>
            <ResetForm />
          </Suspense>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/login" className="text-[#527c9f] hover:underline">← Back to login</Link>
          </p>
        </div>
      </section>
      <aside className="w-full md:w-72 flex-shrink-0"><Sidebar /></aside>
    </>
  );
}
