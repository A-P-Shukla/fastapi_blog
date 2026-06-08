import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";

interface Props {
  post: Post;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export default function PostCard({ post }: Props) {
  return (
    <article className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm hover:shadow-md transition-shadow px-6 py-5 mb-4">
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
            <span className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(post.date_posted)}</span>
          </div>
          <h2 className="font-heading text-lg font-semibold text-[#444] dark:text-[#f0f0f0] mb-1">
            <Link href={`/posts/${post.id}`} className="hover:text-[#428bca] transition-colors">
              {post.title}
            </Link>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line line-clamp-3">
            {post.content}
          </p>
        </div>
      </div>
    </article>
  );
}
