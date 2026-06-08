"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
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
          <h2 className="font-heading text-xl font-semibold text-[#444] dark:text-[#f0f0f0] mb-5">Login</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-xs text-[#527c9f] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#527c9f] hover:underline">Register here</Link>
          </p>
        </div>
      </section>
      <aside className="w-full md:w-72 flex-shrink-0"><Sidebar /></aside>
    </>
  );
}
