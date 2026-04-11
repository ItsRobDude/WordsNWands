#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CANONICAL_DOC="$ROOT_DIR/docs/implementation-contracts.md"
PROGRESSION_DOC="$ROOT_DIR/docs/progression-economy-and-monetization.md"

EXPECTED_STARTER_WIN="starter_result_outcome = 'won'"
EXPECTED_STARTER_LOSS="starter_result_outcome = 'lost'"

for doc in "$CANONICAL_DOC" "$PROGRESSION_DOC"; do
  if ! grep -Fq "$EXPECTED_STARTER_WIN" "$doc" || ! grep -Fq "$EXPECTED_STARTER_LOSS" "$doc"; then
    echo "[starter-gate-consistency] Missing starter outcome rules in ${doc#$ROOT_DIR/}" >&2
    exit 1
  fi
done

echo "[starter-gate-consistency] PASS"
