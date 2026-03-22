import { getSupabase } from "./supabase";
import { Bookmark, VideoProgress } from "@/types";

// ── Bookmarks ─────────────────────────────────────────────────────────────────

export async function fetchBookmarksFromDB(userId: string): Promise<Bookmark[]> {
  const { data, error } = await getSupabase()
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    bookmarkId: row.id,
    userId: row.user_id,
    videoId: row.video_id,
    videoTitle: row.video_title ?? "",
    videoUrl: `https://www.youtube.com/watch?v=${row.video_id}`,
    timestamp: row.sentence_index,
    totalSentences: row.total_sentences ?? undefined,
    sentenceEn: row.sentence_text,
    sentenceKo: row.sentence_ko ?? undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function insertBookmarkToDB(bookmark: Bookmark): Promise<void> {
  await getSupabase().from("bookmarks").insert({
    id: bookmark.bookmarkId,
    user_id: bookmark.userId,
    video_id: bookmark.videoId,
    video_title: bookmark.videoTitle,
    sentence_index: bookmark.timestamp,
    total_sentences: bookmark.totalSentences ?? null,
    sentence_text: bookmark.sentenceEn,
    sentence_ko: bookmark.sentenceKo ?? null,
  });
}

export async function deleteBookmarkFromDB(bookmarkId: string): Promise<void> {
  await getSupabase().from("bookmarks").delete().eq("id", bookmarkId);
}

// ── Video Progress ─────────────────────────────────────────────────────────────

export async function fetchProgressFromDB(userId: string): Promise<VideoProgress[]> {
  const { data, error } = await getSupabase()
    .from("video_progress")
    .select("*")
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((row) => ({
    progressId: row.id,
    userId: row.user_id,
    videoId: row.video_id,
    videoTitle: row.video_title ?? "",
    totalSentences: 0,
    completedSentences: row.completed_sentences ?? [],
    lastPosition: row.last_position ?? 0,
    updatedAt: new Date(row.updated_at),
  }));
}

export async function upsertProgressToDB(progress: VideoProgress): Promise<void> {
  await getSupabase().from("video_progress").upsert(
    {
      user_id: progress.userId,
      video_id: progress.videoId,
      video_title: progress.videoTitle,
      completed_sentences: progress.completedSentences,
      last_position: progress.lastPosition,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" }
  );
}
