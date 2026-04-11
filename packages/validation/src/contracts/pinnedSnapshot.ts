import type { RuntimeValidationSnapshot } from "./types.js";

const starterAndChapterAnchorWords = [
  "leaf",
  "sun",
  "rain",
  "river",
  "wave",
  "burn",
  "ember",
  "wind",
  "storm",
  "rock",
  "glow",
  "shine",
] as const;

const commonArcaneSupportWords = [
  "aura",
  "beam",
  "bloom",
  "cloud",
  "dawn",
  "drift",
  "flare",
  "frost",
  "lumen",
  "mist",
  "moss",
  "petal",
  "spark",
  "stone",
  "tide",
] as const;

const castableWords = [
  ...new Set([...starterAndChapterAnchorWords, ...commonArcaneSupportWords]),
];

export const PINNED_VALIDATION_SNAPSHOT_V1: RuntimeValidationSnapshot = {
  metadata: {
    snapshot_version: "val_snapshot_m2_launch_v1",
    language: "en",
    word_count: castableWords.length,
    tagged_word_count: starterAndChapterAnchorWords.length,
    generated_at_utc: "2026-04-11T00:00:00.000Z",
  },
  castable_words: castableWords,
  element_tags: {
    leaf: "bloom",
    sun: "light",
    rain: "tide",
    river: "tide",
    wave: "tide",
    burn: "flame",
    ember: "flame",
    wind: "storm",
    storm: "storm",
    rock: "stone",
    glow: "light",
    shine: "light",
  },
};
