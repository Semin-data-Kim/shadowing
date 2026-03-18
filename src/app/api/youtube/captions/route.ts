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

    // 2. Get caption tracks
    const captionRes = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
    );
    const captionData = await captionRes.json();

    if (!captionData.items?.length) {
      return NextResponse.json(
        { error: "No captions available for this video" },
        { status: 404 }
      );
    }

    // Find English captions (prefer manually created over auto-generated)
    const enTrack =
      captionData.items.find(
        (t: { snippet: { language: string; trackKind: string } }) =>
          t.snippet.language === "en" && t.snippet.trackKind !== "asr"
      ) ||
      captionData.items.find(
        (t: { snippet: { language: string } }) => t.snippet.language === "en"
      );

    const koTrack = captionData.items.find(
      (t: { snippet: { language: string } }) => t.snippet.language === "ko"
    );

    if (!enTrack) {
      return NextResponse.json(
        { error: "No English captions available for this video" },
        { status: 404 }
      );
    }

    // 3. Download caption content (requires OAuth for non-public captions)
    // For MVP, we parse TimedText XML from the public endpoint
    const enXml = await fetchCaptionXml(videoId, "en");
    const koXml = koTrack ? await fetchCaptionXml(videoId, "ko") : null;

    const enCaptions = parseCaptionXml(enXml);
    const koCaptions = koXml ? parseCaptionXml(koXml) : null;

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

async function fetchCaptionXml(videoId: string, lang: string): Promise<string> {
  const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${lang} captions`);
  return res.text();
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
