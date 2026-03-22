export interface User {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Caption {
  index: number;
  startTime: number; // seconds
  endTime: number;
  textEn: string;
  textKo?: string;
}

export interface VideoInfo {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  captions: Caption[];
}

export interface VideoProgress {
  progressId?: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  totalSentences: number;
  completedSentences: number[];
  lastPosition: number;
  updatedAt: Date;
}

export interface Bookmark {
  bookmarkId: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  timestamp: number;
  sentenceEn: string;
  sentenceKo?: string;
  createdAt: Date;
}

export interface ValidationResult {
  isCorrect: boolean;
  errors: DiffError[];
}

export interface DiffError {
  index: number;
  expected: string;
  actual: string;
}

export type SortOrder = "recent" | "oldest";
