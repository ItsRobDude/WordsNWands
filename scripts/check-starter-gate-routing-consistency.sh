#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SCREENS_DOC="$ROOT_DIR/docs/screens-and-session-flow.md"
CONTRACTS_DOC="$ROOT_DIR/docs/implementation-contracts.md"
MILESTONE_DOC="$ROOT_DIR/docs/milestone-implementation-plan.md"

EXPECTED_GATE_FIELD="has_completed_starter_encounter"
EXPECTED_GATE_TRUE="has_completed_starter_encounter = 1"
EXPECTED_GATE_FALSE="has_completed_starter_encounter = 0"

if ! grep -Fq "### Canonical starter-gate routing rule" "$SCREENS_DOC"; then
  echo "[starter-gate-routing-consistency] Missing canonical starter-gate routing section in docs/screens-and-session-flow.md" >&2
  exit 1
fi

for required in "$EXPECTED_GATE_TRUE" "$EXPECTED_GATE_FALSE"; do
  if ! grep -Fq "$required" "$SCREENS_DOC"; then
    echo "[starter-gate-routing-consistency] Missing starter-gate truth string '$required' in docs/screens-and-session-flow.md" >&2
    exit 1
  fi

  if ! grep -Fq "$required" "$CONTRACTS_DOC"; then
    echo "[starter-gate-routing-consistency] Missing starter-gate truth string '$required' in docs/implementation-contracts.md" >&2
    exit 1
  fi
done

if ! grep -Fq "launch and Home routing must treat" "$CONTRACTS_DOC" || ! grep -Fq "$EXPECTED_GATE_FIELD" "$CONTRACTS_DOC"; then
  echo "[starter-gate-routing-consistency] Implementation contracts must define launch/Home routing on $EXPECTED_GATE_FIELD" >&2
  exit 1
fi

if ! grep -Fq "startup routing integration tests must explicitly assert starter-gate truth using \`$EXPECTED_GATE_FIELD\`" "$MILESTONE_DOC"; then
  echo "[starter-gate-routing-consistency] Milestone plan must include starter-gate startup-routing integration-test requirement" >&2
  exit 1
fi

echo "[starter-gate-routing-consistency] PASS"
