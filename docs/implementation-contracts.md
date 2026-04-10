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
```

Rules:

- `won`, `lost`, `recoverable_error`, and `abandoned` are terminal encounter states.
- Invalid and repeated casts do **not** leave `in_progress`.
- Result acknowledgement is UI-local and must not rewrite canonical outcome state.
- Restart creates a new encounter run; it does not mutate a completed result into an unfinished state.

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
}
```

Rules:

- each stream state is a deterministic serialized RNG internal state blob
- restore must continue from these stored stream states (never regenerate from seed when snapshot state exists)
- stream labels and behavior must match `docs/randomness-and-seeding-contract.md`

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
  damage_model_version: 'damage_model_v1';
}
```

Rules:

- `repeated_words` stores normalized cast history for repeat rejection
- `moves_remaining` must never exceed `move_budget_total`
- `terminal_reason_code` is required whenever `session_state` is terminal, and must be `spark_shuffle_retry_cap_unrecoverable` when `session_state = 'recoverable_error'`
- `spark_shuffle_retry_cap` must mirror the canonical v1 value (`3`) so restore/debug payloads do not infer hidden constants
- `spark_shuffle_retries_attempted` and `spark_shuffle_fallback_outcome` must persist the last Spark Shuffle recovery cycle outcome even when encounter terminates
- the four version pins above are required for restore/debug trust
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
5. Apply Bubble post-refill motion for **surviving** Bubble tiles (rise to column top, shift others downward), then clear Bubble from those tiles.
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

Concrete example:

- before Spark Shuffle: `current_countdown = 2`, `moves_remaining = 9`
- after Spark Shuffle: `current_countdown = 2`, `moves_remaining = 9`

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
}

export interface ShiftColumnPrimitive {
  kind: 'shift_column';
  col_index: number;
  mode: 'rotate';
  distance: 1;
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

Example:

- step 1: `shift_row`
- step 2: `apply_tile_state(tile_state: 'frozen', target_count: 2)`

Step 2 eligibility uses post-shift coordinates, not pre-shift coordinates.

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
- this table stores exact restore truth, not a lossy summary
- a terminal `session_state` may still remain here briefly until the result screen is acknowledged and cleanup rules run
- restore must prefer this snapshot over guessed screen history

---

## 8. Runtime Content Definition Contracts

These interfaces define the stable runtime shapes for bundled encounter content.

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
export interface RuntimeEncounterDefinition {
  id: string;
  creatureId: string;
  moveBudget: number;
  isStarterEncounter: boolean;
  introFlavorText: string | null;
  damageModelVersion: 'damage_model_v1';
  rewardDefinition: RuntimeRewardDefinition | null;
  boardConfig: RuntimeBoardConfig;
  balanceMetadata: RuntimeEncounterBalanceMetadata;
  contentVersion: string;
}
```

Rules:

- `damageModelVersion` is required encounter authoring metadata for every balance-derived encounter and must currently be `'damage_model_v1'`
- `RuntimeEncounterDefinition` intentionally has no Spark Shuffle countdown/move override field in v1; runtime must apply the global Spark Shuffle pressure rule from section 5.6 without per-encounter guessing
- `balanceMetadata.waivers` is required and must be present even when empty (`[]`)
- any authored out-of-band balance value with `warn` severity requires an active waiver entry
- `error` severity out-of-band values are never auto-waived by content-only metadata; they require explicit governance exception handling outside ordinary authoring flow

#### 8.2.a Player assist action gating contract (M1-M2 and later)

- M1 and M2 ship with no player-invoked hint/clue runtime contract.
- Only automatic dead-board Spark Shuffle recovery is allowed during active encounter play in M1-M2.
- If player-invoked hints/clues are introduced in a later milestone, `docs/implementation-contracts.md` must define all of the following before implementation ships:
  - trigger source (exact button/surface and availability state)
  - gameplay effect (for example, one valid path candidate highlight and its lifetime)
  - pressure impact (exact move/countdown/currency effects)
  - anti-abuse constraints (cooldown, per-encounter limit, and any disable conditions)

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
  letterDistributionProfileId: string; // e.g. `letter_distribution_v1`
  letterWeightEntries: RuntimeLetterWeightEntry[]; // canonical weighted A-Z entries for this runtime config
  namedLetterPoolId: string | null; // optional named pool alias, e.g. `v1_default_pool`
}

export interface RuntimeLetterWeightEntry {
  letter: string; // normalized uppercase A-Z only
  weight: number; // finite positive non-zero numeric weight
}
```

Rules:

- `letterDistributionProfileId` is required and versioned so balancing can evolve additively (for example, `letter_distribution_v1`) without changing RNG semantics.
- `namedLetterPoolId` is optional metadata for authored presets and does not change draw algorithm behavior by itself.
- `wandSpawnRate` is required and is the canonical runtime-authored wand incidence representation used by encounter balance parity validators.
- `wandSpawnRate` must be finite and clamped to inclusive range `[0, 1]`; runtime/content validators must fail values outside this range (no silent coercion).
- if `allowWandTiles = false`, `wandSpawnRate` must be exactly `0`; any non-zero value is invalid.
- `letterWeightEntries` is the canonical runtime source for weighted refill and initial-board letter selection.
- `letterWeightEntries` must contain exactly one entry per letter `A` through `Z`.
- normalization must canonicalize letters to uppercase ASCII and reject non-`A`-`Z` values.
- every `weight` must be finite, non-zero, and strictly greater than `0`.
- deterministic ordering is mandatory: runtime consumers must process `letterWeightEntries` in ascending letter order (`A`..`Z`) before building cumulative weighted ranges.
- duplicate letters are invalid after normalization and must fail runtime validation.
- deterministic RNG consumption rule for Wand assignment:
  - board generation/refill resolves each tile in a fixed row-major order.
  - when `allowWandTiles = true`, runtime must consume exactly one Bernoulli roll per generated tile using `wandSpawnRate` from the same board RNG stream used for tile generation; consumption is mandatory even if the tile ultimately is not marked as Wand.
  - when `allowWandTiles = false`, runtime must consume zero Wand rolls and assign no Wand markers.

### 8.4 Reward contract

```ts
export interface RuntimeRewardDefinition {
  grantsProgressUnlock: 0 | 1;
  grantsJournalProgress: 0 | 1;
  grantsCosmeticCurrency: number;
}
```

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
  | 'encounter.won'
  | 'encounter.lost'
  | 'encounter.result_viewed'
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
  encounter_session_id: string | null;
  encounter_type: EncounterType | null;
  difficulty_tier: DifficultyTier | null;
  encounter_session_state: EncounterSessionState | null;
  encounter_terminal_reason_code: EncounterTerminalReasonCode | null;
  content_version_pin: string | null;
  validation_snapshot_version_pin: string | null;
  battle_rules_version_pin: string | null;
  word_length: number | null;
  element: ElementType | null;
  matchup_result: MatchupResult | null;
  moves_remaining: number | null;
  rejection_reason: CastRejectionReason | null;
  spark_shuffle_retries_attempted: number | null;
  spark_shuffle_retry_cap: number | null;
  spark_shuffle_fallback_outcome: 'none' | 'deterministic_emergency_regen' | 'recoverable_error_end' | null;
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
- `encounter_terminal_reason_code = 'spark_shuffle_retry_cap_unrecoverable'` is required on terminal analytics events emitted from a `recoverable_error` encounter end

---

## 13. Contract Usage Guidance

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
