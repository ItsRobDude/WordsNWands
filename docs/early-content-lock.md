# Early Content Lock (M1–M2)

Lockfile policy for canonical early content pins and acceptance constraints.

---

## 1. Canonical version pins (required)

All M1–M2 authored content, runtime loading, restore snapshots, and deterministic fixtures must use exactly these pins:

- `content_version`: `content_m2_launch_v1`
- `validation_snapshot_version`: `val_snapshot_m2_launch_v1`
- `battle_rules_version`: `battle_rules_m2_launch_v1`
- `board_generator_version`: `board_generator_m2_launch_v1`
- `progression_version`: `progression_m2_chapter_linear_v1`
- `starter_board_profile_id`: `board_profile_starter_onboarding_v1`
- `core_board_profile_id`: `board_profile_core_mainline_v1`

Rules:

- Do not ship mixed M1–M2 bundles where any of these pins differ by encounter.
- Do not advance any one pin without intentional lock update in this file.
- Runtime records that carry content/version pins must match this lock exactly for M1–M2 content slices.

Cross-reference anchors:

- Content package/version discipline: `docs/content-pipeline-and-liveops.md` sections 5, 9, and 11.
- Runtime/persistence pin surfaces: `docs/implementation-contracts.md` sections 4.4 and 7.4–7.5.
- Local-first loading and ownership boundaries: `docs/technical-architecture.md` sections 6.1 and 8.
- Deterministic seed + replay parity obligations: `docs/randomness-and-seeding-contract.md` sections 5–7.

---

## 2. Required authored artifacts (must exist)

The M1–M2 lock is valid only when the following authored artifacts exist and are internally consistent:

### 2.1 Encounter artifacts

- Starter encounter artifact for `enc_starter_001`.
- Core chapter-1 encounter artifacts for:
  - `enc_meadow_001`
  - `enc_meadow_002`
  - `enc_meadow_003`

### 2.2 Progression artifacts

- One progression definition artifact pinned to `progression_m2_chapter_linear_v1`.
- `starter_encounter_id` set to `enc_starter_001`.
- Chapter-1 ordered encounter list exactly:
  1. `enc_meadow_001`
  2. `enc_meadow_002`
  3. `enc_meadow_003`

### 2.3 Validation artifacts

- One validation snapshot artifact pinned to `val_snapshot_m2_launch_v1`.
- Snapshot coverage must include all expected tutorial and chapter-1 intended-valid vocabulary used by authored onboarding/progression fixtures.

### 2.4 Deterministic fixture artifacts

- Starter onboarding deterministic fixture set, including cue-stage progression checkpoints.
- Chapter-1 progression deterministic fixture set, including unlock/order assertions.
- Determinism fixture set for seed/replay parity across:
  - initial board generation
  - refill generation
  - spell targeting
  - Spark Shuffle

Rules:

- Missing any required artifact blocks lock adoption.
- Artifact IDs and version pins must match section 1 exactly.
- Encounter/progression/validation artifacts must be cross-reference-valid (no dangling IDs).

---

## 3. Starter onboarding acceptance constraints (required)

Starter onboarding must satisfy all constraints below:

- Easy-first-win posture:
  - First-run starter tuning must bias toward an early confidence win.
  - Starter authored move budget / HP / countdown values must remain aligned with locked milestone constants.
- Deterministic cue alignment:
  - Starter cue progression must follow canonical cue stage ordering and persistence rules.
  - Cue replay/restore behavior must be deterministic across resume and process-kill restore.
- No extra system scope:
  - No auth/login/social/remote dependency gates before starter understanding.
  - No new gameplay systems introduced only for starter flow.
  - No monetization/retention interrupts in active starter solve flow.

Cross-reference anchors:

- Cue ordering and timeline: `docs/screens-and-session-flow.md` section 5 (starter sequence + timeline).
- Starter/progression transition truth: `docs/implementation-contracts.md` section 9.1 and 9.1.a.
- Locked starter constants: `docs/milestone-locked-constants.md` section 2.1.

---

## 4. Chapter-1 constraints (M1–M2 lock)

Chapter-1 authored content for this lock must obey:

- Scope lock:
  - Use only M1–M2 approved tile-state/status families (`frozen`, `sooted`, `dull`, `bubble`).
  - Do not introduce advanced or multi-layer status complexity in chapter-1 content.
- Progression lock:
  - Keep chapter topology at `chapter_linear_v1`.
  - Keep chapter-1 order fixed to section 2.2.
- Runtime determinism lock:
  - Do not require randomness behavior beyond the canonical substream model and retry/fallback rules.

If advanced status complexity is later approved, it must be introduced only through an explicit post-M2 doc lock update and version-pin change.

Cross-reference anchors:

- Allowed early tile-state scope: `docs/milestone-locked-constants.md` section 2.2.
- Progression topology contract: `docs/implementation-contracts.md` section 8.5.
- RNG/substream/determinism constraints: `docs/randomness-and-seeding-contract.md` sections 4–7.

---

## 5. Change-control rules

Any M1–M2 early-content lock change requires all of the following in the same update set:

1. Update this file with revised pins/rules.
2. Update affected contract docs and milestone lock docs where referenced.
3. Update deterministic fixture artifacts and expected outputs tied to changed pins.
4. Record migration notes for persisted snapshots/results that carry prior pins.

No partial lock update is allowed.
