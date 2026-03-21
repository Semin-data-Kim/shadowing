"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { extractVideoId } from "@/lib/validation"
import { useAppStore } from "@/store/useAppStore"

export default function HomePage() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { recentVideos, progressMap } = useAppStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const videoId = extractVideoId(url.trim())
    if (!videoId) {
      setError("올바른 YouTube URL을 입력해주세요")
      return
    }

    router.push(`/practice?videoId=${videoId}`)
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="pt-6 text-center">
        <h1 className="mb-3 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="italic text-[#FF0000]">Shadow</span>
          <span>Tube</span>
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          YouTube 영상으로 영어 섀도잉 연습을 시작하세요
        </p>
      </div>

      {/* URL Input Section */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="YouTube URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError("")
              }}
              className="h-12 rounded-xl border-border/60 bg-background pl-12 text-base shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-[#FF0000] focus-visible:ring-[#FF0000]/20"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 rounded-xl bg-[#FF0000] px-8 text-base font-semibold text-white shadow-md transition-all hover:bg-[#CC0000] hover:shadow-lg"
          >
            시작하기
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* Recent Videos Section */}
      {recentVideos.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">최근 학습 영상</h2>
          <div className="flex flex-col gap-3">
            {recentVideos.map((video) => {
              const progress = progressMap[video.videoId]
              const completed = progress?.completedSentences.length ?? 0
              const total = progress?.totalSentences ?? 0
              const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <div
                  key={video.videoId}
                  onClick={() => router.push(`/practice?videoId=${video.videoId}`)}
                  className="group flex cursor-pointer gap-4 rounded-xl border border-border/40 bg-card p-3 transition-all hover:border-border hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-36 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:w-44">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.videoTitle}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {progressPercent === 100 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="rounded-full bg-[#FF0000] px-2 py-0.5 text-xs font-medium text-white">
                          완료
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <div>
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-[#FF0000]">
                        {video.videoTitle}
                      </h3>
                    </div>

                    {/* Progress */}
                    {total > 0 && (
                      <div className="mt-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">진행률</span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {completed}/{total} ({progressPercent}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#FF0000] transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        /* Empty state */
        <div className="py-12 text-center text-muted-foreground">
          <div className="mb-3 text-5xl">🎧</div>
          <p className="text-sm">YouTube URL을 입력해서 학습을 시작해보세요!</p>
          <p className="mt-1 text-xs">자막이 있는 영상이라면 무엇이든 가능합니다</p>
        </div>
      )}
    </div>
  )
}
