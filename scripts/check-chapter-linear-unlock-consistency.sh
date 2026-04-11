#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CONTRACTS_DOC="$ROOT_DIR/docs/implementation-contracts.md"
EARLY_LOCK_DOC="$ROOT_DIR/docs/early-content-lock.md"
PROGRESSION_DOC="$ROOT_DIR/docs/progression-economy-and-monetization.md"

EXPECTED_TOPOLOGY="chapter_linear_v1"
EXPECTED_UNLOCK_CONDITION="win_any_stars"
EXPECTED_PROGRESSION_VERSION="progression_m2_chapter_linear_v1"

for doc in "$CONTRACTS_DOC" "$EARLY_LOCK_DOC" "$PROGRESSION_DOC"; do
  if ! grep -Fq "$EXPECTED_TOPOLOGY" "$doc"; then
    echo "[chapter-linear-unlock-consistency] Missing topology token '$EXPECTED_TOPOLOGY' in ${doc#$ROOT_DIR/}" >&2
    exit 1
  fi
done

if ! grep -Fq "$EXPECTED_UNLOCK_CONDITION" "$CONTRACTS_DOC" || ! grep -Fq "$EXPECTED_UNLOCK_CONDITION" "$PROGRESSION_DOC"; then
  echo "[chapter-linear-unlock-consistency] Unlock condition '$EXPECTED_UNLOCK_CONDITION' must appear in implementation and progression docs" >&2
  exit 1
fi

if ! grep -Fq "$EXPECTED_PROGRESSION_VERSION" "$CONTRACTS_DOC" || ! grep -Fq "$EXPECTED_PROGRESSION_VERSION" "$EARLY_LOCK_DOC" || ! grep -Fq "$EXPECTED_PROGRESSION_VERSION" "$PROGRESSION_DOC"; then
  echo "[chapter-linear-unlock-consistency] Progression version '$EXPECTED_PROGRESSION_VERSION' must stay aligned across docs" >&2
  exit 1
fi

if ! grep -Fq "must not appear inside \`chapters[*].encounter_ids\`" "$CONTRACTS_DOC" || ! grep -Fq "starter_encounter_id" "$CONTRACTS_DOC"; then
  echo "[chapter-linear-unlock-consistency] Implementation contracts missing starter exclusion rule" >&2
  exit 1
fi

if ! grep -Fq "must not appear in any \`chapters[*].encounter_ids\`" "$EARLY_LOCK_DOC" || ! grep -Fq "starter_encounter_id" "$EARLY_LOCK_DOC"; then
  echo "[chapter-linear-unlock-consistency] Early content lock missing starter exclusion rule" >&2
  exit 1
fi

echo "[chapter-linear-unlock-consistency] PASS"
