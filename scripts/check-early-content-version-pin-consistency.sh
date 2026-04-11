#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

EARLY_LOCK_DOC="$ROOT_DIR/docs/early-content-lock.md"
PIPELINE_DOC="$ROOT_DIR/docs/content-pipeline-and-liveops.md"
CONTRACTS_DOC="$ROOT_DIR/docs/implementation-contracts.md"

EXPECTED_CONTENT_VERSION="content_m2_launch_v1"
EXPECTED_VALIDATION_VERSION="val_snapshot_m2_launch_v1"
EXPECTED_BATTLE_RULES_VERSION="battle_rules_m2_launch_v1"
EXPECTED_BOARD_GENERATOR_VERSION="board_generator_m2_launch_v1"
EXPECTED_PROGRESSION_VERSION="progression_m2_chapter_linear_v1"

for required in \
  "$EXPECTED_CONTENT_VERSION" \
  "$EXPECTED_VALIDATION_VERSION" \
  "$EXPECTED_BATTLE_RULES_VERSION" \
  "$EXPECTED_BOARD_GENERATOR_VERSION" \
  "$EXPECTED_PROGRESSION_VERSION"; do
  if ! grep -Fq "$required" "$EARLY_LOCK_DOC"; then
    echo "[early-content-version-pin-consistency] Missing pin '$required' in docs/early-content-lock.md" >&2
    exit 1
  fi

done

for required in \
  "$EXPECTED_CONTENT_VERSION" \
  "$EXPECTED_VALIDATION_VERSION" \
  "$EXPECTED_BATTLE_RULES_VERSION" \
  "$EXPECTED_BOARD_GENERATOR_VERSION"; do
  if ! grep -Fq "$required" "$PIPELINE_DOC"; then
    echo "[early-content-version-pin-consistency] Missing pin '$required' in docs/content-pipeline-and-liveops.md" >&2
    exit 1
  fi
done

if ! grep -Fq "For active M1-M2 content, runtime pins must match docs/early-content-lock.md section 1 canonical versions exactly" "$CONTRACTS_DOC"; then
  echo "[early-content-version-pin-consistency] Implementation contracts must include explicit M1-M2 early-lock pin alignment rule" >&2
  exit 1
fi

if ! grep -Fq "version_pin_mismatch" "$CONTRACTS_DOC"; then
  echo "[early-content-version-pin-consistency] Implementation contracts must define version_pin_mismatch failure mode" >&2
  exit 1
fi

echo "[early-content-version-pin-consistency] PASS"
