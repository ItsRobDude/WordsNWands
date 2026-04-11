# @words-n-wands/game-rules

Minimal workspace package scaffold for shared battle-truth logic.

## Intended ownership boundary
- Own canonical gameplay rules and encounter state transitions.
- Stay UI-agnostic and deterministic.
- Do **not** put this logic in presentation-layer code inside `apps/mobile` components.

See `docs/technical-architecture.md` for the architecture contract.
