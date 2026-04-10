# AGENTS.md — AI Contributor Operating Guide

This file defines **how contributors should work**. For product design, use `README.md`. For domain truth, use `docs/`.

## 1) Contributor Operating Rules

### Source-of-Truth Order
1. Focused docs for the touched area (e.g., `docs/game-rules.md`).
2. Implementation contracts and engineering/process docs.
3. `README.md` and this file.
4. Code.

*Rule: Do not silently reinvent product behavior. If docs and code disagree, resolve deliberately and document the choice.*

### Scope Discipline
- Make the **smallest safe slice** that solves the requested task.
- Do not widen scope into future milestones unless explicitly requested.
- Prefer clear, maintainable implementations over clever abstractions.

### Working Conventions
- Use **pnpm only**.
- Keep naming explicit and readable.
- Keep gameplay truth out of presentation-only code.
- Document assumptions when docs are incomplete; choose conservative behavior.

### Required Conflict Template (when docs disagree)
Include in PR/final report:
- **Conflicting docs:** `<doc path>` vs `<doc path>`
- **Chosen interpretation:** `<interpretation used>`
- **Why this preserves fairness:** `<short rationale>`
- **Follow-up doc updates needed:** `<docs to reconcile>`

---

## 2) Doc-Routing Matrix

Baseline for all code tasks: `README.md`, this file, `docs/engineering-standards.md`.

| Task Domain | Read Also |
| --- | --- |
| Battle flow, damage, board | `docs/game-rules.md`, `docs/word-validation-and-element-rules.md` |
| Words, elements, Arcane | `docs/word-validation-and-element-rules.md` |
| Creatures, balance | `docs/creature-and-encounter-rules.md`, `docs/game-rules.md` |
| UI/UX, onboarding, flow | `docs/screens-and-session-flow.md` |
| Architecture, save state | `docs/technical-architecture.md`, `docs/implementation-contracts.md` |
| UI copy, tone | `docs/copy-locks-and-voice-guide.md` (or `README.md` tone rules) |
| Live-ops, curation | `docs/content-pipeline-and-liveops.md`, `docs/milestone-implementation-plan.md` |
| Progression, monetization | `docs/progression-economy-and-monetization.md` |
| A/V style, a11y, haptics | `docs/audio-visual-style-guide.md`, `docs/accessibility-localization-and-device-support.md` |
| Analytics | `docs/analytics-and-experimentation.md` |
| Build milestones | `docs/milestone-implementation-plan.md` |

---

## 3) Validation and Reporting Contract

Source of truth: `docs/engineering-standards.md`, section **5.1 Operational Validation Commands**.

Use canonical commands (`pnpm format`, `lint`, `typecheck`, `test`, `build`, `check`).

Before finishing:
1. Run relevant checks for touched files.
2. Verify the exact flow changed.
3. Fix obvious introduced issues.
4. Confirm scope stayed narrow.

Final report must include: what changed, assumptions made, commands run, deferred work, remaining risks.

---

## 4) Forbidden Moves

Do not:
- Invent undocumented battle/validation rules.
- Hide gameplay truth inside UI/animation code.
- Silently change element or collapse semantics.
- Use runtime AI for battle-critical meaning decisions.
- Hardcode creature logic into presentation components.
- Add auth/online requirements to core solo play.
- Introduce ads/monetization interruptions in active play.
- Add heavy dependencies without clear justification.
- Let analytics redefine core gameplay semantics.
