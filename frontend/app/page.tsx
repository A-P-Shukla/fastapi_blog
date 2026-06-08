"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { getPosts } from "@/lib/api";
import type { Post } from "@/lib/types";

const LIMIT = 10;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getPosts(0, LIMIT).then((data) => {
      setPosts(data.posts);
      setHasMore(data.has_more);
      setLoading(false);
    });
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await getPosts(posts.length, LIMIT);
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.has_more);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <section className="flex-1 min-w-0">
        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No posts yet. Be the first!</p>
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
