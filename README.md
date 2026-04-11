# Words 'n Wands!

## What this is

Words 'n Wands! is an Android-first, portrait-first magical word battle game where players swipe valid words to cast spells.
This repository is still docs-first, but it is no longer docs-only: shared packages contain working battle, validation, and content-loading pieces, and `apps/mobile` now ships a first playable vertical slice wired into those shared packages.
The current app slice is a first playable local encounter loop covering starter flow, an active encounter board, result routing, and a minimal Home continuation surface.
Current implementation note: it still uses tap-chained board input and app-local bundled-content wiring while canonical swipe input, SQLite-backed save/restore, and the fuller mobile app architecture are still in progress.
The main goal right now is to keep gameplay rules, UX flow, and implementation contracts aligned.
Treat focused docs in `docs/` as product truth; this file is a fast entry point.
For contributor execution rules and scope discipline, read `AGENTS.md`.

## Quick start

Use `pnpm` only.

```bash
pnpm install --frozen-lockfile
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

If scripts are not scaffolded yet, follow `docs/engineering-standards.md` section 5.1 and validate docs consistency manually.

If local setup or dependency installation behaves unexpectedly, use [docs/development-setup-and-dependency-troubleshooting.md](docs/development-setup-and-dependency-troubleshooting.md) as the canonical recovery guide.

## Repo map

- `AGENTS.md` — contributor operating rules and doc-routing matrix.
- `docs/` — focused source-of-truth documents by domain.
- `README.md` — short orientation and command entry point.
- `scripts/` — validation/utilities when present.
- Future app/workspace packages should follow boundaries in `docs/technical-architecture.md`.

## Source-of-truth docs

Start with `docs/engineering-standards.md` for coding and validation contract.
Start with `docs/development-setup-and-dependency-troubleshooting.md` for local bootstrap, dependency install, or workspace-command troubleshooting.
Then read only the focused docs for your task area (battle rules, RNG, UX, economy, etc.) using `AGENTS.md` section 2.
Implementation and runtime boundaries: `docs/implementation-contracts.md` + `docs/technical-architecture.md`.
Gameplay and validation semantics: `docs/game-rules.md` + `docs/word-validation-and-element-rules.md`.
Encounter generation governance: use `docs/structured-encounter-generation.md` for product policy and `docs/encounter-generator-implementation.md` for engineering/tool construction details.
Milestone-specific required behavior docs: `docs/first-shippable-content-pack.md` (M2 external-quality content readiness), `docs/challenge-and-boss-layer.md` (M3 challenge/boss behavior constraints), and `docs/async-competition-rules.md` (M5 async competition policy).
When docs conflict, resolve deliberately and document the decision with the conflict template from `AGENTS.md`.

## Reading paths

- **60-second overview** (`README.md`): project purpose + core constraints (docs-first phase, deterministic/fair gameplay focus, Android-first foundation).
- **Contributor quick path** (`README.md`, `AGENTS.md`, `docs/engineering-standards.md`): execution rules, doc-routing discipline, and canonical validation command contract.
- **Local setup / dependency recovery path** (`README.md`, `docs/engineering-standards.md`, `docs/development-setup-and-dependency-troubleshooting.md`): install flow, Windows workspace-runner caveats, env troubleshooting, and dependency recovery.
- **Release-readiness/content polish path** (`docs/first-shippable-content-pack.md`, `docs/milestone-implementation-plan.md`, `docs/milestone-locked-constants.md`): external-quality content composition, milestone ship checks, and locked runtime constants.
- **Deep reference** (read only the area you are changing): `docs/game-rules.md`, `docs/word-validation-and-element-rules.md`, `docs/screens-and-session-flow.md`, `docs/implementation-contracts.md`, `docs/randomness-and-seeding-contract.md`, `docs/technical-architecture.md`, `docs/milestone-implementation-plan.md`, `docs/first-shippable-content-pack.md`, `docs/challenge-and-boss-layer.md`, `docs/async-competition-rules.md`.

## Clean-room implementation path

This is the recommended order for implementing the first working slice from zero.

1. [identity](docs/project-identity.md)
2. [game rules](docs/game-rules.md)
3. [screen/session flow](docs/screens-and-session-flow.md)
4. [word validation](docs/word-validation-and-element-rules.md)
5. [creature/encounter rules](docs/creature-and-encounter-rules.md)
6. [technical architecture](docs/technical-architecture.md)
7. [implementation contracts](docs/implementation-contracts.md)
8. [milestone locks](docs/milestone-locked-constants.md)
9. [first shippable content pack](docs/first-shippable-content-pack.md)

## Full implementation reference path (start-to-finish)

If your goal is to build the complete game shape described in docs (not just the first playable slice), use this path in order and follow milestone activation gates:

1. [project identity](docs/project-identity.md)
2. [milestone implementation plan](docs/milestone-implementation-plan.md)
3. [engineering standards](docs/engineering-standards.md)
4. [game rules](docs/game-rules.md)
5. [screen/session flow](docs/screens-and-session-flow.md)
6. [word validation + elements](docs/word-validation-and-element-rules.md)
7. [creature + encounter rules](docs/creature-and-encounter-rules.md)
8. [randomness + seeding contract](docs/randomness-and-seeding-contract.md)
9. [technical architecture](docs/technical-architecture.md)
10. [implementation contracts](docs/implementation-contracts.md)
11. [milestone-locked constants](docs/milestone-locked-constants.md)
12. [encounter balance framework](docs/encounter-balance-framework.md)
13. [first shippable content pack](docs/first-shippable-content-pack.md)
14. [content pipeline + liveops](docs/content-pipeline-and-liveops.md)
15. [challenge + boss layer](docs/challenge-and-boss-layer.md)
16. [hint + clue mechanics](docs/hint-and-clue-mechanics.md)
17. [async competition rules](docs/async-competition-rules.md)
18. [progression economy + monetization](docs/progression-economy-and-monetization.md)
19. [analytics + experimentation](docs/analytics-and-experimentation.md)

For visuals and motion work, include [audio-visual style guide](docs/audio-visual-style-guide.md) and [accessibility/localization/device support](docs/accessibility-localization-and-device-support.md) before implementation.

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
