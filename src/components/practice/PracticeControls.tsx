"use client";

import {
  SpeakerWaveIcon,
  BookmarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid, PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { Caption, Bookmark } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/components/ui/Toast";
import { formatTime } from "@/lib/validation";

interface PracticeControlsProps {
  caption: Caption;
  videoId: string;
  videoTitle: string;
  totalSentences: number;
  isPlaying: boolean;
  isRepeating: boolean;
  onPlay: () => void;
  onToggleRepeat: () => void;
}

export default function PracticeControls({
  caption,
  videoId,
  videoTitle,
  totalSentences,
  isPlaying,
  isRepeating,
  onPlay,
  onToggleRepeat,
}: PracticeControlsProps) {
  const { addBookmark, removeBookmark, isBookmarked, user } = useAppStore();
  const { show, ToastComponent } = useToast();

  const bookmarked = isBookmarked(videoId, caption.index);

  const handleBookmark = () => {
    if (!user) {
      show("로그인이 필요합니다", "error");
      return;
    }
    if (bookmarked) {
      const store = useAppStore.getState();
      const bm = store.bookmarks.find(
        (b) => b.videoId === videoId && b.timestamp === caption.index
      );
      if (bm) { removeBookmark(bm.bookmarkId); show("북마크가 삭제되었습니다", "info"); }
    } else {
      const bookmark: Bookmark = {
        bookmarkId: `${videoId}-${caption.index}-${Date.now()}`,
        userId: user.userId,
        videoId,
        videoTitle,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(caption.startTime)}`,
        timestamp: caption.index,
        totalSentences,
        sentenceEn: caption.textEn,
        sentenceKo: caption.textKo,
        createdAt: new Date(),
      };
      addBookmark(bookmark);
      show("북마크에 추가되었습니다 ⭐", "success");
    }
  };

  return (
    <>
      {ToastComponent}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Play */}
        <button
          onClick={onPlay}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isPlaying && !isRepeating
              ? "bg-red-100 text-red-600 border border-red-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <SpeakerWaveIcon className="w-4 h-4" />
          {isPlaying && !isRepeating ? "재생 중..." : "재생"}
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isRepeating
              ? "bg-blue-100 text-blue-600 border border-blue-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <ArrowPathIcon className="w-4 h-4" />
          {isRepeating ? "반복 중..." : "반복"}
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            bookmarked
              ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {bookmarked ? <BookmarkSolid className="w-4 h-4 text-yellow-500" /> : <BookmarkIcon className="w-4 h-4" />}
          북마크
        </button>

        <span className="ml-auto text-xs text-gray-400">{formatTime(caption.startTime)}</span>
      </div>
    </>
  );
}
