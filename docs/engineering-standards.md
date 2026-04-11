# Words 'n Wands! Engineering Standards

This document defines how Words 'n Wands! code should be written, organized, reviewed, tested, and maintained.

Its purpose is to keep Words 'n Wands! understandable and maintainable over time, especially when multiple humans and AI tools contribute to the codebase.

This document is a coding and implementation standard.

If Words 'n Wands! code “works” but ignores these standards, it should not be considered acceptable without intentional review and approval.

---

## 1. Core Engineering Philosophy

Words 'n Wands! should be built with these principles:

- slower but cleaner is better than fast and messy
- boring is good
- clear is better than clever
- consistency beats personal style
- maintainability matters more than showing off
- battle truth and player trust matter more than convenience
- do not trade long-term sanity for short-term momentum

Words 'n Wands! is not the place for:

- fragile “smart” code
- hidden state magic
- UI code that quietly becomes the rules engine
- architecture experiments that make future maintenance harder
- AI-generated code that drifts from the docs just because it “kind of works”
- overbuilt systems added just because they sound impressive

### Practical project rule
This project is being built with heavy AI assistance and limited human implementation bandwidth.

That means the codebase must stay easy to:

- read
- reason about
- test
- modify safely
- review against the docs

If an implementation is too clever for future you to trust quickly, it is probably not a good Words 'n Wands! implementation.

---

## 2. Source of Truth Hierarchy

When coding Words 'n Wands!, contributors should follow this order of truth:

1. Words 'n Wands! product documents in `docs/`
2. Words 'n Wands! implementation contracts in `docs/implementation-contracts.md`
3. Words 'n Wands! engineering standards in this document
4. approved milestone/build-order documents
5. code

Important rules:

- the code should reflect the docs
- product behavior should not be silently reinvented inside the code
- if code and docs disagree, fix the disagreement deliberately
- do not assume current code is automatically the product truth
- do not let “the UI already does this” become an excuse for rules drift

---

## 3. Current Stack Direction

Words 'n Wands! should stay aligned with the current intended stack direction.

### Current working stack
- mobile app: React Native with Expo
- language: TypeScript
- routing: Expo Router
- app/session/UI state: Zustand
- important local persistence: SQLite via Expo SQLite
- shared rule logic: TypeScript packages

If a later technical architecture document intentionally changes part of this, that document should be updated first and the code should follow the updated source of truth.

---

## 4. Mandatory Tooling

These tools are mandatory unless the engineering docs are intentionally updated later.

### Package management
- **pnpm** only

Do not mix:
- npm workspace commands
- yarn
- bun

### Formatting
- **Prettier** is mandatory

Formatting should be automatic and non-negotiable.  
Humans should not waste review time on whitespace fights.

### Linting
- **ESLint** is mandatory
- TypeScript-aware linting is mandatory
- obvious unused code/imports should be caught automatically
- import/order rules should be enforced

### Type checking
- **TypeScript compiler checks** are mandatory

Code that passes visually but fails type safety is not done.

### Testing
Mandatory test tools:
- **Vitest** for shared logic and unit tests
- **React Native Testing Library** for app/component behavior where needed
- **Jest with `jest-expo`** for Expo/React Native test environment support where needed

### Build / app validation
Mandatory build/app validation tools:
- **Expo CLI**
- **Expo Doctor**

The project must maintain a reliable way to validate that the mobile app still bundles and remains sane for Android.

### CI
- **GitHub Actions** should be the standard CI path

---

## 5. What Lint / Format / Test / Build Tools Are Mandatory?

### Mandatory tools summary
- `pnpm`
- `prettier`
- `eslint`
- `typescript`
- `vitest`
- `@testing-library/react-native`
- `jest-expo`
- `expo` CLI
- `expo-doctor`
- GitHub Actions CI

### Practical rule
If a proposed tool does not clearly improve:

- trust
- maintainability
- Android reliability
- or testing quality

it should not be added.

### Dependency discipline reminder
Words 'n Wands! does not need:
- five testing stacks
- overlapping formatters
- heavy state frameworks
- “enterprise” monorepo complexity
- engine-like runtime libraries for ordinary UI behavior

---

## 5.1 Operational Validation Commands (Contributor Contract)

This section is the single operational contract for contributor validation.

Use these exact commands so local validation, milestone gates, and CI all run the same path.

Reference points:
- `AGENTS.md` for execution expectations
- `docs/milestone-implementation-plan.md` for milestone-required checks
- `docs/technical-architecture.md` for package and boundary assumptions

### Canonical command names
The repo/workspace must expose these command names:

- `format`
- `lint`
- `typecheck`
- `test`
- `build`
- `check` (aggregated validation: `lint` + `typecheck` + `test` + `build`)
- `docs:check` (aggregated validation for all documentation-consistency bash scripts in `scripts/`)

### Requirement vs enforcement state
A requirement is normative as soon as it appears in this document.  
Lack of automation does not make the requirement optional; it only changes whether enforcement is currently manual or automated.

| Requirement | Canonical command | Required since milestone | Current enforcement | Blocking now |
| :--- | :--- | :--- | :--- | :--- |
| Code formatting | `pnpm format` | M0 | Manual / Unavailable until scripts exist | No |
| Linting | `pnpm lint` | M0 | Manual / Unavailable until scripts exist | No |
| Type checking | `pnpm typecheck` | M0 | Manual / Unavailable until scripts exist | No |
| Testing | `pnpm test` | M0 | Manual / Unavailable until scripts exist | No |
| Building | `pnpm build` | M0 | Manual / Unavailable until scripts exist | No |
| All checks | `pnpm check` | M0 | Manual / Unavailable until scripts exist | No |
| Doc Consistency | `pnpm docs:check` | M0 | Manual (run shell scripts in `scripts/` individually until script exists) | Yes |

During the docs-first phase, enforcement is mostly manual.  
Automated scripts and CI should become blocking once workspace scaffolding is introduced.

### Repo-wide usage
Run from repo root:

- `pnpm format`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Use this shortcut when available:

- `pnpm check`

### Package-scoped usage during iteration
For faster local loops, run checks only for touched package(s):

- `pnpm --filter <package_name> format`
- `pnpm --filter <package_name> lint`
- `pnpm --filter <package_name> typecheck`
- `pnpm --filter <package_name> test`
- `pnpm --filter <package_name> build`

### Package-level content validation examples
When a change touches content packages, manifests, schema files, or version pins, run package-scoped content checks in addition to core checks:

- schema validation:
  - `pnpm --filter <package_name> content:validate:schema`
- referential integrity checks (for example creature/encounter/snapshot references):
  - `pnpm --filter <package_name> content:validate:refs`
- version pin consistency checks:
  - `pnpm --filter <package_name> content:validate:version-pins`
- all package content checks:
  - `pnpm --filter <package_name> content:validate`

Practical rule: `content:validate` should fail if schema validation fails, if references are broken, or if manifest/runtime version pins do not match active contract versions.

Before merge, always run repo-wide checks from root or the CI-equivalent command path.

### When to run each command
- `format`: after edits and before opening or merging PRs
- `lint`: on every feature, fix, or code-touching docs update before commit
- `typecheck`: on every TypeScript change before commit
- `test`: whenever battle behavior, validation behavior, persistence behavior, routing behavior, or UI logic can change
- `build`: before merge and for milestone completion validation
- `check`: preferred pre-commit / pre-PR command when available

### Milestone-specific required checks
- **Milestone 0 and onward:** `format`, `lint`, `typecheck`, `test`, and `build` must pass
- **Milestones that touch Expo/mobile runtime paths:** run `expo-doctor` and a successful Expo bundle/start validation in addition to the core checks
- **Milestones that change battle truth, validation policy, element tagging behavior, or canonical encounter/session restore logic:** require targeted tests covering the changed rule path plus passing repo-wide checks

### Expected CI parity
CI must execute the same command contract, in this order:

1. `pnpm format --check` or equivalent non-mutating formatter check
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

When relevant, CI should also run:
- `expo-doctor`
- content/schema validation checks
- package-level validation for touched critical modules

Do not create a CI-only validation path that differs from contributor-local commands.

---

## 5.2 Pre-Coding Milestone Feature Checklist (Required)

Before implementing milestone feature work, contributors must run this checklist and record outcomes in the PR description or final report.

### Required pre-coding gates
1. Confirm the doc-precedence path for the touched feature area.
2. Record unresolved questions as explicit assumptions.
3. Apply a **"contract exists?"** gate for any persisted or runtime-critical behavior. If no contract exists, stop and define or request one before coding.
4. Apply a **"milestone scope check"** gate to prevent feature creep beyond the approved milestone slice.

### Required decision-audit template
Include this section in every milestone-feature PR/final report:

```md
## Ambiguities resolved this change
- Ambiguity:
- Chosen interpretation:
- Why this is safe for player trust/fairness:
- Follow-up doc updates needed:
```

---

## 6. Architecture Boundary Rules

Words 'n Wands! should enforce strong separation between:

- UI/app shell
- feature screens/components
- persistence/services
- shared battle truth
- validation and element truth
- content definitions
- analytics/logging side effects

### Non-negotiable rules
- UI must not become the hidden source of battle truth
- move use, damage, countdown, spell resolution, and encounter end-state logic must not be duplicated across many layers
- analytics, logs, experiments, and ads must never define gameplay semantics
- persistence stores truth; it does not invent truth
- content definitions and validation snapshots must be versioned and reviewable
- active encounters must not be silently mutated by unrelated side effects
- dead-board recovery must not live only inside screen code

### Practical rule
If the screen, a helper, and a shared package all contain versions of the same battle rule, that is already a warning sign.

---

## 7. Dependency Standards

Words 'n Wands! should be strict about adding libraries.

### Rules for adding a dependency
A dependency should only be added if it clearly provides real value such as:

- saving significant implementation effort
- improving reliability
- solving a hard problem better than in-house code
- reducing long-term maintenance burden
- fitting naturally into the Expo / TypeScript / Android-first stack

### Words 'n Wands! should avoid
- flashy libraries for convenience only
- heavy state-management or architectural frameworks beyond what is needed
- duplicate libraries that solve the same job
- native modules that increase build/setup pain without a clear payoff
- packages that make AI-assisted maintenance harder

### Preferred rule
Prefer first-party Expo-compatible choices where they are good enough.

### Special caution
Any package that touches:
- persistence
- routing
- content loading
- validation
- analytics
- logging
- test infrastructure

should be treated as a serious long-term decision.

---

## 8. Naming Standards

Words 'n Wands! should use clear, boring, descriptive names.

### Preferred naming style
Use names like:

- `battleSessionState`
- `encounterResult`
- `wordValidationResult`
- `elementTagLookup`
- `boardCollapseResult`
- `creatureSpellResolution`
- `sparkShuffleRecovery`
- `resumeBattleService`

Avoid names that are:
- cute
- vague
- overly shortened
- inside-jokes
- clever for the sake of cleverness

### File and symbol naming rule
A developer should be able to guess what a file, class, or function does from its name without opening it.

If a name needs explanation, it is probably not a good Words 'n Wands! name.

---

## 9. Comments and Documentation in Code

Words 'n Wands! should use comments carefully.

### Comment rules
Comments should explain:

- why something exists
- why a gameplay rule matters
- why a non-obvious implementation choice was made
- why a workaround is necessary
- why a fairness or restore constraint exists

Comments should not:

- narrate obvious code line by line
- repeat the code in English
- become stale and misleading

### Comments are especially important around
- cast resolution ordering
- collapse/refill sequencing
- dead-board detection and spark shuffle recovery
- damage and multiplier application
- weakness/resistance handling
- countdown updates
- creature spell targeting
- save/restore behavior
- validation snapshot lookup
- content/version pinning

---

## 10. Logging Standards

Words 'n Wands! should keep useful logs without leaking unnecessary gameplay truth or drowning real issues in noise.

### Words 'n Wands! should log
- technical errors
- content-loading failures
- validation snapshot mismatch problems
- persistence failures/retries
- restore failures
- battle-state transition failures where appropriate
- content version or schema mismatch problems

### Words 'n Wands! should avoid logging by default
- giant board dumps in production logs unless truly needed
- full validation lexicon dumps
- raw internal content bundles when a summary would do
- noisy per-frame or per-animation logs
- user-entered freeform text if any ever exists later
- sensitive account/session payloads if online systems are added later

### Logging principle
Logs should help diagnose problems without:

- spoiling internal gameplay data unnecessarily
- creating privacy messes
- or turning normal play into a log firehose

---

## 11. Error Handling Standards

Words 'n Wands! should handle errors in a player-friendly and engineering-usable way.

### User-facing behavior
Players should see:

- clear readable messages
- calm failure states
- practical next-step guidance when possible

### Technical behavior
Technical detail belongs in logs, not in normal player UI.

### Words 'n Wands! should avoid
- raw exception dumps in the app
- vague “something went wrong” messages with no clue what to do
- silent state corruption
- resetting an encounter just because a non-critical side effect failed

### Important rule
If analytics fails, gameplay continues.  
If logging fails, gameplay continues.  
If haptics or sound fail, gameplay continues.  
If content validation fails, keep last-known-good content or show a clean unavailable state.  
Do not invent battle truth to “smooth over” a failure.

---

## 12. Mandatory Tests by Rule Area

These tests are required for the most important battle-truth systems.

### Word validation and element assignment
Required tests:

- normalization behavior
- castable-word acceptance
- invalid-word rejection reasons
- Arcane fallback behavior
- non-neutral element assignment
- deterministic same-input same-output behavior
- version-pinned validation behavior

### Repeated-word handling
Required tests:

- valid word can be cast once
- repeated word is rejected in the same encounter
- repeated word rejection does not consume a move
- repeated word rejection does not mutate the board
- repeated word rejection does not change countdown state

### Board generation and refill
Required tests:

- initial board is playable
- collapse logic preserves expected tile order
- refill restores full board size
- refill respects structural rules
- same seed produces stable outcomes if seeded generation is used

### Dead-board recovery
Required tests:

- no-playable-word state is detected correctly
- spark shuffle produces a playable state
- recovery does not create hidden extra penalties
- recovery does not corrupt encounter state

### Damage and matchup
Required tests:

- base damage application
- weakness multiplier behavior
- resistance multiplier behavior
- Arcane neutral behavior
- Wand bonus application if in rules
- final damage is deterministic and explainable

### Countdown behavior
Required tests:

- countdown updates after successful casts
- countdown does not change on invalid/repeated casts
- weakness-related countdown effects behave as documented
- countdown reset after creature spell is correct
- victory before countdown-triggered spell prevents post-win creature action

### Creature spell behavior
Required tests:

- each supported spell primitive applies correctly
- tile-state application is correct
- row/column manipulation is correct
- multiple-step spell resolution is ordered correctly
- spell result stays readable and deterministic

### Encounter result behavior
Required tests:

- win state creation
- loss state creation
- star-rating or efficiency classification if implemented as rule truth
- result state does not double-fire on restore

### Persistence and restore
Required tests:

- encounter snapshot serialization
- encounter snapshot restoration
- restore after background/resume
- restore after process kill
- no duplicate resolution on restore
- no duplicated move consumption on restore
- no duplicated creature spell on restore

---

## 13. What Tests Are Required for the Critical Gameplay Systems?

At minimum, the following are mandatory before a related milestone is considered trustworthy:

- validation lookup unit tests
- element tagging / Arcane fallback unit tests
- repeated-word rejection unit tests
- board generation and refill unit tests
- dead-board recovery unit tests
- damage / matchup unit tests
- countdown unit tests
- creature spell unit tests
- encounter result transition unit tests
- encounter snapshot / restore unit tests
- startup / restore routing integration tests
- content schema validation tests if content-loading behavior changes

If a change touches any of those systems and no new or updated tests were added where needed, the change is not complete.

---

## 14. Testing Standards

Words 'n Wands! should treat testing as essential from the start, but should focus effort where trust lives.

### Highest-priority automated test areas
- shared battle engine
- validation engine
- dead-board detection and recovery
- countdown behavior
- creature spell application
- save/restore behavior
- content validation
- encounter state transitions

### Lower-priority early areas
- minor cosmetic animation behavior
- decorative visual polish details
- non-critical presentational effects

### Manual testing is still required
Automated tests are not enough.  
Real Android manual testing is required for:

- onboarding clarity
- one-handed usability
- board readability
- resume reliability
- sound-off usability
- haptics-off usability
- reduced motion / larger text sanity
- result clarity
- no fake unfinished screens

---

## 15. CI Standards

Words 'n Wands! should use CI to enforce boring correctness before merge.

### What CI checks must pass before merge?
For code changes, these checks are mandatory:

- format check passes
- lint passes
- typecheck passes
- all relevant tests pass
- app sanity/build validation passes
- content/schema validation passes if content or validation files changed
- Expo Doctor passes if app dependencies or config changed

### Minimum required CI gates
- `format:check`
- `lint`
- `typecheck`
- `test`
- `build:check`
- `content:validate` when relevant
- `expo:doctor` when relevant
- `battle-formula-version:check` when battle-critical docs or contracts change

The exact script names can vary internally, but the behaviors above are mandatory.

`battle-formula-version:check` requirement:
- compare the canonical combat math formula version declared in `docs/implementation-contracts.md` against all battle-critical numeric references in:
  - `docs/game-rules.md`
  - `docs/word-validation-and-element-rules.md`
- fail CI (blocking merge) if formula-version identifiers are missing or mismatched in any referenced battle-critical section

### Docs-only PRs
Docs-only PRs do not need full app build validation, but they should still avoid breaking doc references, file names, or source-of-truth consistency.

---

## 16. File and Module Structure Standards

Every Words 'n Wands! file should have a clear reason to exist.

### Rules
- each file should have a focused purpose
- each module should own a clearly defined area
- do not mix UI rendering, persistence, and battle truth in one file
- avoid giant god-files and god-services
- keep shared battle logic in shared packages
- keep app-layer code focused on rendering, orchestration, and local device behavior
- keep content data out of random screen components

### Asset/runtime rule
The runtime app should depend on exported app-ready assets, not proprietary design-tool project formats.

That means the app should consume formats like:
- png / webp
- svg where appropriate
- audio exports
- standard font assets

The app should not require Adobe project files to function at runtime.

### Source-art rule
If source design files are ever kept in the repo, they should be clearly separated from runtime assets and should not complicate ordinary developer setup.

---

## 17. Feature Flags and Unfinished Work

Words 'n Wands! should never leave confusing half-built features exposed casually.

### Rules
- unfinished features should be hidden or cleanly disabled in development-only paths
- do not expose dead-end buttons
- do not ship fake daily/weekly, async, journal, event, or store surfaces
- if a feature is incomplete, it should remain clearly non-player-facing

The app should feel intentional, even while under development.

---

## 18. Acceptable AI-Generated Code

AI-generated code is allowed, but only under strict standards.

### What counts as acceptable AI-generated code in this repo?

Acceptable AI-generated code must:

- follow Words 'n Wands! docs and source-of-truth behavior
- keep battle truth out of random UI/helpers
- use boring, descriptive naming
- avoid speculative abstractions
- avoid dependency creep
- include or update tests when changing battle-truth behavior
- clearly separate canonical encounter state from device-local transient UI state
- not expose fake unfinished features
- not invent product behavior where the docs are explicit

### AI-generated code is not acceptable if it:
- silently changes move rules, damage rules, countdown rules, spell rules, or encounter result rules
- silently changes validation behavior
- duplicates rule logic across multiple layers
- hides board truth inside animation code
- adds libraries without clear justification
- introduces cleverness that makes future maintenance harder
- skips tests for critical gameplay-truth changes
- treats “it ran once” as proof that the implementation is good

### Human review rule
All AI-generated code that touches any of these must be reviewed carefully:

- validation rules
- element-tag rules
- board generation/refill
- dead-board detection and recovery
- damage application
- countdown behavior
- creature spell behavior
- encounter result transitions
- save/restore logic
- dependency changes
- app architecture

### Special rule for AI-generated content/tooling
AI may assist with:
- encounter scaffolding
- typed content scaffolding
- validation tooling scaffolding
- review checklists

AI must not be the final authority for:
- fairness sign-off
- battle-balance sign-off
- family-friendly tone sign-off
- live canonical content approval later

---

## 19. Code Review Standards

Reviews should focus on substance, not style nitpicks already enforced automatically.

### Reviewers should check
- does this match the docs?
- does this preserve battle truth and player trust?
- does this create hidden behavior?
- is this simpler than the alternatives?
- is naming clear?
- is the dependency really justified?
- are required tests present?
- does this increase Android app fragility unnecessarily?
- does this create future restore/state confusion?
- does this keep the product family-friendly and readable?
- if battle-critical numeric docs are touched, do all referenced formula-version identifiers match the canonical version?

### Review principle
A change should not be approved just because it technically passes if it makes the codebase harder to understand later.

---

## 20. Merge Standards

A PR is not ready to merge unless:

- CI passes
- required tests exist and pass
- changed docs and code still agree
- no obvious scope creep remains in the PR
- no fake unfinished surface is being exposed
- any AI-generated logic in critical paths has been reviewed carefully

If a PR changes battle truth but does not mention that explicitly in the summary, it is not ready.

---

## Appendix A. Spec Conflict Resolution

This appendix defines the required process for resolving conflicts between docs when battle-critical numeric semantics are involved.

### A.1 Battle-critical numeric precedence order

For formulas, multiplier values, evaluation order, clamping, and rounding:

1. `docs/implementation-contracts.md` is authoritative for canonical combat math and rounding behavior.
2. `docs/game-rules.md` is authoritative for player-facing gameplay explanation and must mirror the canonical formula version from implementation contracts.
3. `docs/word-validation-and-element-rules.md` may reference damage behavior context, but must not override canonical combat math.
4. If code disagrees with docs, code is not authoritative; reconcile docs first, then update code and tests.

Authoritative rounding rule: the canonical source is `docs/implementation-contracts.md` (including tie behavior and shared helper contract).

### A.2 Required same-PR updates for canonical combat math changes

Any PR that changes canonical combat math (formula, multipliers, evaluation order, clamp policy, or rounding semantics) must include all of the following in the **same PR**:

- canonical combat math version bump in `docs/implementation-contracts.md`
- dependent doc updates that reference the changed math semantics (at minimum `docs/game-rules.md`; plus any other impacted focused docs)
- deterministic fixture updates for affected automated tests (including shared battle-logic fixtures and expected outputs tied to the changed formula version)

If any one of the three is missing, the PR is not merge-ready.

### A.3 Conflict discovered checklist (required in PR description/final report)

When a conflict is discovered, include this checklist verbatim and complete each item:

- [ ] **Conflicting docs/sections identified** (list exact doc paths + section names)
- [ ] **Chosen interpretation stated** (which rule is being used now)
- [ ] **Fairness/trust impact justified** (why this interpretation preserves deterministic, fair player outcomes)
- [ ] **Mandatory follow-up doc edits listed** (explicit docs/sections that must be reconciled next)

This checklist is mandatory whenever battle-critical docs disagree, even if no code changes are included in the PR.

### A.4 Source-of-truth conflict decision governance (all blocking spec conflicts)

When a blocking source-of-truth conflict is identified, this governance flow is mandatory.

#### Decision owner (single accountable approver)
- Exactly one decision owner must be assigned per conflict.
- The decision owner is the single accountable approver for the resolution outcome.
- The decision owner must be named in the conflict-tracking entry and in the PR/final report.

#### Turnaround SLA
- Blocking spec conflicts require a resolution decision within **48 hours** of conflict identification.
- If the 48-hour window is at risk, escalation must be recorded in the same conflict-tracking entry.

#### Temporary implementation rule while blocked
- While a blocking source-of-truth conflict remains unresolved, contributors must **freeze the affected feature branch scope**.
- No merge is allowed for changes that depend on the disputed rule until the conflict is formally resolved.

#### Required closure artifacts
Every resolved conflict must include all of the following artifacts:
- updated canonical doc section reflecting the approved interpretation
- explicit version/date stamp in the updated canonical section
- linked completed conflict-template entry (from Appendix A.3 checklist) documenting the decision

#### Merge gate
- **No merge is allowed with an unresolved source-of-truth conflict.**
- A conflict is considered unresolved until the decision owner approves and all required closure artifacts are present in the PR.

---

## 21. Practical Summary

Words 'n Wands! engineering should follow this practical standard:

- slower but cleaner
- TypeScript-first
- Expo-friendly and Android-realistic
- pnpm only
- Prettier + ESLint + TypeScript + tests are mandatory
- Vitest for shared logic
- React Native Testing Library + jest-expo where app behavior needs testing
- SQLite for important local truth
- shared packages own battle truth and validation truth
- UI does not define game semantics
- logs stay useful but do not become noise
- gameplay-critical systems require real tests
- CI must pass before merge
- AI must follow the docs, not improvise them

If Words 'n Wands! sticks to these standards, the codebase should stay understandable, maintainable, and much harder to accidentally ruin.
