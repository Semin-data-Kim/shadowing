"use client";

import { Bookmark } from "@/types";
import { formatTime } from "@/lib/validation";
import { TrashIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export default function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const router = useRouter();
  const { removeBookmark } = useAppStore();

  const handlePlay = () => {
    router.push(`/practice?videoId=${bookmark.videoId}&t=${bookmark.timestamp}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 hover:shadow-sm transition-shadow">
      <img
        src={`https://img.youtube.com/vi/${bookmark.videoId}/mqdefault.jpg`}
        alt={bookmark.videoTitle}
        className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-red-600 truncate mb-1">
          {bookmark.videoTitle}
        </p>
        <p className="text-sm text-gray-800 font-medium line-clamp-1">
          &ldquo;{bookmark.sentenceEn}&rdquo;
        </p>
        {bookmark.sentenceKo && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            &ldquo;{bookmark.sentenceKo}&rdquo;
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {formatTime(bookmark.timestamp)} &middot;{" "}
            {new Date(bookmark.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePlay}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeBookmark(bookmark.bookmarkId)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
