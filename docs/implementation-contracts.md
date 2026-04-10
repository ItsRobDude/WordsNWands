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
  | 'abandoned';

export type EncounterSessionTransition =
  | 'open_encounter'
  | 'dismiss_intro'
  | 'submit_valid_cast'
  | 'submit_invalid_cast'
  | 'submit_repeated_cast'
  | 'resolve_creature_spell'
  | 'trigger_spark_shuffle'
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

- `won`, `lost`, and `abandoned` are terminal encounter states.
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
  in_progress: 'in_progress' | 'won' | 'lost' | 'abandoned';
  won: never;
  lost: never;
  abandoned: never;
};
```

Rules:

- `unopened` is allowed only before a run truly starts.
- `intro_presented` exists so the encounter-intro surface can be restored or skipped cleanly without hiding that state inside UI code.
- `in_progress` is the only active playable state.
- `won`, `lost`, and `abandoned` are terminal canonical states for a specific encounter session.
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
- a resolved encounter should restore to `result`, not fake `in_progress`
- if an unresolved active encounter exists, restore should prefer `encounter`
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
  encounter_seed: string | null;
}
```

Rules:

- `tiles.length` must always equal `rows * cols` for a valid active board
- every `row` and `col` pair must be unique
- `encounter_seed` is optional but strongly preferred for deterministic testing/debugging
- the board snapshot is canonical gameplay truth, not derived presentation state

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
  move_budget_total: number;
  moves_remaining: number;
  repeated_words: string[]; // normalized lowercase words
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
}
```

Rules:

- `repeated_words` stores normalized cast history for repeat rejection
- `moves_remaining` must never exceed `move_budget_total`
- the four version pins above are required for restore/debug trust
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

Damage-calculation rules for `ValidCastResolution`:

- `base_damage = 8 + 3 * (wordLength - 3) + max(0, wordLength - 5)`
- matchup multipliers: weakness `1.5`, neutral `1.0`, resistance `0.7`, arcane `1.0`
- `used_wand_tile = true` applies `wandMultiplier = 1.25`, otherwise `1.0`
- any cast that includes one or more Sooted tiles applies one `sootMultiplier = 0.75`
- `final_damage = round(base_damage * matchupMultiplier * wandMultiplier * sootMultiplier)`
- successful valid casts that reach damage resolution must clamp `final_damage >= 1`

### 5.3 Rejected cast resolution contract

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

### 5.4 Unified cast resolution contract

```ts
export type CastResolution = ValidCastResolution | RejectedCastResolution;
```

Rules:

- invalid or repeated casts must not consume a move
- invalid or repeated casts must not mutate the board
- invalid or repeated casts must not change countdown state
- `did_win` and `did_lose` must never both be true
- the UI should not infer win/loss from HP alone if the gameplay engine already returned a terminal result

### 5.5 Creature spell resolution contract

```ts
export interface CreatureSpellResolution {
  spell_identity: string;
  applied_primitives: CreatureSpellPrimitive[];
  countdown_reset_to: number;
  did_change_board: boolean;
}
```

### 5.6 Spark shuffle resolution contract

```ts
export interface SparkShuffleResolution {
  trigger_reason: 'dead_board';
  did_recover_playable_state: boolean;
}
```

Rules:

- spark shuffle is a system recovery event, not player blame
- spark shuffle resolution must be explicit so UI, logs, and tests can treat it differently from normal creature actions
- board recovery must not sneak in hidden penalties

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
  target_count: number;
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
  steps: Array<ApplyTileStatePrimitive | ShiftRowPrimitive | ShiftColumnPrimitive>;
}
```

Rules:

- standard creatures should normally use one primitive or one small chained primitive
- `ChainedSpellPrimitive` exists for readable multi-step boss/event behavior, not for content chaos
- whole-board scramble primitives are intentionally absent from the early contract
- new primitive families must be added deliberately in this document before wide implementation

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
  best_star_rating: 0 | 1 | 2 | 3;
  first_completed_at_utc: string | null;
  last_completed_at_utc: string | null;
  win_count: number;
  loss_count: number;
  updated_at_utc: string;
}
```

Rules:

- `best_star_rating = 0` means no win recorded yet
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
  moves_remaining: number;
  star_rating: 0 | 1 | 2 | 3;
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

### 7.5 `active_encounter_snapshots`

Exact device-local restore snapshots for active or just-resolved sessions.

```ts
export interface ActiveEncounterSnapshotRecord {
  encounter_session_id: string;
  encounter_id: string;
  encounter_type: EncounterType;
  difficulty_tier: DifficultyTier;
  session_state: EncounterSessionState;
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
  encounter_seed: string | null;
  move_budget_total: number;
  moves_remaining: number;
  board_json: string;
  creature_state_json: string;
  repeated_words_json: string;
  last_surface: AppPrimarySurface;
  created_at_utc: string;
  updated_at_utc: string;
  last_interaction_at_utc: string;
}
```

Rules:

- `board_json`, `creature_state_json`, and `repeated_words_json` are canonical serialized restore payloads for early milestones
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
  rewardDefinition: RuntimeRewardDefinition | null;
  boardConfig: RuntimeBoardConfig;
  contentVersion: string;
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
}
```

### 8.4 Reward contract

```ts
export interface RuntimeRewardDefinition {
  grantsProgressUnlock: 0 | 1;
  grantsJournalProgress: 0 | 1;
  grantsCosmeticCurrency: number;
}
```

### 8.5 Phase rule contract

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

## 9. Validation Snapshot Runtime Contracts

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

## 10. Content Runtime Validation Contracts

These interfaces define runtime content/schema validation boundaries for encounter and creature activation.

### 10.1 Generic validation result contract

```ts
export interface RuntimeValidationResult {
  ok: boolean;
  errors: Array<{
    code:
      | 'schema_invalid'
      | 'enum_invalid'
      | 'countdown_invalid'
      | 'matchup_invalid'
      | 'board_config_invalid'
      | 'phase_rule_invalid'
      | 'version_pin_mismatch'
      | 'id_collision';
    message: string;
    field_path?: string;
  }>;
}
```

### 10.2 Runtime content validator contract

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

## 11. Analytics Event Contracts

This section pins canonical event names, required properties, and privacy/redaction rules.

It mirrors the later analytics-doc direction while giving TypeScript-facing shapes now.

### 11.1 Canonical event names

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
  | 'encounter.won'
  | 'encounter.lost'
  | 'encounter.result_viewed'
  | 'progression.encounter_unlocked'
  | 'settings.updated';
```

### 11.2 Base required analytics properties

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

### 11.3 Gameplay analytics fields

```ts
export interface CanonicalGameplayAnalyticsFields {
  encounter_id: string | null;
  encounter_session_id: string | null;
  encounter_type: EncounterType | null;
  difficulty_tier: DifficultyTier | null;
  content_version_pin: string | null;
  validation_snapshot_version_pin: string | null;
  battle_rules_version_pin: string | null;
  word_length: number | null;
  element: ElementType | null;
  matchup_result: MatchupResult | null;
  moves_remaining: number | null;
  rejection_reason: CastRejectionReason | null;
}
```

### 11.4 Redaction/privacy contract

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

---

## 12. Contract Usage Guidance

- `packages/game-rules` and `packages/validation` should own these exported contracts where practical
- `apps/mobile` should consume contracts and avoid redefining parallel shape types
- tests for transition legality, persistence serialization, analytics payload safety, and runtime content validation should assert against this contract file
- if a contract shape becomes annoying to use, fix it here first rather than working around it separately in each package

### Final rule
If the same gameplay concept is represented differently in three places, the contract layer is not doing its job.
