#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"

failed=0

for script in "$SCRIPTS_DIR"/check-*.sh; do
  if [[ "$script" == "$BASH_SOURCE" ]]; then
    continue
  fi

  if [[ -x "$script" ]]; then
    echo "Running $(basename "$script")..."
    if ! "$script"; then
      failed=1
    fi
  fi
done

if [[ "$failed" -eq 1 ]]; then
  echo "One or more doc consistency checks failed." >&2
  exit 1
fi

echo "All doc consistency checks passed."
