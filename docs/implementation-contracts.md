# Words 'n Wands! Implementation Contracts

This document defines stable TypeScript-facing contracts for battle state, persisted entities, content runtime validation, and analytics-safe event shapes.

Its purpose is to eliminate implementation guessing in app and package code.

When implementation details need to change, update this file first and version changes intentionally.

This document is especially important because Words 'n Wands! is being built with heavy AI assistance.  
If the contracts are vague, the code will drift.

---

## 1. Contract Stability Rules

- Contract names and field names in this file are **stable** once used in production code.
- Additive change is preferred over breaking change.
- Breaking contract changes require:
  - contract version bump
  - migration/update notes
  - updates to dependent docs and tests in the same change
- UI-facing convenience state may evolve, but must map cleanly to the canonical contracts below.

### Practical rule
If a type or persisted shape is likely to be read or written by:

- app screens
- Zustand stores
- shared battle logic
- persistence services
- content loaders
- validation lookup services
- analytics adapters

then it belongs in a stable contract here rather than being redefined ad hoc in multiple files.

---

## 2. Core Shared Type Contracts

These contracts define the stable shared vocabulary used across app, gameplay, validation, and persistence layers.

### 2.1 Element and gameplay enums

```ts
export type ElementType =
  | 'flame'
  | 'tide'
  | 'bloom'
  | 'storm'
  | 'stone'
  | 'light'
  | 'arcane';

export type NonNeutralElementType = Exclude<ElementType, 'arcane'>;

export type EncounterType = 'standard' | 'boss' | 'event';

export type DifficultyTier = 'gentle' | 'standard' | 'challenging' | 'boss' | 'event';

export type TileStateKind = 'frozen' | 'sooted' | 'dull' | 'bubble';

export type TileSpecialMarkerKind = 'wand';

export type MatchupResult = 'weakness' | 'neutral' | 'resistance';

export type EncounterOutcome = 'won' | 'lost';

export type EncounterTerminalReasonCode =
  | 'none'
  | 'normal_win'
  | 'moves_exhausted'
  | 'manual_abandon'
  | 'spark_shuffle_retry_cap_unrecoverable';

export type CastSubmissionKind = 'valid' | 'invalid' | 'repeated';

export type CastRejectionReason =
  | 'illegal_path'
  | 'too_short'
  | 'not_in_lexicon'
  | 'blocked_by_tile_state'
  | 'repeated_word';
```

### 2.2 Session and routing enums

```ts
export type EncounterSessionState =
  | 'unopened'
  | 'intro_presented'
  | 'in_progress'
  | 'won'
  | 'lost'
  | 'recoverable_error'
  | 'abandoned';

export type EncounterSessionTransition =
  | 'open_encounter'
  | 'dismiss_intro'
  | 'submit_valid_cast'
  | 'submit_invalid_cast'
  | 'submit_repeated_cast'
  | 'resolve_creature_spell'
  | 'trigger_spark_shuffle'
  | 'spark_shuffle_unrecoverable_failure'
  | 'win'
  | 'lose'
  | 'restart'
  | 'abandon';

export type AppPrimarySurface =
  | 'starter_flow'
  | 'home'
  | 'encounter'
  | 'result'
  | 'settings'
  | 'profile';

export type StarterTutorialCueStage =
  | 'none'
  | 'cue_01_trace_word'
  | 'cue_02_release_to_cast'
  | 'cue_03_read_countdown'
  | 'cue_04_watch_creature_spell'
  | 'cue_05_loss_retry_prompt'
  | 'cue_06_win_next_step'
  | 'completed';

export type StarterTutorialBlockState = 'none' | 'blocked' | 'non_blocking';
```

Rules:

- `won`, `lost`, `recoverable_error`, and `abandoned` are terminal encounter states.
- Invalid and repeated casts do **not** leave `in_progress`.
- Result acknowledgement is UI-local and must not rewrite canonical outcome state.
- Restart creates a new encounter run; it does not mutate a completed result into an unfinished state.
- `StarterTutorialCueStage` tracks deterministic first-time cue progression and must align with `docs/screens-and-session-flow.md` section 5 cue ordering.

---

## 3. Canonical Encounter State Contracts

These contracts describe canonical encounter state and transition legality.

### 3.1 Canonical encounter transition rules

```ts
export type EncounterStateTransitionMap = {
  unopened: 'intro_presented' | 'in_progress' | 'abandoned';
  intro_presented: 'in_progress' | 'abandoned';
  in_progress: 'in_progress' | 'won' | 'lost' | 'recoverable_error' | 'abandoned';
  won: never;
  lost: never;
  recoverable_error: never;
  abandoned: never;
};
```

Rules:

- `unopened` is allowed only before a run truly starts.
- `intro_presented` exists so the encounter-intro surface can be restored or skipped cleanly without hiding that state inside UI code.
- `in_progress` is the only active playable state.
- `won`, `lost`, `recoverable_error`, and `abandoned` are terminal canonical states for a specific encounter session.
- `recoverable_error` is required for Spark Shuffle retry-cap fallback where deterministic emergency regeneration also fails.
- Restarting an encounter means creating a new session record rather than mutating a terminal session back to `in_progress`.

### 3.2 Encounter route restoration contract

```ts
export interface EncounterRestoreTarget {
  surface: AppPrimarySurface;
  encounter_session_id: string | null;
  encounter_id: string | null;
  result_record_id: string | null;
}
```

Rules:

- restore routing should be derived from persisted encounter/session truth, not guessed from the last visible screen alone
- a resolved encounter (including `recoverable_error`) should restore to `result`, not fake `in_progress`
- if an unresolved active encounter exists, restore should prefer `encounter`
- restore priority order should be: terminal encounter result (`won` / `lost` / `recoverable_error`) -> unresolved active encounter (`unopened` / `intro_presented` / `in_progress`) -> `starter_flow` gate -> `home`
- if no active encounter exists and the player has not completed starter flow, restore should prefer `starter_flow`
- otherwise restore should prefer `home`

### 3.3 Launch/resume phase contract

This contract defines the required blocking startup/restore sequence for warm resume and cold launch.

Anchor references:

- section 3.2 restore-priority routing rules in this document
- section 7.5 `active_encounter_snapshots` restore payload requirements in this document
- section 8.0 manifest load/validation gating rules in this document
- `docs/technical-architecture.md` section 14 (Persistence Architecture) and section 15 (Session Restore Architecture)

```ts
export type LaunchResumePhase =
  | 'app_init'
  | 'profile_load'
  | 'manifest_validate'
  | 'validation_hydrate'
  | 'active_snapshot_load'
  | 'restore_target_derive'
  | 'route_commit';

export interface LaunchResumeTransitionState {
  phase: LaunchResumePhase;
  attempt_id: string;
  started_at_utc: string;
  completed_phases: LaunchResumePhase[];
  restore_target: EncounterRestoreTarget | null;
}
```

#### Phase 1: `app_init`

- Inputs: process start or foreground resume signal; last-known app version/build metadata.
- Outputs: initialized startup context (`attempt_id`, timestamps, startup reason).
- Blocking conditions: startup context initialization must complete before persistence/content reads begin.
- Failure modes + fallback routes:
  - startup context build fails => route to safe `home` shell with no encounter auto-restore and emit recoverable startup error surface.
- Telemetry hooks (non-blocking): `session.resume` with `phase='app_init'`, reason (`cold_launch`/`warm_resume`), and `attempt_id`.
- Atomicity boundary: no SQLite read transaction required in this phase.
- Timeout/retry boundary: single retry permitted for transient bootstrapping failures; after retry failure, continue to safe `home`.
- Duplicate-resolution invariant: this phase must not read or mutate encounter state.

#### Phase 2: `profile_load` (SQLite)

- Inputs: startup context from phase 1, SQLite connection.
- Outputs: persisted settings/profile/tutorial gate snapshot required for `starter_flow` vs `home` decisions.
- Blocking conditions: restore routing cannot be finalized without profile/tutorial gate truth.
- Failure modes + fallback routes:
  - SQLite unavailable/corrupt => fall back to conservative default profile state and route to `starter_flow` gate path, never directly into active encounter.
- Telemetry hooks (non-blocking): phase duration metric, load status (`ok`/`fallback_default`), SQLite error category.
- Atomicity boundary: read settings/profile rows in one read transaction so gate decisions come from one consistent snapshot.
- Timeout/retry boundary: bounded retries for opening DB handle; no unbounded polling loops.
- Duplicate-resolution invariant: profile load is read-only and cannot advance encounter/session transitions.

#### Phase 3: `manifest_validate`

- Inputs: runtime content package manifest candidate(s), active runtime version pins.
- Outputs: validated active manifest reference with matching `content_version`, `validation_snapshot_version`, `battle_rules_version`, and `board_generator_version`.
- Blocking conditions: manifest validation must pass before loading encounter definitions or validation snapshot data (section 8.0).
- Failure modes + fallback routes:
  - `schema_invalid` or `version_pin_mismatch` => fail closed for encounter restore; route to non-encounter safe surface (`home` or startup error panel) with encounter launch disabled.
- Telemetry hooks (non-blocking): manifest id/version, failure code, pin mismatch fields.
- Atomicity boundary: manifest selection + validation decision must be committed as one in-memory decision unit (no partial activation).
- Timeout/retry boundary: retry once for transient local read failure; no retries for deterministic schema/pin errors.
- Duplicate-resolution invariant: no encounter snapshot is interpreted against an unvalidated manifest.

#### Phase 4: `validation_hydrate`

- Inputs: validated manifest and `validation_snapshot_version` pin from phase 3.
- Outputs: process-global in-memory `ValidationSnapshotLookup` bound to the active snapshot version (section 9.4).
- Blocking conditions: encounter restore is blocked until validation lookup hydration succeeds.
- Failure modes + fallback routes:
  - hydration/read failure => skip encounter restore and route to non-encounter safe surface (`home`/error), preserving persisted encounter data for later retry.
- Telemetry hooks (non-blocking): hydration latency, snapshot version, load result.
- Atomicity boundary: hydration publishes lookup only after full successful load; partial lookup instances must not be exposed.
- Timeout/retry boundary: bounded retry for transient read/decode errors; abort phase after retry cap.
- Duplicate-resolution invariant: dead-board/cast replay parity rules require one active lookup instance; mixed snapshot-version lookups in one attempt are forbidden.

#### Phase 5: `active_snapshot_load`

- Inputs: SQLite handle, validated pins, hydrated validation lookup handle.
- Outputs: zero-or-one canonical `active_encounter_snapshots` restore candidate plus optional terminal result reference.
- Blocking conditions: restore target derivation cannot run until snapshot query completes.
- Failure modes + fallback routes:
  - missing snapshot => continue with no active encounter and derive `starter_flow`/`home`.
  - corrupted snapshot payload => treat as unusable restore candidate; do not attempt partial reconstruction; fall back to `home` or `starter_flow`.
  - pin mismatch between snapshot and active runtime => do not restore encounter; route to safe non-encounter surface.
- Telemetry hooks (non-blocking): snapshot presence flag, session state, rejection reason.
- Atomicity boundary: read restore-critical snapshot/profile rows under one SQLite read transaction so route derivation uses a coherent point-in-time view.
- Timeout/retry boundary: bounded read retries for locked DB/transient I/O only.
- Duplicate-resolution invariant: this phase is strictly read-only; it must not re-run pending battle-resolution steps.

#### Phase 6: `restore_target_derive`

- Inputs: profile gate state, optional snapshot candidate, optional result row, section 3.2 restore priority.
- Outputs: one `EncounterRestoreTarget` decision.
- Blocking conditions: route commit is blocked until exactly one restore target is produced.
- Failure modes + fallback routes:
  - ambiguous/corrupt state graph => choose conservative fallback (`starter_flow` if gate incomplete, else `home`) and mark restore as degraded.
- Telemetry hooks (non-blocking): chosen surface, decision path (`terminal_result`, `active_encounter`, `starter_flow`, `home`), degraded flag.
- Atomicity boundary: pure derivation; no persistence writes.
- Timeout/retry boundary: no retries required for deterministic derivation.
- Duplicate-resolution invariant: terminal sessions (`won`/`lost`/`recoverable_error`) must map to `result`; unresolved sessions map to `encounter`; no branch may perform game-state mutation.

#### Phase 7: `route_commit`

- Inputs: finalized `EncounterRestoreTarget`.
- Outputs: exactly one initial route transition committed to router state.
- Blocking conditions: input acceptance remains locked until route commit result is known.
- Failure modes + fallback routes:
  - router commit failure => fallback commit to `home` and keep encounter state unchanged for later manual resume.
- Telemetry hooks (non-blocking): route commit outcome, target surface, commit latency.
- Atomicity boundary: commit exactly one initial route transition; avoid multi-commit race on same `attempt_id`.
- Timeout/retry boundary: one immediate retry permitted for transient router readiness, then fallback to `home`.
- Duplicate-resolution invariant: once a route is committed for an `attempt_id`, additional commits are no-op; restore flow must be idempotent per launch/resume attempt.

Global invariants for all phases:

- restore orchestration is read-then-route; it must not replay cast resolution, reapply damage, consume moves, or retrigger creature actions (`docs/technical-architecture.md` section 15.3).
- restore is authoritative from persisted state, not last rendered screen history (`docs/technical-architecture.md` sections 15.1-15.2).
- persisted state consumed for restore must represent safe checkpoints, not half-animation state (`docs/technical-architecture.md` section 14.5).

---

## 4. Board and Battle Runtime Contracts

These interfaces define the canonical battle-state shape consumed by app and shared logic.

### 4.1 Board cell contracts

```ts
export interface BoardPosition {
  row: number; // 0-based
  col: number; // 0-based
}

export interface BoardTile {
  tile_id: string;
  letter: string; // normalized uppercase A-Z for runtime board storage
  row: number;
  col: number;
  tile_state: TileStateKind | null;
  special_marker: TileSpecialMarkerKind | null;
}
```

Rules:

- `row` and `col` are 0-based indexes
- each tile occupies exactly one board position
- a tile may have at most one negative `tile_state`
- a tile may have at most one `special_marker`
- runtime board storage should use normalized uppercase letters for stability and cheap comparisons

Tile-state runtime behavior locks:

- negative tile states tick down only after successful valid cast resolution
- invalid or repeated submissions must not tick down tile-state duration
- Frozen duration: 1 successful cast; blocked from selection during that cast window
- Sooted duration: 2 successful casts; applies one non-stacking `0.75` damage multiplier if used
- Dull duration: 2 successful casts; if used with non-Arcane word, matchup resolves as Arcane/neutral
- Bubble duration: 1 successful cast; after next refill step, surviving Bubble tiles rise to top of column and clear

### 4.2 Board snapshot contract

```ts
export interface BoardSnapshot {
  rows: 6;
  cols: 6;
  tiles: BoardTile[];
  encounter_seed: string;
  rng_algorithm_id: 'pcg32_xsh_rr_64_32' | 'xoroshiro128ss';
  rng_stream_states: EncounterRngStreamStates;
}
```

Rules:

- `tiles.length` must always equal `rows * cols` for a valid active board
- every `row` and `col` pair must be unique
- `encounter_seed` is required and must be immutable for the encounter session
- `encounter_seed` format is 32 lowercase hex chars (128-bit)
- `rng_algorithm_id` must match the active RNG contract implementation
- `rng_stream_states` must include deterministic serialized state for every required encounter substream
- the board snapshot is canonical gameplay truth, not derived presentation state

`EncounterRngStreamStates` contract:

```ts
export interface EncounterRngStreamStates {
  board_init: string;
  board_refill: string;
  spell_targeting: string;
  spark_shuffle: string;
  hidden_bonus_word_selection: string;
}
```

Rules:

- each stream state is a deterministic serialized RNG internal state blob
- restore must continue from these stored stream states (never regenerate from seed when snapshot state exists)
- stream labels and behavior must match `docs/randomness-and-seeding-contract.md`
- `hidden_bonus_word_selection` is optional to consume in encounters that do not author `hiddenBonusWordPolicy`, but its stored state is still required for deterministic replay parity

### 4.3 Creature runtime state contract

```ts
export interface CreatureRuntimeState {
  creature_id: string;
  display_name: string;
  encounter_type: EncounterType;
  difficulty_tier: DifficultyTier;
  max_hp: number;
  current_hp: number;
  weakness: NonNeutralElementType;
  resistance: NonNeutralElementType;
  base_countdown: number;
  current_countdown: number;
  spell_identity: string;
  phase_state: 'default' | 'phase_two' | 'special';
  has_matchup_shifted: 0 | 1;
}
```

Rules:

- ordinary creatures must keep `phase_state = 'default'`
- `has_matchup_shifted` should remain `0` for standard encounters
- `weakness` and `resistance` must never be equal
- bosses/events may use phase changes only if separately documented and clearly telegraphed
- HP must be represented as both `current_hp` and `max_hp` so UI and persistence do not infer missing values

### 4.4 Encounter runtime state contract

```ts
export interface EncounterRuntimeState {
  encounter_session_id: string;
  encounter_id: string;
  creature_state: CreatureRuntimeState;
  board: BoardSnapshot;
  session_state: EncounterSessionState;
  terminal_reason_code: EncounterTerminalReasonCode | null;
  move_budget_total: number;
  moves_remaining: number;
  repeated_words: string[]; // normalized lowercase words
  spark_shuffle_retry_cap: number;
  spark_shuffle_retries_attempted: number;
  spark_shuffle_fallback_outcome: 'none' | 'deterministic_emergency_regen' | 'recoverable_error_end';
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
  reward_constants_version_pin: string;
  damage_model_version: 'damage_model_v1';
}
```

Rules:

- `repeated_words` stores normalized cast history for repeat rejection
- `moves_remaining` must never exceed `move_budget_total`
- `terminal_reason_code` is required whenever `session_state` is terminal, and must be `spark_shuffle_retry_cap_unrecoverable` when `session_state = 'recoverable_error'`
- `spark_shuffle_retry_cap` must mirror the canonical v1 value (`3`) so restore/debug payloads do not infer hidden constants
- `spark_shuffle_retries_attempted` and `spark_shuffle_fallback_outcome` must persist the last Spark Shuffle recovery cycle outcome even when encounter terminates
- the five version pins above are required for restore/debug trust
- any change to locked milestone constants in `docs/milestone-locked-constants.md` requires corresponding version-pin updates in this contract file within the same change
- `damage_model_version` is required for deterministic restore/debug replay and must match the active canonical damage model contract version
- runtime state should be complete enough that battle resolution does not depend on hidden UI state

---

## 5. Cast and Resolution Contracts

These contracts describe how a cast submission and its result are represented between gameplay, persistence, and UI.

### 5.1 Cast submission contract

```ts
export interface CastSubmission {
  selected_positions: BoardPosition[];
  traced_word_display: string;
  normalized_word: string;
}
```

Rules:

- `traced_word_display` is for immediate UX/debug display
- `normalized_word` is the canonical lookup key
- the gameplay engine should not trust `traced_word_display` over `normalized_word`
- the board-path validator should confirm that the selected positions are legal for the current board

### 5.1.1 Companion input-binding contract (gesture trace -> `selected_positions`)

This companion contract defines the deterministic mapping from pointer gesture traces to `CastSubmission.selected_positions` so input UX and gameplay validation remain aligned.

Cross-document alignment requirements:

- cast feedback/lifecycle behavior must align with `docs/screens-and-session-flow.md` section 11 (**Core Battle Interaction Flow**, including Rejected Cast Feedback ordering)
- normalization behavior must align with `docs/word-validation-and-element-rules.md` section 5 (**Word Normalization Rules**)

Trace payload contract:

```ts
export interface TracePointerSample {
  pointer_id: number;
  x_px: number; // viewport-local board-space x coordinate in pixels
  y_px: number; // viewport-local board-space y coordinate in pixels
  t_ms: number; // monotonically increasing trace timestamp (ms)
}

export interface CastTracePayload {
  trace_id: string;
  phase: 'start' | 'move' | 'end' | 'cancel';
  samples: TracePointerSample[]; // ordered by t_ms ascending
}
```

Output contract:

```ts
export type BoundSelectedPositions = BoardPosition[];
```

Binding rules:

- only one active `pointer_id` may drive one cast trace at a time
- `samples` must be processed in ascending `t_ms`; out-of-order samples are ignored
- binding output is append-only during active tracing, except for explicit backtrack behavior below
- partial traces are represented as a transient, non-submitted `BoundSelectedPositions` candidate until lifecycle commit

Deterministic snapping rules (pointer coordinates -> tile cells):

- board geometry for snapping must come from the current rendered board bounds and fixed `rows=6`, `cols=6`
- each sample snaps to exactly one candidate cell using deterministic floor division into row/col buckets:
  - `col = clamp(floor((x_px - board_left_px) / cell_width_px), 0, cols - 1)`
  - `row = clamp(floor((y_px - board_top_px) / cell_height_px), 0, rows - 1)`
- samples outside board bounds do not append positions and do not mutate existing trace selection
- when multiple samples snap to the same cell consecutively, they collapse to a single effective cell visit (no duplicate append)
- the snapped position must reference the canonical board coordinate (`row`, `col`) at binding time

Path growth rules:

- legal transition requirement: every newly appended tile must be adjacent to the current tail tile, where adjacency includes horizontal, vertical, and diagonal (Chebyshev distance `<= 1`)
- non-adjacent jumps are disallowed and ignored for growth; trace remains at last legal tail tile
- tile reuse is disallowed within one submission candidate (no de-dup append of prior non-tail tiles)
- visual/geometric path crossing of rendered trace segments is allowed
- legality depends only on snapped tile sequence constraints (adjacency, no disallowed reuse, deterministic backtracking/no-op rules), not on segment-intersection geometry
- backtracking behavior is deterministic:
  - if the newly snapped tile equals the immediate predecessor of the current tail tile, pop the current tail tile (single-step rewind)
  - repeated backtrack samples may continue popping one tile per predecessor match
  - backtracking never inserts new duplicates; it only shortens the candidate path
- selecting a previously used non-predecessor tile does not mutate the path (remains no-op)

Deterministic contract example (path crossing vs. tile reuse):

- crossing rendered trace lines without selecting any tile twice remains legal
- any case that reselects a previously used non-predecessor tile remains no-op as defined above

Submission/cancel lifecycle:

- commit-on-release: when `phase = 'end'`, submission is committed only if current candidate path length is `>= 1`; committed payload writes `selected_positions` from current candidate path order
- discard-on-cancel: `phase = 'cancel'` always discards candidate trace and produces no `CastSubmission`
- discard-on-empty-release: `phase = 'end'` with empty candidate path produces no `CastSubmission`
- post-submit/reset rule: after `end` or `cancel`, transient candidate trace must clear before next trace start
- partial trace representation:
  - during `start`/`move`, keep candidate `selected_positions` as UI-transient only
  - partial candidate is never persisted as canonical cast history until a committed release occurs
- resolution-lock input discard rule (normative):
  - while encounter UI/runtime is in a **valid-cast resolution lock window** (from valid submission acceptance through section 5.3 step 19 finalize) or **creature-spell resolution lock window** (section 5.6 flow active), all incoming board-input trace payloads (`start`/`move`/`end`/`cancel`) must be ignored and discarded
  - lock-window traces must not create or mutate a candidate path, must not emit `CastSubmission`, and must not be buffered for later replay
  - when control returns after lock completion, input handling resumes from a clean idle state; no deferred auto-submit from previously discarded lock-window gestures is allowed

Deterministic contract example (lock-window gesture discard):

- scenario: board is mid-resolution after a valid cast (collapse/refill active), player begins a swipe gesture and releases before control returns
- expected binding/result:
  - no candidate path is retained after lock window
  - no `CastSubmission` is emitted for that swipe
  - no queued/deferred submission fires when board returns to `battle_input_ready`

Normalization coupling rules:

- `traced_word_display` must be derived from selected tiles in candidate order by concatenating tile letters exactly as displayed to the player during trace feedback
- committed `traced_word_display` for `CastSubmission` must be recomputed from committed `selected_positions` (never copied from stale UI text buffers)
- `normalized_word` must be derived from committed `traced_word_display` using canonical normalization policy in `docs/word-validation-and-element-rules.md` section 5 before lexicon lookup
- lexicon lookup and repeat-word checks must key on `normalized_word`, not on display-form text

### 5.2 Valid cast resolution contract

```ts
export interface ValidCastResolution {
  submission_kind: 'valid';
  normalized_word: string;
  element: ElementType;
  matchup_result: MatchupResult;
  used_wand_tile: boolean;
  base_damage: number;
  final_damage: number;
  moves_consumed: 1;
  countdown_before: number;
  countdown_after: number;
  did_trigger_creature_spell: boolean;
  did_trigger_spark_shuffle: boolean;
  did_win: boolean;
  did_lose: boolean;
}
```

### 5.2.1 Damage Model v1 (canonical)

Damage model version identifier:

- `damage_model_version = 'damage_model_v1'`

Canonical damage constants and formula contract for `damage_model_v1`:

- `base_damage = 8 + 3 * (word_length - 3) + max(0, word_length - 5)`
- matchup multipliers: weakness `1.5`, neutral `1.0`, resistance `0.7`, arcane `1.0`
- Wand multiplier: `1.25` when one or more selected Wand tiles are used, else `1.0`
- Soot multiplier: `0.75` when one or more selected Sooted tiles are used, else `1.0` (non-stacking)
- `raw_damage = base_damage * matchup_multiplier * wand_multiplier * soot_multiplier`
- rounding mode: round-half-up for non-negative values (same tie behavior as `Math.round`)
- minimum-damage floor: `final_damage = max(1, round_half_up(raw_damage))`

Damage Model v1 fingerprint string (must match docs consistency lint):

- `DMV1|base=8+3*(L-3)+max(0,L-5)|matchup=1.5,1.0,0.7,1.0|wand=1.25|soot=0.75|round=half_up|min=1`

Implementation/testing contract:

- runtime and tests that compute expected damage must import shared constants and helper from one canonical module (recommended path: `packages/game-rules/src/damage/damageModelV1.ts`)
- the canonical module must export the version identifier, constants, and `roundFinalDamage(rawDamage: number): number`

Damage-calculation rules for `ValidCastResolution`:

- use the canonical `Damage Model v1` constants/formula above; do not fork constants inline in runtime or tests
- `used_wand_tile = true` applies `wandMultiplier = 1.25`, otherwise `1.0`
- any cast that includes one or more Sooted tiles applies one `sootMultiplier = 0.75`
- `raw_damage = base_damage * matchupMultiplier * wandMultiplier * sootMultiplier`
- `final_damage = roundFinalDamage(raw_damage)`
- `roundFinalDamage` must use **round-half-up** for non-negative values (same tie behavior as `Math.round`): exact `.5` rounds up
- explicit tie example: `raw_damage = 16.5` resolves to `final_damage = 17`
- successful valid casts that reach damage resolution must clamp `final_damage >= 1`

### 5.3 Modifier evaluation order contract

The resolution pipeline below is mandatory for every **validated cast** (`submission_kind: 'valid'`) so damage, countdown behavior, and tile-state duration behavior remain deterministic.

1. Confirm validated cast inputs (`normalized_word`, selected tiles, and resolved base element) and snapshot `countdown_before`.
2. Mark selected tiles as consumed for this cast; consumed tiles are removed from active board occupancy.
3. Collapse affected columns downward.
4. Refill empty spaces from the top.
5. Apply Bubble post-refill motion for **surviving** Bubble tiles (rise to column top, shift others downward), then clear Bubble from those tiles. For multiple surviving Bubble tiles in one column, preserve original relative vertical order among surviving Bubble tiles: the Bubble tile with the smallest pre-rise row index becomes the highest Bubble after rise.
6. Resolve matchup candidate from cast element versus creature weakness/resistance.
7. Apply Dull override: if one or more selected tiles were Dull and cast element is non-Arcane, force matchup to Arcane/neutral (`matchup_result = 'neutral'`, `matchupMultiplier = 1.0`).
8. Resolve wand multiplier (`1.25` if any selected Wand tile, else `1.0`).
9. Resolve soot multiplier (`0.75` if one or more selected tiles were Sooted, else `1.0`; never stacks).
10. Compute preliminary damage: `round(base_damage * matchupMultiplier * wandMultiplier * sootMultiplier)`.
11. Apply minimum-damage clamp: if preliminary damage `< 1`, set `final_damage = 1`.
12. Apply `final_damage` to creature HP.
13. If HP reaches `0`, end encounter immediately in victory; skip countdown decrement, spell cast, and surviving tile-state duration decrement.
14. If creature survives, evaluate weakness stall against the **post-Dull** matchup result:
    - if matchup is `weakness`, keep countdown unchanged (`countdown_after = countdown_before`)
    - otherwise decrement countdown by `1`
15. If countdown reaches `0`, resolve creature spell and reset countdown to creature base countdown.
    - ordering lock: if the same valid cast both (a) leaves creature HP above `0`, (b) reaches countdown `0`, and (c) consumes the final remaining move, creature spell resolution from this step still executes before terminal loss finalization.
16. Decrement durations for surviving (non-consumed) negative tile states after cast resolution:
    - Frozen: decrement after this successful cast; clear when duration reaches `0`
    - Sooted: decrement after this successful cast; clear when duration reaches `0`
    - Dull: decrement after this successful cast; clear when duration reaches `0`
    - Bubble: already cleared in step 5 for surviving Bubble tiles; consumed Bubble tiles cleared at consumption
17. Run dead-board detection on the **fully resolved post-cast board** (after refill, Bubble resolution, creature spell resolution if any, and tile-state duration decrement).
18. If dead board is detected, trigger Spark Shuffle recovery immediately:
    - detection is required at step 17 for every non-terminal valid cast cycle
    - additional dead-board checks are allowed during internal spell primitive execution, but do not replace step 17
    - Spark Shuffle may chain/retry in the same cast cycle if the first shuffle output is still dead, up to `max_shuffle_retries_per_recovery_cycle = 3`
    - each retry must preserve `moves_remaining` and `current_countdown` (zero move change, zero countdown change)
    - on retry-cap hit, run fallback sequence: deterministic emergency board regeneration branch, then recoverable-error encounter end + retry CTA if still dead
19. Finalize post-resolution state (`moves_remaining`, `repeated_words`, board snapshot, countdown_after, did_win/did_lose flags).
    - terminal-loss ordering lock: in the final-move edge case above, set `did_lose`/terminal loss during this finalize step only after step-15 creature spell resolution is complete.

Worked example (Dull + Sooted + weakness candidate):

- Creature weakness: `flame`; resistance: `tide`; `countdown_before = 2`
- Cast element before tile modifiers: `flame` (would be a weakness hit)
- Selected tiles include: one Dull tile, one Sooted tile, no Wand tile
- `base_damage = 14`

Resolution:

1. Dull override applies before countdown logic, so matchup is forced to neutral (`matchupMultiplier = 1.0`) instead of weakness.
2. Soot applies once (`sootMultiplier = 0.75`).
3. Damage math: `round(14 * 1.0 * 1.0 * 0.75) = round(10.5) = 11`; minimum clamp not needed.
4. Creature survives, so weakness stall check uses post-Dull matchup (`neutral`), meaning **no stall**; countdown decrements from `2` to `1`.
5. Surviving Frozen/Sooted/Dull durations decrement once now; consumed state tiles were already cleared when selected.

Worked example (Bubble stable ordering in one column):

- Pre-rise single column (row `0` = top): row `0` = `H` (normal), row `1` = `B1` (Bubble), row `2` = `M` (normal), row `3` = `B2` (Bubble), row `4` = `Q` (normal), row `5` = `R` (normal)
- Post-rise + clear Bubble in same column: row `0` = `B1`, row `1` = `B2`, row `2` = `H`, row `3` = `M`, row `4` = `Q`, row `5` = `R`
- Ordering rule illustrated: `B1` started above `B2` pre-rise, so `B1` remains above `B2` after rise.

Worked example (cast cycle that triggers Spark Shuffle):

- Start of cast: `moves_remaining = 9`, `countdown_before = 2`, creature HP above `0`
- Cast resolves as a non-weakness hit, so countdown decrements to `1`
- Countdown is not `0`, so creature spell does not fire in this cycle
- After refill + Bubble + tile-state decrement, dead-board detection runs and finds `0` valid playable words

Resolution:

1. Spark Shuffle triggers from `trigger_reason = 'dead_board'`.
2. First shuffle result is still dead, so Spark Shuffle retries once in the same cast cycle.
3. Second shuffle produces a playable board, ending recovery.
4. Final state remains `moves_remaining = 9`, `countdown_after = 1` (no Spark Shuffle pressure side-effects across either trigger).

### 5.4 Rejected cast resolution contract

```ts
export interface RejectedCastResolution {
  submission_kind: 'invalid' | 'repeated';
  normalized_word: string;
  rejection_reason: CastRejectionReason;
  moves_consumed: 0;
  did_trigger_creature_spell: false;
  did_trigger_spark_shuffle: false;
  did_win: false;
  did_lose: false;
}
```

### 5.5 Unified cast resolution contract

```ts
export type CastResolution = ValidCastResolution | RejectedCastResolution;
```

Rules:

- invalid or repeated casts must not consume a move
- invalid or repeated casts must not mutate the board
- invalid or repeated casts must not change countdown state
- `did_win` and `did_lose` must never both be true
- the UI should not infer win/loss from HP alone if the gameplay engine already returned a terminal result
- during valid-cast resolution or creature-spell resolution lock windows, incoming board input must be ignored/discarded and must not queue deferred submission work

### 5.6 Creature spell resolution contract

```ts
export interface CreatureSpellResolution {
  spell_identity: string;
  applied_primitives: CreatureSpellPrimitive[];
  countdown_reset_to: number;
  did_change_board: boolean;
}
```

### 5.7 Spark shuffle resolution contract

```ts
export interface SparkShuffleResolution {
  trigger_reason: 'dead_board';
  max_shuffle_retries_per_recovery_cycle: 3;
  retries_attempted: number;
  did_hit_retry_cap: boolean;
  fallback_outcome: 'none' | 'deterministic_emergency_regen' | 'recoverable_error_end';
  did_recover_playable_state: boolean;
}
```

Rules:

- spark shuffle is a system recovery event, not player blame
- spark shuffle resolution must be explicit so UI, logs, and tests can treat it differently from normal creature actions
- board recovery must not sneak in hidden penalties
- v1 Spark Shuffle pressure behavior is global: it consumes `0` moves and applies `0` countdown change
- v1 Spark Shuffle pressure behavior is not configurable per encounter type
- `max_shuffle_retries_per_recovery_cycle` is a canonical v1 constant and must be `3`
- if retry cap is reached without a playable board, fallback sequence is:
  1. deterministic emergency board regeneration branch (seeded from encounter seed lineage)
  2. if still dead board, terminate encounter into recoverable error state with retry CTA
- retry-cap unrecoverable termination must set `session_state = 'recoverable_error'` and `terminal_reason_code = 'spark_shuffle_retry_cap_unrecoverable'`
- retry-cap fallback must preserve fairness: no additional move consumption and no countdown decrement/reset
- deterministic emergency regeneration must consume randomness from the same deterministic lineage as Spark Shuffle recovery: use the active `spark_shuffle` substream state at retry-cap hit as branch input, derive emergency-attempt states deterministically from that branch input, and persist resulting state transitions in encounter snapshot/runtime traces.
- deterministic emergency regeneration must construct candidate boards in canonical row-major slot order (`row 0 col 0` → `row 5 col 5`) with deterministic per-slot letter then Wand assignment ordering matching section 5.3/board generation semantics.
- emergency-regeneration acceptance predicate is strict: a candidate board is accepted only if `hasPlayableWord(...)` returns `true` using the encounter’s active `validation_snapshot_version_pin` lookup instance.
- emergency regeneration retries are bounded by canonical config and must terminate deterministically: once retry budget is exhausted without acceptance, transition encounter to `recoverable_error` with `terminal_reason_code = 'spark_shuffle_retry_cap_unrecoverable'`.
- telemetry for this branch must capture deterministic debug/fairness fields at minimum: `spark_shuffle_retries_attempted`, `spark_shuffle_retry_cap_hit`, `spark_shuffle_fallback_outcome`, `emergency_regen_attempt_count`, `emergency_regen_acceptance_result`, and active `validation_snapshot_version_pin`.
- if product introduces “guaranteed anchor words,” the anchor lexicon must be a versioned runtime content artifact explicitly pinned to `validation_snapshot_version_pin`; runtime must not source anchors from an implicit/external “top-1000” list.

Concrete example:

- before Spark Shuffle: `current_countdown = 2`, `moves_remaining = 9`
- after Spark Shuffle: `current_countdown = 2`, `moves_remaining = 9`

### 5.8 Dead-board detection contract

Dead-board detection is a **system safety contract**, not a player-fault classifier. This subsection must stay aligned with `docs/game-rules.md` section 13 (Dead-board rule + Spark Shuffle pressure rule) so recovery communicates assistance rather than blame.

Canonical predicate shape:

```ts
export function hasPlayableWord(
  boardSnapshot: BoardSnapshot,
  encounterState: Pick<EncounterRuntimeState, 'repeated_words'>,
  validationLookup: ValidationSnapshotLookup
): boolean;
```

Playable-word criteria checklist (all must pass for at least one path):

1. **Path legality:** letters form a continuous adjacency path (horizontal, vertical, or diagonal) with no tile reused in the same candidate word.
2. **Minimum length:** candidate word length is `>= 3`.
3. **Tile-state selection constraints:** candidate path excludes tiles currently blocked from selection (for v1, Frozen tiles are unselectable until cleared).
4. **Lexicon membership:** normalized candidate word exists in the active `ValidationSnapshotLookup` (`hasWord(normalizedWord) = true`).
5. **Repeated-word rejection:** normalized candidate word is not present in `encounterState.repeated_words` for the current encounter.

Trigger timing and consistency requirements:

- Required timing remains section 5.3 step 17: execute dead-board detection only on the **fully resolved post-cast board** (post-refill, post-Bubble resolution, post-creature-spell resolution when applicable, and post tile-state decrement).
- Internal spell-primitive safety checks may run earlier, but the step-17 check is canonical for cast-cycle outcome.
- The dead-board predicate must produce acceptance/rejection parity with cast validation for the same board snapshot and encounter repeat history.

Determinism rule:

- Dead-board checks must use the exact same normalized-word pipeline as cast validation (same normalization function and ordering).
- Dead-board checks must use the same pinned `validation_snapshot_version_pin` and in-memory lookup instance as cast validation for the active encounter.
- Implementations must not mix snapshot versions or fallback to alternate lexicon sources during the same encounter.
- `hasPlayableWord(...)` is the hard safety gate for board acceptance/recovery decisions.

Optional additive quality predicate (generation/refill only):

```ts
export interface BoardQualityPredicateInput {
  boardSnapshot: BoardSnapshot;
  vowelClassProfileVersion: string;
  vowelClassIncludesY: boolean;
  minVowelClassCount: number;
}

export function passesBoardQualityPredicate(input: BoardQualityPredicateInput): boolean;
```

Quality-predicate rules:

- `passesBoardQualityPredicate(...)` is an optional acceptance filter for initial generation/refill candidate boards and must never replace `hasPlayableWord(...)`.
- Acceptance ordering is strict when quality filtering is enabled:
  1. require `hasPlayableWord(...) = true` (hard safety),
  2. then apply `passesBoardQualityPredicate(...)` (quality/tuning gate).
- Vowel-class counting for the predicate uses runtime board letters after normalization and must use the pinned fields from section 8.3 (`vowelClassProfileVersion`, `vowelClassIncludesY`).
- Dead-board trigger/recovery semantics remain tied to `hasPlayableWord(...)`; a board that fails only quality criteria is not a “dead board.”

Performance requirements (correctness-preserving):

- Dead-board detection must return `true` as soon as any legal candidate word with normalized length `>= 3` is found; implementations must not introduce arbitrary max-depth caps that can miss legal longer paths.
- Implementations must early-exit immediately on the first candidate that satisfies the full playable-word checklist above.
- If profiling shows naive exhaustive traversal exceeds UX timing budget under normal conditions, `ValidationSnapshotLookup` structures must provide prefix-pruning support (for example, precomputed prefix lookup/trie-like checks) so traversal can prune impossible branches without changing semantic acceptance criteria.

Examples:

- **Dead due to repeat + blocked constraints:** board contains only one dictionary-valid adjacency path, `GLOW`, but `G` is Frozen and `"glow"` already exists in `repeated_words`; all remaining adjacency paths are either too short or not in lexicon. `hasPlayableWord(...)` returns `false`, so Spark Shuffle recovery is required.
- **Playable board:** board contains legal path `S-T-O-N-E` with no tile reuse, no blocked tiles, length `5`, `"stone"` in active validation snapshot, and `"stone"` absent from `repeated_words`; `hasPlayableWord(...)` returns `true`, so no dead-board recovery triggers.

### 5.9 Engine event stream and UI action queue contract

The gameplay engine must emit a deterministic, append-only battle event stream.  
UI, audio, haptics, animation, and analytics consume this stream but do not redefine gameplay outcomes.

#### 5.9.1 Base event envelope + idempotency keys

```ts
export type EngineEventType =
  | 'cast_submitted'
  | 'cast_resolved'
  | 'damage_applied'
  | 'countdown_ticked'
  | 'spell_started'
  | 'spell_resolved'
  | 'encounter_ended';

export type EngineFramePhase =
  | 'input_acceptance'
  | 'board_resolution'
  | 'damage_commit'
  | 'countdown_commit'
  | 'spell_resolution'
  | 'terminal_commit';

export interface EngineEventEnvelope {
  event_id: string; // UUID/ULID; globally unique within the session
  sequence: number; // strict monotonic per encounter session; starts at 1
  event_type: EngineEventType; // discriminant
  session_id: string;
  encounter_id: string;
  turn_index: number; // 0-based valid-cast turn index; stable for all events from that cast cycle
  cast_index: number; // 0-based submission index; increments for valid + rejected submissions
  occurred_at_utc: string; // ISO 8601 UTC timestamp from engine clock
  frame_phase: EngineFramePhase;
}
```

Deduplication/idempotency rule:

- consumers must dedupe on `(session_id, event_id)` first
- if `event_id` is unknown but `sequence` is already consumed, treat as duplicate and do not replay side effects
- a consumer checkpoint should persist `last_consumed_sequence` per `session_id`

#### 5.9.2 Discriminated union payloads

```ts
export interface CastSubmittedEvent extends EngineEventEnvelope {
  event_type: 'cast_submitted';
  frame_phase: 'input_acceptance';
  submission_kind: CastSubmissionKind;
  normalized_word: string;
  selected_positions_count: number;
}

export interface CastResolvedEvent extends EngineEventEnvelope {
  event_type: 'cast_resolved';
  frame_phase: 'board_resolution';
  submission_kind: CastSubmissionKind;
  moves_consumed: 0 | 1;
  did_trigger_creature_spell: boolean;
  did_trigger_spark_shuffle: boolean;
}

export interface DamageAppliedEvent extends EngineEventEnvelope {
  event_type: 'damage_applied';
  frame_phase: 'damage_commit';
  hp_before: number;
  hp_after: number;
  base_damage: number;
  final_damage: number;
  matchup_result: MatchupResult;
}

export interface CountdownTickedEvent extends EngineEventEnvelope {
  event_type: 'countdown_ticked';
  frame_phase: 'countdown_commit';
  countdown_before: number;
  countdown_after: number;
  tick_reason: 'post_cast_non_weakness' | 'spell_reset';
}

export interface SpellStartedEvent extends EngineEventEnvelope {
  event_type: 'spell_started';
  frame_phase: 'spell_resolution';
  spell_id: string;
  countdown_before_reset: number;
}

export interface SpellResolvedEvent extends EngineEventEnvelope {
  event_type: 'spell_resolved';
  frame_phase: 'spell_resolution';
  spell_id: string;
  applied_primitives_count: number;
  countdown_reset_to: number;
}

export interface EncounterEndedEvent extends EngineEventEnvelope {
  event_type: 'encounter_ended';
  frame_phase: 'terminal_commit';
  outcome: EncounterOutcome;
  terminal_reason_code: EncounterTerminalReasonCode;
}

export type EngineEvent =
  | CastSubmittedEvent
  | CastResolvedEvent
  | DamageAppliedEvent
  | CountdownTickedEvent
  | SpellStartedEvent
  | SpellResolvedEvent
  | EncounterEndedEvent;
```

#### 5.9.3 Ordering guarantees

- `sequence` defines canonical order; transport order is irrelevant if consumers re-sort by `sequence`.
- Required causal order for a cast cycle:
  1. `cast_submitted`
  2. `cast_resolved`
  3. optional `damage_applied` (valid casts only)
  4. optional `countdown_ticked` (only when creature survives)
  5. optional `spell_started`
  6. optional `spell_resolved`
  7. optional `encounter_ended` (terminal outcome)
- `spell_started` and `spell_resolved` must share the same `turn_index`/`cast_index` as the triggering cast.
- `encounter_ended` must be the final emitted event for the session (`sequence = last_consumed_sequence` at terminal commit).

#### 5.9.4 Restore/replay emission rules

- restore must reload canonical gameplay state from snapshot tables (section 7.5), not from re-running UI animation logic.
- already-committed historical events with `sequence <= restored_last_sequence` must not be re-emitted.
- after restore, only not-yet-emitted future events may be emitted with continuing monotonic `sequence`.
- recoverable re-notification is allowed only through explicit UI-local restore actions (see `ActionQueueItem` below), not through duplicated `EngineEvent` emission.
- analytics adapters must treat replayed UI-local restore actions as non-analytics unless explicitly mapped as restore telemetry.

#### 5.9.5 Side-effect eligibility: presentation vs analytics-only

- may trigger audio/haptics/animation:
  - `cast_submitted`
  - `cast_resolved`
  - `damage_applied`
  - `countdown_ticked`
  - `spell_started`
  - `spell_resolved`
  - `encounter_ended`
- analytics-only events are emitted by analytics adapters (section 12), not by this battle-engine union.
- rule: presentation side effects are optional consumers of `EngineEvent`; skipping an effect must not change canonical battle state.

#### 5.9.6 UI-side `ActionQueueItem` contract (engine-decoupled, React-decoupled)

```ts
export type UIActionType =
  | 'show_cast_trace_feedback'
  | 'show_cast_resolution_banner'
  | 'animate_damage_number'
  | 'animate_hp_bar'
  | 'animate_countdown_tick'
  | 'play_spell_windup'
  | 'play_spell_resolution'
  | 'show_encounter_result'
  | 'persist_event_checkpoint';

export interface ActionQueueItem {
  action_id: string; // unique queue item id
  session_id: string;
  source_event_id: string;
  source_sequence: number;
  action_type: UIActionType;
  enqueue_ts_utc: string;
  not_before_phase: EngineFramePhase;
  payload: Record<string, unknown>;
  effect_channel: 'visual' | 'audio' | 'haptic' | 'system';
  dedupe_key: string; // recommended: `${session_id}:${source_event_id}:${action_type}`
}
```

Rules:

- `ActionQueueItem` is a platform/application contract, not a React component prop.
- queue consumption order is stable by (`source_sequence`, insertion order).
- dedupe must be enforced on `dedupe_key` to prevent repeated haptic/audio firings during warm restore.
- `persist_event_checkpoint` must run after each consumed engine event to update `last_consumed_sequence`.

Engine events -> required baseline UI action mapping:

| Engine event | Required `ActionQueueItem` entries |
| --- | --- |
| `cast_submitted` | `show_cast_trace_feedback`, `persist_event_checkpoint` |
| `cast_resolved` | `show_cast_resolution_banner`, `persist_event_checkpoint` |
| `damage_applied` | `animate_damage_number`, `animate_hp_bar`, `persist_event_checkpoint` |
| `countdown_ticked` | `animate_countdown_tick`, `persist_event_checkpoint` |
| `spell_started` | `play_spell_windup`, `persist_event_checkpoint` |
| `spell_resolved` | `play_spell_resolution`, `persist_event_checkpoint` |
| `encounter_ended` | `show_encounter_result`, `persist_event_checkpoint` |

Mapping-extension rule:

- teams may add extra platform-specific actions (for example richer animation variants), but additive actions must still trace back to one `source_event_id` and must preserve baseline dedupe/order semantics above.

---

## 6. Spell Primitive Contracts

Creature spells should be built from a small reusable primitive library.

### 6.1 Primitive contracts

```ts
export type CreatureSpellPrimitive =
  | ApplyTileStatePrimitive
  | ShiftRowPrimitive
  | ShiftColumnPrimitive
  | ChainedSpellPrimitive;

export interface ApplyTileStatePrimitive {
  kind: 'apply_tile_state';
  tile_state: TileStateKind;
  target_count: number; // upper bound; actual applied count may be lower per eligible-pool rules in section 6.2
  targeting: 'random_eligible' | 'authored_pattern';
}

export interface ShiftRowPrimitive {
  kind: 'shift_row';
  row_index: number;
  mode: 'rotate';
  distance: 1;
  direction: 1 | -1; // canonical: 1 = right, -1 = left
}

export interface ShiftColumnPrimitive {
  kind: 'shift_column';
  col_index: number;
  mode: 'rotate';
  distance: 1;
  direction: 1 | -1; // canonical: 1 = down, -1 = up
}

export interface ChainedSpellPrimitive {
  kind: 'chained';
  // resolve strictly in authored order; each step recomputes eligibility from prior step output (section 6.2)
  steps: Array<ApplyTileStatePrimitive | ShiftRowPrimitive | ShiftColumnPrimitive>;
}
```

Rules:

- standard creatures should normally use one primitive or one small chained primitive
- `ChainedSpellPrimitive` exists for readable multi-step boss/event behavior, not for content chaos
- whole-board scramble primitives are intentionally absent from the early contract
- new primitive families must be added deliberately in this document before wide implementation

### 6.2 `apply_tile_state` deterministic eligibility contract

This section is normative for all `ApplyTileStatePrimitive` resolution and mirrors creature authoring rules.

Eligibility matrix:

| Requested `tile_state` | same state already present | different negative state present | Wand marker present |
| --- | --- | --- | --- |
| `frozen` | ineligible | ineligible | eligible |
| `sooted` | ineligible | ineligible | eligible |
| `dull` | ineligible | ineligible | eligible |
| `bubble` | ineligible | ineligible | eligible |

Deterministic resolution requirements:

1. Build eligible set from current board at primitive evaluation time.
2. `target_count` is an upper bound; if `target_count > eligible.length`, apply to `eligible.length` and stop.
3. Sampling must be without replacement.
4. For `targeting: 'random_eligible'`, use seeded deterministic pseudo-random selection in authoritative runtime, implemented as seeded deterministic ordering then take first `N` (replay-stable):
   - primary: ascending hash(`encounter_seed + creature_cast_index + primitive_step_index + tile_id`)
   - secondary: `row` ascending
   - tertiary: `col` ascending
   - quaternary: `tile_id` ascending lexicographic
5. Never rely on runtime object-key iteration order for authoritative selection.

### 6.3 Chain interaction contract for eligibility-affecting primitives

If one cast contains multiple primitives that affect eligibility (including `chained` with repeated `apply_tile_state` steps), evaluate in authored order and commit each step before computing the next step's eligible set.
Within the same chain, once a tile becomes ineligible in an earlier step (same requested state already present or a different negative state already present), later `apply_tile_state` steps cannot select that tile again.

Example:

- step 1: `shift_row`
- step 2: `apply_tile_state(tile_state: 'frozen', target_count: 2)`

Step 2 eligibility uses post-shift coordinates, not pre-shift coordinates.
Post-shift retargeting uses updated coordinates but still enforces the section 6.2 eligibility matrix without bypass.

### 6.4 Authoring examples for `apply_tile_state` variants

Text snapshot legend:

- `X*` means Wand marker on tile letter `X`
- `[F]`, `[S]`, `[D]`, `[B]` mean frozen/sooted/dull/bubble respectively

All examples assume `targeting: 'random_eligible'` with seeded deterministic pseudo-random selection in authoritative runtime from section 6.2.

Frozen (`target_count = 2`):

Pre:
```
R0: A   B   C   D
R1: E*  F   G   H
R2: I   J   K   L
R3: M   N   O   P
```
Post:
```
R0: A[F] B    C    D
R1: E*[F] F    G    H
R2: I    J    K    L
R3: M    N    O    P
```

Sooted (`target_count = 3`; one same-state tile already present):

Pre:
```
R0: A     B[S]  C    D
R1: E     F     G*   H
R2: I     J     K    L
R3: M     N     O    P
```
Post:
```
R0: A[S]  B[S]  C    D
R1: E[S]  F     G*[S] H
R2: I     J     K    L
R3: M     N     O    P
```

Dull (`target_count = 2`):

Pre:
```
R0: A     B[D]  C    D
R1: E*    F     G    H
R2: I     J     K    L
R3: M     N     O    P
```
Post:
```
R0: A[D]  B[D]  C    D
R1: E*[D] F     G    H
R2: I     J     K    L
R3: M     N     O    P
```

Bubble (`target_count = 2`; one same-state tile already present):

Pre:
```
R0: A     B     C    D
R1: E*    F[B]  G    H
R2: I     J     K    L
R3: M     N     O    P
```
Post:
```
R0: A[B]  B     C    D
R1: E*[B] F[B]  G    H
R2: I     J     K    L
R3: M     N     O    P
```

### 6.5 Canonical spell payload schema contract

This section defines the canonical content-bundle schema for authored creature spell payloads. Runtime loaders and content validators must reject payloads that violate this contract.

#### 6.5.1 Primitive IDs and parameter contracts

Canonical primitive IDs:

- `apply_tile_state`
- `shift_row`
- `shift_column`
- `chained`

Primitive parameter contract:

| Primitive ID | Required params | Optional params | Allowed range / values |
| --- | --- | --- | --- |
| `apply_tile_state` | `kind`, `tile_state`, `target_count`, `targeting` | none | `tile_state ∈ {'frozen','sooted','dull','bubble'}`; `targeting ∈ {'random_eligible','authored_pattern'}`; `target_count` integer `>= 1` |
| `shift_row` | `kind`, `row_index`, `mode`, `distance`, `direction` | none | `row_index` integer `0-5`; `mode = 'rotate'`; `distance = 1`; `direction ∈ {1, -1}` where `1 = right`, `-1 = left` |
| `shift_column` | `kind`, `col_index`, `mode`, `distance`, `direction` | none | `col_index` integer `0-5`; `mode = 'rotate'`; `distance = 1`; `direction ∈ {1, -1}` where `1 = down`, `-1 = up` |
| `chained` | `kind`, `steps` | none | `steps.length >= 2`; each step must be one of `apply_tile_state`, `shift_row`, `shift_column`; nested `chained` is illegal |

#### 6.5.2 Intensity tiers mapped to numeric constraints

Authoring and validation must enforce these numeric boundaries per encounter type:

| Encounter type | Max affected tiles per cast (`sum(apply_tile_state.target_count)` across resolved steps) | Duration bounds | Chain allowance (`extra_steps = total_steps - 1`) |
| --- | --- | --- | --- |
| `standard` | `<= 5` (`warn` at `5`, `error` at `>= 6`) | state durations are fixed by tile-state runtime contract: Frozen/Bubble `1`, Sooted/Dull `2` successful casts | `extra_steps <= 2` (`warn` at `2`, `error` at `>= 3`) |
| `boss` | `<= 7` (`warn` at `7`, `error` at `>= 8`) | state durations are fixed by tile-state runtime contract: Frozen/Bubble `1`, Sooted/Dull `2` successful casts | `extra_steps <= 4` (`warn` at `4`, `error` at `>= 5`) |
| `event` | `<= 7` (`warn` at `7`, `error` at `>= 8`) | state durations are fixed by tile-state runtime contract: Frozen/Bubble `1`, Sooted/Dull `2` successful casts | `extra_steps <= 4` (`warn` at `4`, `error` at `>= 5`) |

Notes:

- The fixed duration bounds are normative and cannot be overridden per spell payload.
- Validators may compute advisory warnings for authored values in `warn` bands, but must hard-fail `error` bands.

#### 6.5.3 Validation error contract for illegal combinations

Canonical content-validator error codes:

| Error code | Trigger | Guardrail mapping |
| --- | --- | --- |
| `spell_schema_unknown_primitive` | Primitive `kind` not in canonical primitive IDs | Prevents unsupported runtime behavior |
| `spell_schema_missing_required_param` | Required parameter absent or null | Prevents ambiguous spell execution |
| `spell_schema_param_out_of_range` | Numeric or enum parameter violates section 6.5.1 bounds | Prevents illegal board mutation semantics |
| `spell_schema_shift_direction_missing_or_invalid` | `shift_row`/`shift_column` missing `direction` or `direction ∉ {1,-1}` | Prevents ambiguous horizontal/vertical movement semantics |
| `spell_schema_nested_chain_forbidden` | A `chained` step contains another `chained` primitive | Enforces readability and deterministic evaluation |
| `spell_balance_tiles_exceed_error_band` | Affected-tile total exceeds encounter error band | Maps to `CER-STATE-002`/`CER-STATE-004`/`CER-STATE-005` limits |
| `spell_balance_chain_exceed_error_band` | Chain extra-step count exceeds encounter error band | Maps to `CER-CHAIN-002`/`CER-CHAIN-004`/`CER-CHAIN-005` limits |
| `spell_balance_duration_override_forbidden` | Payload attempts to author tile-state duration | Preserves canonical tile-state trust contract |
| `spell_balance_illegal_encounter_combo` | Spell marked `standard` but includes boss/event-only pressure (error-band chain or tile counts) | Prevents ordinary content from silently inheriting boss/event intensity |

#### 6.5.4 Serialization and versioning policy for content bundles

Spell payloads in content bundles must follow these versioning rules:

- Every spell payload must include:
  - `schema_version` (current: `"spell_payload_v1"`)
  - `spell_id` (stable identity string)
  - `encounter_type` (`standard`/`boss`/`event`)
  - `intensity_tier` (string label; must be compatible with encounter type and numeric constraints)
  - `primitives` (array of canonical primitive payloads)
- `schema_version` is the only discriminator for payload-shape breaking changes.
- Additive fields are allowed only when:
  - older runtimes can ignore them safely, and
  - required semantics for existing fields do not change.
- Any breaking change requires:
  - new schema version name (for example, `spell_payload_v2`)
  - migration notes in this document
  - simultaneous validator/runtime support updates in the same release train.
- Content bundles must be rejected if `schema_version` is unknown by the active runtime.

#### 6.5.5 Canonical JSON examples

Standard encounter spell (single primitive):

```json
{
  "schema_version": "spell_payload_v1",
  "spell_id": "standard_soot_spritz_v1",
  "encounter_type": "standard",
  "intensity_tier": "standard_light_nuisance",
  "primitives": [
    {
      "kind": "apply_tile_state",
      "tile_state": "sooted",
      "target_count": 3,
      "targeting": "random_eligible"
    }
  ]
}
```

Boss encounter spell (chained, within boss bounds):

```json
{
  "schema_version": "spell_payload_v1",
  "spell_id": "boss_row_hex_v1",
  "encounter_type": "boss",
  "intensity_tier": "boss_phase_pressure",
  "primitives": [
    {
      "kind": "chained",
      "steps": [
        { "kind": "shift_row", "row_index": 2, "mode": "rotate", "distance": 1, "direction": 1 },
        {
          "kind": "apply_tile_state",
          "tile_state": "frozen",
          "target_count": 3,
          "targeting": "random_eligible"
        },
        {
          "kind": "apply_tile_state",
          "tile_state": "dull",
          "target_count": 2,
          "targeting": "random_eligible"
        }
      ]
    }
  ]
}
```

Event encounter spell (curated unusual mix, still schema-valid):

```json
{
  "schema_version": "spell_payload_v1",
  "spell_id": "event_tidal_twist_v1",
  "encounter_type": "event",
  "intensity_tier": "event_curated_pressure",
  "primitives": [
    { "kind": "shift_column", "col_index": 4, "mode": "rotate", "distance": 1, "direction": -1 },
    {
      "kind": "apply_tile_state",
      "tile_state": "bubble",
      "target_count": 4,
      "targeting": "random_eligible"
    }
  ]
}
```

---

## 7. Persisted SQLite Entity Contracts

These are canonical entity names and required fields for local persistence.

Column naming uses `snake_case` to keep SQL schemas boring and explicit.

### 7.1 `player_profile_records`

One row per local player profile.

```ts
export interface PlayerProfileRecord {
  local_player_id: string;
  has_completed_starter_encounter: 0 | 1;
  starter_result_outcome: 'unplayed' | 'won' | 'lost';
  starter_tutorial_current_stage: StarterTutorialCueStage;
  starter_tutorial_block_state: StarterTutorialBlockState;
  starter_tutorial_completed_stages_json: string; // JSON array of StarterTutorialCueStage values for show-once cues
  starter_tutorial_last_interrupted_stage: StarterTutorialCueStage;
  cosmetic_currency_balance: number;
  cosmetic_unlock_records_json: string; // JSON array of CosmeticUnlockRecord values
  created_at_utc: string;
  updated_at_utc: string;
}
```

Rules:

- this record supports first-time routing truth
- starter completion must not be inferred only from UI navigation history
- this record is local-first and may later map to account data if cloud features are added
- `has_completed_starter_encounter = 1` means the starter gate has been cleared by a win
- `starter_result_outcome = 'lost'` is allowed while `has_completed_starter_encounter = 0`
- starter loss does not count as starter-gate completion
- launch and Home routing must treat `has_completed_starter_encounter`, not mere starter attempt history, as the onboarding gate truth
- `starter_tutorial_current_stage` is the deterministic progression pointer used to decide the next eligible starter cue.
- `starter_tutorial_completed_stages_json` stores show-once completion markers (`cue_01_trace_word`, `cue_02_release_to_cast`, `cue_03_read_countdown`) and must not include event/result-bound cues.
- `starter_tutorial_block_state` stores whether interruption recovery must reopen a blocking cue before normal interaction.
- `starter_tutorial_last_interrupted_stage` stores interruption checkpointing for background/kill/resume recovery and should be `'none'` when no cue was active at interruption time.
- `cosmetic_currency_balance` is the canonical spendable cosmetic soft-currency balance and must be a non-negative integer.
- `cosmetic_unlock_records_json` stores owned cosmetic unlocks as canonical `CosmeticUnlockRecord[]` and is the profile-side source of truth for cosmetic ownership.
- cosmetic spend deduction and append of a new owned unlock record must commit in one SQLite transaction (see `docs/technical-architecture.md` section 14 "Persistence Architecture" for trust-critical local persistence behavior).
- if any step in that cosmetic spend/unlock write path fails, the transaction must roll back and persist neither currency deduction nor unlock append partial state.

### 7.2 `player_settings_records`

```ts
export interface PlayerSettingsRecord {
  settings_id: 'default';
  sound_enabled: 0 | 1;
  music_enabled: 0 | 1;
  haptics_enabled: 0 | 1;
  reduced_motion_enabled: 0 | 1 | null;
  created_at_utc: string;
  updated_at_utc: string;
}
```

Rules:

- `null` is allowed for `reduced_motion_enabled` until the app explicitly stores a value
- player settings must not be required for battle truth, but they are part of stable app behavior

### 7.3 `encounter_progress_records`

One row per encounter identifier for lightweight local progression truth.

```ts
export interface EncounterProgressRecord {
  encounter_id: string;
  is_unlocked: 0 | 1;
  first_unlocked_at_utc: string | null;
  best_star_rating: 0 | 1 | 2 | 3;
  first_completed_at_utc: string | null;
  last_completed_at_utc: string | null;
  win_count: number;
  loss_count: number;
  updated_at_utc: string;
}
```

Rules:

- `is_unlocked = 1` means the encounter is launchable from normal progression surfaces
- `is_unlocked` is monotonic in ordinary progression flow and must not revert from `1` to `0`
- `best_star_rating = 0` means the encounter has never been won
- `win_count = 0` and `loss_count > 0` means unlocked-and-attempted but not yet cleared
- `first_unlocked_at_utc` records the first time the encounter became unlocked and does not change on replay
- this contract is intentionally lightweight enough to support list/path progression without overcommitting to a specific map structure
- additive progression fields are allowed later, but this table should remain a stable per-encounter record

### 7.4 `encounter_result_records`

One row per completed encounter session.

```ts
export interface EncounterResultRecord {
  result_id: string;
  encounter_session_id: string;
  encounter_id: string;
  encounter_type: EncounterType;
  difficulty_tier: DifficultyTier;
  outcome: EncounterOutcome;
  terminal_session_state: 'won' | 'lost' | 'recoverable_error' | 'abandoned';
  terminal_reason_code: EncounterTerminalReasonCode;
  moves_remaining: number;
  star_rating: 0 | 1 | 2 | 3;
  spark_shuffle_retry_cap: number | null;
  spark_shuffle_retries_attempted: number | null;
  spark_shuffle_fallback_outcome: 'none' | 'deterministic_emergency_regen' | 'recoverable_error_end' | null;
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
  reward_constants_version_pin: string;
  concluded_at_utc: string;
  acknowledged_locally: 0 | 1;
  created_at_utc: string;
  updated_at_utc: string;
}
```

Rules:

- `acknowledged_locally` is UI-local and must not rewrite outcome truth
- `star_rating = 0` is allowed for a loss
- one encounter session should produce at most one terminal result row
- result history must not be re-derived from transient UI state
- `terminal_session_state` is required so terminal restore/routing and analytics do not collapse `recoverable_error` into ordinary loss
- `outcome` remains a coarse two-state summary (`won` or `lost`) for progression compatibility; `recoverable_error` must map to `outcome = 'lost'` with `terminal_reason_code = 'spark_shuffle_retry_cap_unrecoverable'`
- `spark_shuffle_*` fields are required (nullable) for every row and must be non-null when `terminal_reason_code = 'spark_shuffle_retry_cap_unrecoverable'`

### 7.5 `active_encounter_snapshots`

Exact device-local restore snapshots for active or just-resolved sessions.

```ts
export interface ActiveEncounterSnapshotRecord {
  encounter_session_id: string;
  encounter_id: string;
  encounter_type: EncounterType;
  difficulty_tier: DifficultyTier;
  session_state: EncounterSessionState;
  terminal_reason_code: EncounterTerminalReasonCode | null;
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
  reward_constants_version_pin: string;
  encounter_seed: string;
  rng_algorithm_id: 'pcg32_xsh_rr_64_32' | 'xoroshiro128ss';
  rng_stream_states_json: string;
  move_budget_total: number;
  moves_remaining: number;
  board_json: string;
  creature_state_json: string;
  repeated_words_json: string;
  spark_shuffle_retry_cap: number;
  spark_shuffle_retries_attempted: number;
  spark_shuffle_fallback_outcome: 'none' | 'deterministic_emergency_regen' | 'recoverable_error_end';
  assist_policy_version: 'assist_policy_v1' | null;
  active_assist_state_json: string | null; // serialized ActiveEncounterAssistState for current attempt
  cosmetic_currency_balance_snapshot: number;
  cosmetic_unlock_records_json_snapshot: string; // JSON array of CosmeticUnlockRecord values mirrored from PlayerProfileRecord
  last_surface: AppPrimarySurface;
  created_at_utc: string;
  updated_at_utc: string;
  last_interaction_at_utc: string;
}
```

Rules:

- `board_json`, `creature_state_json`, and `repeated_words_json` are canonical serialized restore payloads for early milestones
- `encounter_seed`, `rng_algorithm_id`, and `rng_stream_states_json` are required restore-critical randomness fields
- `rng_stream_states_json` must serialize all required substreams (`board_init`, `board_refill`, `spell_targeting`, `spark_shuffle`)
- `terminal_reason_code` is required whenever `session_state` is terminal and must preserve recoverable-error reason across warm/cold resume
- `spark_shuffle_retry_cap`, `spark_shuffle_retries_attempted`, and `spark_shuffle_fallback_outcome` are required restore/debug fields for Spark Shuffle retry-cap traces
- `assist_policy_version` and `active_assist_state_json` are required once repeated-loss assist state exists for an attempt and must preserve one-attempt assist behavior across warm/cold restore.
- `cosmetic_currency_balance_snapshot` and `cosmetic_unlock_records_json_snapshot` must mirror the latest persisted profile cosmetic state at snapshot write time.
- this table stores exact restore truth, not a lossy summary
- a terminal `session_state` may still remain here briefly until the result screen is acknowledged and cleanup rules run
- restore must prefer this snapshot over guessed screen history
- starter tutorial cue state fields in this table must mirror the latest persisted profile/tutorial state at snapshot write time so hard-resume behavior is deterministic.

---

## 8. Runtime Content Definition Contracts

These interfaces define the stable runtime shapes for bundled encounter content.

### 8.0 Content package manifest load contract (required fields)

Runtime content loaders must require and validate these manifest fields before any creature/encounter/validation payload is activated:

```ts
export interface RuntimeContentPackageManifest {
  package_id: string;
  content_version: string;
  validation_snapshot_version: string;
  battle_rules_version: string;
  board_generator_version: string;
  min_supported_app_version: string;
  schema_versions: {
    manifest_schema: string;
    creature_schema: string;
    encounter_schema: string;
    validation_snapshot_schema: string;
  };
  asset_pack_version: string | null;
  created_at_utc: string; // ISO-8601 UTC
  created_by: string;
  status:
    | 'draft'
    | 'review_ready'
    | 'fairness_reviewed'
    | 'approved'
    | 'bundled'
    | 'published'
    | 'archived'
    | 'corrected_exception';
}
```

Load-time requirements:

- missing any required field above is a hard load failure (`schema_invalid`)
- `content_version`, `validation_snapshot_version`, `battle_rules_version`, and `board_generator_version` must match active runtime pins before activation (`version_pin_mismatch` on failure)
- `schema_versions.*` identifiers must match known runtime-supported schema IDs (`schema_invalid` on failure)
- loaders must validate manifest first, then creature/encounter/snapshot payloads; do not partially activate package content on manifest failure

### 8.0.a AssetManifest contract (required for bundled runtime assets)

Runtime bundles that ship creature/spell/UI/audio references must provide a deterministic `AssetManifest`.
This contract defines stable asset IDs, variant dimensions, static module binding ownership, and fallback behavior.

```ts
export type AssetNamespace =
  | 'creature'
  | 'spell'
  | 'ui_icon'
  | 'ui_illustration'
  | 'audio_sfx'
  | 'audio_music'
  | 'vfx';

export interface AssetVariantSelector {
  theme: 'default' | 'starter' | 'event' | 'boss';
  density: 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
  locale: string | null; // BCP-47 (for locale-authored variants only)
}

export interface AssetManifestEntry {
  namespace: AssetNamespace;
  id: string; // slug-like ID, never filesystem path
  variants: Partial<Record<string, string>>; // variant key -> app-owned static module key
  fallback_keys: {
    required_default: string;
    theme_default: string;
    density_default: string;
    locale_default: string;
  };
}

export interface RuntimeAssetManifest {
  manifest_id: string;
  asset_pack_version: string;
  entries: AssetManifestEntry[];
}
```

ID and namespace requirements:

- `namespace` is mandatory and must be one of the allowed `AssetNamespace` values
- `id` must be lowercase `snake_case` or `kebab-case` and must not contain `/`, `\\`, `:`, `.`, or URL-like prefixes
- path-like or file-like identifiers are forbidden (for example `icons/fire.png`, `../spell.wav`, `https://...`)
- registry key identity is `namespace + ':' + id`
- `entries` must not contain duplicate registry keys

Variant and fallback requirements:

- variant dimensions are `theme`, `density`, and optional `locale`
- runtime variant lookup key format is deterministic and app-owned (for example `theme=boss|density=xxhdpi|locale=en-US`)
- each entry must declare all `fallback_keys` values listed above
- fallback precedence is strict and must be applied in order:
  1. exact match (`theme + density + locale` when locale is requested)
  2. `theme + density + locale_default`
  3. `theme + density_default + locale_default`
  4. `theme_default + density_default + locale_default`
  5. `required_default` (terminal fallback; must always resolve)
- failure to resolve `required_default` is a hard load failure

Static module binding rule (source map ownership):

- runtime content/docs may define only logical asset registry keys; they must never define bundler import paths
- `registry key -> require(...)` mapping is owned by app code in a static source map module checked into the client app
- content packages are not allowed to inject dynamic path resolution
- app code must validate that every referenced registry key resolves to a statically-bound module key

Validation failure codes (asset manifest + reference integrity):

- `asset_manifest_schema_invalid`: malformed manifest shape, unknown namespace, or illegal ID format
- `asset_manifest_id_path_forbidden`: ID contains path-like or URL-like segments
- `asset_manifest_duplicate_registry_key`: duplicate `namespace:id` entries
- `asset_manifest_variant_missing_required_fallback`: missing one or more required fallback keys
- `asset_manifest_required_fallback_unresolvable`: `required_default` does not resolve to a static module binding
- `asset_manifest_reference_missing`: content references registry key absent from `entries`
- `asset_manifest_binding_missing`: registry key exists in manifest but no app static `require(...)` binding exists
- `asset_manifest_binding_unused`: static app binding exists but no manifest/content reference uses it
- `asset_manifest_namespace_mismatch`: content ID mapped to wrong namespace (for example spell content pointing at `creature:*`)

Content ID mapping guidance:

- `RuntimeCreatureDefinition.id` (content `creature_id`) maps to asset registry keys under `creature:<creature_id>`
- `RuntimeCreatureDefinition.spellIdentity` maps to asset registry keys under `spell:<spellIdentity>`
- auxiliary UI or audio associations should follow explicit namespace prefixes (`ui_icon:*`, `audio_sfx:*`, etc.)
- content IDs and asset IDs must stay logical identifiers, never file paths

### 8.1 Creature definition contract

```ts
export interface RuntimeCreatureDefinition {
  id: string;
  displayName: string;
  encounterType: EncounterType;
  difficultyTier: DifficultyTier;
  maxHp: number;
  weakness: NonNeutralElementType;
  resistance: NonNeutralElementType;
  baseCountdown: number;
  spellIdentity: string;
  spellPrimitives: CreatureSpellPrimitive[];
  phaseRules: RuntimePhaseRule[];
  contentVersion: string;
}
```

### 8.2 Encounter definition contract

```ts
export interface RuntimeStarterTutorialScript {
  guidedFirstCast: {
    normalizedWord: string;
    selectedPositions: BoardPosition[];
    expectedElement: NonNeutralElementType;
  };
  weaknessTeachingWord: string;
  mustShowCreatureSpellBeforeWin: boolean;
}

export interface HiddenBonusWordPolicy {
  selectionSource: 'themed_lexicon_subset';
  deterministicSelection: 'encounter_seed_bound';
  maxClaimsPerEncounter: 1;
  grantsMetaRewardOnly: 1;
}

export interface RuntimeEncounterDefinition {
  id: string;
  creatureId: string;
  moveBudget: number;
  starPolicyVersion: StarPolicyVersion;
  isStarterEncounter: boolean;
  starterTutorialScript: RuntimeStarterTutorialScript | null;
  introFlavorText: string | null;
  damageModelVersion: 'damage_model_v1';
  rewardDefinition: RuntimeRewardDefinition | null;
  hiddenBonusWordPolicy: HiddenBonusWordPolicy | null;
  boardConfig: RuntimeBoardConfig;
  balanceMetadata: RuntimeEncounterBalanceMetadata;
  contentVersion: string;
}
```

Rules:

- `starterTutorialScript` is required when `isStarterEncounter = true`
- `starterTutorialScript` must be `null` for non-starter encounters
- `guidedFirstCast.selectedPositions` must map to canonical `cue_01_trace_word` behavior in starter cue flow
- `guidedFirstCast.expectedElement` is intentionally restricted to `NonNeutralElementType`; the first guided cast must teach a concrete weakness/resistance-facing element, not Arcane fallback
- this strict first-cast element rule preserves deterministic onboarding intent: first guided success should immediately reinforce that element choice changes battle outcomes
- this contract is onboarding truth and does not define player-invoked hint/clue behavior (M1-M2 ship with no player-invoked hint/clue runtime contract)
- `damageModelVersion` is required encounter authoring metadata for every balance-derived encounter and must currently be `'damage_model_v1'`
- `starPolicyVersion` is the canonical star-rating policy input for encounter results and must be passed to section 9.1.b `deriveStarRating(...)` as `star_policy_version`
- for M1-M2, `standard` encounters default to `star_policy_v1_absolute` unless a documented standard-policy migration intentionally changes the default
- `boss` and `event` encounters must explicitly author `starPolicyVersion` (no implied inheritance from standard defaults)
- omission of `starPolicyVersion` for `boss`/`event` content is an authoring/validation failure and runtime must not silently fall back
- `starPolicyVersion` routing and defaults must align with `docs/game-rules.md` section 13 ("Current star-rating direction" and "Boss/event star-policy routing rule")
- `hiddenBonusWordPolicy` is optional and encounter-bound; when present it must select from a themed lexicon subset using deterministic seeded selection for that encounter only
- `hiddenBonusWordPolicy.maxClaimsPerEncounter` is locked to `1`; runtime must guard against multiple claims in the same encounter session
- hidden bonus discovery is reward-side flavor only and must not alter damage, move consumption, creature countdown behavior, or board mutation/collapse/refill semantics
- `RuntimeEncounterDefinition` intentionally has no Spark Shuffle countdown/move override field in v1; runtime must apply the global Spark Shuffle pressure rule from section 5.6 without per-encounter guessing
- `balanceMetadata.waivers` is required and must be present even when empty (`[]`)
- any authored out-of-band balance value with `warn` severity requires an active waiver entry
- `error` severity out-of-band values are never auto-waived by content-only metadata; they require explicit governance exception handling outside ordinary authoring flow

#### 8.2.a Player assist action gating contract (M1-M2 and later)

Milestone gating:

- M1 and M2 ship with no player-invoked hint/clue runtime contract.
- Only automatic dead-board Spark Shuffle recovery is allowed during active encounter play in M1-M2.
- Earliest milestone for player-invoked clues is M3.
- Starter flow remains clue-hidden unless docs are explicitly updated later.

Milestone-gated repeated-loss fail-soft runtime config (required):

```ts
export type EncounterAssistLevel = 'tip_only' | 'gentle_board_bias' | 'easier_variant';

export interface AssistStarCapBehavior {
  tip_only: 3; // no star cap reduction
  gentle_board_bias: 2;
  easier_variant: 1;
}

export interface EncounterAssistRuntimePolicyConfig {
  assist_policy_version: 'assist_policy_v1';
  enabled_assist_levels: EncounterAssistLevel[];
  assist_star_cap_behavior: AssistStarCapBehavior;
}

export interface EasierVariantMechanicalOverrides {
  move_budget_delta?: 0 | 1; // additive to encounter move budget for assisted attempt
  countdown_delta?: -1 | 0; // additive to creature countdown floor-clamped to 1
}

export interface ActiveEncounterAssistState {
  active_level: EncounterAssistLevel | null;
  tip_copy_id: string | null; // stable copy key for loss-#2 one-time strategy tip
  tip_text: string | null; // optional resolved fallback copy payload when id lookup is unavailable
  mechanical_overrides: EasierVariantMechanicalOverrides | null;
}

export interface MilestoneAssistRuntimeConfigMap {
  M1: EncounterAssistRuntimePolicyConfig;
  M2: EncounterAssistRuntimePolicyConfig;
  M3_PLUS: EncounterAssistRuntimePolicyConfig;
}

export const MILESTONE_ASSIST_RUNTIME_CONFIG: MilestoneAssistRuntimeConfigMap = {
  M1: {
    assist_policy_version: 'assist_policy_v1',
    enabled_assist_levels: ['tip_only'],
    assist_star_cap_behavior: {
      tip_only: 3,
      gentle_board_bias: 2,
      easier_variant: 1,
    },
  },
  M2: {
    assist_policy_version: 'assist_policy_v1',
    enabled_assist_levels: ['tip_only', 'gentle_board_bias'],
    assist_star_cap_behavior: {
      tip_only: 3,
      gentle_board_bias: 2,
      easier_variant: 1,
    },
  },
  M3_PLUS: {
    assist_policy_version: 'assist_policy_v1',
    enabled_assist_levels: ['tip_only', 'gentle_board_bias', 'easier_variant'],
    assist_star_cap_behavior: {
      tip_only: 3,
      gentle_board_bias: 2,
      easier_variant: 1,
    },
  },
};
```

Rules:

- Runtime assist behavior must be selected from `MILESTONE_ASSIST_RUNTIME_CONFIG` and must not be hardcoded ad hoc in UI or encounter logic.
- This section is the implementation-level runtime counterpart to `docs/creature-and-encounter-rules.md` section **"Repeated-loss assistance contract (encounter layer)"**; both docs must stay semantically aligned.
- Runtime must materialize `ActiveEncounterAssistState` per encounter attempt; this state is reset/recomputed when a new attempt begins.
- loss-#2 (`tip_only`) contract: `active_level = 'tip_only'`, exactly one of (`tip_copy_id`, `tip_text`) should be populated for that attempt-level payload, and `mechanical_overrides` must remain `null`.
- loss-#3 (`gentle_board_bias`) contract is deterministic and one-attempt scoped:
  - allowed parameter change: temporarily raise `RuntimeBoardConfig.boardQualityPolicy.minVowelClassCount` by `+1` for that attempt only.
  - clamp rule: effective value is `min(baseMinVowelClassCount + 1, rows * cols)` where base comes from authored encounter runtime config.
  - scope rule: applies to **`board_init` generation only** for the assisted attempt; `board_refill` acceptance rules/thresholds remain exactly as authored baseline.
  - RNG lineage rule: quality-gate retries caused by this temporary threshold must consume additional draws from `board_init` only, preserve the same `board_init` substream lineage, and must not consume/borrow from `board_refill`, `spell_targeting`, or `spark_shuffle`.
- loss-#4 (`easier_variant`) contract is deterministic and one-attempt scoped:
  - `mechanical_overrides` allows only `move_budget_delta` and `countdown_delta`; other keys are invalid.
  - bounds: `move_budget_delta` allowed values are `0 | 1`; `countdown_delta` allowed values are `-1 | 0`.
  - stacking rule: within one attempt, each override key is applied at most once; values are not cumulatively stacked across multiple assists/prompts.
  - application rule: `effective_move_budget = authored_move_budget + move_budget_delta`; `effective_countdown = max(1, authored_countdown + countdown_delta)`.
  - expiry rule: overrides expire immediately after that assisted attempt resolves (win/loss/recoverable terminal), and future attempts must recompute eligibility from repeated-loss thresholds.
  - restore/replay rule: assisted attempts must remain deterministic and restorable using persisted snapshot payloads plus pinned versions; restores must not re-roll or reinterpret override values.
- `assist_policy_version` and serialized `ActiveEncounterAssistState` must be persisted in `active_encounter_snapshots` (section 7.5) once assist state is present so restores replay the same policy contract.
- Star-cap resolution for an encounter must apply the minimum cap implied by all assists used in that run.
- If a level is missing from `enabled_assist_levels`, runtime must treat that level as unavailable even if UI copy exists.
- `M3_PLUS` is the canonical config for Milestone 3 and every later milestone unless this contract is intentionally revised.

Canonical clue enums:

```ts
export type ClueActionType =
  | 'reveal_starter_letter'
  | 'highlight_legal_path'
  | 'reroll_local_tiles';

export type ClueUseDenyReason =
  | 'clues_disabled_for_milestone'
  | 'starter_flow_locked'
  | 'no_charges_available'
  | 'encounter_limit_reached'
  | 'cooldown_active'
  | 'encounter_not_in_progress'
  | 'creature_spell_lock_active'
  | 'post_terminal_state';
```

Canonical persisted clue counters in active encounter runtime:

```ts
export interface EncounterClueRuntimeState {
  clue_charges_available: number;
  clue_uses_total: number;
  clue_uses_reveal_starter_letter: number;
  clue_uses_highlight_legal_path: number;
  clue_uses_reroll_local_tiles: number;
  clue_cooldown_successful_casts_remaining: number;
  clue_star_cap_from_usage: 0 | 1 | 2 | 3 | null;
}
```

Rules:

- `clue_charges_available` is decremented only on successful clue action commit.
- `clue_uses_*` counters are per-encounter counters and reset on fresh run creation.
- `clue_cooldown_successful_casts_remaining` tracks cooldown in units of successful valid casts.
- `clue_star_cap_from_usage` is null before clue use; then records strict cap values that mirror `docs/milestone-locked-constants.md` section 3.3.e exactly (`reveal_starter_letter`/`highlight_legal_path` -> cap `2`, `reroll_local_tiles` -> cap `1`) and always resolves to the minimum cap seen so far.

Canonical deterministic candidate-selection contract for:
- `reveal_starter_letter`
- `highlight_legal_path`

```ts
export interface ClueWordCandidate {
  normalized_word: string;
  path: BoardPosition[]; // ordered cast path
  length: number;
}
```

Selection pipeline rules:

1. Candidate enumeration order:
   - enumerate start positions in row-major order (`row` asc, `col` asc)
   - enumerate neighbor expansion using this fixed order:
     1) `(-1, -1)` 2) `(-1, 0)` 3) `(-1, +1)` 4) `(0, -1)` 5) `(0, +1)` 6) `(+1, -1)` 7) `(+1, 0)` 8) `(+1, +1)`
   - paths must be non-reusing and length `>= 3`
2. Candidate filtering precedence (required order):
   - tile-state eligibility filter (reject path containing unselectable tile states; v1 includes Frozen)
   - lexicon-validity filter (`ValidationSnapshotLookup.hasWord(normalized_word)`)
   - repeated-word filter (`normalized_word` must be absent from `EncounterRuntimeState.repeated_words`)
3. Priority sort (on surviving candidates):
   - length descending
   - normalized word lexical ascending (`a`..`z`)
   - path board-position tuple ascending by first differing `(row, col)`
4. Canonical selection:
   - selected candidate is sorted `index 0`
   - `reveal_starter_letter` reveals `selected.path[0]`
   - `highlight_legal_path` highlights `selected.path`
5. RNG usage:
   - both actions consume zero RNG draws
   - no RNG stream label is used for this pipeline in v1
   - encounter RNG stream state must remain unchanged after candidate resolution for these actions

Worked example fixture (QA lock):

- board rows:
  - row 0: `S T O N E .`
  - row 1: `G L O W . .`
  - row 2: `. . . . . .`
  - row 3: `. . . . . .`
  - row 4: `. . . . . .`
  - row 5: `. . . . . .`
- active castable words include `stone`, `glow`
- `repeated_words = []`
- no blocking tile state on any candidate tile

Candidate set after filtering:
- `stone` path `[(0,0),(0,1),(0,2),(0,3),(0,4)]` length `5`
- `glow` path `[(1,0),(1,1),(1,2),(1,3)]` length `4`

Canonical chosen result:
- selected candidate: `stone`
- `reveal_starter_letter` output tile: `(0,0)` (`S`)
- `highlight_legal_path` output path: `[(0,0),(0,1),(0,2),(0,3),(0,4)]`

Required persisted profile-level clue economy counters:

```ts
export interface PlayerClueEconomyState {
  clue_daily_earned_utc_date: string | null; // YYYY-MM-DD UTC
  clue_daily_earned_count: number;
  clue_daily_purchased_utc_date: string | null; // YYYY-MM-DD UTC
  clue_daily_purchased_count: number;
  clue_inventory_count: number;
}
```

Rules:

- runtime must enforce daily earn cap, daily purchase cap, and inventory cap exactly as locked in `docs/milestone-locked-constants.md` section 3.3.e.
- cap logic is UTC-date keyed and must not rely on local device timezone interpretation.
- paid and non-paid clue charges draw from the same encounter runtime budget constraints.
- If clue-economy lock values change, update `docs/milestone-locked-constants.md` section 3.3.e first, then mirror the updated values here in the same change.

#### 8.2.b Encounter balance metadata and waiver contract

```ts
export interface RuntimeEncounterBalanceMetadata {
  authoredFailRateBand: 'low' | 'medium' | 'high';
  shippabilityStatus:
    | 'prototype'
    | 'tune-required'
    | 'candidate-shippable'
    | 'shippable';
  waivers: RuntimeEncounterBalanceWaiver[];
}

export interface RuntimeEncounterBalanceWaiver {
  waiverId: string;
  ruleId: string;
  reason: string;
  approver: string;
  reviewByUtc: string; // ISO-8601 UTC
}
```

### 8.3 Board config contract

```ts
export interface RuntimeBoardConfig {
  rows: 6;
  cols: 6;
  seedMode: 'generated' | 'fixed_seed';
  fixedSeed: string | null;
  allowWandTiles: boolean;
  wandSpawnRate: number; // finite rate in [0, 1], canonical runtime wand incidence source
  maxConcurrentWands: number | null; // null = legacy uncapped behavior; non-null = active board cap
  letterDistributionProfileId: string; // e.g. `letter_distribution_v1`
  letterWeightEntries: RuntimeLetterWeightEntry[]; // canonical weighted A-Z entries for this runtime config
  namedLetterPoolId: string | null; // optional named pool alias, e.g. `v1_default_pool`
  vowelClassProfileVersion: string; // versioned vowel-class profile id, e.g. `vowel_class_v1`
  vowelClassIncludesY: boolean; // pinned by `vowelClassProfileVersion`; false => A/E/I/O/U, true => A/E/I/O/U/Y
  boardQualityPolicy: RuntimeBoardQualityPolicy | null; // optional additive quality gate for generation/refill acceptance
}

export interface RuntimeBoardQualityPolicy {
  qualityPolicyVersion: string; // versioned profile id, e.g. `board_quality_v1`
  minVowelClassCount: number; // inclusive threshold over generated/refilled board under active vowel-class profile
}

export interface RuntimeLetterWeightEntry {
  letter: string; // normalized uppercase A-Z only
  weight: number; // finite positive non-zero numeric weight
}
```

Rules:

- `letterDistributionProfileId` is required and versioned so balancing can evolve additively (for example, `letter_distribution_v1`) without changing RNG semantics.
- `namedLetterPoolId` is optional metadata for authored presets and does not change draw algorithm behavior by itself.
- `vowelClassProfileVersion` and `vowelClassIncludesY` together define the canonical vowel class used by board-quality checks:
  - base class is always `A`, `E`, `I`, `O`, `U`
  - include `Y` only when `vowelClassIncludesY = true`
  - both fields are version-pinned runtime data and must not be inferred ad hoc from locale/device settings.
- `boardQualityPolicy` is an optional additive acceptance filter for board generation/refill outputs:
  - `null` disables quality filtering (only hard safety gate applies).
  - non-null requires finite integer `minVowelClassCount` in inclusive range `[0, rows * cols]`.
  - `qualityPolicyVersion` is required so tuning can evolve additively without retroactively changing old fixtures.
- `wandSpawnRate` is required and is the canonical runtime-authored wand incidence representation used by encounter balance parity validators.
- `wandSpawnRate` must be finite and clamped to inclusive range `[0, 1]`; runtime/content validators must fail values outside this range (no silent coercion).
- if `allowWandTiles = false`, `wandSpawnRate` must be exactly `0`; any non-zero value is invalid.
- `maxConcurrentWands` controls the active-board Wand marker cap:
  - `null` means legacy uncapped behavior (no board-level Wand cap enforced).
  - non-null values must be finite integers in inclusive range `[0, rows * cols]` (`[0, 36]` for current 6x6 board).
  - values outside the allowed range, non-integers, and non-finite values must fail runtime/content validation (no silent coercion).
  - cap accounting counts every tile currently carrying the Wand marker, including tiles that also carry a negative tile state overlay (Frozen, Sooted, Dull, Bubble).
  - negative tile states do not remove, suspend, or otherwise pause Wand-marker membership for cap accounting.
  - when checking whether new Wand assignment is suppressed due to cap, runtime must reference only this total active-board Wand count.
  - composition semantics must remain aligned with `docs/game-rules.md` section 5 "Board composition" (a tile may simultaneously carry letter + marker + negative state).
  - example capped snapshot (`maxConcurrentWands = 3`): board contains `Wand`, `Wand+Frozen`, and `Wand+Bubble` tiles; active-board Wand count is `3`, so additional generated tiles cannot be assigned Wand until the count drops below cap.
- `letterWeightEntries` is the canonical runtime source for weighted refill and initial-board letter selection.
- `letterWeightEntries` must contain exactly one entry per letter `A` through `Z`.
- normalization must canonicalize letters to uppercase ASCII and reject non-`A`-`Z` values.
- every `weight` must be finite, non-zero, and strictly greater than `0`.
- deterministic ordering is mandatory: runtime consumers must process `letterWeightEntries` in ascending letter order (`A`..`Z`) before building cumulative weighted ranges.
- duplicate letters are invalid after normalization and must fail runtime validation.
- deterministic RNG consumption rule for Wand assignment:
  - board generation/refill resolves each tile in a fixed row-major order.
  - when `allowWandTiles = true`, runtime must consume exactly one Bernoulli roll per generated tile using `wandSpawnRate` from the same board RNG stream used for tile generation; consumption is mandatory even if the tile ultimately is not marked as Wand.
  - when `allowWandTiles = true` and `maxConcurrentWands` cap is reached, the Wand Bernoulli result is still consumed, but Wand assignment is suppressed for that tile.
  - when `allowWandTiles = false`, runtime must consume zero Wand rolls and assign no Wand markers.

Migration note for authored encounters:

- Existing content keeps current behavior by default: authored/runtime records that omit `maxConcurrentWands` should be treated as `null` (legacy uncapped) during migration and compatibility loading.
- Encounter authors must set a non-null `maxConcurrentWands` explicitly to opt into capped Wand concurrency behavior.

### 8.4 Reward contract

```ts
export interface RuntimeRewardDefinition {
  grantsProgressUnlock: 0 | 1;
  grantsJournalProgress: 0 | 1;
  grantsCosmeticCurrency: number;
}

export interface CosmeticUnlockRecord {
  unlock_id: string;
  unlock_type: 'avatar_frame' | 'profile_badge' | 'board_vfx' | 'other_profile_cosmetic';
  cost_currency: number;
  unlocked_at_utc: string; // ISO-8601 UTC
}
```

Rules:

- reward writes and reward UI text must use the locked constants in `docs/milestone-locked-constants.md` section 3.3 (no duplicated ad hoc numeric literals).
- encounter first-clear currency and journal increments must follow section 3.3.a.
- star-improvement currency grants and per-encounter cap behavior must follow section 3.3.b.
- `grantsJournalProgress = 1` means apply the canonical journal increment from section 3.3.d (not an encounter-specific increment amount).
- challenge reward amounts and challenge cadence caps must follow section 3.3.c.
- `grantsCosmeticCurrency` must be a non-negative integer and must not exceed the applicable locked reward cap for the claim type.
- when no reward applies, `RuntimeRewardDefinition` should be `null` rather than using zeroed placeholder values.
- source-of-truth linkage: the `grantsCosmeticCurrency` accrual field writes directly into `player_profile_records.cosmetic_currency_balance`; implementations must not create alternate spendable cosmetic balance field names for the same economy.
- spend invariant: cosmetic purchases/unlocks must fail pre-commit if `player_profile_records.cosmetic_currency_balance - cost_currency < 0`.
- spend invariant: unlock handling must be idempotent by `unlock_id`; retrying an already-owned unlock must not decrement currency again.
- spend invariant: profile ownership must not contain duplicate `unlock_id` records inside `cosmetic_unlock_records_json`.
- spend invariant: cosmetic spend deduction plus unlock append must execute atomically in one SQLite transaction; partial writes are forbidden.
- failure semantics: if any step in the spend+unlock transaction fails, the full transaction must roll back and leave persisted balance/ownership unchanged.
- idempotency semantics: retrying an already-owned `unlock_id` must no-op without additional currency deduction and without writing duplicate ownership records.

### 8.5 Progression definition contract

```ts
export type ProgressionTopology = 'chapter_linear_v1';
export type MainlineUnlockCondition = 'win_any_stars';

export interface RuntimeProgressionDefinition {
  progression_version: string;
  topology: 'chapter_linear_v1';
  starter_encounter_id: string;
  chapters: RuntimeProgressionChapterDefinition[];
}

export interface RuntimeProgressionChapterDefinition {
  chapter_id: string;
  display_name: string;
  habitat_theme_id: string;
  sort_index: number;
  encounter_ids: string[]; // ordered mainline encounter ids only
}
```

Rules:

- `starter_encounter_id` must not appear inside `chapters[*].encounter_ids`
- each mainline encounter ID must appear exactly once across all chapters
- canonical mainline order is defined by `sort_index`, then `encounter_ids[]` order
- the next mainline encounter for unlock purposes is derived only from that canonical order
- boss encounters may appear in mainline chapter order
- event encounters do not gate mainline progression by default in Milestone 2

### 8.6 Phase rule contract

```ts
export interface RuntimePhaseRule {
  trigger:
    | { kind: 'hp_threshold'; thresholdPercent: number }
    | { kind: 'countdown_cycle'; cycleCount: number };
  changesWeaknessTo: NonNeutralElementType | null;
  changesResistanceTo: NonNeutralElementType | null;
  nextPhaseState: 'phase_two' | 'special';
}
```

Rules:

- ordinary creatures should use `phaseRules: []`
- phase rules are primarily for bosses/events
- the current product direction expects very little or no use of matchup shifts in v1 ordinary content
- `changesWeaknessTo` and `changesResistanceTo` must not be random

### 8.7 Post-M2 challenge and competition runtime contracts

```ts
export interface RuntimeChallengeDefinition {
  challengeId: string;
  challengeType: 'daily' | 'weekly' | 'event' | 'limited_time';
  sourceEncounterId: string;
  modifierList: string[];
  rewardDefinition: RuntimeRewardDefinition | null;
  contentVersionPin: string;
  validationSnapshotVersionPin: string;
  battleRulesVersionPin: string;
  boardGeneratorVersionPin: string;
  rewardConstantsVersionPin: string;
  availabilityWindow: {
    startsAtUtc: string;
    endsAtUtc: string;
    timezoneMode: 'utc';
    windowLabel: string | null;
  };
}

export interface RuntimeChallengeBundleManifest {
  bundleId: string;
  bundleType: 'daily_rotation' | 'weekly_rotation' | 'event_bundle';
  activeWindow: {
    startsAtUtc: string;
    endsAtUtc: string;
    timezoneMode: 'utc';
  };
  includedChallengeIds: string[];
  spotlightMapping: Record<string, string | null>;
  contentVersionPin: string;
  validationSnapshotVersionPin: string;
  battleRulesVersionPin: string;
  rewardConstantsVersionPin: string;
}

export interface RuntimeMirrorCompetitionDefinition {
  competitionId: string;
  format: 'mirror_competition_v1';
  encounterId: string;
  sharedSeed: string;
  contentVersionPin: string;
  validationSnapshotVersionPin: string;
  battleRulesVersionPin: string;
  boardGeneratorVersionPin: string;
  rewardConstantsVersionPin: string;
  cluePolicy: 'disabled' | 'shared_budget' | 'own_budget';
  rankingRulesRef: string;
}

export interface CompetitionResultSummary {
  outcome: EncounterOutcome;
  stars: 0 | 1 | 2 | 3;
  movesRemaining: number;
  successfulCastsUsed: number;
  tieState: 'none' | 'exact_tie' | 'shared_rank';
  rankDisplay: {
    rankLabel: string;
    rankOrdinal: number | null;
    percentileBand: string | null;
  };
}
```

Rules:

- post-M2 challenge and competition contracts are additive and must not redefine M1-M2 encounter runtime semantics
- `sourceEncounterId` and `encounterId` must resolve to a valid `RuntimeEncounterDefinition.id`
- `rewardDefinition` amounts for `daily` and `weekly` challenges must use the exact locked values in `docs/milestone-locked-constants.md` section 3.3.c
- runtime claim services must enforce the UTC daily/weekly reward caps from section 3.3.c before persisting currency or journal progress writes
- `sharedSeed` is fairness-critical and must be immutable once a competition becomes active
- all post-M2 challenge and competition payloads must preserve explicit version pins to support replayability, auditability, and deterministic dispute review

---

## 9. Canonical progression transition rules

Progression changes are applied only when a terminal encounter result is committed.

### 9.1 Starter result transition rules

When the starter encounter resolves:

- on win:
  - set `player_profile_records.has_completed_starter_encounter = 1`
  - set `player_profile_records.starter_result_outcome = 'won'`
  - update the starter encounter progress/result records normally
  - unlock the first mainline encounter if it is locked
- on loss:
  - set `player_profile_records.starter_result_outcome = 'lost'`
  - keep `player_profile_records.has_completed_starter_encounter = 0`
  - update the starter encounter progress/result records normally
  - unlock nothing


### 9.1.a Canonical first-time starter timeline contract

The canonical onboarding timeline is:

1. **First launch**
   - route to `starter_flow`
   - starter tutorial begins from `starter_tutorial_current_stage = 'cue_01_trace_word'`
2. **Starter loss**
   - write `starter_result_outcome = 'lost'`
   - keep `has_completed_starter_encounter = 0`
   - route to starter loss result with retry CTA (`cue_05_loss_retry_prompt`)
3. **Starter retry**
   - keep route inside `starter_flow`
   - resume cues from persisted stage markers (show-once stages remain skipped once completed)
4. **Starter win**
   - write `starter_result_outcome = 'won'`
   - set `has_completed_starter_encounter = 1`
   - show starter win next-step prompt (`cue_06_win_next_step`)
5. **Route to Home**
   - clear starter gate
   - route to `home` and point primary progression CTA to first unlocked, uncleared mainline encounter

### 9.1.b Deterministic star-rating policy contract

Star-rating computation for persisted encounter results is policy-versioned:

- `star_policy_v1_absolute`
- `star_policy_v2_percentage`

This must align with `docs/game-rules.md` ("Current star-rating direction") and `docs/progression-economy-and-monetization.md` section 9 (`win_any_stars`, no relock).

TypeScript-facing pure contract:

```ts
export type StarRating = 0 | 1 | 2 | 3;
export type StarPolicyVersion = 'star_policy_v1_absolute' | 'star_policy_v2_percentage';

export function deriveStarRating(
  outcome: EncounterOutcome,
  moves_remaining: number,
  move_budget_total: number,
  star_policy_version: StarPolicyVersion,
): StarRating;
```

Deterministic policy mappings:

- if `outcome = 'lost'`, return `0` (ignore `moves_remaining`, `move_budget_total`, and policy thresholds for rating)

`star_policy_v1_absolute` (current standard encounter behavior):

- if `outcome = 'won'` and `moves_remaining >= 4`, return `3`
- if `outcome = 'won'` and `moves_remaining` is `2` or `3`, return `2`
- if `outcome = 'won'` and `moves_remaining` is `0` or `1`, return `1`

`star_policy_v2_percentage` (percentage-of-budget behavior):

- compute `remaining_ratio = moves_remaining / move_budget_total`
- `move_budget_total` must be `>= 1` for any playable encounter and policy evaluation
- deterministic rounding rule: compute `remaining_percent_floor = floor(remaining_ratio * 100)` (no nearest rounding; always floor)
- deterministic boundary rule (inclusive lower bounds):
  - `remaining_percent_floor >= 30` => `3` stars
  - `remaining_percent_floor >= 15` and `< 30` => `2` stars
  - `remaining_percent_floor >= 0` and `< 15` => `1` star
- deterministic guardrail rule: clamp `remaining_percent_floor` to `[0, 100]` before threshold checks so out-of-range persisted values do not produce undefined mapping

Boundary examples:

- `deriveStarRating('won', 0, 12, 'star_policy_v1_absolute') = 1`
- `deriveStarRating('won', 3, 12, 'star_policy_v1_absolute') = 2`
- `deriveStarRating('won', 4, 12, 'star_policy_v1_absolute') = 3`
- `deriveStarRating('won', 3, 10, 'star_policy_v2_percentage') = 3` (`floor(30.0)`)
- `deriveStarRating('won', 2, 10, 'star_policy_v2_percentage') = 2` (`floor(20.0)`)
- `deriveStarRating('won', 1, 10, 'star_policy_v2_percentage') = 1` (`floor(10.0)`)
- `deriveStarRating('won', 9, 31, 'star_policy_v2_percentage') = 2` (`floor(29.03) = 29`)
- `deriveStarRating('lost', 5, 10, 'star_policy_v2_percentage') = 0` (loss always maps to `0`)

Persistence and progression application rules:

- compute `encounter_result_records.star_rating` exactly once, at terminal result commit time, using `deriveStarRating(outcome, moves_remaining, move_budget_total, star_policy_version)` and persist with the result row
- do not derive or rewrite `star_rating` later from UI state or replay screens
- on outcome `won`, update `encounter_progress_records.best_star_rating = max(existing_best_star_rating, result.star_rating)`
- on outcome `lost`, do not change `encounter_progress_records.best_star_rating`
- progression unlock semantics remain `win_any_stars` (`1|2|3` on win unlocks next canonical encounter) regardless of `star_policy_version`; losses (`0` stars) do not unlock and replays must not relock

### 9.1.c Terminal result commit transaction order

Terminal encounter commit is a single atomic write transaction. Implementations must execute the following steps in strict order:

1. Derive terminal outcome and `terminal_reason_code`.
2. Derive `star_rating` using the active `star_policy_version`.
3. Insert `encounter_result_records`.
4. Update `encounter_progress_records`.
5. Apply reward/currency/journal/first-clear and star-improvement deltas atomically.
6. Update or clear `active_encounter_snapshots` according to terminal state policy.
7. Set restore target behavior to `result` for terminal sessions.

Transaction/rollback contract:

- Steps 1-7 must occur inside one database write transaction boundary for the terminal commit unit.
- If any step fails, the entire transaction must roll back; partial writes are forbidden.
- No side table (`encounter_result_records`, `encounter_progress_records`, profile rewards/currency/journal, first-clear flags, star-improvement updates, `active_encounter_snapshots`) may remain mutated after rollback.
- Replay/retry behavior must be idempotent at the commit boundary: rerunning a failed terminal commit attempt must either produce one fully committed result set or no persisted changes.

### 9.2 Mainline win transition rules

When a mainline encounter resolves with outcome `won`:

- update its `best_star_rating` using max(existing, new)
- set `first_completed_at_utc` if this is the first win
- set `last_completed_at_utc`
- increment `win_count`
- find the canonical next mainline encounter from `RuntimeProgressionDefinition`
- if a next mainline encounter exists and is locked:
  - set `is_unlocked = 1`
  - set `first_unlocked_at_utc` if null
- unlock at most one next mainline encounter from a single win

### 9.3 Mainline loss transition rules

When a mainline encounter resolves with outcome `lost`:

- increment `loss_count`
- do not change `best_star_rating`
- do not change unlock state for any encounter

### 9.4 Replay rules

Replays may change:
- `best_star_rating`
- `last_completed_at_utc`
- `win_count`
- `loss_count`

Replays must not:
- relock any encounter
- unlock more than the single canonical next encounter
- change chapter order or next-action truth

---

## 10. Validation Snapshot Runtime Contracts

These interfaces define app/runtime validation boundaries for word lookup and element lookup.

### 9.1 Runtime validation word contract

```ts
export interface RuntimeValidationWord {
  normalized_word: string;
  element: ElementType;
}
```

Rules:

- runtime validation lookup should contain only castable words
- blocked or rejected words do not need to exist in the hot lookup path
- `element = 'arcane'` is a normal valid value

### 9.2 Validation snapshot metadata contract

```ts
export interface ValidationSnapshotMetadata {
  snapshot_version: string;
  language: 'en';
  word_count: number;
  tagged_word_count: number;
  generated_at_utc: string;
}
```

### 9.3 Runtime validation lookup contract

```ts
export interface ValidationSnapshotLookup {
  snapshot_version: string;
  metadata: ValidationSnapshotMetadata;
  hasWord(normalizedWord: string): boolean;
  getEntry(normalizedWord: string): RuntimeValidationWord | null;
}
```

### 9.4 Validation snapshot provider contract

```ts
export interface ValidationSnapshotLookupProvider {
  get(snapshot_version: string): ValidationSnapshotLookup;
}
```

Required runtime behavior:

- player cast validation must resolve against a pre-hydrated in-memory lookup for the active pinned snapshot
- dead-board detection must use the same lookup truth
- board generation/refill safety checks must use the same lookup truth
- do not parse validation snapshot files per cast
- do not query SQLite per cast for ordinary lookup paths

Preferred v1 implementation:

- hydrate generated validation snapshot data once into process-global in-memory lookup structures inside `packages/validation`
- reuse those structures for all active lookups
- avoid introducing Trie/SQLite/per-cast lookup complexity unless profiling proves the simple approach is inadequate

---

## 11. Content Runtime Validation Contracts

These interfaces define runtime content/schema validation boundaries for encounter and creature activation.

### 11.1 Generic validation result contract

```ts
export interface RuntimeValidationResult {
  ok: boolean;
  findings: RuntimeValidationFinding[];
  errors: Array<{
    code:
      | 'schema_invalid'
      | 'enum_invalid'
      | 'countdown_invalid'
      | 'matchup_invalid'
      | 'damage_model_version_invalid'
      | 'board_config_invalid'
      | 'phase_rule_invalid'
      | 'version_pin_mismatch'
      | 'id_collision';
    message: string;
    field_path?: string;
  }>;
}
```

```ts
export interface RuntimeValidationFinding {
  rule_id: string;
  severity: 'error' | 'warn' | 'info';
  measured_value: string | number | boolean | null;
  threshold: string;
  remediation_hint: string;
  field_path?: string;
}
```

### 11.2 Runtime content validator contract

```ts
export interface ContentPackageRuntimeValidator {
  validateCreatureDefinition(def: unknown): RuntimeValidationResult;
  validateEncounterDefinition(def: unknown): RuntimeValidationResult;
  validateValidationSnapshotMetadata(meta: unknown): RuntimeValidationResult;
}
```

Required runtime behavior:

- reject activation when validation fails
- preserve last-known-good content or show unavailable state
- do not silently mutate active pinned sessions due to newly loaded content
- keep content validation failures separate from ordinary battle-result failures

---

## 12. Analytics Event Contracts

This section pins canonical event names, required properties, and privacy/redaction rules.

It mirrors the later analytics-doc direction while giving TypeScript-facing shapes now.

### 12.1 Canonical event names

```ts
export type CanonicalAnalyticsEventName =
  | 'session.start'
  | 'session.resume'
  | 'session.pause'
  | 'session.end'
  | 'session.route_viewed'
  | 'session.recovered_from_persisted_state'
  | 'encounter.started'
  | 'encounter.resumed'
  | 'encounter.cast_submitted'
  | 'encounter.cast_rejected'
  | 'encounter.cast_resolved'
  | 'encounter.creature_spell_triggered'
  | 'encounter.dead_board_recovered'
  | 'encounter.spark_shuffle_retry_cap_hit'
  | 'encounter.clue_used'
  | 'encounter.clue_denied'
  | 'encounter.hidden_bonus_word_discovered'
  | 'encounter.won'
  | 'encounter.lost'
  | 'encounter.result_viewed'
  | 'challenge.viewed'
  | 'challenge.started'
  | 'challenge.completed'
  | 'challenge.expired'
  | 'competition.joined'
  | 'competition.seed_locked'
  | 'competition.result_submitted'
  | 'competition.rank_viewed'
  | 'progression.encounter_unlocked'
  | 'settings.updated';
```

### 12.2 Base required analytics properties

```ts
export interface AnalyticsEventBase {
  event_name: CanonicalAnalyticsEventName;
  event_version: number;
  event_id: string;
  event_ts_utc: string;
  client_build_id: string;
  platform: 'android';
  environment: 'dev' | 'staging' | 'prod';
  app_session_id: string;
}
```

### 12.3 Gameplay analytics fields

```ts
export interface CanonicalGameplayAnalyticsFields {
  encounter_id: string | null;
  challenge_id: string | null;
  challenge_bundle_id: string | null;
  competition_id: string | null;
  encounter_session_id: string | null;
  encounter_type: EncounterType | null;
  difficulty_tier: DifficultyTier | null;
  encounter_session_state: EncounterSessionState | null;
  encounter_terminal_reason_code: EncounterTerminalReasonCode | null;
  content_version_pin: string | null;
  validation_snapshot_version_pin: string | null;
  battle_rules_version_pin: string | null;
  board_generator_version_pin: string | null;
  reward_constants_version_pin: string | null;
  hidden_bonus_reward_granted: 0 | 1 | null;
  competition_shared_seed: string | null;
  word_length: number | null;
  element: ElementType | null;
  matchup_result: MatchupResult | null;
  moves_remaining: number | null;
  rejection_reason: CastRejectionReason | null;
  spark_shuffle_retries_attempted: number | null;
  spark_shuffle_retry_cap: number | null;
  spark_shuffle_fallback_outcome: 'none' | 'deterministic_emergency_regen' | 'recoverable_error_end' | null;
  board_init_quality_retry_count: number | null;
  board_refill_quality_retry_count: number | null;
  clue_action_type: ClueActionType | null;
  clue_use_deny_reason: ClueUseDenyReason | null;
  clue_charges_available: number | null;
  clue_uses_total: number | null;
  clue_star_cap_from_usage: 0 | 1 | 2 | 3 | null;
  ranking_dimension_primary: 'stars' | 'moves_remaining' | 'successful_casts_used' | 'completion_time_ms' | null;
  ranking_dimension_secondary: 'moves_remaining' | 'successful_casts_used' | 'completion_time_ms' | 'none' | null;
  rank_ordinal: number | null;
  tie_state: 'none' | 'exact_tie' | 'shared_rank' | null;
}
```

### 12.4 Redaction/privacy contract

```ts
export interface AnalyticsPrivacyGuard {
  forbid_raw_cast_text: true;
  forbid_full_board_snapshot: true;
  forbid_validation_lexicon_dump: true;
  forbid_freeform_user_text: true;
  forbid_direct_personal_identifiers: true;
}
```

Required behavior:

- analytics must not send raw cast text by default
- analytics must not send full board snapshots by default
- event transport failures must be non-blocking for gameplay and persistence
- `encounter.spark_shuffle_retry_cap_hit` is required whenever Spark Shuffle reaches retry cap (even if deterministic emergency regeneration succeeds)
- when `boardQualityPolicy` is enabled, board-generation/refill analytics events must include `board_init_quality_retry_count` and `board_refill_quality_retry_count` so tuning and fairness audits can reconstruct acceptance/retry behavior.
- `encounter.clue_used` is required for every successful clue action commit and must include `clue_action_type`, `clue_charges_available`, and `clue_uses_total`.
- `encounter.clue_denied` is required for clue-use attempts rejected by gating, cooldown, or budget constraints and must include `clue_use_deny_reason`.
- `encounter.hidden_bonus_word_discovered` is required when an encounter-hidden bonus word is first discovered and must include `encounter_id`, `encounter_session_id`, `validation_snapshot_version_pin`, `reward_constants_version_pin`, and `hidden_bonus_reward_granted`.
- `encounter_terminal_reason_code = 'spark_shuffle_retry_cap_unrecoverable'` is required on terminal analytics events emitted from a `recoverable_error` encounter end
- all `challenge.*` events must include `challenge_id`; if emitted from a bundle context they must also include `challenge_bundle_id`
- all `competition.*` events must include `competition_id`, ranking dimensions (`ranking_dimension_primary`, `ranking_dimension_secondary`), and final rank/tie fields when available
- competition analytics payloads must always preserve `content_version_pin`, `validation_snapshot_version_pin`, `battle_rules_version_pin`, `board_generator_version_pin`, `reward_constants_version_pin`, and `competition_shared_seed` for fairness audits

---

## 13. App Store State Orchestration Contracts

This section defines the canonical Zustand-facing app orchestration state described in `docs/technical-architecture.md` section 13.1–13.4.
It intentionally separates:

- engine-owned battle truth
- persistence restore truth
- UI-only transient orchestration state

`AppStoreState` and slice contracts below are normative for `apps/mobile` store modules.

### 13.1 Root `AppStoreState` composition

```ts
export interface AppStoreState {
  sessionSlice: SessionSliceState;
  encounterSlice: EncounterSliceState;
  settingsSlice: SettingsSliceState;
  uiSlice: UiSliceState;
}
```

Rules:

- root composition must remain a shallow object with stable slice keys (`sessionSlice`, `encounterSlice`, `settingsSlice`, `uiSlice`)
- slice renames are breaking contract changes
- store middleware must not inject hidden gameplay-truth fields outside these slices

### 13.2 `sessionSlice` contract

```ts
export interface SessionSliceState {
  app_session_id: string;
  app_primary_surface: AppPrimarySurface;
  encounter_restore_target: EncounterRestoreTarget;
  active_encounter_session_id: string | null;
  active_encounter_id: string | null;
  active_result_record_id: string | null;
  starter_tutorial_cue_stage: StarterTutorialCueStage;
  starter_tutorial_block_state: StarterTutorialBlockState;
  has_completed_starter_flow: 0 | 1;
  last_route_change_at_utc: string;
}
```

Allowed write sources:

- persistence restore (`EncounterRestoreTarget`, starter-flow/profile flags)
- engine result mapping (`active_*` references after encounter creation or terminalization)
- UI-only interaction (`app_primary_surface` route acknowledgment)

Forbidden fields (must stay in encounter runtime/persistence contracts):

- `moves_remaining`, `move_budget_total`, board tiles, creature HP/countdown, repeated words, RNG stream state
- any inferred encounter outcome flags that duplicate `EncounterSessionState` or `EncounterResultRecord`

Required actions and idempotency:

- `sessionSlice.hydrateFromRestore(target)` must be idempotent for identical `EncounterRestoreTarget` payloads
- `sessionSlice.setPrimarySurface(surface)` must be idempotent for repeated same-value calls
- `sessionSlice.bindActiveEncounterRefs(refs)` must only update reference fields and never mutate canonical battle truth

Selector stability rules:

- provide leaf selectors (`selectAppPrimarySurface`, `selectActiveEncounterSessionId`) for route rendering
- avoid selectors that allocate new object literals per call for stable React memoization
- route selectors must be pure and derive only from `sessionSlice` + immutable contract values

### 13.3 `encounterSlice` contract

```ts
export interface EncounterSliceState {
  runtime_state: EncounterRuntimeState | null;
  last_engine_transition: EncounterSessionTransition | null;
  pending_persist_write: 0 | 1;
  last_persisted_snapshot_updated_at_utc: string | null;
}
```

Allowed write sources:

- engine result only (`runtime_state`, `last_engine_transition`)
- persistence restore (`runtime_state`, `last_persisted_snapshot_updated_at_utc`)
- orchestration flags (`pending_persist_write`)

Forbidden fields (battle-truth duplication):

- parallel `board`, `creature`, `moves`, or `session_state` fields outside `runtime_state`
- separate UI-owned Spark Shuffle counters or terminal reason mirrors
- derived damage previews stored as canonical state

Required actions and idempotency:

- `encounterSlice.applyEngineResult(nextState, transition)` must be idempotent when same state/version payload is reapplied
- `encounterSlice.restoreFromSnapshot(snapshot)` must preserve snapshot fidelity and not recompute deterministic fields
- `encounterSlice.markPersisted(updatedAtUtc)` must only clear `pending_persist_write` when `runtime_state` version matches persisted payload
- `encounterSlice.clearActiveEncounter()` must be safe to call repeatedly after terminal acknowledgment

Selector stability rules:

- expose granular selectors (`selectEncounterSessionState`, `selectMovesRemaining`, `selectCreatureRuntimeState`)
- selectors that project composite objects must be memoized and preserve referential equality when inputs are unchanged
- list/array projections from `runtime_state` (for example board tile lists) must avoid per-render resort/reallocation unless source changed

### 13.4 `settingsSlice` contract

```ts
export interface SettingsSliceState {
  sfx_enabled: 0 | 1;
  music_enabled: 0 | 1;
  haptics_enabled: 0 | 1;
  reduce_motion_enabled: 0 | 1;
  locale_code: string;
  analytics_opt_in: 0 | 1;
  has_seen_settings_education: 0 | 1;
}
```

Allowed write sources:

- persistence restore (authoritative for durable player preferences)
- UI-only interaction from settings surfaces

Forbidden fields:

- runtime encounter/battle state
- progression unlock state that belongs to profile/progression contracts
- ad-hoc feature flags that alter gameplay truth without corresponding documented contract

Required actions and idempotency:

- `settingsSlice.hydrate(persisted)` must be idempotent for same payload
- toggle/update actions (`setSfxEnabled`, `setLocaleCode`, etc.) must no-op on identical value
- `settingsSlice.resetToDefaults()` must restore documented defaults only, never infer from current encounter state

Selector stability rules:

- provide per-setting primitive selectors for render isolation
- avoid returning new grouped objects from selectors in frequently rerendered HUD roots

### 13.5 `uiSlice` contract

```ts
export interface UiSliceState {
  swipe_preview_path: BoardPosition[];
  highlighted_word_preview: string;
  transient_banner: 'none' | 'invalid_word' | 'repeated_word' | 'countdown_warning' | 'recoverable_error';
  pause_overlay_open: 0 | 1;
  result_ack_pending: 0 | 1;
}
```

Allowed write sources:

- UI-only interaction and view lifecycle state
- engine event reactions that map to presentation cues (`transient_banner`, `result_ack_pending`)

Forbidden fields:

- canonical encounter terminal outcome or persistence identifiers
- board truth, creature truth, or deterministic RNG progression
- duplicated starter-flow progression flags (`has_completed_starter_flow`, `starter_tutorial_cue_stage`)

Required actions and idempotency:

- `uiSlice.setSwipePreview(path, word)` must accept empty-path resets and be idempotent for same preview payload
- `uiSlice.showTransientBanner(kind)` must allow safe repeated calls without queue duplication side effects
- `uiSlice.acknowledgeResultView()` must only clear UI acknowledgment flags and must not mutate encounter outcome truth

Selector stability rules:

- transient selectors must return stable primitives or stable array references unless payload changed
- interaction-heavy selectors (swipe preview) should avoid derived allocations in render path
- UI-only selectors must never derive or infer gameplay legality; legality comes from engine output

### 13.6 Field mapping to existing contracts

- `sessionSlice.encounter_restore_target` maps directly to `EncounterRestoreTarget` (section 3.2)
- `encounterSlice.runtime_state` maps directly to `EncounterRuntimeState` (section 4.4)
- persistence hydrate and flush flows must use `ActiveEncounterSnapshotRecord` (section 7.5) as the serialized source of truth
- terminal result acknowledgement must reference `EncounterResultRecord.result_id` (section 7.4) without duplicating result truth in UI state
- restore routing decisions must continue to follow `EncounterSessionState` semantics defined in section 2.2 and section 3.1

### 13.7 Relationship to architecture boundary rules

These contracts operationalize `docs/technical-architecture.md` section 13.1–13.4:

- Zustand orchestrates app/session/UI state
- battle transitions remain engine-owned
- UI transient state stays local and non-canonical
- ownership split remains: rules packages compute truth, app store orchestrates invocation and rendering

## 14. Contract Usage Guidance

- `packages/game-rules` and `packages/validation` should own these exported contracts where practical
- `apps/mobile` should consume contracts and avoid redefining parallel shape types
- tests for transition legality, persistence serialization, analytics payload safety, and runtime content validation should assert against this contract file
- determinism tests must include:
  - same `encounter_seed` + same valid-cast sequence => identical board/countdown/outcome
  - mid-encounter snapshot restore => identical subsequent outcomes vs uninterrupted run
  - Spark Shuffle retry-cap case => identical retries attempted, fallback outcome, and post-fallback state for same seed/input sequence
- if a contract shape becomes annoying to use, fix it here first rather than working around it separately in each package

### Final rule
If the same gameplay concept is represented differently in three places, the contract layer is not doing its job.
