#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CANONICAL_DOC="$ROOT_DIR/docs/implementation-contracts.md"
GAME_RULES_DOC="$ROOT_DIR/docs/game-rules.md"
BALANCE_DOC="$ROOT_DIR/docs/encounter-balance-framework.md"

EXPECTED_VERSION="damage_model_v1"
EXPECTED_FINGERPRINT="DMV1|base=8+3*(L-3)+max(0,L-5)|matchup=1.5,1.0,0.7,1.0|wand=1.25|soot=0.75|round=half_up|min=1"

for doc in "$CANONICAL_DOC" "$GAME_RULES_DOC" "$BALANCE_DOC"; do
  if ! grep -Fq "$EXPECTED_FINGERPRINT" "$doc"; then
    echo "[damage-model-consistency] Missing or mismatched fingerprint in ${doc#$ROOT_DIR/}" >&2
    exit 1
  fi

done

if ! grep -Fq "damage_model_version = 'damage_model_v1'" "$CANONICAL_DOC"; then
  echo "[damage-model-consistency] Canonical doc missing version lock: ${CANONICAL_DOC#$ROOT_DIR/}" >&2
  exit 1
fi

if ! grep -Fq "$EXPECTED_VERSION" "$GAME_RULES_DOC" || ! grep -Fq "$EXPECTED_VERSION" "$BALANCE_DOC"; then
  echo "[damage-model-consistency] Non-canonical docs must reference ${EXPECTED_VERSION}" >&2
  exit 1
fi

if ! grep -Fq "Section 5.2.1, “Damage Model v1 (canonical)”" "$GAME_RULES_DOC"; then
  echo "[damage-model-consistency] Game rules doc must reference canonical section 5.2.1" >&2
  exit 1
fi

if ! grep -Fq "Section 5.2.1, “Damage Model v1 (canonical)”" "$BALANCE_DOC"; then
  echo "[damage-model-consistency] Encounter balance doc must reference canonical section 5.2.1" >&2
  exit 1
fi

echo "[damage-model-consistency] PASS"
