"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import CreatePostModal from "./CreatePostModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <nav className="bg-[#527c9f] fixed top-0 inset-x-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/" className="text-white font-bold text-lg tracking-tight font-heading">
            FastAPI Blog
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/" className="text-[#cbd5db] hover:text-white text-sm transition-colors">
              Home
            </Link>
            {user ? (
              <>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-sm border border-white/60 text-white px-3 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  New Post
                </button>
                <Link
                  href="/account"
                  className="text-sm bg-white text-[#527c9f] px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
                >
                  {user.username}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm border border-white/60 text-white px-3 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-white text-[#527c9f] px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#466a87] px-4 pb-4 flex flex-col gap-2">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-white text-sm py-1">Home</Link>
            {user ? (
              <>
                <button
                  onClick={() => { setMenuOpen(false); setShowCreate(true); }}
                  className="text-white text-sm text-left py-1"
                >
                  New Post
                </button>
                <Link href="/account" onClick={() => setMenuOpen(false)} className="text-white text-sm py-1">
                  Account ({user.username})
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-white text-sm text-left py-1">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-white text-sm py-1">Login</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="text-white text-sm py-1">Register</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
