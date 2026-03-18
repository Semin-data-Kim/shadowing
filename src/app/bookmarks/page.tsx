"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import BookmarkCard from "@/components/bookmark/BookmarkCard";
import { ArrowLeftIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { SortOrder } from "@/types";

export default function BookmarksPage() {
  const router = useRouter();
  const { bookmarks } = useAppStore();
  const [sort, setSort] = useState<SortOrder>("recent");

  const sorted = [...bookmarks].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return sort === "recent" ? bDate - aDate : aDate - bDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          북마크 ({bookmarks.length})
        </h1>
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-red-400"
          >
            <option value="recent">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 space-y-3 text-gray-400">
          <BookmarkIcon className="w-12 h-12 mx-auto" />
          <p className="text-sm">저장된 북마크가 없습니다</p>
          <p className="text-xs">학습 중 ⭐ 버튼을 눌러 문장을 저장해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((bookmark) => (
            <BookmarkCard key={bookmark.bookmarkId} bookmark={bookmark} />
          ))}
        </div>
      )}
    </div>
  );
}
