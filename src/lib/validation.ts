import { ValidationResult, DiffError } from "@/types";

export function validateAnswer(
  userInput: string,
  correctAnswer: string
): ValidationResult {
  // Remove punctuation
  const cleanUser = userInput.replace(/[.,!?;:'"]/g, "").trim();
  const cleanAnswer = correctAnswer.replace(/[.,!?;:'"]/g, "").trim();

  if (cleanUser === cleanAnswer) {
    return { isCorrect: true, errors: [] };
  }

  const errors: DiffError[] = findDifferences(cleanUser, cleanAnswer);
  return { isCorrect: false, errors };
}

function findDifferences(actual: string, expected: string): DiffError[] {
  const errors: DiffError[] = [];
  const maxLen = Math.max(actual.length, expected.length);

  for (let i = 0; i < maxLen; i++) {
    if (actual[i] !== expected[i]) {
      errors.push({
        index: i,
        expected: expected[i] || "",
        actual: actual[i] || "",
      });
    }
  }

  return errors;
}

export function maskSentence(text: string): string {
  return text
    .split(" ")
    .map((word) => "_".repeat(word.replace(/[.,!?;:'"]/g, "").length || 1))
    .join(" ");
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
