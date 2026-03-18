import { NextRequest, NextResponse } from "next/server";
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

    // 2. Fetch captions directly via timedtext (no OAuth required)
    const enXml = await fetchCaptionXml(videoId, "en");
    const koXml = await fetchCaptionXml(videoId, "ko");

    const enCaptions = enXml ? parseCaptionXml(enXml) : [];
    const koCaptions = koXml ? parseCaptionXml(koXml) : null;

    if (!enCaptions.length) {
      return NextResponse.json(
        { error: "No English captions available for this video" },
        { status: 404 }
      );
    }

    const captions: Caption[] = enCaptions.map((c, i) => ({
      index: i,
      startTime: c.start,
      endTime: c.start + c.dur,
      textEn: c.text,
      textKo: koCaptions?.[i]?.text,
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

async function fetchCaptionXml(videoId: string, lang: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

function parseCaptionXml(
  xml: string
): Array<{ start: number; dur: number; text: string }> {
  const results: Array<{ start: number; dur: number; text: string }> = [];
  const regex = /<p[^>]*t="(\d+)"[^>]*d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const start = parseInt(match[1]) / 1000;
    const dur = parseInt(match[2]) / 1000;
    const rawText = match[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();

    if (rawText) {
      results.push({ start, dur, text: rawText });
    }
  }

  return results;
}
