import { normalizeWord } from "./normalizeWord.ts";
import type {
  RuntimeValidationSnapshot,
  RuntimeValidationWord,
  ValidationSnapshotLookup,
} from "./types.ts";

export class InMemoryValidationSnapshotLookup implements ValidationSnapshotLookup {
  public readonly snapshot_version: string;
  public readonly metadata;

  private readonly entriesByWord: ReadonlyMap<string, RuntimeValidationWord>;

  public constructor(snapshot: RuntimeValidationSnapshot) {
    this.snapshot_version = snapshot.metadata.snapshot_version;
    this.metadata = snapshot.metadata;

    const elementTags = new Map(
      Object.entries(snapshot.element_tags).map(([word, element]) => [
        normalizeWord(word),
        element,
      ]),
    );

    const entries = new Map<string, RuntimeValidationWord>();
    for (const word of snapshot.castable_words) {
      const normalizedWord = normalizeWord(word);
      const element = elementTags.get(normalizedWord) ?? "arcane";
      entries.set(normalizedWord, { normalized_word: normalizedWord, element });
    }

    this.entriesByWord = entries;
  }

  public hasWord(normalizedWord: string): boolean {
    return this.entriesByWord.has(normalizeWord(normalizedWord));
  }

  public getEntry(normalizedWord: string): RuntimeValidationWord | null {
    return this.entriesByWord.get(normalizeWord(normalizedWord)) ?? null;
  }
}
