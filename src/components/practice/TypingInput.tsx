"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { validateAnswer } from "@/lib/validation";
import { ValidationResult } from "@/types";

interface TypingInputProps {
  correctAnswer: string;
  onCorrect: () => void;
  initialValue?: string;
  initialResult?: ValidationResult | null;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export default function TypingInput({ correctAnswer, onCorrect, initialValue = "", initialResult = null, onValueChange, disabled }: TypingInputProps) {
  const [value, setValue] = useState(initialValue);
  const [result, setResult] = useState<ValidationResult | null>(initialResult);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!value.trim()) return;

    const validation = validateAnswer(value, correctAnswer);
    setResult(validation);

    if (validation.isCorrect) {
      setTimeout(() => {
        setValue("");
        setResult(null);
        onCorrect();
      }, 800);
    }
  };

  const renderFeedback = () => {
    if (!result) return null;

    if (result.isCorrect) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium mt-2 animate-pulse">
          <span>✅</span>
          <span>맞았어요! 다음 문장으로 이동합니다...</span>
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-1">
        <div className="text-red-500 text-sm font-medium flex items-center gap-1">
          <span>❌</span>
          <span>다시 시도해보세요</span>
        </div>
        <div className="text-xs text-gray-500">
          대소문자와 공백을 확인해주세요 (구두점은 무시됩니다)
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onValueChange?.(e.target.value);
          if (result?.isCorrect === false) setResult(null);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled || result?.isCorrect}
        placeholder="여기에 타이핑하세요..."
        className={`w-full px-4 py-3 rounded-xl border-2 text-base outline-none transition-colors ${
          result === null
            ? "border-gray-300 focus:border-red-400"
            : result.isCorrect
            ? "border-green-400 bg-green-50"
            : "border-red-400 bg-red-50"
        } disabled:bg-gray-100`}
      />
      {renderFeedback()}
    </div>
  );
}
