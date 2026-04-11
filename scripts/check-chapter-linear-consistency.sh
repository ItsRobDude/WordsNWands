#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CANONICAL_DOC="$ROOT_DIR/docs/implementation-contracts.md"
PROGRESSION_DOC="$ROOT_DIR/docs/progression-economy-and-monetization.md"

EXPECTED_TOPOLOGY="chapter_linear_v1"
EXPECTED_UNLOCK="win_any_stars"

if ! grep -Fq "$EXPECTED_TOPOLOGY" "$CANONICAL_DOC" || ! grep -Fq "$EXPECTED_TOPOLOGY" "$PROGRESSION_DOC"; then
  echo "[chapter-linear-consistency] Missing chapter_linear_v1 topology lock" >&2
  exit 1
fi

if ! grep -Fq "$EXPECTED_UNLOCK" "$CANONICAL_DOC" || ! grep -Fq "$EXPECTED_UNLOCK" "$PROGRESSION_DOC"; then
  echo "[chapter-linear-consistency] Missing win_any_stars unlock rule" >&2
  exit 1
fi

echo "[chapter-linear-consistency] PASS"
