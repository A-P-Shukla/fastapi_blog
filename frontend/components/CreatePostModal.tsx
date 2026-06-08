"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createPost, getErrorMessage } from "@/lib/api";

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const post = await createPost(title, content);
      onClose();
      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err as never));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="New Post"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button form="createForm" type="submit" disabled={loading} className="btn-primary">
            {loading ? "Posting…" : "Post"}
          </button>
        </>
      }
    >
      <form id="createForm" onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="form-label" htmlFor="new-title">Title</label>
          <input
            id="new-title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="new-content">Content</label>
          <textarea
            id="new-content"
            className="form-input resize-none"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
