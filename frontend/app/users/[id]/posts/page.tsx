"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { getUser, getUserPosts } from "@/lib/api";
import type { Post, UserPublic } from "@/lib/types";

const LIMIT = 10;

export default function UserPostsPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const [user, setUser] = useState<UserPublic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([getUser(userId), getUserPosts(userId, 0, LIMIT)])
      .then(([u, data]) => {
        setUser(u);
        setPosts(data.posts);
        setHasMore(data.has_more);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await getUserPosts(userId, posts.length, LIMIT);
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.has_more);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return (
    <div className="flex-1 py-8 text-center text-gray-400 text-sm">Loading…</div>
  );

  if (notFound || !user) return (
    <div className="flex-1 py-8 text-center">
      <p className="text-gray-500 mb-3">User not found.</p>
      <Link href="/" className="text-[#527c9f] hover:underline text-sm">← Back to home</Link>
    </div>
  );

  return (
    <>
      <section className="flex-1 min-w-0">
        <h1 className="font-heading text-2xl font-semibold text-[#444] dark:text-[#f0f0f0] mb-5">
          Posts by {user.username}
        </h1>
        {posts.length === 0 ? (
          <p className="text-gray-400 text-sm">No posts by this user yet.</p>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {hasMore && (
              <div className="text-center mt-2 mb-4">
                <button onClick={loadMore} disabled={loadingMore} className="btn-outline">
                  {loadingMore ? "Loading…" : "Load More Posts"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <aside className="w-full md:w-72 flex-shrink-0">
        <Sidebar />
      </aside>
    </>
  );
}
