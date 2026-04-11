const ASCII_LETTER_PATTERN = /^[a-z]+$/;

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function normalizeTracedBoardLetters(
  letters: readonly string[],
): string {
  if (letters.length === 0) {
    return "";
  }

  const normalized = letters.join("").toLowerCase();
  if (!ASCII_LETTER_PATTERN.test(normalized)) {
    throw new Error("Traced board letters must normalize to ASCII a-z only.");
  }

  return normalized;
}
