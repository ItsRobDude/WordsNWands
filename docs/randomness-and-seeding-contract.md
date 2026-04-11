# Randomness and Seeding Contract (v1)

This document locks deterministic randomness behavior for encounter runtime systems.

It exists to prevent fairness drift, replay mismatches, and restore inconsistencies across devices or app sessions.

---

## 1. Scope and goals

This contract covers:

- encounter board generation
- refill generation after valid casts
- creature spell random targeting
- Spark Shuffle behavior
- persistence requirements for deterministic resume
- determinism test requirements

This contract does **not** define cryptographic security requirements.  
RNG in v1 is for game fairness and reproducibility.

---

## 2. Canonical RNG requirement (v1)

v1 uses a **required interface + approved implementation list** model.

### 2.1 Required interface

All runtime RNG implementations must expose:

```ts
export interface EncounterRng {
  nextUint32(): number; // 0..4294967295 inclusive
  nextFloat01(): number; // [0, 1)
  snapshotState(): string; // deterministic serialized internal state
  restoreState(state: string): void;
}
```

Rules:

- `nextUint32()` is the canonical primitive.
- `nextFloat01()` must be derived from `nextUint32()` only.
- RNG state must be serializable/restorable without loss.
- RNG output must be platform-stable across supported builds.

### 2.2 Approved implementations (v1)

The only approved v1 generator algorithms are:

1. **PCG32 (XSH RR 64/32 variant)** — preferred default.
2. **xoroshiro128\*\*** — allowed alternative for parity with existing content tools.

No other algorithm may be used in encounter runtime without updating this contract and version pins.

---

## 3. Seed material and normalization

### 3.1 Encounter root seed

Each encounter session must have exactly one `encounter_seed`:

- format: 32 lowercase hex chars (128 bits)
- generated once at encounter creation (or supplied by fixed-seed test mode)
- immutable for that encounter session

### 3.2 Derivation function

All subsystem seeds derive from the root seed using:

`SHA-256(utf8("wnw:v1:" + encounter_seed + ":" + label))`

Then take the first 16 bytes (128 bits) as the derived seed for that label.

Label comparison is exact and case-sensitive.

---

## 4. Stream topology (v1)

v1 uses **isolated deterministic substreams**.  
It does **not** use one shared mutable stream for all subsystems.

Substream labels:

- `board_init`
- `board_refill`
- `spell_targeting`
- `spark_shuffle`

Rules:

- Each label has its own RNG state.
- A subsystem must consume only from its own substream.
- One subsystem must not advance another subsystem’s state.
- Adding new calls in one subsystem must not alter outputs in other subsystems.

---

## 5. Exact seed derivation + consumption rules

### 5.1 Encounter initial board generation

- RNG stream: `board_init`
- Seed label: `board_init`
- Consumption rule: consume only for initial board tile selection, Wand assignment checks, and any internal retries needed to satisfy “playable board” requirements.
- Per-tile execution order is fixed:
  1. select base letter for tile slot,
  2. evaluate Wand marker assignment for that same slot.
- Wand assignment draw semantics:
  - letter selection and Wand assignment must not share a single draw.
  - Wand assignment consumes one additional `nextUint32()` draw per generated tile slot when `allowWandTiles = true`.
  - when `allowWandTiles = false`, Wand assignment is skipped and consumes no draw.
- `board_init` state is persisted after initial generation.

### 5.2 Refill generation after cast

- RNG stream: `board_refill`
- Seed label: `board_refill`
- Consumption rule: consume only for selecting newly spawned letters during refill, Wand assignment checks for those spawned tiles, and refill retries (if required by board safety checks).
- Per-spawned-tile execution order is fixed:
  1. select base letter for spawned slot,
  2. evaluate Wand marker assignment for that same slot.
- Wand assignment draw semantics:
  - letter selection and Wand assignment must not share a single draw.
  - Wand assignment consumes one additional `nextUint32()` draw per spawned tile slot when `allowWandTiles = true`.
  - when `allowWandTiles = false`, Wand assignment is skipped and consumes no draw.
- Collapse movement itself is deterministic and non-random.
- Refill retries (if required by board safety checks) consume from `board_refill` only.
- One `board_refill` draw maps to weighted letter selection using `RuntimeBoardConfig.letterWeightEntries` from `docs/implementation-contracts.md` §8.3.
- Mapping rule for each spawned tile:
  1. validate and normalize configured weights (`A`..`Z`, unique letters, finite `weight > 0`, deterministic `A`..`Z` ordering),
  2. compute `totalWeight = Σ(weight)`,
  3. draw `r = nextUint32()`,
  4. compute threshold `t = (r / 2^32) * totalWeight`,
  5. select the first cumulative range in canonical `A`..`Z` order where `cumulativeWeight > t`.
- Exactly one `nextUint32()` consumption is used per spawned tile letter attempt.
- If safety validation fails before any draw attempt, refill must reject the active config and switch to deterministic failure handling (no silent fallback profile substitution).
- If post-refill board-level safety checks fail (for example, dead-board detection under current fairness rules), refill retry attempts are allowed and must consume additional draws from `board_refill` only.
- Retry behavior must preserve deterministic parity: same seed + same cast sequence + same profile/version must produce identical accepted/rejected refill attempt sequence.

### 5.3 Creature spell random targeting

- RNG stream: `spell_targeting`
- Seed label: `spell_targeting`
- Applies only to spell behaviors authored as `random_eligible`.
- Eligibility filtering order must be deterministic before random index selection.
- Each random pick consumes exactly one `nextUint32()` draw unless documented otherwise in spell-specific contracts.

### 5.4 Spark Shuffle

- RNG stream: `spark_shuffle`
- Seed label: `spark_shuffle`
- Spark Shuffle must use Fisher–Yates shuffle with draws from this stream only.
- Post-shuffle “board is playable” checks and any required re-shuffle attempts consume from this same stream.
- `max_shuffle_retries_per_recovery_cycle` is a canonical v1 constant set to `3`.
- Emergency-regeneration deterministic lineage is explicit:
  - branch input is the active `spark_shuffle` stream state at retry-cap hit,
  - emergency attempt stream states are derived deterministically from that branch input (no `board_init`/`board_refill`/`spell_targeting` borrowing),
  - branch lineage and resulting state must be persisted for deterministic replay.
- Emergency-regeneration board-construction attempt order is fixed:
  - attempts execute in strictly increasing attempt index order (`attempt_index = 0..N-1`),
  - within each attempt, tiles are generated in row-major slot order,
  - per slot, consume letter draw first, then optional Wand-assignment draw.
- Emergency-regeneration acceptance predicate is required:
  - accept candidate only when `hasPlayableWord(...)` returns `true`,
  - `hasPlayableWord(...)` must execute against the active pinned validation lookup for `validation_snapshot_version_pin` (no alternate lexicon fallback).
- Emergency-regeneration retries are bounded:
  - if acceptance is not reached within bounded retry budget, terminal fallback is mandatory,
  - terminal fallback is encounter transition to `recoverable_error` with retry CTA payload parity guarantees.
- Required telemetry for Spark Shuffle emergency branch must include:
  - `spark_shuffle_retries_attempted`
  - `spark_shuffle_retry_cap_hit`
  - `spark_shuffle_fallback_outcome`
  - `emergency_regen_attempt_count`
  - `emergency_regen_acceptance_result`
  - `validation_snapshot_version_pin`
- If product wants “guaranteed anchor words,” anchors must be a versioned content artifact pinned to validation snapshot versions; implicit external frequency lists (for example ad-hoc “top-1000” lists) are forbidden in runtime recovery logic.
- If retry cap is reached and board is still dead, fallback sequence is mandatory:
  1. regenerate board via deterministic emergency seed branch
  2. if still dead, end encounter safely in recoverable error state with retry CTA
- Retry-cap fallback must preserve fairness: no additional move consumption and no countdown decrement/reset.

---

## 6. Snapshot + resume requirements

### 6.1 Required persisted fields

Active encounter snapshots must persist:

- `encounter_seed`
- RNG algorithm id/version (for compatibility checks)
- per-substream serialized state for:
  - `board_init`
  - `board_refill`
  - `spell_targeting`
  - `spark_shuffle`

### 6.2 Resume behavior

On restore:

1. Load encounter board/creature/session state.
2. Restore all RNG substream states exactly.
3. Continue runtime from restored substream states.

Restore must not re-derive fresh substream states from root seed when snapshot state exists.

### 6.3 Backward-compatibility rule

If snapshot RNG metadata is incompatible with the running engine version, restore handling must fail safely and follow explicit migration/fallback policy from implementation contracts (never silently continue with different randomness behavior).

---

## 7. Determinism test requirements

Required automated tests:

1. **Cast-sequence determinism**
   - Given same content version, same `encounter_seed`, and same valid-cast sequence:
   - board states, countdown states, creature HP, spell targets, and encounter outcome must be identical at each step.

2. **Mid-encounter restore parity**
   - Save snapshot mid-encounter.
   - Continue run A uninterrupted.
   - Restore snapshot into run B and continue with same cast sequence.
   - Runs A and B must produce identical subsequent board/countdown/HP/targets/outcome.

3. **Substream isolation guard**
   - Introduce additional random consumption in one subsystem in a test harness.
   - Verify unrelated subsystem outputs remain unchanged for same seed and cast sequence.

4. **Spark Shuffle determinism**
   - For fixed seed and fixed pre-shuffle board, resulting shuffle sequence and playable-board retry count must match across repeated runs.

5. **Spark Shuffle retry-cap determinism**
   - For fixed seed and a crafted pre-shuffle dead-board case that reaches `max_shuffle_retries_per_recovery_cycle`, fallback outcome must be deterministic.
   - If emergency branch succeeds, regenerated board must match across repeated runs.
   - If emergency branch fails, recoverable error termination state and retry CTA payload must match across repeated runs.

---


## 8. Deterministic fixture contract (required)

Determinism tests in §7 must be backed by version-pinned JSON fixtures rather than ad-hoc inline setup.

### 8.1 Canonical fixture schema (required keys)

Every deterministic fixture JSON file must include all of the following top-level keys:

- `fixture_schema_version` (string; current value: `"rng_fixture_v1"`)
- `fixture_id` (string; stable identifier used by tests/CI)
- `encounter_id` (string; authored encounter id)
- `content_bundle_version` (string; exact content bundle/version pin)
- `rules_version` (string; battle-rules/version pin used by runtime)
- `rng_contract_version` (string; this contract version pin, currently `"v1"`)
- `rng_algorithm_id` (string; must match approved v1 algorithm id)
- `encounter_seed` (string; 32 lowercase hex chars)
- `cast_sequence` (array of cast-attempt records in execution order)
- `expected_steps` (array of per-step expected state snapshots)

Each `cast_sequence` record must include:

- `step_index` (integer, 0-based)
- `attempted_word` (string)
- `expected_acceptance` (`"accepted" | "rejected"`)
- `expected_rejection_reason` (nullable string; required when rejected)

Each `expected_steps` record must include:

- `step_index` (integer, 0-based)
- `creature_hp` (integer)
- `creature_countdown` (integer)
- `moves_remaining` (integer)
- `repeated_words` (array of strings; canonical normalized forms tracked so far)
- `session_state` (object with at least `status` and `failure_reason` nullable fields)

Rules:

- `cast_sequence.length` must exactly equal `expected_steps.length`.
- Every `step_index` must be contiguous and match between the two arrays.
- Fixture loader/validator must reject missing keys, unknown `fixture_schema_version`, and invalid enum values.
- Encounter/content/rules/version pins are mandatory to prevent hidden fixture drift when authored data changes.

### 8.2 Minimum required fixture set

At minimum, v1 must ship and keep green the following deterministic fixtures:

1. `starter_intended_path`
   - Starter encounter happy-path sequence leading to intended starter win state.
2. `repeat_word_rejection`
   - Demonstrates repeated-word rejection behavior and confirms no illegal state drift.
3. `mid_encounter_restore_parity`
   - Includes a documented save step and verifies uninterrupted vs restored parity from that point onward.
4. `spark_shuffle_retry_cap_determinism`
   - Crafted dead-board sequence that deterministically reaches retry cap behavior.
5. `starter_loss_retry_win_gate` *(required only when starter gate is in active milestone scope, e.g., M1/M2 if applicable)*
   - Verifies starter loss → retry → win gate behavior parity under fixed seed/version pins.

### 8.3 Fixture storage conventions

Fixture files must live under the game-rules fixture path and use deterministic naming:

- Directory root: `fixtures/game-rules/randomness/`
- File naming: `<fixture_id>.fixture.json`
- Optional expected-output snapshots (if separated): `<fixture_id>.expected.json`

Conventions:

- One fixture scenario per file.
- No generated timestamp fields in committed fixtures.
- Fixture id in filename must match `fixture_id` inside the file.

### 8.4 CI schema validation gate (required)

CI must validate every committed fixture in `fixtures/game-rules/randomness/` against the canonical schema before running determinism tests.

Required CI behavior:

1. Fail fast on schema violations (missing required fields, enum mismatch, invalid pins, or index mismatch).
2. Fail on unknown fixture ids referenced by deterministic test suites.
3. Fail on missing required minimum fixture set from §8.2 for the active milestone scope.
4. Run deterministic runtime validation using the fixture payloads only after schema validation passes.

---

## 9. Versioning and change control


Any change to:

- RNG algorithm implementation
- derivation function
- substream labels/topology
- random-consumption semantics in encounter-critical flows

must:

1. increment the relevant version pin(s),
2. update this document,
3. update implementation contracts,
4. update determinism tests accordingly.
