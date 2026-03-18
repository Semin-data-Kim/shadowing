"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { BookmarkIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const { user, setUser } = useAppStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-red-600 tracking-tight">
          ShadowTube
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/bookmarks"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BookmarkIcon className="w-4 h-4" />
            북마크
          </Link>
          {user ? (
            <button
              onClick={() => setUser(null)}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
