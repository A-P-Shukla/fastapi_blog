"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  headerClass?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ title, headerClass = "bg-[#527c9f]", onClose, children, footer }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-[#2d2d2d] rounded-lg shadow-xl w-full max-w-lg">
        <div className={`${headerClass} text-white flex items-center justify-between px-4 py-3 rounded-t-lg`}>
          <h5 className="font-heading font-semibold text-base">{title}</h5>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#404040] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
