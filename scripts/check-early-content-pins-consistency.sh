#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

EARLY_CONTENT_LOCK_DOC="$ROOT_DIR/docs/early-content-lock.md"
FIRST_SHIPPABLE_DOC="$ROOT_DIR/docs/first-shippable-content-pack.md"
CONTENT_PIPELINE_DOC="$ROOT_DIR/docs/content-pipeline-and-liveops.md"
VALIDATION_SNAPSHOT_DOC="$ROOT_DIR/docs/validation-snapshot-bootstrap-playbook.md"

EXPECTED_CONTENT_PIN="content_m2_launch_v1"
EXPECTED_VALIDATION_PIN="val_snapshot_m2_launch_v1"

for doc in "$EARLY_CONTENT_LOCK_DOC" "$FIRST_SHIPPABLE_DOC" "$CONTENT_PIPELINE_DOC" "$VALIDATION_SNAPSHOT_DOC"; do
  if ! grep -Fq "$EXPECTED_CONTENT_PIN" "$doc"; then
    echo "[early-content-pins-consistency] Missing expected content pin ($EXPECTED_CONTENT_PIN) in ${doc#$ROOT_DIR/}" >&2
    exit 1
  fi

  if ! grep -Fq "$EXPECTED_VALIDATION_PIN" "$doc"; then
    echo "[early-content-pins-consistency] Missing expected validation pin ($EXPECTED_VALIDATION_PIN) in ${doc#$ROOT_DIR/}" >&2
    exit 1
  fi
done

echo "[early-content-pins-consistency] PASS"
