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
  const [showResume, setShowResume] = useState(false);
  const [completed, setCompleted] = useState(false);
  // started: false = show big start button, true = show sentence practice
  const [started, setStarted] = useState(false);
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

  const handlePlayerReady = useCallback(() => {
    setIsPlayerReady(true);
  }, []);

  // Seek to current sentence whenever sentence changes or player becomes ready
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

  // DEBUG BANNER - remove after confirming new code loads
  const DEBUG_BANNER = (
    <div style={{background:'lime', color:'black', padding:'8px', fontWeight:'bold', textAlign:'center'}}>
      ✅ NEW CODE v3 LOADED
    </div>
  );

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
      {DEBUG_BANNER}
      {/* Hidden YouTube player – audio only, positioned off-screen */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: "1px",
          height: "1px",
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <YouTubePlayer ref={playerRef} videoId={videoId!} onReady={handlePlayerReady} />
      </div>

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

      {/* Start screen */}
      {!started ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">{videoInfo.videoTitle}</h2>
            <p className="text-sm text-gray-500">총 {videoInfo.captions.length}개 문장</p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
          >
            <PlayIcon className="w-6 h-6" />
            학습 시작
          </button>
        </div>
      ) : (
        /* Practice area */
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="text-xs text-gray-400">
            문장 {currentIndex + 1} / {videoInfo.captions.length}
          </div>

          <SentenceDisplay caption={caption} />

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
          />
        </div>
      )}
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
