"use client";

import { useEffect } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { fetchBookmarksFromDB, fetchProgressFromDB, upsertProgressToDB } from "@/lib/db";
import { User } from "@/types";

function sessionToUser(session: Session): User {
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.user_metadata?.full_name ?? "",
    avatar: session.user.user_metadata?.avatar_url ?? "",
    createdAt: new Date(session.user.created_at),
  };
}

async function mergeAndLoadUserData(newUser: User) {
  const { progressMap } = useAppStore.getState();

  // 1. Migrate any guest progress to real userId
  const hasGuestProgress = Object.values(progressMap).some((p) => p.userId === "guest");
  if (hasGuestProgress) {
    const migrated = Object.fromEntries(
      Object.entries(progressMap).map(([key, progress]) => [
        key,
        progress.userId === "guest" ? { ...progress, userId: newUser.userId } : progress,
      ])
    );
    useAppStore.setState({ progressMap: migrated });

    // Push migrated guest progress to DB
    await Promise.all(
      Object.values(migrated)
        .filter((p) => p.userId === newUser.userId)
        .map((p) => upsertProgressToDB(p).catch(console.error))
    );
  }

  // 2. Load bookmarks from DB and merge (DB is source of truth for logged-in users)
  const [dbBookmarks, dbProgress] = await Promise.all([
    fetchBookmarksFromDB(newUser.userId),
    fetchProgressFromDB(newUser.userId),
  ]);

  // Merge bookmarks: combine DB + local (avoid duplicates by bookmarkId)
  const localBookmarks = useAppStore.getState().bookmarks.filter(
    (b) => b.userId === newUser.userId
  );
  const dbIds = new Set(dbBookmarks.map((b) => b.bookmarkId));
  const onlyLocal = localBookmarks.filter((b) => !dbIds.has(b.bookmarkId));
  useAppStore.setState({ bookmarks: [...dbBookmarks, ...onlyLocal] });

  // Merge progress: DB wins over local for logged-in user
  if (dbProgress.length > 0) {
    const currentMap = useAppStore.getState().progressMap;
    const dbMap = Object.fromEntries(dbProgress.map((p) => [p.videoId, p]));
    useAppStore.setState({ progressMap: { ...currentMap, ...dbMap } });
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore();

  useEffect(() => {
    const supabase: SupabaseClient = getSupabase();

    supabase.auth.getSession().then(async (result) => {
      if (result.data.session) {
        const user = sessionToUser(result.data.session);
        await mergeAndLoadUserData(user);
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const newUser = sessionToUser(session);
        await mergeAndLoadUserData(newUser);
        setUser(newUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
