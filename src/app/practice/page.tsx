"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Caption, VideoInfo } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import YouTubePlayer, { YouTubePlayerRef } from "@/components/player/YouTubePlayer";
import SentenceDisplay from "@/components/practice/SentenceDisplay";
import TypingInput from "@/components/practice/TypingInput";
import PracticeControls from "@/components/practice/PracticeControls";
import ProgressBar from "@/components/ui/ProgressBar";
import { ArrowLeftIcon, PlayIcon } from "@heroicons/react/24/solid";

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [playerStarted, setPlayerStarted] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const playerRef = useRef<YouTubePlayerRef>(null);

  const {
    completedSentences,
    markSentenceComplete,
    resetProgress,
    saveProgress,
    getProgress,
    addRecentVideo,
    setCurrentVideo,
    user,
  } = useAppStore();

  const loadVideo = useCallback(
    async (id: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/youtube/captions?videoId=${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "자막을 불러오는데 실패했습니다");
          return;
        }

        const info: VideoInfo = {
          videoId: id,
          videoTitle: data.videoTitle,
          thumbnailUrl: data.thumbnailUrl,
          captions: data.captions,
        };

        setVideoInfo(info);
        setCurrentVideo(info);
        addRecentVideo(id, data.videoTitle, data.thumbnailUrl, 0);

        const savedProgress = getProgress(id);
        if (savedProgress && savedProgress.lastPosition > 0) {
          setShowResume(true);
        }
      } catch {
        setError("네트워크 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    },
    [getProgress, setCurrentVideo, addRecentVideo]
  );

  useEffect(() => {
    if (!videoId) {
      router.push("/");
      return;
    }
    loadVideo(videoId);
  }, [videoId, loadVideo, router]);

  // When player becomes ready, seek to the current sentence and pause
  const handlePlayerReady = useCallback(() => {
    setIsPlayerReady(true);
  }, []);

  // Auto-seek to current sentence timestamp whenever sentence changes or player becomes ready
  useEffect(() => {
    if (!isPlayerReady || !videoInfo) return;
    const caption = videoInfo.captions[currentIndex];
    if (!caption) return;
    playerRef.current?.seekTo(caption.startTime);
    playerRef.current?.pauseVideo();
  }, [currentIndex, isPlayerReady, videoInfo]);

  const handleCorrect = () => {
    if (!videoInfo) return;

    markSentenceComplete(currentIndex);
    setShowHint(false);

    const newCompleted = [...completedSentences, currentIndex];
    saveProgress({
      userId: user?.userId ?? "guest",
      videoId: videoInfo.videoId,
      videoTitle: videoInfo.videoTitle,
      totalSentences: videoInfo.captions.length,
      completedSentences: newCompleted,
      lastPosition: currentIndex + 1,
      updatedAt: new Date(),
    });

    if (currentIndex + 1 >= videoInfo.captions.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleResume = (resume: boolean) => {
    setShowResume(false);
    if (resume && videoId) {
      const progress = getProgress(videoId);
      if (progress) {
        setCurrentIndex(progress.lastPosition);
      }
    } else {
      resetProgress();
      setCurrentIndex(0);
    }
  };

  if (!videoId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">자막을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">😢</div>
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!videoInfo) return null;

  const caption: Caption = videoInfo.captions[currentIndex];

  if (completed) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800">완료!</h2>
        <p className="text-gray-500">
          모든 {videoInfo.captions.length}개 문장을 완료했습니다!
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <ProgressBar
            completed={completedSentences.length}
            total={videoInfo.captions.length}
          />
        </div>
      </div>

      {/* Resume modal */}
      {showResume && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">이어서 학습할까요?</h3>
            <p className="text-sm text-gray-500">이전 학습 기록이 있습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleResume(true)}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700"
              >
                이어서 학습
              </button>
              <button
                onClick={() => handleResume(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200"
              >
                처음부터
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video area: thumbnail start screen or YouTube player */}
      {!playerStarted ? (
        <button
          onClick={() => setPlayerStarted(true)}
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
        >
          {videoInfo.thumbnailUrl ? (
            <img
              src={videoInfo.thumbnailUrl}
              alt={videoInfo.videoTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <PlayIcon className="w-8 h-8 text-white ml-1" />
            </div>
            <p className="mt-3 text-white text-sm font-medium drop-shadow">
              클릭하여 학습 시작
            </p>
          </div>
        </button>
      ) : (
        <YouTubePlayer ref={playerRef} videoId={videoId} onReady={handlePlayerReady} />
      )}

      {/* Practice area */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>문장 {currentIndex + 1} / {videoInfo.captions.length}</span>
        </div>

        <SentenceDisplay caption={caption} revealed={showHint} />

        <TypingInput
          key={currentIndex}
          correctAnswer={caption.textEn}
          onCorrect={handleCorrect}
        />

        <PracticeControls
          caption={caption}
          playerRef={playerRef}
          videoId={videoInfo.videoId}
          videoTitle={videoInfo.videoTitle}
          onHint={() => setShowHint(true)}
          showHint={showHint}
        />
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
