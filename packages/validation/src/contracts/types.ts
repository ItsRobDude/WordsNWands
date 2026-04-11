export type ElementType =
  | "flame"
  | "tide"
  | "bloom"
  | "storm"
  | "stone"
  | "light"
  | "arcane";

export interface RuntimeValidationWord {
  normalized_word: string;
  element: ElementType;
}

export interface ValidationSnapshotMetadata {
  snapshot_version: string;
  language: "en";
  word_count: number;
  tagged_word_count: number;
  generated_at_utc: string;
}

export interface ValidationSnapshotLookup {
  snapshot_version: string;
  metadata: ValidationSnapshotMetadata;
  hasWord(normalizedWord: string): boolean;
  getEntry(normalizedWord: string): RuntimeValidationWord | null;
}

export interface ValidationSnapshotLookupProvider {
  get(snapshot_version: string): ValidationSnapshotLookup;
}

export interface RuntimeValidationSnapshot {
  metadata: ValidationSnapshotMetadata;
  castable_words: string[];
  element_tags: Partial<Record<string, Exclude<ElementType, "arcane">>>;
}
