"use client";

import { useMemo } from "react";
import { Caption } from "@/types";

interface SentenceDisplayProps {
  caption: Caption;
  revealed: boolean;
}

/** Deterministically picks ~40% of word indices to reveal, stable per sentence. */
function getRevealedIndices(words: string[]): Set<number> {
  let hash = 0;
  const text = words.join(" ");
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }

  const targetCount = Math.max(1, Math.round(words.length * 0.4));
  const indices = new Set<number>();
  let seed = Math.abs(hash) || 1;

  while (indices.size < targetCount) {
    seed = Math.imul(seed, 1664525) + 1013904223;
    indices.add(Math.abs(seed) % words.length);
  }

  return indices;
}

export default function SentenceDisplay({ caption, revealed }: SentenceDisplayProps) {
  const words = useMemo(() => caption.textEn.split(/\s+/), [caption.textEn]);
  const revealedIndices = useMemo(() => getRevealedIndices(words), [words]);

  return (
    <div className="space-y-2">
      <div className="text-2xl font-mono tracking-wider min-h-[2rem] flex flex-wrap gap-x-2 gap-y-1">
        {words.map((word, i) => {
          if (!revealed) {
            return (
              <span key={i} className="text-gray-400">
                {"_".repeat(word.replace(/[\u2018\u2019\u02BC\u201C\u201D.,!?;:'"]/g, "").length || 1)}
              </span>
            );
          }
          if (revealedIndices.has(i)) {
            return (
              <span key={i} className="text-red-600 font-semibold">
                {word}
              </span>
            );
          }
          return (
            <span key={i} className="text-gray-400">
              {"_".repeat(word.replace(/[\u2018\u2019\u02BC\u201C\u201D.,!?;:'"]/g, "").length || 1)}
            </span>
          );
        })}
      </div>
      {caption.textKo && (
        <div className="text-sm text-gray-500">{caption.textKo}</div>
      )}
    </div>
  );
}
