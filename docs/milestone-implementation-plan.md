# Words 'n Wands! Milestone Implementation Plan

This document defines the recommended order for building Words 'n Wands!.

Its purpose is to turn Words 'n Wands!’ product vision, gameplay rules, screen behavior, validation rules, creature rules, and technical direction into a practical implementation sequence.

This is the build-order source of truth.

It should answer:

- what gets built first
- what is intentionally delayed
- what the first real vertical slice includes
- what must exist before a milestone starts
- what “done” means for each milestone
- what tests and manual checks are required before calling a milestone complete

This document is intentionally biased toward:

- product truth
- player trust
- maintainability
- real Android usability
- controlled expansion
- solo-builder realism
- AI-assisted development discipline

over flashy breadth, premature live-service complexity, or architecture cosplay.

---

## Status Note

These milestone definitions are target completion criteria, not a claim that the repo has already reached that milestone in every layer.

Current repo status as of 2026-04-11:

- root workspace/setup tooling is in the Milestone 0 foundation shape
- shared packages (`packages/game-rules`, `packages/validation`, `packages/content`) contain the main implemented Milestone 1 gameplay, validation, and content-loading logic
- `apps/mobile` now contains a first playable local encounter slice wired into those shared packages
- the current mobile slice still does not satisfy the full Milestone 1 app/runtime definition of done because final player-facing support for both trace/swipe input and tap-selected casting, SQLite-backed save/restore, and the fuller mobile app architecture are still in progress

When contributors compare code to this plan, they should treat missing app-layer work as not-yet-built milestone scope unless code or docs explicitly claim the feature is already shipped.

---

## 1. Core Build Philosophy

Words 'n Wands! should be built in a controlled sequence.

Important rules:

- do not try to build the whole game at once
- do not let content breadth outrun battle trust
- do not let UI polish outrun board clarity and session reliability
- do not let backend, social, or monetization complexity outrun proof that the core battle loop is actually fun
- do not expose fake unfinished systems as if they are real
- do not make the repo harder to maintain than the game is worth

Words 'n Wands! should aim to become:

1. understandable
2. fun
3. fair
4. stable
5. satisfying to repeat
6. broader later

That order matters.

### Solo-builder realism rule
This project is being built with heavy AI help and limited human implementation bandwidth.

That means the correct build strategy is:

- fewer systems
- clearer rules
- stronger docs
- tighter milestones
- less speculative scaffolding

not bigger ambition in code before the fundamentals are proven.

---

## 2. Current Source-of-Truth Docs

Before serious feature work begins, Words 'n Wands! should have a usable source-of-truth doc set.

### Already required for the core product shape
- `README.md`
- `AGENTS.md`
- `docs/game-rules.md`
- `docs/word-validation-and-element-rules.md`
- `docs/creature-and-encounter-rules.md`
- `docs/encounter-balance-framework.md`
- `docs/screens-and-session-flow.md`
- `docs/milestone-implementation-plan.md`

### Required before deeper implementation layers begin
These docs may be created just before the milestone that needs them, but they must exist before serious work starts in that area:

- `docs/technical-architecture.md`
- `docs/engineering-standards.md`
- `docs/implementation-contracts.md`
- `docs/milestone-locked-constants.md`
- `docs/audio-visual-style-guide.md`
- `docs/accessibility-localization-and-device-support.md`
- `docs/content-pipeline-and-liveops.md`
- `docs/progression-economy-and-monetization.md`
- `docs/analytics-and-experimentation.md`
- `docs/hint-and-clue-mechanics.md` (required before enabling any player-invoked clue surface in Milestone 3+)

If a milestone depends on a missing doc, create or finalize that doc before serious coding starts for that milestone.

### Validation command contract
Use `docs/engineering-standards.md` section **"5.1 Operational Validation Commands (Contributor Contract)"** as the authoritative command list for:

- exact format/lint/typecheck/test/build command names
- milestone-required checks
- package-scoped versus repo-wide execution
- CI parity with local contributor validation

Milestone completion checks should reference that section directly rather than redefining command paths per milestone.

---

## 3. Build Strategy Summary

Words 'n Wands! should be built in this order:

1. repo and architecture foundation
2. one fully playable local encounter vertical slice
3. small creature roster and basic progression
4. optional challenge flavor and boss/event layering
5. content operations and balance hardening
6. async competition only if the solo loop proves strong
7. monetization and content expansion only if they fit the emotional contract
8. beta hardening and release readiness

The **battle loop is the product**.  
Everything else should support that.

---

## 4. Surface Availability Matrix

To prevent UI and routing drift, player-facing surfaces must follow this matrix until intentionally updated.

“Unavailable” means completely unavailable:

- no visible button
- no tab
- no route in normal player flow
- no placeholder shell
- no “coming soon” card clutter
- no reward hooks pretending the feature exists

| Milestone | Main Progression | Starter Encounter | Standard Encounters | Boss Encounters | Daily/Weekly Flavor | Creature Journal | Async Competition | Store / Monetization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Milestone 0** Foundation | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |
| **Milestone 1** Core Slice | Minimal | Available | One or two only | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |
| **Milestone 2** Roster + Progression | Available | Available if still useful | Available | Optional single simple boss only if truly real | Unavailable | Optional minimal if it has real content | Unavailable | Unavailable |
| **Milestone 3** Challenge Layer | Available | Available if retained | Available | Available if real | Available as optional side flavor | Available if truly populated | Unavailable | Unavailable |
| **Milestone 4** Content + Balance Ops | Available | Available if retained | Available | Available | Available | Available | Unavailable | Unavailable |
| **Milestone 5** Async Competition | Available | Available if retained | Available | Available | Available | Available | Available if truly playable | Unavailable |
| **Milestone 6+** Monetization / Expansion | Available | Available if retained | Available | Available | Available | Available | Available if justified | Available if justified |

### Early-surface discipline
For Milestones 0–2, the app should feel focused, not broad.

The player-facing flow should emphasize:

- first battle
- current battle
- result
- next battle

Anything else should stay hidden unless it is truly functional and useful.

### Scope lock — hidden bonus word discovery feature
Hidden bonus word discovery (encounter-bound themed lexicon selection + tiny meta reward) must remain **inactive and hidden** until the milestone that explicitly adopts it in scope docs.

Rules:

- do not silently enable it mid-milestone
- do not expose UI hints, reward hooks, or analytics events for it before milestone activation
- activation must be called out in milestone scope + definition-of-done updates in the same change

---

## 5. What Should Not Be Built Early

The following should be delayed until the core encounter loop is strong:

- real-time multiplayer
- chat-heavy social systems
- complex world map presentation
- live service event calendars
- large content CMS tooling
- battle pass layers
- multiple currencies
- heavy cosmetic systems
- gear/equipment systems
- deep story campaign scenes
- backend-required solo play
- store-first navigation
- runtime AI gameplay semantics
- advanced monetization systems
- polished marketing surfaces inside the app

Words 'n Wands! should first become excellent at:

- one understandable battle
- one trustworthy board
- one satisfying result
- one reliable resume flow
- one clear next step

---

## 6. Milestone 0 — Project Foundation

### Goal
Prepare the repo and app foundation so future work stays clean, boring, and maintainable.

### Scope
- establish docs structure
- establish monorepo/workspace direction
- establish pnpm-only command expectations
- establish Expo app direction
- establish TypeScript-first shared package boundaries
- establish local-first persistence direction
- establish battle-truth ownership boundaries
- establish initial content/validation package direction
- establish environment/config conventions
- establish initial asset folder shape

### This milestone is not about
- a real playable battle
- progression systems
- boss encounters
- daily/weekly content
- cloud sync
- async competition
- monetization
- elaborate art pipelines

### Docs required before Milestone 0 begins
- `README.md`
- `AGENTS.md`
- `docs/game-rules.md`
- `docs/word-validation-and-element-rules.md`
- `docs/creature-and-encounter-rules.md`
- `docs/screens-and-session-flow.md`
- `docs/milestone-implementation-plan.md`
- `docs/technical-architecture.md`
- `docs/engineering-standards.md`

### M0 bootstrap contract (required artifacts)
> **Normative (M0 required):** Milestone 0 is not complete unless these bootstrap artifacts exist and are the enforced defaults for all contributors.

- `package.json` at repo root **must exist** and own the root scripts contract (`format`, `lint`, `typecheck`, `test`, `build`, and `check` when present). It must exist in M0 so all contributors execute one canonical validation surface; deferred: deeper package-specific script fan-out where not yet needed.
- `pnpm-workspace.yaml` **must exist** at repo root. It must exist in M0 so workspace boundaries are explicit and reproducible in every install; deferred: adding future workspaces not needed for M0–M1 delivery.
- base TypeScript config file(s) shared by all workspaces **must exist** at repo root (for example `tsconfig.base.json` and root wiring config files). They must exist in M0 so type behavior is consistent from day one; deferred: stricter compiler policies and specialized per-package overrides.
- Expo app config under `apps/mobile` **must be locked to `app.config.ts`** as the single source of truth (no parallel `app.json`). It must exist in M0 so runtime/build metadata stays deterministic; deferred: multi-environment config overlays beyond immediate milestone needs.
- root test command ownership **must live in root `package.json` scripts**, and the current implemented shared-package path may use per-package `node:test` commands instead of a mandatory root `vitest.config.ts`. The command contract must remain predictable across contributors and CI; deferred: consolidating onto a root test config only if the repo actually adopts one.
- root lint/format/typecheck command ownership **must live in root `package.json` scripts** and delegate to workspace tasks as needed. It must exist in M0 so contributor validation has one stable entrypoint; deferred: advanced task orchestration tooling and CI-specific wrappers.

Minimum required first-pass file/folder tree for Milestone 0:

```text
apps/
  mobile/
    app.config.ts
packages/
  game-rules/
  validation/
  content/
  utils/
package.json
pnpm-workspace.yaml
tsconfig.base.json
```

### Definition of done
Milestone 0 is done when:

- the repo has an approved boring structure
- the intended stack is clearly documented
- there is no ambiguity about where battle logic, validation logic, and content logic should live
- the app shell direction is real, not implied
- the missing core engineering docs for Milestone 1 are no longer missing
- no one needs to guess how to start the vertical slice

---

## 7. Milestone 1 — Core Vertical Slice

### Goal
Prove that Words 'n Wands! is fun and trustworthy on one Android device before building breadth.

### Exact scope
Milestone 1 should include:

- startup / first-launch routing
- starter encounter or starter battle flow
- home screen with one clear primary action
- one fully playable standard encounter
- battle screen
- word trace and submission
- valid-word resolution
- invalid-word handling
- repeated-word rejection
- board collapse and refill
- damage calculation
- weakness/resistance interaction
- countdown behavior
- one creature spell
- dead-board detection and spark shuffle recovery
- result screen
- same-device autosave / resume
- restrained first-pass feedback and animation where practical

### What Milestone 1 should not include
- broad creature roster
- real daily/weekly challenge structure
- full creature journal
- boss system unless the vertical slice genuinely needs one
- cloud account linking
- social systems
- async competition
- monetization
- fake placeholder screens

### What exactly is in Milestone 1?
Milestone 1 is a **single-device, local-first, content-bundled vertical slice** that proves:

- the battle loop is understandable quickly
- the board feels fair
- element choice matters
- the creature countdown adds useful tension
- the app can save and restore an in-progress encounter
- the result flow feels satisfying

### Assist policy lock (M1)
Milestone 1 ships with **tip-only fail-soft** for repeated losses on the same encounter:

- enabled: optional encouragement + one-time strategy tip (non-mechanical)
- disabled: gentle board bias
- disabled: easier variant

### Docs required before Milestone 1 begins
- all Milestone 0 docs
- `docs/implementation-contracts.md`
- `docs/milestone-locked-constants.md`
- `docs/audio-visual-style-guide.md`
- `docs/accessibility-localization-and-device-support.md`

### Definition of done
Milestone 1 is done when:

- a fresh install launches cleanly
- the first-time flow creates a fast understandable early win
- the player can reach Home and start the main encounter flow
- one standard encounter is fully playable from start to result
- word validation and element behavior match the docs
- board collapse/refill behavior feels trustworthy
- dead-board recovery works
- countdown and creature spell behavior are visible and understandable
- the app resumes an active encounter correctly after backgrounding and process death
- the product already feels calm, readable, and magical
- no fake challenge, social, or store surfaces are exposed

### Required automated tests before Milestone 1 is complete
At minimum:

- unit tests for word normalization and validation lookup integration
- unit tests for repeated-word rejection
- unit tests for damage and matchup application
- unit tests for countdown updates
- unit tests for creature spell application
- unit tests for board collapse/refill
- unit tests for dead-board detection and spark shuffle recovery
- unit tests for win/loss transitions
- unit tests for encounter snapshot serialization and restoration
- integration tests for startup routing into first-time flow, Home, active encounter, and result state
- startup routing integration tests must explicitly assert starter-gate truth using `has_completed_starter_encounter`

### Required manual checks before Milestone 1 is complete
At minimum:

- first launch is understandable within the first minute
- the starter encounter teaches the loop without long text walls
- the board feels comfortable to use one-handed on a normal phone
- invalid-word feedback is calm and readable
- damage / multipliers / matchup feedback are understandable
- sound-off play is still fully understandable
- haptics-off play is still fully understandable
- process kill and reopen restores the correct encounter state
- the app does not feel cluttered or fake

---

## 8. Milestone 2 — Small Roster and Basic Progression

### Goal
Expand the game from one proof-of-concept encounter into a small but real repeatable loop.

### Scope
Active content-lock priority for M2:

- treat the first shippable slice as the active authored lock until additional chapters are explicitly authored and locked
- do not treat planned Chapter 2/3 breadth as active player-facing authored content until lock docs/artifacts are intentionally expanded
- use `docs/first-shippable-content-pack.md` as the active authored slice definition
- use `docs/early-content-lock.md` as the active lock constraints source

- several standard creatures
- tuned HP/countdown/spell variety
- basic progression structure
- next-encounter flow
- star ratings
- encounter history or completion tracking
- optional simple creature journal only if it has real content
- optional first simple boss only if it is truly real and justified

### What Milestone 2 should not include
- daily/weekly flavor systems unless they are real enough to matter
- async competition
- live content operations
- store surfaces
- deep story campaign systems
- heavy cosmetic systems
- fake world maps

### Progression surface direction
Milestone 2 may use:

- a simple encounter list
- a minimalist chapter view
- a lightweight progression path

Milestone 2 should not spend major effort on a decorative world map unless it clearly improves play.

### Assist policy lock (M2)
Milestone 2 enables the middle assist tier but keeps strongest assists off:

- enabled: optional encouragement + one-time strategy tip (non-mechanical)
- enabled: optional gentle board bias (next attempt only)
- disabled: easier variant

### Docs required before Milestone 2 begins
- all Milestone 1 docs
- `docs/technical-architecture.md` finalized enough for shared package boundaries
- `docs/implementation-contracts.md` expanded for progression and encounter records if needed
- `docs/milestone-locked-constants.md` reviewed and updated for M2 locks before implementation
- `docs/first-shippable-content-pack.md` required before implementation begins for first external-quality content slice and ship-no-apology readiness criteria
- `docs/early-content-lock.md` required before implementation begins as the active authored lock constraints source

### Definition of done
Milestone 2 is done when:

- the player can progress through the active authored first shippable slice without placeholder breadth assumptions
- creatures feel distinct without requiring a new rules language every fight
- difficulty ramps in a readable way
- star ratings and repeat play make sense
- progression feels lightweight rather than bloated
- the game begins to support “one more battle” behavior honestly
- any Chapter 2/3 expansion claims are deferred until those chapters are explicitly authored and lock-approved in scope/lock docs

### Required automated tests before Milestone 2 is complete
At minimum:

- encounter-definition validation tests
- creature spell coverage tests for the supported primitive library
- progression state tests
- result-history tests if implemented
- save/restore tests for progression-adjacent state where relevant

### Required manual checks before Milestone 2 is complete
At minimum:

- the difficulty ramp feels real but not punishing
- creatures remain readable across multiple encounters
- progression does not clutter the app
- a returning player can quickly understand what to do next
- the game still feels warm and family-friendly rather than stressful
- first external-quality shippable readiness checks must be evaluated against `docs/first-shippable-content-pack.md` as the acceptance framing source

---

## 9. Milestone 3 — Challenge Flavor and Boss/Event Layer

### Goal
Add optional side flavor and more standout content without redefining the core game.

### Scope
- daily and/or weekly side challenge entry
- curated optional challenge content
- clearer boss/event content support
- modest reward loops for optional challenge play
- challenge surfaces that remain secondary to main progression

### Important rule
Daily/weekly content must remain **side flavor**, not mandatory identity.

The player should still be able to treat the main encounter progression as the center of the game.

### Assist policy lock (M3+)
Milestone 3 and later use the full fail-soft contract:

- enabled: optional encouragement + one-time strategy tip (non-mechanical)
- enabled: optional gentle board bias (next attempt only)
- enabled: optional easier variant (next attempt only)

### What Milestone 3 should not include
- live-service complexity that requires a backend before it is justified
- manipulative streak pressure
- store-first UI
- fake event shells
- async competition unless separately approved into a later milestone

### Docs required before Milestone 3 begins
- all Milestone 2 docs
- `docs/content-pipeline-and-liveops.md`
- `docs/challenge-and-boss-layer.md` required before implementation begins for challenge/boss behavior constraints
- `docs/progression-economy-and-monetization.md` if rewards become meaningful enough to require clear boundaries
- `docs/analytics-and-experimentation.md` if challenge behavior is instrumented in a serious way

### Definition of done
Milestone 3 is done when:

- optional challenge content is real and understandable
- daily/weekly flavor does not overshadow the main game
- boss/event encounters feel special rather than baseline
- rewards remain small, fair, and non-mandatory
- missing side content does not make the player feel punished

---

## 10. Milestone 4 — Content Operations and Balance Hardening

### Goal
Make content expansion and tuning safer before the game broadens further.

### Scope
- creature/encounter content schema hardening
- stronger content validation
- better balancing workflows
- more robust playability checks
- optional lightweight content tools if truly needed
- refinement of progression and challenge data flow

### What Milestone 4 should not include
- broad backend dependence unless clearly justified
- giant custom CMS work
- large operational systems that exceed the game’s real content cadence

### Docs required before Milestone 4 begins
- all Milestone 3 docs
- `docs/content-pipeline-and-liveops.md` expanded enough to support repeatable content authoring/review
- `docs/implementation-contracts.md` updated for content definitions and versioning where needed
- `docs/encounter-balance-framework.md` finalized so authoring and validation tools can auto-check encounter balance and shippability

### Definition of done
Milestone 4 is done when:

- content addition is safer and less error-prone
- balance changes are easier to make deliberately
- battle fairness checks are stronger
- authored encounters can be automatically validated against documented balance guardrails and shippability thresholds
- the game can expand its creature roster without becoming fragile
- content operations still fit solo-builder reality

---

## 11. Milestone 5 — Async Competition Later

### Goal
Add asynchronous competition only if the solo battle loop has already proven strong.

### Scope
- async mirror-style competition direction
- equivalent seeded board / encounter comparisons
- fair result comparison model
- minimal social comparison surfaces
- optional leaderboard or friend-comparison behavior later if justified

### Important rule
Async competition must not redefine the solo battle loop or make solo play feel second-class.

### What Milestone 5 should not include
- real-time multiplayer
- coordination-heavy social systems
- chat systems
- broad PvP economy layers

### Docs required before Milestone 5 begins
- all Milestone 4 docs
- `docs/async-competition-rules.md` is required
- implementation details must remain consistent with `docs/implementation-contracts.md` section 8.7 post-M2 challenge/competition runtime contracts
- `docs/technical-architecture.md` updated for any online/service additions

### Definition of done
Milestone 5 is done when:

- async competition is truly playable
- fairness is preserved through reproducible encounter conditions
- social comparison remains lightweight
- the product still feels like Words 'n Wands!, not a generic PvP wrapper

---

## 12. Milestone 6 — Monetization and Content Expansion

### Goal
Add only the monetization and expansion layers that fit Words 'n Wands!’ emotional contract.

### Scope
- ad-free purchase if appropriate
- carefully constrained cosmetics
- carefully constrained content packs if justified
- optional reward systems that do not break fairness

### Forbidden directions
Milestone 6 must not introduce:

- pay-to-win combat power
- interruption during active solving
- monetization that damages trust or warmth
- manipulative pressure loops that deform the puzzle flow

### Docs required before Milestone 6 begins
- all Milestone 5 docs
- `docs/progression-economy-and-monetization.md`
- `docs/audio-visual-style-guide.md` if cosmetic expansion becomes real

### Definition of done
Milestone 6 is done when:

- monetization supports the product rather than deforms it
- the game remains fair and readable
- the core battle loop is still the main value
- expansion adds delight rather than clutter

---

## 13. Milestone 7 — Beta Hardening and Release Readiness

### Goal
Reduce risk before broader player release.

### Scope
- bug fixing
- balance tuning
- fairness audits
- accessibility hardening
- low-end Android sanity checks
- crash reduction
- save/resume hardening
- content QA hardening
- polish on the most-used surfaces

### Docs required before Milestone 7 begins
All launch-critical behavior docs should now exist and be internally consistent.

At minimum:

- `README.md`
- `AGENTS.md`
- `docs/game-rules.md`
- `docs/word-validation-and-element-rules.md`
- `docs/creature-and-encounter-rules.md`
- `docs/encounter-balance-framework.md`
- `docs/screens-and-session-flow.md`
- `docs/technical-architecture.md`
- `docs/engineering-standards.md`
- `docs/implementation-contracts.md`
- `docs/milestone-locked-constants.md`
- `docs/audio-visual-style-guide.md`
- `docs/accessibility-localization-and-device-support.md`
- `docs/content-pipeline-and-liveops.md`
- `docs/progression-economy-and-monetization.md`
- `docs/analytics-and-experimentation.md`
- `docs/milestone-implementation-plan.md`

### Definition of done
Milestone 7 is done when:

- the most-used flows are stable on real Android devices
- the game is fun in ordinary sessions, not only on paper
- save/resume behavior feels trustworthy
- major fairness problems are not still sitting open
- accessibility and readability are no longer afterthoughts
- launch confidence comes from testing, not hope

---

## 14. General Milestone Completion Rules

A milestone is not complete just because one demo worked once.

A milestone is complete only when:

- the intended workflow works reliably
- the docs and implementation agree closely enough to trust them
- player-facing behavior is understandable
- obvious fairness/trust risks have been addressed
- no fake unfinished feature is being used to hide missing real behavior
- the result does not create obvious maintainability debt that should have been prevented immediately

---

## 15. General Test Expectations

Every milestone should include tests appropriate to the area it changes.

### Minimum automated test expectations
- core battle-truth changes require unit tests
- state transition changes require unit tests and targeted integration tests
- persistence/resume changes require serialization/restore tests
- content loading/versioning changes require validation tests
- competition or sync additions later require deterministic comparison or merge tests

### Minimum manual test expectations
- test the main happy path
- test a plausible failure path
- test background/resume behavior where relevant
- test sound-off and haptics-off usability where relevant
- test one real Android phone flow before calling the milestone done
- if the milestone touches readability-sensitive UI, run the corresponding accessibility checks

---

## 16. Final Priority Summary

If Words 'n Wands! has to choose what to protect most during implementation, the priority order should be:

1. player trust
2. battle fairness
3. save/resume reliability
4. maintainable structure
5. real-world Android usability
6. satisfying repeat play
7. optional side flavor
8. monetization and extras

Words 'n Wands! should win by becoming a smart, fair, satisfying magical word battle game first.

Everything else can come later.
