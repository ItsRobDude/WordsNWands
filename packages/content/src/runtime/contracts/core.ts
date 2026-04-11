export type EncounterType = "standard" | "boss" | "event";

export type DifficultyTier =
  | "gentle"
  | "standard"
  | "challenging"
  | "boss"
  | "event";

export type ElementType =
  | "flame"
  | "tide"
  | "bloom"
  | "storm"
  | "stone"
  | "light"
  | "arcane";

export type NonNeutralElementType = Exclude<ElementType, "arcane">;
