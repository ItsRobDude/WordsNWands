import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryValidationSnapshotLookup } from "./ValidationSnapshotLookup.ts";
import {
  countPlayableWordsUpToLimit,
  hasPlayableWord,
} from "./hasPlayableWord.ts";

const createLookup = (
  castable_words = ["leaf", "sun", "path", "calm"],
  element_tags = {
    leaf: "bloom",
    sun: "light",
  } as const,
) =>
  new InMemoryValidationSnapshotLookup({
    metadata: {
      snapshot_version: "test_snapshot_v1",
      language: "en",
      word_count: castable_words.length,
      tagged_word_count: Object.keys(element_tags).length,
      generated_at_utc: "2026-01-01T00:00:00.000Z",
    },
    castable_words,
    element_tags,
  });

test("lookup exposes prefix checks and max word length for pruning", () => {
  const lookup = createLookup();

  assert.equal(lookup.hasPrefix("lea"), true);
  assert.equal(lookup.hasPrefix("leaf"), true);
  assert.equal(lookup.hasPrefix("leaz"), false);
  assert.equal(lookup.getMaxWordLength(), 4);
});

test("hasPlayableWord finds a playable word on a simple board", () => {
  const lookup = createLookup();

  assert.equal(
    hasPlayableWord({
      board: [
        [
          { letter: "l", blocked: false },
          { letter: "e", blocked: false },
        ],
        [
          { letter: "a", blocked: false },
          { letter: "f", blocked: false },
        ],
      ],
      repeated_words: new Set(),
      validation_lookup: lookup,
      minimum_length: 3,
    }),
    true,
  );
});

test("hasPlayableWord respects repeated words and returns false when no fresh word remains", () => {
  const lookup = createLookup();

  assert.equal(
    hasPlayableWord({
      board: [
        [
          { letter: "l", blocked: false },
          { letter: "e", blocked: false },
        ],
        [
          { letter: "a", blocked: false },
          { letter: "f", blocked: false },
        ],
      ],
      repeated_words: new Set(["leaf"]),
      validation_lookup: lookup,
      minimum_length: 3,
    }),
    false,
  );
});

test("countPlayableWordsUpToLimit deduplicates paths and stops at the requested limit", () => {
  const count = countPlayableWordsUpToLimit({
    board: [
      [
        { letter: "c", blocked: false },
        { letter: "a", blocked: false },
      ],
      [
        { letter: "t", blocked: false },
        { letter: "r", blocked: false },
      ],
    ],
    repeated_words: new Set(),
    validation_lookup: createLookup(["cat", "car", "cart"]),
    limit: 2,
  });

  assert.equal(count, 2);
});
