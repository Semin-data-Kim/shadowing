import { ValidationResult, DiffError } from "@/types";

function normalize(text: string): string {
  return text
    .replace(/[\u2018\u2019\u02BC]/g, "'") // curly/smart apostrophes → straight
    .replace(/[\u201C\u201D]/g, '"')         // curly double quotes → straight
    .replace(/[.,!?;:'"]/g, "")              // remove punctuation
    .replace(/\s+/g, " ")                    // collapse multiple spaces
    .trim();
}

export function validateAnswer(
  userInput: string,
  correctAnswer: string
): ValidationResult {
  const cleanUser = normalize(userInput);
  const cleanAnswer = normalize(correctAnswer);

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
    .split(/\s+/)
    .map((word) => "_".repeat(word.replace(/[\u2018\u2019\u02BC\u201C\u201D.,!?;:'"]/g, "").length || 1))
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
