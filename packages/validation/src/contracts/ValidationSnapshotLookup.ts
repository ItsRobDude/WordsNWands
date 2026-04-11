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
  private readonly prefixes: ReadonlySet<string>;
  private readonly maxWordLength: number;

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
    const prefixes = new Set<string>();
    let maxWordLength = 0;
    for (const word of snapshot.castable_words) {
      const normalizedWord = normalizeWord(word);
      const element = elementTags.get(normalizedWord) ?? "arcane";
      entries.set(normalizedWord, { normalized_word: normalizedWord, element });
      maxWordLength = Math.max(maxWordLength, normalizedWord.length);
      for (let index = 1; index <= normalizedWord.length; index += 1) {
        prefixes.add(normalizedWord.slice(0, index));
      }
    }

    this.entriesByWord = entries;
    this.prefixes = prefixes;
    this.maxWordLength = maxWordLength;
  }

  public hasWord(normalizedWord: string): boolean {
    return this.entriesByWord.has(normalizeWord(normalizedWord));
  }

  public hasPrefix(normalizedPrefix: string): boolean {
    return this.prefixes.has(normalizeWord(normalizedPrefix));
  }

  public getEntry(normalizedWord: string): RuntimeValidationWord | null {
    return this.entriesByWord.get(normalizeWord(normalizedWord)) ?? null;
  }

  public getMaxWordLength(): number {
    return this.maxWordLength;
  }
}
