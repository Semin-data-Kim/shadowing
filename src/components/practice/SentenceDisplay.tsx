"use client";

import { useMemo, useState } from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { Caption } from "@/types";

interface SentenceDisplayProps {
  caption: Caption;
  isCompleted?: boolean;
}

export default function SentenceDisplay({ caption, isCompleted = false }: SentenceDisplayProps) {
  const [hintOn, setHintOn] = useState(false);

  const words = useMemo(() => caption.textEn.split(/\s+/).filter(Boolean), [caption.textEn]);

  const hintIndices = useMemo(
    () => new Set(words.map((_, i) => i).filter((i) => i % 2 === 1)),
    [words]
  );

  return (
    <div className="space-y-3">
      <div className="text-2xl font-mono tracking-wider min-h-[2rem] flex flex-wrap gap-x-2 gap-y-1">
        {words.map((word, i) => {
          const clean = word.replace(/[\u2018\u2019\u02BC\u201C\u201D.,!?;:'"]/g, "");
          // Completed sentence: show full text in green
          if (isCompleted) {
            return (
              <span key={i} className="text-green-600 font-semibold">
                {word}
              </span>
            );
          }
          if (hintOn && hintIndices.has(i)) {
            return (
              <span key={i} className="text-red-500 font-semibold bg-red-50 rounded px-0.5">
                {word}
              </span>
            );
          }
          return (
            <span key={i} className="text-gray-400">
              {"_".repeat(clean.length || 1)}
            </span>
          );
        })}
      </div>

      {caption.textKo && (
        <div className="text-sm text-gray-500">{caption.textKo}</div>
      )}

      {!isCompleted && (
        <button
          onClick={() => setHintOn((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            hintOn
              ? "bg-amber-100 text-amber-700 border border-amber-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <LightBulbIcon className="w-4 h-4" />
          {hintOn ? "힌트 끄기" : "힌트"}
        </button>
      )}
    </div>
  );
}
