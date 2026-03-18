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
    // First get available tracks, then fetch with correct kind (manual or asr)
    const tracks = await fetchCaptionTracks(videoId);
    const enTrack = tracks.find((t) => t.lang === "en") || tracks.find((t) => t.lang.startsWith("en"));
    const koTrack = tracks.find((t) => t.lang === "ko");

    const enXml = enTrack ? await fetchCaptionXml(videoId, enTrack.lang, enTrack.kind) : null;
    const koXml = koTrack ? await fetchCaptionXml(videoId, koTrack.lang, koTrack.kind) : null;

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

async function fetchCaptionTracks(videoId: string): Promise<Array<{ lang: string; kind: string }>> {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&type=list`;
    const res = await fetch(url, { headers: { "Accept-Language": "en-US,en;q=0.9" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const tracks: Array<{ lang: string; kind: string }> = [];
    const regex = /<track[^>]*lang_code="([^"]+)"[^>]*kind="([^"]*)"[^>]*/g;
    const regexNoKind = /<track[^>]*lang_code="([^"]+)"[^>]*/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      tracks.push({ lang: match[1], kind: match[2] });
    }
    if (!tracks.length) {
      while ((match = regexNoKind.exec(xml)) !== null) {
        tracks.push({ lang: match[1], kind: "" });
      }
    }
    return tracks;
  } catch {
    return [];
  }
}

async function fetchCaptionXml(videoId: string, lang: string, kind: string): Promise<string | null> {
  try {
    const kindParam = kind === "asr" ? "&kind=asr" : "";
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}${kindParam}&fmt=srv3`;
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
