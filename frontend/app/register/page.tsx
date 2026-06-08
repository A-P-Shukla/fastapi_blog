"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
      // Auto-login after register
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
          <h2 className="font-heading text-xl font-semibold text-[#444] dark:text-[#f0f0f0] mb-5">Register</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={1}
                maxLength={50}
              />
            </div>
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
                minLength={8}
              />
              <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters.</p>
            </div>
            <div>
              <label className="form-label" htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#527c9f] hover:underline">Login here</Link>
          </p>
        </div>
      </section>
      <aside className="w-full md:w-72 flex-shrink-0"><Sidebar /></aside>
    </>
  );
}
