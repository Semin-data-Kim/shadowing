"use client"

import Link from "next/link"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/useAppStore"
import { getSupabase } from "@/lib/supabase"

export default function Header() {
  const { user, setUser } = useAppStore()

  const handleLogout = async () => {
    await getSupabase().auth.signOut()
    setUser(null)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold italic text-[#FF0000]">Shadow</span>
          <span className="text-xl font-bold">Tube</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/bookmarks">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Bookmark className="size-4" />
              <span className="hidden sm:inline">북마크</span>
            </Button>
          </Link>
          {user ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-[#FF0000] px-4 font-medium text-white hover:bg-[#CC0000]">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
