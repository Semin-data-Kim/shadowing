import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { Caption } from "@/types";

const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const INNERTUBE_CONTEXT = {
  client: { clientName: "ANDROID", clientVersion: "20.10.38" },
};
const INNERTUBE_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoTitle = videoData.items[0].snippet.title;
    const thumbnailUrl =
      videoData.items[0].snippet.thumbnails?.medium?.url || "";

    // 2. Check that manual (non-auto-generated) English captions exist
    const hasManual = await checkManualEnCaptions(videoId);
    if (!hasManual) {
      return NextResponse.json(
        {
          error:
            "이 영상은 수동 영어 자막이 없습니다. 영어 자막이 직접 추가된 영상을 사용해 주세요.",
        },
        { status: 404 }
      );
    }

    // 3. Fetch English captions via youtube-transcript
    let enTranscript;
    try {
      enTranscript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "en",
      });
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

    // 4. Try to fetch Korean captions (optional)
    let koTranscript: typeof enTranscript | null = null;
    try {
      koTranscript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "ko",
      });
    } catch {
      // Korean captions are optional
    }

    const rawChunks = enTranscript.map((c) => ({
      text: decodeHtmlEntities(c.text),
      startTime: c.offset / 1000,
      endTime: (c.offset + c.duration) / 1000,
    }));

    const captions = splitIntoSentences(rawChunks);

    return NextResponse.json({ videoTitle, thumbnailUrl, captions });
  } catch (err) {
    console.error("Caption fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load captions" },
      { status: 500 }
    );
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoSentences(
  chunks: { text: string; startTime: number; endTime: number }[]
): Caption[] {
  const captions: Caption[] = [];
  let buffer = "";
  let sentenceStart = 0;
  let sentenceEnd = 0;
  let idx = 0;

  for (const chunk of chunks) {
    if (!buffer) sentenceStart = chunk.startTime;
    sentenceEnd = chunk.endTime;

    if (buffer) buffer += " ";
    buffer += chunk.text;

    // Extract all complete sentences from the buffer
    // Sentence ends at [.!?] followed by whitespace or end of string
    let match: RegExpExecArray | null;
    const re = /[.!?](?=\s|$)/g;
    let lastEnd = 0;

    while ((match = re.exec(buffer)) !== null) {
      const end = match.index + 1;
      const sentence = buffer.slice(lastEnd, end).trim();
      if (sentence) {
        captions.push({ index: idx++, startTime: sentenceStart, endTime: sentenceEnd, textEn: sentence });
        sentenceStart = chunk.startTime; // approximate for subsequent sentences in same chunk
      }
      lastEnd = end;
      // skip trailing whitespace
      while (lastEnd < buffer.length && buffer[lastEnd] === " ") lastEnd++;
    }

    buffer = buffer.slice(lastEnd);
  }

  // flush remaining
  if (buffer.trim()) {
    captions.push({ index: idx++, startTime: sentenceStart, endTime: sentenceEnd, textEn: buffer.trim() });
  }

  return captions;
}

/** Returns true if the video has at least one manually added English caption track (not asr). */
async function checkManualEnCaptions(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(INNERTUBE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": INNERTUBE_USER_AGENT,
      },
      body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
    });
    if (!res.ok) return true; // fail open — don't block if check itself fails
    const data = await res.json();
    const tracks: Array<{ languageCode: string; kind?: string }> =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    return tracks.some((t) => t.languageCode === "en" && t.kind !== "asr");
  } catch {
    return true; // fail open
  }
}
