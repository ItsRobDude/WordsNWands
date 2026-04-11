# AGENTS.md — AI Contributor Operating Guide

This file defines **how contributors should work**, not full product design.

For high-level product identity and experience goals, use `README.md`.
For domain truth (battle rules, validation, encounters, UX flow, architecture), use focused docs in `docs/`.

## Quick Start (read before coding)
- Combat math / damage / turn order: open `docs/implementation-contracts.md` first, then `docs/game-rules.md`.
- UX timing / input lock / interaction flow: open `docs/screens-and-session-flow.md` first.
- RNG parity / seed determinism: open `docs/randomness-and-seeding-contract.md` first.
- Rewards / stars / progression economy: open `docs/progression-economy-and-monetization.md` first.
- Word validation / normalization / element tagging: open `docs/word-validation-and-element-rules.md` first.

## Why this file is short

Short guidance is easier to keep accurate. A compact operating guide reduces copy drift, keeps responsibilities clear, and prevents stale narrative from competing with source-of-truth docs.

---

## 1) Contributor operating rules

### Context Conservation (Read-Only-What-You-Need)
- Do NOT read the entire `docs/` folder.
- Use the routing matrix in Section 2 to fetch only the 1-3 files strictly required for your immediate task.

### Source-of-truth order
1. Focused docs for the touched area
2. Implementation contracts and engineering/process docs
3. `README.md` and this file
4. Code

Rules:
- Do not silently reinvent product behavior in code.
- If docs and code disagree, resolve deliberately and document the choice.
- If a focused doc is more specific than `README.md`, follow the focused doc.

### Scope discipline (default)
- Make the **smallest safe slice** that solves the requested task.
- Do not widen scope into future milestones unless explicitly requested.
- Do not add backend/social/monetization/live-ops complexity to unrelated tasks.
- Do not expose unfinished features as if complete.
- Prefer clear, boring, maintainable implementations over clever abstractions.

### Working conventions
- Use **pnpm only**.
- Keep naming explicit and readable.
- Keep gameplay truth out of presentation-only code.
- Document assumptions when docs are incomplete; choose conservative behavior.

### Required conflict template (when docs disagree)
Include this in the PR description or final report (per `docs/engineering-standards.md` Appendix A):
- **Conflicting docs/sections:** `<doc path + section>` vs `<doc path + section>`
- **Chosen interpretation:** `<interpretation used in this change>`
- **Why this preserves fairness/trust:** `<short rationale>`
- **Follow-up doc updates needed:** `<docs/sections to reconcile>`

---

## 2) Doc-routing matrix (read only what you need)

Baseline for all code tasks:
- `README.md`
- this file
- `docs/engineering-standards.md`

| If the task involves... | Also read... |
| --- | --- |
| battle rules, move budget, win/loss rules, damage formula, turn flow, collapse/refill order, special tiles | `docs/game-rules.md`, `docs/word-validation-and-element-rules.md` |
| word acceptance, normalization, repeated-word policy, dictionary scope, element tagging, Arcane fallback | `docs/word-validation-and-element-rules.md` |
| creature HP, weaknesses/resistances, countdowns, spells, tile states, encounter balance | `docs/creature-and-encounter-rules.md`, `docs/game-rules.md` |
| screen layout, swipe interaction, onboarding, battle HUD, results, pause/resume, animation order | `docs/screens-and-session-flow.md`; add `docs/audio-visual-style-guide.md` and `docs/accessibility-localization-and-device-support.md` if visuals/motion/sound/haptics are involved |
| battle session save/restore, local persistence, content loading, runtime data ownership, architecture boundaries | `docs/technical-architecture.md`, `docs/implementation-contracts.md` |
| RNG, board generation, refill logic, or Spark Shuffle determinism | `docs/randomness-and-seeding-contract.md`, `docs/implementation-contracts.md` |
| numeric tuning, HP/move derivation, fail-rate targeting, or content shippability gates | `docs/encounter-balance-framework.md` |
| M1-M2 version pins, authorized content bundles, or deterministic fixtures | `docs/early-content-lock.md`, `docs/milestone-locked-constants.md` |
| player-facing semantic text, exact UI copy, names, labels, tone rules | `docs/copy-locks-and-voice-guide.md` if it exists; otherwise use `README.md` and conservative tone assumptions |
| challenge schedules, daily/weekly structure, content release flow, encounter curation | `docs/content-pipeline-and-liveops.md`, `docs/milestone-implementation-plan.md`, `docs/challenge-and-boss-layer.md`; add `docs/encounter-generator-implementation.md` when building or modifying encounter-generation tooling (policy remains in `docs/structured-encounter-generation.md`) |
| first external-quality content slice, ship-no-apology criteria, M2 content readiness gates | `docs/first-shippable-content-pack.md` |
| hints, rewards, ads, purchases, cosmetics, boosters, retention systems | `docs/progression-economy-and-monetization.md` |
| sound, haptics, visual tone, icon style, typography, spacing, animation behavior | `docs/audio-visual-style-guide.md`, `docs/accessibility-localization-and-device-support.md` |
| analytics, telemetry, experiments, funnel measurement | `docs/analytics-and-experimentation.md` |
| async competition fairness policy, constraints, and result-comparison rules | `docs/async-competition-rules.md`, `docs/analytics-and-experimentation.md` |
| deciding what should be built next | `docs/milestone-implementation-plan.md` |

If a task does not touch one of these areas, do not pull in extra docs.

---

## 3) Validation and reporting contract

Validation source of truth:
- `docs/engineering-standards.md`, section **5.1 Operational Validation Commands (Contributor Contract)**.
- Damage Model Consistency: Run `./scripts/check-damage-model-consistency.sh` if touching combat math, formulas, or balance documents.

Use the canonical commands from that section (`pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm check` when available) and follow milestone-specific requirements.

Before finishing:
1. Run relevant checks for the files you touched.
2. Verify the exact flow you changed.
3. Fix obvious issues introduced by your change.
4. Confirm scope stayed narrow and aligned with docs.

Final report must include:
- what changed
- assumptions made
- commands run
- intentionally deferred work
- remaining risks/cleanup

---

## 4) Forbidden moves

Do not:
- invent undocumented battle or validation rules
- hide gameplay truth inside UI-only or animation-only code
- silently change element semantics, collapse/refill semantics, or encounter behavior
- use runtime AI for battle-critical meaning decisions
- hardcode creature logic into presentation components
- add auth/online requirements to core solo play without explicit direction
- introduce ads/monetization interruptions in active solving
- add pay-to-win mechanics or fairness-breaking monetization
- publish unreviewed generated content as canonical live content
- duplicate core gameplay truth across modules carelessly
- add heavy dependencies without clear justification
- optimize spectacle over readability, determinism, and trust
- let analytics/experiments redefine core gameplay semantics
