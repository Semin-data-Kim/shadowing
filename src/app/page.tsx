"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractVideoId } from "@/lib/validation";
import { useAppStore } from "@/store/useAppStore";
import ProgressBar from "@/components/ui/ProgressBar";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { recentVideos, progressMap } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      setError("올바른 YouTube URL을 입력해주세요");
      return;
    }

    router.push(`/practice?videoId=${videoId}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 py-8">
        <h1 className="text-4xl font-bold text-gray-900">
          <span className="text-red-600">Shadow</span>Tube
        </h1>
        <p className="text-gray-500 text-lg">
          ⭐ 서버확인 v999 ⭐ YouTube 영상으로 영어 섀도잉 연습을 시작하세요
        </p>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="YouTube URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            시작하기
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            최근 학습 영상
          </h2>
          <div className="space-y-2">
            {recentVideos.map((video) => {
              const progress = progressMap[video.videoId];
              const completed = progress?.completedSentences.length ?? 0;
              const total = progress?.totalSentences ?? 0;

              return (
                <button
                  key={video.videoId}
                  onClick={() =>
                    router.push(`/practice?videoId=${video.videoId}`)
                  }
                  className="w-full bg-white rounded-xl border border-gray-200 p-3 flex gap-3 hover:shadow-sm transition-shadow text-left"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.videoTitle}
                    className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {video.videoTitle}
                    </p>
                    {total > 0 && (
                      <ProgressBar completed={completed} total={total} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {recentVideos.length === 0 && (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <div className="text-5xl">🎧</div>
          <p className="text-sm">YouTube URL을 입력해서 학습을 시작해보세요!</p>
          <p className="text-xs">자막이 있는 영상이라면 무엇이든 가능합니다</p>
        </div>
      )}
    </div>
  );
}
