"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
}

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId, onReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YT.Player | null>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds) => playerRef.current?.seekTo(seconds, true),
      playVideo: () => playerRef.current?.playVideo(),
      pauseVideo: () => playerRef.current?.pauseVideo(),
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    }));

    useEffect(() => {
      const initPlayer = () => {
        if (!containerRef.current) return;
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => onReady?.(),
          },
        });
      };

      if (window.YT?.Player) {
        initPlayer();
      } else {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = initPlayer;
      }

      return () => {
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [videoId]);

    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";
export default YouTubePlayer;
