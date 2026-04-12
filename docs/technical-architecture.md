# Words 'n Wands! Technical Architecture

This document defines the intended technical architecture for Words 'n Wands!.

Its purpose is to turn the game’s product truth into an implementation shape that is:

- realistic for a mostly AI-assisted solo builder
- Android-first
- maintainable over time
- explicit enough to reduce guessing
- conservative enough to avoid early technical self-sabotage

This document is the technical source of truth for:

- stack direction
- system boundaries
- repo shape
- runtime ownership of battle truth
- persistence direction
- content and validation loading direction
- offline-first behavior
- future backend scope boundaries

If future code, scaffolding, or architecture experiments disagree with this document, this document should be treated as the intended architecture until intentionally updated.

## Status Note

This document describes the intended architecture, not a claim that every layer already exists in code today.

Current repo status as of 2026-04-11:

- `packages/game-rules`, `packages/validation`, and `packages/content` contain the main implemented shared logic
- `apps/mobile` now contains a first playable local encounter slice covering starter flow, active encounter, result routing, and a minimal Home continuation surface using the shared gameplay and validation packages
- the current mobile slice now supports both continuous trace/swipe release-casting and tap-selected path building through one shared board-selection pipeline, and the launch bundle now hydrates through a shared mobile-safe bundled runtime helper rather than a mobile-only content shape
- the current mobile slice now ships a real Zustand-backed app store plus SQLite-backed active-encounter restore/profile/settings persistence, and its app shell is now split into dedicated starter/home/encounter/result screen modules around those seams, but it still does not realize the full Expo Router route ownership or broader progression/history architecture described later in this document
- when current code and target architecture differ, contributors must either align the code or mark the target-only architecture explicitly instead of treating future structure as already shipped

---

## 1. Core Philosophy

Words 'n Wands! should be built with a boring, explicit, low-ops architecture.

That is not a compromise.  
That is the correct strategy for this project.

The project is being built with heavy AI assistance and limited human implementation bandwidth. That means the architecture must optimize for:

- low ambiguity
- low operational burden
- low dependency sprawl
- strong documentation alignment
- easy local iteration
- clear ownership of game rules
- minimal hidden magic

Words 'n Wands! should prefer:

1. one clear stack
2. local-first solo play
3. explicit typed data
4. shared gameplay truth outside the UI
5. conservative build steps
6. future expansion only when justified

over:

- clever architecture
- premature backend complexity
- live-service infrastructure too early
- abstraction for abstraction’s sake
- multiple overlapping tools for the same job

### Practical architecture rule

A version of the game that is technically “modern” but hard for you and your AI tools to maintain is worse than a simpler version that is boring and reliable.

---

## 2. Project Constraints and Architecture Assumptions

This architecture is intentionally shaped around the project’s real constraints.

### Current practical constraints

- primary builder is not writing the entire game manually from scratch
- implementation help comes mainly from Codex and Jules
- design tooling is available through Adobe Creative Cloud, but high-skill custom asset pipelines should not be assumed
- early production capacity is limited
- the game must be understandable and maintainable by reading the docs and code, not by reverse-engineering clever systems

### Architecture consequences

Because of those constraints, the architecture should:

- avoid custom engine work
- avoid multi-platform complexity early
- avoid mandatory backend dependence for core solo play
- avoid deeply nested monorepo machinery beyond what truly helps
- avoid runtime AI decisions for gameplay truth
- avoid heavy custom content tooling before it is needed
- use typed, explicit, reviewable data formats

---

## 3. Scope of This Document

This document owns:

- stack direction
- runtime boundaries
- repo structure direction
- local persistence direction
- gameplay-truth ownership
- content and validation loading direction
- future backend scope boundaries
- AI-assisted implementation constraints
- asset-pipeline practicality rules

This document does **not** own:

- battle rules
- word validation policy itself
- creature tuning policy
- screen behavior details
- milestone order beyond architecture-specific interpretation
- analytics taxonomy
- monetization behavior

Those belong in other focused docs.

---

## 4. Architecture Goals

The architecture should make it easy to build and maintain the following:

### 4.1 A local playable vertical slice

The game must be able to reach a real playable Android encounter without requiring:

- accounts
- cloud sync
- matchmaking
- live content infrastructure
- backend-only truth

### 4.2 Shared gameplay truth

Core battle truth must live outside screen components.

The system must have one trustworthy place for:

- board state
- move budget
- word-resolution outcomes
- damage calculation
- countdown behavior
- creature spell resolution
- dead-board recovery

### 4.3 Reliable save and resume

A player should be able to:

- background the app
- return later
- recover the active encounter safely

without screen-level hacks or duplicated state ownership.

### 4.4 Easy content expansion later

Creature and encounter content should be data-driven enough that new content can be added without rewriting battle logic.

### 4.5 Low-ops foundation

The early game should not require:

- live backend hosting
- live database operations
- push infrastructure
- remote balancing systems
- content-publishing services

unless and until the product truly needs them.

---

## 5. Stack Direction

Words 'n Wands! should stay aligned with a conservative TypeScript-first mobile stack.

### Current intended stack direction

This section defines the canonical stack target for the architecture.
It should not be read as a claim that every app-layer piece listed below is already fully implemented in the current mobile slice.

- **Language:** TypeScript
- **Mobile app:** React Native with Expo
- **Routing:** Expo Router
- **App/session/UI state:** Zustand
- **Important local persistence:** SQLite via Expo SQLite
- **Shared gameplay logic:** TypeScript packages where useful
- **Future backend/API later where needed:** TypeScript
- **Future background/scheduled work later where needed:** TypeScript worker

### Why this stack fits the project

This stack is a good fit because it provides:

- strong AI-tool familiarity
- fast iteration
- good Android-first practicality
- reasonable asset integration
- a clear path to offline solo play
- enough structure without forcing heavy native complexity early

### Dependency rule

Prefer Expo-compatible, first-party or boring mainstream tools where they are good enough.

Do not add tech because it is fashionable.

---

## 6. Architecture Shape by Phase

The project should not pretend it needs its final long-term architecture on day one.

### 6.1 Immediate architecture shape (Milestones 0–2)

For early milestones, Words 'n Wands! should behave like:

- one local-first mobile app
- one shared gameplay-truth layer
- one shared validation/content layer
- one local persistence layer
- no required backend

This is the correct early architecture.

### 6.2 Later architecture shape (Milestones 3+)

Only when needed, the project may expand to include:

- content pipeline tooling
- optional remote challenge/content delivery
- optional cloud sync
- optional async competition services
- optional analytics and experiment infrastructure
- optional monetization and live-ops support

These are later layers.  
They must not redefine the core solo architecture.

---

## 7. Repo Structure Direction

The repo should remain understandable from the product point of view.

### 7.1 Long-term target shape

The long-term expected top-level structure is:

- `apps/mobile`
- `apps/api`
- `apps/worker`
- `apps/content-tools`
- `packages/game-rules`
- `packages/validation`
- `packages/content`
- `packages/ui`
- `packages/audio`
- `packages/analytics`
- `packages/utils`
- `docs/`
- `assets/art`
- `assets/audio`
- `assets/fonts`
- `assets/marketing`

### 7.2 Practical early shape

For Milestones 0–2, the repo should only create what is actually needed.

The smallest practical early shape is likely:

- `apps/mobile`
- `packages/game-rules`
- `packages/validation`
- `packages/content`
- `packages/utils`
- `docs/`
- `assets/art`
- `assets/audio`
- `assets/fonts`
- `assets/marketing`

### 7.3 M0 bootstrap contract (required artifacts)

> **Normative (M0 required):** Milestone 0 must include these root-level and workspace bootstrap artifacts before Milestone 1 implementation begins.

- `package.json` at repo root **must exist** as the root scripts contract owner (`format`, `lint`, `typecheck`, `test`, `build`, and `check` when present). It must exist in M0 so every workspace runs one canonical command surface; deferred: package-level script specialization and milestone-specific script expansion.
- `pnpm-workspace.yaml` **must exist** at repo root. It must exist in M0 so workspace membership is explicit and deterministic for installs and task execution; deferred: broader workspace expansion beyond M0-required packages.
- base TypeScript config file(s) **must exist** at repo root and be shared by all workspaces (for example `tsconfig.base.json` plus any root-level `tsconfig.json` wiring). They must exist in M0 so type boundaries and compiler defaults stay consistent; deferred: strictness ramp-ups and per-package advanced compiler overrides.
- Expo app config in `apps/mobile` **must be locked to `app.config.ts`** (do not dual-track with `app.json`). It must exist in M0 so mobile runtime/build metadata has one authoritative location; deferred: environment-specific config branching beyond immediate local development needs.
- root test command ownership **must be explicit and stable** in root `package.json` scripts, and the current implemented shared-package path may use per-package `node:test` commands rather than a mandatory root `vitest.config.ts`. Test discovery and contributor commands must still stay predictable; deferred: adding a consolidated root test config only if the repo actually adopts one.
- root command ownership for lint/format/typecheck **must remain at repo root scripts** (implemented in root `package.json`, delegating into workspaces as needed). It must exist in M0 so engineering validation has one entrypoint; deferred: task-runner orchestration upgrades or CI-only command wrappers.

Minimum required first-pass file/folder tree (M0) must include:

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

### 7.4 Deferred folders rule

Do not create speculative scaffolding for:

- `apps/api`
- `apps/worker`
- `apps/content-tools`
- `packages/analytics`
- `packages/audio`

unless the current milestone truly needs them.

### 7.5 Naming rule

Use boring, obvious names.

A contributor should be able to guess what a folder owns without reading three more files.

---

## 8. System Boundary Rules

The architecture should enforce strong boundaries between product truth and presentation.

### 8.1 Core runtime layers

Words 'n Wands! should separate these layers clearly:

- app shell and routing
- screen-level UI
- feature orchestration
- gameplay-truth engine
- validation and element lookup
- content definitions
- persistence and restore
- optional side-effect systems such as audio or analytics

### 8.2 Non-negotiable boundary rule

UI code must not become the hidden source of gameplay truth.

### 8.3 Shared truth rule

If a battle rule matters to fairness, it should live in shared gameplay or validation code, not as an animation side effect or screen helper accident.

### 8.4 Side-effect isolation rule

Audio, haptics, analytics, ads, and logging must react to battle outcomes.  
They must not define those outcomes.

---

## 9. Mobile App Architecture

### 9.1 App shell responsibilities

`apps/mobile` should own:

- routing
- screen composition
- view models or feature orchestration
- local device integration
- persistence integration
- app lifecycle handling
- asset loading
- settings UI
- result and progression surfaces

### 9.2 App shell should not own

`apps/mobile` should not own the canonical implementation of:

- damage rules
- countdown rules
- dead-board detection
- word acceptance
- element assignment
- creature spell semantics

Those belong in shared packages.

### 9.3 Routing direction

Expo Router should be used for predictable screen-level structure.

Likely early route groups include:

- startup / root
- home
- encounter
- result
- settings / profile

The exact route names may evolve, but the structure should stay small and obvious.

### 9.4 Static asset registry requirement (React Native/Expo)

Runtime visual assets must be resolved through a compile-time registry map (for example, `id -> require(...)`) instead of dynamic runtime path construction.

Rules:

- content IDs such as `creature_id` and `spell_identity` are lookup keys only; they must never be treated as file paths
- registry lookups must resolve bundled assets through static module references compatible with React Native/Expo bundling
- missing registry keys must fail content validation in tooling and use a safe runtime fallback visual if an invalid payload still reaches the device

This requirement must stay aligned with the runtime content ID contracts in `docs/implementation-contracts.md` section [8. Runtime Content Definition Contracts](./implementation-contracts.md#8-runtime-content-definition-contracts).

---

## 10. Gameplay Truth Architecture

Core battle truth is the most important part of the architecture.

### 10.1 Ownership

`packages/game-rules` should own the canonical implementation of battle rules and state transitions where practical.

### 10.2 What `packages/game-rules` should own

This package should own logic for:

- encounter initialization from content definitions
- board state structure
- cast resolution order
- move-budget consumption
- damage resolution
- weakness/resistance application
- countdown updates
- creature spell application
- dead-board detection
- spark-shuffle recovery
- victory/loss determination
- star-rating evaluation if it becomes rule truth rather than pure UI formatting

### 10.3 What `packages/game-rules` should return

The gameplay package should produce explicit results such as:

- updated encounter state
- cast outcome details
- damage details
- countdown result
- creature-spell result
- end-state result

It should not require the UI to infer hidden meaning from half-finished data.

### 10.4 Reducer/state-machine preference

Core battle updates should be implemented as explicit state transitions or reducer-style operations rather than a web of mutable UI helpers.

This is especially important for AI-assisted maintenance.

---

## 11. Validation and Element Architecture

Validation and element tagging are separate trust systems and should not be tangled with UI code.

### 11.1 Ownership

`packages/validation` should own:

- castable-word lookup
- normalization behavior
- repeat-safe validation helpers
- element tag lookup
- Arcane fallback logic
- validation snapshot loading
- board-playability checks that depend on the real lexicon

### 11.2 Shared-truth rule

The same validation truth must power:

- player word acceptance
- board dead-state detection
- board-generation safety checks
- refill safety checks
- content QA tools later

### 11.3 No split-dictionary rule

Do not let one dictionary govern board logic while another governs player submission.

That is how trust dies.

### 11.4 No runtime AI rule

The validation/element package must not call runtime AI or remote semantic services to decide battle-critical truth.

---

## 12. Content Architecture

Content should be typed and reviewable, not scattered through screens.

### 12.1 Ownership

`packages/content` should own typed content definitions such as:

- `CreatureDefinition`
- `EncounterDefinition`
- element icon/name data
- progression metadata
- optional daily/weekly challenge content later

### 12.2 Content direction

For early milestones, content should be:

- bundled locally
- versioned in the repo
- easy to review in diffs
- easy to understand without custom tooling

### 12.3 Early content format rule

Early content should use simple typed objects or JSON-like static data structures.

Do not invent a complicated authoring format too early.

### 12.4 Stable identifier rule

Creature IDs and encounter IDs should be stable once introduced.

This protects persistence, progression, and future content operations.

---

## 13. UI and State Management Architecture

### 13.1 Zustand role

Zustand should manage:

- app-level session state
- current route-adjacent feature state
- current active encounter reference
- restore coordination
- user settings
- lightweight UI state

### 13.2 Zustand should not become the rules engine

Zustand is for state orchestration, not hidden battle semantics.

The canonical battle updates should still come from shared gameplay-truth functions.

### 13.3 UI-local transient state

Purely transient UI state may live in components or view-level state, such as:

- active board-selection preview
- temporary highlight animation flags
- ephemeral feedback visibility

These should not become the canonical battle record.

### 13.4 Suggested ownership split

A healthy split is:

- `packages/game-rules`: computes legal state changes
- `apps/mobile` + Zustand: decides when to invoke those changes and how to present them

---

## 14. Persistence Architecture

### 14.1 Local-first rule

Core solo play must work locally without requiring a backend.

### 14.2 SQLite role

SQLite should be the source of important device-local persistent truth such as:

- active encounter snapshot
- encounter history
- player progression state
- settings that must survive restarts
- optional daily/weekly completion history later

### 14.3 What should be persisted

At minimum, an active encounter snapshot should preserve:

- encounter identifier
- creature state
- current board
- remaining moves
- countdown value
- tile states
- relevant progression context
- current session/result state

### 14.4 Autosave trigger rule

The app should autosave after meaningful stable actions such as:

- encounter creation
- successful cast resolution
- creature spell resolution
- spark shuffle recovery
- encounter result creation
- explicit retry/restart

### 14.5 No half-truth restore rule

Persisted state should represent a safe restore point, not a partial mid-animation guess.

---

## 15. Session Restore Architecture

### 15.1 Restore authority

The app should derive restore routing from persisted encounter/session truth, not from loose guesses about what screen the player “probably meant” to be on.

### 15.2 Restore behavior

On launch or resume, the restore system should decide whether to route to:

- active encounter
- result screen
- home
- first-time flow

based on explicit stored state.

### 15.3 No duplicated-resolution rule

Restore logic must not:

- replay a completed cast
- reapply creature damage
- consume an extra move
- re-trigger a countdown event
- re-trigger a spell that already resolved

### 15.4 Lifecycle principle

Battle truth should be durable enough that app lifecycle interruptions do not create fairness bugs.

### 15.5 State/persistence/session orchestration order (required)

For each accepted in-battle player action, the runtime order is:

1. UI submits the action to `packages/game-rules`.
2. The engine returns the canonical next state plus ordered events.
3. The app writes a stable SQLite snapshot/checkpoint.
4. Zustand commits the canonical runtime state.
5. Action queue entries are derived from the ordered events and consumed in order.
6. Input unlock occurs only after the interaction lock window completes.

This ordering must align with the interaction lock behavior in `docs/screens-and-session-flow.md` and with the canonical event/action contracts in `docs/implementation-contracts.md`.

### 15.5.a Encounter action lifecycle contract (canonical terms)

Use the following lifecycle terms and sequence as the implementation contract:

1. UI submits player action to `packages/game-rules`.
2. Engine returns next `EncounterRuntimeState` plus ordered `EngineEvent[]`.
3. App writes SQLite snapshot at a stable checkpoint.
4. App updates Zustand with the canonical runtime state.
5. App derives `ActionQueueItem[]` from ordered `EngineEvent[]`.
6. UI consumes the action queue strictly in order.
7. Input unlocks only after the final lock-window phase completes.

---

## 16. Board Generation Architecture

Board generation is a gameplay-truth problem, not just a UI convenience.

### 16.1 Ownership

Board generation and refill logic should live with gameplay-truth code, not inside screen components.

### 16.2 Generator responsibilities

The board-generation system should be responsible for:

- generating a starting playable board
- refilling after casts
- maintaining fair unpredictability
- supporting dead-board detection
- enabling spark-shuffle recovery when necessary

### 16.3 Safety-check rule

Board generation must use the same validation truth as player casting.

### 16.4 Randomness contract (required)

Encounter randomness is mandatory and contract-driven in v1.

System-of-record document: `docs/randomness-and-seeding-contract.md`.

Architecture requirements:

- encounter sessions must carry an immutable root `encounter_seed`
- randomness must use isolated deterministic substreams (not one shared stream)
- substream state must be persisted in active encounter snapshots for exact resume
- restore must continue from persisted RNG state, not from re-derived fresh streams

This is a gameplay fairness and trust requirement, not an optional optimization.

---

## 17. Audio and Feedback Architecture

Audio and feedback are important, but they are not allowed to redefine game truth.

### 17.1 Early architecture direction

For Milestones 0–1, feedback can remain simple and local:

- UI-triggered animation cues
- haptic calls driven by known battle outcomes
- lightweight sound triggers

### 17.2 Separation rule

The battle engine should say what happened.  
The feedback layer should decide how that is presented.

### 17.3 No hidden semantic audio rule

Audio/haptic code must not be where battle semantics “really happen.”

---

## 18. Asset Workflow Architecture

This project should assume a practical, low-drama asset workflow.

### 18.1 Asset-pipeline rule

The asset pipeline should be easy for a mostly non-specialist solo owner to manage.

### 18.2 Preferred asset direction

Prefer assets that are easy to export, version, and replace, such as:

- creature illustrations
- icons
- UI panels
- simple backgrounds
- lightweight frame elements
- font files only when necessary and licensed correctly

### 18.3 Avoid early complexity

Avoid early dependence on:

- skeletal animation pipelines
- complicated sprite atlases for everything
- 3D content pipelines
- shader-heavy art systems
- custom VFX authoring systems that are hard to maintain

### 18.4 Practical animation rule

For early milestones, use code-driven UI animation and simple asset swaps/transforms where possible.

The product needs clarity and consistency more than cinematic asset systems.

---

## 19. AI-Assisted Development Rules

This architecture must remain friendly to AI-assisted implementation.

### 19.1 Explicitness rule

Systems should use:

- descriptive names
- small focused modules
- typed interfaces
- obvious data flow

### 19.2 Avoid cleverness rule

Avoid architecture that depends on:

- deep metaprogramming
- invisible magic state
- custom DSLs
- highly abstract factories for basic gameplay concepts
- difficult-to-reason-about dependency injection webs

### 19.3 Documentation-first rule

If a major architecture decision is not obvious from the code, it should be documented in a focused doc before widespread implementation starts.

### 19.4 Acceptance-rule path

AI tools should be able to answer, by reading the docs and code:

- where does battle truth live
- where does validation live
- where does content live
- what gets persisted
- what the UI is allowed to own

If that is unclear, the architecture is too muddy.

---

## 20. Backend and Online Scope Boundaries

### 20.1 No required backend for core solo play

The game must not require a backend for ordinary solo encounter play in early milestones.

### 20.2 When backend may become justified

A backend may become justified later for:

- challenge distribution
- optional cloud sync
- async competition
- account linking
- live content operations
- optional analytics collection
- optional monetization support

### 20.3 Backend boundary rule

Even when a backend exists later, it must not quietly become the sole source of truth for ordinary local battle semantics.

The player should still be able to play the core solo game with strong local reliability.

### 20.4 Worker/content-tools rule

`apps/worker` and `apps/content-tools` should not appear as real required infrastructure until the game actually has enough content cadence or remote behavior to need them.

---

## 21. Recommended Package Responsibilities

The following is the recommended package/module responsibility map.

### `apps/mobile`

Owns:

- routing
- screens
- Zustand stores
- lifecycle integration
- SQLite integration adapters
- asset loading
- player-visible navigation and presentation

### `packages/game-rules`

Owns:

- encounter state transitions
- cast resolution
- countdown behavior
- creature spell application
- win/loss resolution
- dead-board handling
- board generation/refill logic where practical

### `packages/validation`

Owns:

- word normalization
- castable word lookup
- element tagging
- Arcane fallback
- playability checks

### `packages/content`

Owns:

- typed creature content
- typed encounter content
- content versioning metadata
- optional challenge content later

### `packages/utils`

Owns:

- generic helpers that are truly shared and not game-specific dumping grounds

### Deferred packages

Introduce only when justified:

- `packages/audio`
- `packages/analytics`

---

## 22. Contract Ownership Map (M1/M2)

This map anchors implementation-contract ownership to concrete module/package targets for Milestones 1 and 2.

All rows below are normative for M1/M2 implementation:

- contract-owned logic must live in the listed package/module targets
- UI components may render state and dispatch intent, but must not re-implement contract logic
- if a row spans app + package code, the app side is orchestration/adaptation only

| Contract group                                    | Contract section reference (`docs/implementation-contracts.md`)                                                                              | Target package/module path convention (M1/M2)                                                                                                               | UI layer prohibition                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Encounter state transitions and reducer ownership | 3.1 `Canonical encounter transition rules`; 13.2 `sessionSlice` contract; 13.3 `encounterSlice` contract                                     | `packages/game-rules/encounter/**` for transition legality + reducer helpers; `apps/mobile/session/store/**` for wiring reducers into app store             | Must not be implemented in UI component layer (`apps/mobile/**/components/**`); components dispatch typed actions only.                         |
| Word validation lookup ownership                  | 10.3 `Runtime validation lookup contract`; 10.4 `Validation snapshot provider contract`                                                      | `packages/validation/lookup/**` and `packages/validation/provider/**`; app integration in `apps/mobile/validation/**`                                       | Must not be implemented in UI component layer; screens must call lookup/provider adapters rather than embedding lexicon or normalization logic. |
| RNG substream manager ownership                   | 4.2 `Board snapshot contract` (`rng_stream_states`); 7.5 `active_encounter_snapshots`; 5.7 `Spark shuffle resolution contract`               | `packages/game-rules/rng/**` for substream lifecycle and deterministic advancement; persistence bridge in `apps/mobile/session/persistence/**`              | Must not be implemented in UI component layer; UI must never advance RNG streams directly.                                                      |
| Snapshot persistence read/write ownership         | 7.5 `active_encounter_snapshots`; 3.2 `Encounter route restoration contract`                                                                 | `apps/mobile/session/persistence/**` for SQLite repository adapters; domain shape mappers in `packages/game-rules/session-snapshot/**`                      | Must not be implemented in UI component layer; components must not read/write snapshot tables directly.                                         |
| Launch/resume phase orchestrator ownership        | 3.3 `Launch/resume phase contract`; 3.2 `Encounter route restoration contract`                                                               | `apps/mobile/session/orchestration/launch-resume/**` for phase runner + restore target derivation; pure helpers in `packages/game-rules/session-restore/**` | Must not be implemented in UI component layer; components may observe phase state but cannot sequence restore phases.                           |
| Telemetry event adapter ownership                 | 12.1 `Canonical event names`; 12.2 `Base required analytics properties`; 12.3 `Gameplay analytics fields`; 12.4 `Redaction/privacy contract` | `packages/analytics/contracts/**` (when package exists) or `apps/mobile/telemetry/adapters/**` in M1 fallback                                               | Must not be implemented in UI component layer; components emit semantic intents only, never construct raw analytics payloads.                   |

---

## 23. Testing-Oriented Architecture Rules

This document does not replace the engineering standards, but architecture should support testing naturally.

### 23.1 High-value test targets

The architecture should make it easy to test:

- cast resolution
- board refill
- dead-board detection
- spark shuffle recovery
- creature spell application
- countdown updates
- encounter result transitions
- session save/restore
- validation and element lookup

### 23.2 Testability rule

If battle truth can only be tested through the full UI, the architecture is probably wrong.

Core battle logic should be testable without rendering screens.

---

## 24. Error Handling Architecture

### 24.1 Player-facing failure rule

If supporting systems fail, the app should degrade gracefully.

Examples:

- if an optional feedback effect fails, gameplay continues
- if a non-critical asset fails, the screen should remain usable where possible
- if persistence temporarily fails, the player should get a calm recoverable state rather than corrupted play

### 24.2 No invented truth rule

If content or validation cannot be loaded correctly, the app should not invent replacement gameplay truth on the fly.

Prefer:

- last-known-good content
- clean unavailable state
- clear internal logging

over silent improvisation.

---

## 25. Early Implementation Recommendation

For this specific project, the best early implementation strategy is:

### Milestone 0

Create:

- `apps/mobile`
- `packages/game-rules`
- `packages/validation`
- `packages/content`
- `packages/utils`
- docs and asset folders

### Milestone 1

Implement:

- one starter encounter
- one standard encounter
- local content loading
- local save/resume
- battle engine outside the UI
- battle UI on top of that engine

### Milestone 2

Expand:

- creature roster
- progression state
- result history
- more encounter definitions
- more balancing and playability checks

This is the lowest-risk path for a mostly AI-assisted project.

---

## 26. What This Architecture Deliberately Avoids Early

This architecture intentionally avoids early dependence on:

- a backend for solo play
- custom content CMS tooling
- live-service operations
- heavy animation tech
- advanced multiplayer systems
- high-complexity economy systems
- giant monorepo package sprawl before the code earns it
- runtime AI gameplay semantics
- broad architectural experiments

That restraint is a strength, not a limitation.

---

## 27. Summary Rule

Words 'n Wands! should be built as:

- one Android-first Expo app
- one clear shared gameplay-truth layer
- one clear validation/element layer
- one typed content layer
- one reliable local persistence layer
- one docs-first architecture that AI tools can follow safely

The architecture should stay:

- boring
- explicit
- local-first
- low-ops
- TypeScript-first
- maintainable by a solo owner with AI help

If a future architecture idea makes the project harder to understand, harder to test, harder to resume reliably, or more operationally fragile before the game is proven fun, it should not be treated as an improvement.
