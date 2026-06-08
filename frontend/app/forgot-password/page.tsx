"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword, getErrorMessage } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err as never));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="flex-1 min-w-0">
        <div className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-6 mb-4">
          <h2 className="font-heading text-xl font-semibold text-[#444] dark:text-[#f0f0f0] mb-5">
            Forgot Password
          </h2>
          {sent ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If an account with that email exists, we&apos;ve sent password reset instructions.
              Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div>
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/login" className="text-[#527c9f] hover:underline">← Back to login</Link>
          </p>
        </div>
      </section>
      <aside className="w-full md:w-72 flex-shrink-0"><Sidebar /></aside>
    </>
  );
}
