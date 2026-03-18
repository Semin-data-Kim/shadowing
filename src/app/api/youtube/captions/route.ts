import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { Caption } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "videoId is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Get video info
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const videoData = await videoRes.json();

    if (!videoData.items?.length) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const videoTitle = videoData.items[0].snippet.title;
    const thumbnailUrl =
      videoData.items[0].snippet.thumbnails?.medium?.url || "";

    // 2. Fetch English captions via youtube-transcript
    let enTranscript;
    try {
      enTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    } catch {
      return NextResponse.json(
        { error: "No English captions available for this video" },
        { status: 404 }
      );
    }

    if (!enTranscript.length) {
      return NextResponse.json(
        { error: "No English captions available for this video" },
        { status: 404 }
      );
    }

    // 3. Try to fetch Korean captions (optional)
    let koTranscript: typeof enTranscript | null = null;
    try {
      koTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "ko" });
    } catch {
      // Korean captions are optional
    }

    const captions: Caption[] = enTranscript.map((c, i) => ({
      index: i,
      startTime: c.offset / 1000,
      endTime: (c.offset + c.duration) / 1000,
      textEn: c.text,
      textKo: koTranscript?.[i]?.text,
    }));

    return NextResponse.json({ videoTitle, thumbnailUrl, captions });
  } catch (err) {
    console.error("Caption fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load captions" },
      { status: 500 }
    );
  }
}
