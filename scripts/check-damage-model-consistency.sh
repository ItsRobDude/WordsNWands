#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CANONICAL_DOC="$ROOT_DIR/docs/implementation-contracts.md"
GAME_RULES_DOC="$ROOT_DIR/docs/game-rules.md"
BALANCE_DOC="$ROOT_DIR/docs/encounter-balance-framework.md"

EXPECTED_VERSION="damage_model_v1"
EXPECTED_FINGERPRINT="DMV1|base=8+3*(L-3)+max(0,L-5)|matchup=1.5,1.0,0.7,1.0|wand=1.25|soot=0.75|round=half_up|min=1"

has_text() {
  local pattern="$1"
  local file="$2"

  if command -v rg >/dev/null 2>&1; then
    rg -Fq "$pattern" "$file"
  else
    grep -Fq "$pattern" "$file"
  fi
}

for doc in "$CANONICAL_DOC" "$GAME_RULES_DOC" "$BALANCE_DOC"; do
  if ! has_text "$EXPECTED_FINGERPRINT" "$doc"; then
    echo "[damage-model-consistency] Missing or mismatched fingerprint in ${doc#$ROOT_DIR/}" >&2
    exit 1
  fi

done

if ! has_text "damage_model_version = 'damage_model_v1'" "$CANONICAL_DOC"; then
  echo "[damage-model-consistency] Canonical doc missing version lock: ${CANONICAL_DOC#$ROOT_DIR/}" >&2
  exit 1
fi

if ! has_text "$EXPECTED_VERSION" "$GAME_RULES_DOC" || ! has_text "$EXPECTED_VERSION" "$BALANCE_DOC"; then
  echo "[damage-model-consistency] Non-canonical docs must reference ${EXPECTED_VERSION}" >&2
  exit 1
fi

if ! has_text "Section 5.2.1, “Damage Model v1 (canonical)”" "$GAME_RULES_DOC"; then
  echo "[damage-model-consistency] Game rules doc must reference canonical section 5.2.1" >&2
  exit 1
fi

if ! has_text "Section 5.2.1, “Damage Model v1 (canonical)”" "$BALANCE_DOC"; then
  echo "[damage-model-consistency] Encounter balance doc must reference canonical section 5.2.1" >&2
  exit 1
fi

echo "[damage-model-consistency] PASS"
