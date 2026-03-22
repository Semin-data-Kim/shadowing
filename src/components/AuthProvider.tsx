"use client";

import { useEffect } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
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

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore();

  useEffect(() => {
    const supabase: SupabaseClient = getSupabase();

    supabase.auth.getSession().then((result: Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>) => {
      if (result.data.session) setUser(sessionToUser(result.data.session));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session) {
        const newUser = sessionToUser(session);
        // Migrate guest progress records to real userId
        const { progressMap } = useAppStore.getState();
        const hasGuestProgress = Object.values(progressMap).some((p) => p.userId === "guest");
        if (hasGuestProgress) {
          const migrated = Object.fromEntries(
            Object.entries(progressMap).map(([key, progress]) => [
              key,
              progress.userId === "guest" ? { ...progress, userId: newUser.userId } : progress,
            ])
          );
          useAppStore.setState({ progressMap: migrated });
        }
        setUser(newUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
