# Words 'n Wands!

## What this is
Words 'n Wands! is an Android-first, portrait-first magical word battle game where players swipe valid words to cast spells.
This repository is currently in a docs-first, pre-vertical-slice planning phase.
The main goal right now is to keep gameplay rules, UX flow, and implementation contracts aligned.
Treat focused docs in `docs/` as product truth; this file is a fast entry point.
For contributor execution rules and scope discipline, read `AGENTS.md`.

## Quick start
Use `pnpm` only.
```bash
pnpm install
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```
If scripts are not scaffolded yet, follow `docs/engineering-standards.md` section 5.1 and validate docs consistency manually.

## Repo map
- `AGENTS.md` — contributor operating rules and doc-routing matrix.
- `docs/` — focused source-of-truth documents by domain.
- `README.md` — short orientation and command entry point.
- `scripts/` — validation/utilities when present.
- Future app/workspace packages should follow boundaries in `docs/technical-architecture.md`.

## Source-of-truth docs
Start with `docs/engineering-standards.md` for coding and validation contract.
Then read only the focused docs for your task area (battle rules, RNG, UX, economy, etc.) using `AGENTS.md` section 2.
Implementation and runtime boundaries: `docs/implementation-contracts.md` + `docs/technical-architecture.md`.
Gameplay and validation semantics: `docs/game-rules.md` + `docs/word-validation-and-element-rules.md`.
Encounter generation governance: use `docs/structured-encounter-generation.md` for product policy and `docs/encounter-generator-implementation.md` for engineering/tool construction details.
Milestone-specific required behavior docs: `docs/first-shippable-content-pack.md` (M2 external-quality content readiness), `docs/challenge-and-boss-layer.md` (M3 challenge/boss behavior constraints), and `docs/async-competition-rules.md` (M5 async competition policy).
When docs conflict, resolve deliberately and document the decision with the conflict template from `AGENTS.md`.


## Reading paths

- **60-second overview** (`README.md`): project purpose + core constraints (docs-first phase, deterministic/fair gameplay focus, Android-first foundation).
- **Clean-room implementation path**: If you are implementing from zero, see the "Clean-room implementation path" section at the top of `AGENTS.md` for the exact reading order.
- **Contributor quick path** (`README.md`, `AGENTS.md`, `docs/engineering-standards.md`): execution rules, doc-routing discipline, and canonical validation command contract.
- **Release-readiness/content polish path** (`docs/first-shippable-content-pack.md`, `docs/milestone-implementation-plan.md`, `docs/milestone-locked-constants.md`): external-quality content composition, milestone ship checks, and locked runtime constants.
- **Deep reference** (read only the area you are changing): `docs/game-rules.md`, `docs/word-validation-and-element-rules.md`, `docs/screens-and-session-flow.md`, `docs/implementation-contracts.md`, `docs/randomness-and-seeding-contract.md`, `docs/technical-architecture.md`, `docs/milestone-implementation-plan.md`, `docs/first-shippable-content-pack.md`, `docs/challenge-and-boss-layer.md`, `docs/async-competition-rules.md`.



## Contribution flow
1. Read `AGENTS.md` and `docs/engineering-standards.md`.
2. Pull only the 1–3 focused docs needed for the task.
3. Make the smallest safe change; avoid widening scope.
4. Run relevant validation commands from section 5.1 (`pnpm ...`).
5. Report changes, assumptions, commands run, deferred work, and risks.

## Non-goals
- Do not invent undocumented gameplay, combat math, or word-validation behavior.
- Do not hide gameplay truth in UI-only code.
- Do not add monetization/live-ops/social complexity to unrelated tasks.
- Do not add heavy dependencies without clear justification.
- Do not treat unfinished ideas as shipped behavior.
- Do not prioritize cleverness over readability, determinism, and player trust.

The product philosophy, identity framing, and design intent have been moved into a dedicated appendix document to keep this README focused on operational guidance.
Read `docs/project-identity.md` for the full vision, design pillars, and identity boundaries that should shape product decisions.
