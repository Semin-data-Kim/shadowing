"use client";

import { maskSentence } from "@/lib/validation";
import { Caption } from "@/types";

interface SentenceDisplayProps {
  caption: Caption;
  revealed: boolean;
}

export default function SentenceDisplay({ caption, revealed }: SentenceDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="text-2xl font-mono tracking-wider text-gray-400 min-h-[2rem]">
        {revealed ? (
          <span className="text-gray-800">{caption.textEn}</span>
        ) : (
          maskSentence(caption.textEn)
        )}
      </div>
      {caption.textKo && (
        <div className="text-sm text-gray-500">{caption.textKo}</div>
      )}
    </div>
  );
}
