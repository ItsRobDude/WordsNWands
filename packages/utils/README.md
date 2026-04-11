# @words-n-wands/utils

Minimal workspace package scaffold for generic shared helpers.

## Intended ownership boundary
- Host reusable utilities that are truly generic.
- Keep gameplay truth in `@words-n-wands/game-rules` and validation truth in
  `@words-n-wands/validation`.
- Do **not** move battle semantics into presentation-layer code.

See `docs/technical-architecture.md` for the architecture contract.
