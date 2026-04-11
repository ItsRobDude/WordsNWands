import { normalizeWord } from "./normalizeWord.js";
import type { ElementType, ValidationSnapshotLookup } from "./types.js";

export function resolveElementForWord(
  word: string,
  validationLookup: ValidationSnapshotLookup,
): ElementType | null {
  const entry = validationLookup.getEntry(normalizeWord(word));
  return entry?.element ?? null;
}
