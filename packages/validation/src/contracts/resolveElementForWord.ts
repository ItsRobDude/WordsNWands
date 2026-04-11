import { normalizeWord } from "./normalizeWord.ts";
import type { ElementType, ValidationSnapshotLookup } from "./types.ts";

export function resolveElementForWord(
  word: string,
  validationLookup: ValidationSnapshotLookup,
): ElementType | null {
  const entry = validationLookup.getEntry(normalizeWord(word));
  return entry?.element ?? null;
}
