import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VideoInfo, VideoProgress, Bookmark, User } from "@/types";
import {
  insertBookmarkToDB,
  deleteBookmarkFromDB,
  upsertProgressToDB,
} from "@/lib/db";

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Current video
  currentVideo: VideoInfo | null;
  setCurrentVideo: (video: VideoInfo | null) => void;

  // Practice state
  currentSentenceIndex: number;
  setCurrentSentenceIndex: (index: number) => void;
  completedSentences: number[];
  markSentenceComplete: (index: number) => void;
  resetProgress: () => void;

  // Progress records (per video)
  progressMap: Record<string, VideoProgress>;
  saveProgress: (progress: VideoProgress) => void;
  getProgress: (videoId: string) => VideoProgress | null;

  // Bookmarks
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (bookmarkId: string) => void;
  isBookmarked: (videoId: string, sentenceIndex: number) => boolean;

  // Recent videos
  recentVideos: Array<{ videoId: string; videoTitle: string; thumbnailUrl: string; progressPercent: number }>;
  addRecentVideo: (videoId: string, videoTitle: string, thumbnailUrl: string, progressPercent: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),

      currentVideo: null,
      setCurrentVideo: (video) => set({ currentVideo: video }),

      currentSentenceIndex: 0,
      setCurrentSentenceIndex: (index) => set({ currentSentenceIndex: index }),

      completedSentences: [],
      markSentenceComplete: (index) =>
        set((state) => ({
          completedSentences: state.completedSentences.includes(index)
            ? state.completedSentences
            : [...state.completedSentences, index],
        })),
      resetProgress: () =>
        set({ completedSentences: [], currentSentenceIndex: 0 }),

      progressMap: {},
      saveProgress: (progress) => {
        set((state) => ({
          progressMap: { ...state.progressMap, [progress.videoId]: progress },
        }));
        if (get().user) upsertProgressToDB(progress).catch(console.error);
      },
      getProgress: (videoId) => get().progressMap[videoId] || null,

      bookmarks: [],
      addBookmark: (bookmark) => {
        set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }));
        if (get().user) insertBookmarkToDB(bookmark).catch(console.error);
      },
      removeBookmark: (bookmarkId) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.bookmarkId !== bookmarkId),
        }));
        if (get().user) deleteBookmarkFromDB(bookmarkId).catch(console.error);
      },
      isBookmarked: (videoId, sentenceIndex) =>
        get().bookmarks.some(
          (b) => b.videoId === videoId && b.timestamp === sentenceIndex
        ),

      recentVideos: [],
      addRecentVideo: (videoId, videoTitle, thumbnailUrl, progressPercent) =>
        set((state) => {
          const filtered = state.recentVideos.filter((v) => v.videoId !== videoId);
          return {
            recentVideos: [
              { videoId, videoTitle, thumbnailUrl, progressPercent },
              ...filtered,
            ].slice(0, 5),
          };
        }),
    }),
    {
      name: "shadowing-storage",
      partialize: (state) => ({
        progressMap: state.progressMap,
        bookmarks: state.bookmarks,
        recentVideos: state.recentVideos,
        user: state.user,
      }),
    }
  )
);
