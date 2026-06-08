"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { deletePost, getErrorMessage, getPost, updatePost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Modal from "@/components/Modal";
import Sidebar from "@/components/Sidebar";
import type { Post } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPost(Number(id))
      .then((p) => { setPost(p); setEditTitle(p.title); setEditContent(p.content); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      const updated = await updatePost(Number(id), { title: editTitle, content: editContent });
      setPost(updated);
      setShowEdit(false);
    } catch (err: unknown) {
      setEditError(getErrorMessage(err as never));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(Number(id));
      router.push("/");
    } catch (err: unknown) {
      alert(getErrorMessage(err as never));
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) return (
    <div className="flex-1 py-8 text-center text-gray-400 text-sm">Loading…</div>
  );

  if (notFound || !post) return (
    <div className="flex-1 py-8 text-center">
      <p className="text-gray-500 mb-3">Post not found.</p>
      <Link href="/" className="text-[#527c9f] hover:underline text-sm">← Back to home</Link>
    </div>
  );

  const isOwner = user?.id === post.user_id;

  return (
    <>
      <section className="flex-1 min-w-0">
        <article className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-5 mb-4">
          <div className="flex items-start gap-4">
            <Link href={`/users/${post.author.id}/posts`} className="flex-shrink-0">
              <Image
                src={post.author.image_path}
                alt={`${post.author.username}'s profile picture`}
                width={64}
                height={64}
                className="rounded-full object-cover border border-gray-200 dark:border-[#4a4a4a]"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100 dark:border-[#4a4a4a]">
                <Link
                  href={`/users/${post.author.id}/posts`}
                  className="text-[#527c9f] hover:text-[#428bca] font-medium text-sm transition-colors"
                >
                  {post.author.username}
                </Link>
                <span className="text-gray-400 text-xs">{formatDate(post.date_posted)}</span>
              </div>
              <h1 className="font-heading text-xl font-semibold text-[#444] dark:text-[#f0f0f0] mb-3">
                {post.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{post.content}</p>

              {isOwner && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#4a4a4a] flex gap-2">
                  <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
                    Edit Post
                  </button>
                  <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <aside className="w-full md:w-72 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Edit Modal */}
      {showEdit && (
        <Modal
          title="Edit Post"
          onClose={() => setShowEdit(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancel</button>
              <button form="editForm" type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="editForm" onSubmit={handleEdit} className="flex flex-col gap-3">
            {editError && <p className="text-red-600 text-sm">{editError}</p>}
            <div>
              <label className="form-label" htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                className="form-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="edit-content">Content</label>
              <textarea
                id="edit-content"
                className="form-input resize-none"
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <Modal
          title="Delete Post?"
          headerClass="bg-[#a85b5b]"
          onClose={() => setShowDelete(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowDelete(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
