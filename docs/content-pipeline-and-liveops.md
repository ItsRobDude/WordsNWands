# Words 'n Wands! Content Pipeline and LiveOps

This document defines how Words 'n Wands! should create, review, package, publish, correct, and evolve game content over time.

Its purpose is to keep content operations:

- fair
- reviewable
- maintainable
- realistic for a mostly AI-assisted solo project
- aligned with the game’s local-first architecture
- aligned with the product’s warm, family-friendly identity

This is the product-level source of truth for:

- content unit types
- content review and approval expectations
- content versioning and package boundaries
- challenge content delivery rules
- correction and rollback rules
- the boundaries of LiveOps and what should not be built too early

If future tools, pipelines, or publishing habits disagree with this document, this document should be treated as the content-pipeline and LiveOps rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should treat content as product truth, not decoration.

The game’s content includes:

- creatures
- encounters
- starter flow content
- progression content
- optional challenge content
- validation snapshots
- element-tag data
- reward definitions
- creature journal metadata later

A word game with creature battles can become untrustworthy very quickly if content is:

- ambiguous
- unreviewed
- internally inconsistent
- pushed live without validation
- changed silently after players have already interacted with it

### Practical content rule
The content pipeline must fit the real shape of this project:

- one primary human owner
- heavy AI assistance
- limited production bandwidth
- local-first gameplay
- conservative scope

That means Words 'n Wands! should prefer:

1. bundled local content first
2. typed reviewable content files
3. small clear release units
4. human-reviewed AI-assisted drafts
5. optional LiveOps later

over:

- giant custom CMS work
- constant live-event pressure
- backend-dependent content truth
- unreviewed generated content
- aggressive content cadence that the project cannot sustain

---

## 2. Scope of This Document

This document owns:

- what kinds of content exist
- how content should be authored and reviewed
- how content should be versioned and packaged
- how optional challenge content may be delivered later
- how content corrections and rollbacks should work
- what LiveOps should and should not mean for this product

This document does **not** own:

- battle mechanics themselves
- word-validation policy details
- implementation contracts for every runtime type
- engineering command contracts
- analytics taxonomy details
- monetization policy details

Those belong in other focused docs.

---

## 3. Content Principles

All Words 'n Wands! content should satisfy these principles.

### 3.1 Readability
The content must be understandable by ordinary players.

### 3.2 Fairness
The content must not depend on hidden tricks, obscure vocabulary abuse, or surprising matchup logic.

### 3.3 Family-friendly fit
The content must stay aligned with the game’s warm magical tone.

### 3.4 Replayable clarity
Creatures and encounters should feel distinct without becoming convoluted.

### 3.5 Stable identity
Creature IDs, encounter IDs, and validation snapshot versions should remain stable once introduced.

### 3.6 Reviewability
A human reviewer must be able to inspect what is being shipped.

### 3.7 Operational realism
Do not design a content cadence that assumes a full live-service team when the project does not have one.

---

## 4. Content Unit Types

Words 'n Wands! content should be divided into clear unit types.

### 4.1 Creature definitions
Creature definitions include things such as:

- creature ID
- name
- encounter type
- difficulty tier
- HP
- weakness
- resistance
- countdown
- spell identity
- spell primitives
- phase rules if any
- content version metadata

### 4.2 Encounter definitions
Encounter definitions include things such as:

- encounter ID
- referenced creature
- move budget
- starter flag if applicable
- intro flavor text if applicable
- reward definition
- board config
- progression placement metadata later if needed

### 4.3 Validation snapshots
Validation snapshots include:

- castable words
- element tags
- snapshot metadata
- version identity

Validation snapshots are content, not just code data.

### 4.4 Starter flow content
Starter flow content includes:

- first encounter definition
- any tutorial-specific creature or flavor wrappers
- first result flow framing

### 4.5 Progression content
Progression content may later include:

- encounter ordering
- chapter or habitat grouping
- unlock relationships
- progression reward metadata

### 4.6 Optional challenge content
Optional challenge content may later include:

- daily challenge sets
- weekly challenge sets
- event encounter packs
- seasonal challenge packs

### 4.7 Journal or codex metadata later
Creature journal data may later include:

- creature lore snippets
- visual unlock states
- flavor tags
- collection progress metadata

This should remain secondary to battle content.

---

## 5. Content Source of Truth

### 5.1 Typed, repo-owned content rule
Content should live in typed, reviewable repo-owned files.

Do not make core content depend on:

- screenshots
- spreadsheets as the canonical runtime truth
- untyped blobs hidden in app code
- one-off hand-edited screen components

### 5.2 Bundled-first rule
For early milestones, content should be bundled with the app.

Bundled-first means:

- content ships with the build
- content can be versioned with code
- content can be reviewed in diffs
- content does not require a live backend to make the game work

### 5.3 Shared-truth rule
Creature definitions, encounter definitions, and validation snapshots must remain aligned.

A shipped encounter must not point at:

- a creature definition that no longer exists
- a validation snapshot the app does not have
- a reward definition with unclear semantics
- a spell primitive the runtime does not support

---

## 6. Content Lifecycle States

All major content units should move through clear lifecycle states.

### Standard lifecycle states
Content should generally use a lifecycle such as:

- `draft`
- `review_ready`
- `fairness_reviewed`
- `approved`
- `bundled`
- `published`
- `archived`
- `corrected_exception`

### Meaning of states

#### Draft
The content exists, but is not ready for serious gameplay sign-off.

#### Review Ready
The content is coherent enough for real human review.

#### Fairness Reviewed
The content has been checked for:

- readability
- family-friendly fit
- obvious fairness issues
- obvious product-tone drift

#### Approved
The content is approved for bundling or publishing under the current milestone rules.

#### Bundled
The content has been included in a shipped app build or packaged bundle.

#### Published
The content is considered live/official for whatever delivery model applies.

#### Archived
The content is no longer active but remains part of history or package lineage.

#### Corrected Exception
The content required a player-trust-protecting correction after approval/publish.

### Practical rule
AI-generated content may help produce `draft` or `review_ready` content.  
It must not be treated as `approved` without human review.

---

## 7. Review and Approval Rules

### 7.1 Human review is mandatory
Content that affects gameplay truth must receive human review before approval.

This includes:

- creature definitions
- encounter definitions
- validation snapshot changes
- element-tag changes
- challenge reward definitions
- boss/event special rules

### 7.2 Fairness review checklist
Before approval, a content reviewer should be able to answer:

- Is this encounter readable?
- Is the creature identity clear?
- Is the weakness/resistance pairing understandable?
- Is the move budget fair for the intended tier?
- Is the spell intensity appropriate?
- Does the encounter rely on ordinary-player vocabulary?
- Does this content fit the family-friendly tone?
- Does this content depend on hidden special cases?

### 7.3 AI-content guardrail
AI may assist with:

- first-pass drafts
- naming suggestions
- flavor text drafts
- schema scaffolding
- review checklists

AI must not be the final authority for:

- fairness sign-off
- tone sign-off
- live challenge approval
- validation snapshot approval

For validation snapshot workflows, optional AI-prefilled draft fields are allowed only under the human-verification and provenance requirements in:

- `docs/validation-snapshot-bootstrap-playbook.md` (`Optional AI prefill mode`)

### 7.4 Validation snapshot curation protocol linkage
Validation snapshot approvals must follow the operational curation protocol defined in:

- `docs/word-validation-and-element-rules.md`, Section **18. Operational Curation Protocol**

For executable bootstrap/release steps for `val_snapshot_m2_launch_v1`, use:

- `docs/validation-snapshot-bootstrap-playbook.md`

This linkage is mandatory so that content operations and gameplay-validation policy remain synchronized for:

- candidate-word review fields
- tier acceptance thresholds and overrides
- reviewer dispute handling and SLA
- pre-release batch QA checks
- post-release rollback handling for mistaken acceptance or tag changes

---

## 8. Versioning and Package Rules

Words 'n Wands! should use explicit versioning for core content.

### 8.1 Required version pins
Runtime content should be pinned by at least:

- content version
- validation snapshot version
- battle rules version
- board generator version where relevant

For the active M1–M2 lock, canonical strings are defined in `docs/early-content-lock.md` section 1:

- `content_version = content_m2_launch_v1`
- `validation_snapshot_version = val_snapshot_m2_launch_v1`
- `battle_rules_version = battle_rules_m2_launch_v1`
- `board_generator_version = board_generator_m2_launch_v1`

### 8.2 Why this matters
Version pins protect trust in:

- restore behavior
- debugging
- test reproducibility
- fairness review
- future correction workflows

### 8.3 Stable release rule
Once a build is shipped, its bundled content must remain stable for that build.

Do not treat “main moved” as permission for the app to silently reinterpret older encounter sessions.

### 8.4 Additive change preference
When possible, prefer additive content change over destructive content churn.

### 8.5 Canonical v1 content package layout
For v1 bundled content, use this canonical directory and file layout:

```txt
content/
  schemas/
    content-package-manifest.schema.json
    creature.schema.json
    encounter.schema.json
    validation-snapshot.schema.json
  packages/
    <content_version>/
      manifest.json
      creatures/
        *.json
      encounters/
        *.json
      progression/
        *.json
      validation/
        snapshot.<validation_snapshot_version>.json
```

#### 8.5.1 Normative package structure and manifest-reference integrity example (M1–M2)
This subsection is limited to package folder/file layout plus manifest/reference integrity checks.
Example IDs and payload fragments below are non-canonical placeholders for schema illustration only (not live content canon).
Gameplay-authoritative starter/chapter values (creature IDs, tutorial scripts, HP/countdown/reward/board tuning, etc.) come from:

- `docs/first-shippable-content-pack.md`
- `docs/early-content-lock.md`

A package is minimally valid for M1–M2 only if all files below exist exactly at these paths:

```txt
content/packages/content_m2_launch_v1/manifest.json
content/packages/content_m2_launch_v1/creatures/creature.placeholder_starter_creature.json
content/packages/content_m2_launch_v1/encounters/enc_starter_001.json
content/packages/content_m2_launch_v1/encounters/enc_meadow_001.json
content/packages/content_m2_launch_v1/encounters/enc_meadow_002.json
content/packages/content_m2_launch_v1/encounters/enc_meadow_003.json
content/packages/content_m2_launch_v1/progression/progression.progression_m2_chapter_linear_v1.json
content/packages/content_m2_launch_v1/validation/snapshot.val_snapshot_m2_launch_v1.json
```

Structural `manifest.json` example (complete JSON; placeholder IDs illustrate required package-local references only):

```json
{
  "package_id": "content_pack_m2_launch",
  "content_version": "content_m2_launch_v1",
  "validation_snapshot_version": "val_snapshot_m2_launch_v1",
  "battle_rules_version": "battle_rules_m2_launch_v1",
  "board_generator_version": "board_generator_m2_launch_v1",
  "min_supported_app_version": "0.1.0",
  "schema_versions": {
    "manifest_schema": "content-package-manifest.schema.v1",
    "creature_schema": "creature.schema.v1",
    "encounter_schema": "encounter.schema.v1",
    "validation_snapshot_schema": "validation-snapshot.schema.v1"
  },
  "asset_pack_version": null,
  "created_at_utc": "2026-01-15T00:00:00Z",
  "created_by": "content_authoring_pipeline",
  "status": "approved",
  "payload_files": {
    "creatures": {
      "placeholder_starter_creature_v1": "creatures/creature.placeholder_starter_creature.json"
    },
    "encounters": {
      "enc_starter_001": "encounters/enc_starter_001.json",
      "enc_meadow_001": "encounters/enc_meadow_001.json",
      "enc_meadow_002": "encounters/enc_meadow_002.json",
      "enc_meadow_003": "encounters/enc_meadow_003.json"
    },
    "progression": {
      "progression_m2_chapter_linear_v1": "progression/progression.progression_m2_chapter_linear_v1.json"
    },
    "validation": {
      "val_snapshot_m2_launch_v1": "validation/snapshot.val_snapshot_m2_launch_v1.json"
    }
  }
}
```

Structural creature file example (`content/packages/content_m2_launch_v1/creatures/creature.placeholder_starter_creature.json`):

```json
{
  "id": "placeholder_starter_creature_v1",
  "displayName": "Placeholder Starter Creature",
  "encounterType": "standard",
  "difficultyTier": "intro_placeholder",
  "maxHp": 1,
  "weakness": "arcane",
  "resistance": "arcane",
  "baseCountdown": 1,
  "spellIdentity": "placeholder_spell_identity_v1",
  "spellPrimitives": [],
  "phaseRules": [],
  "contentVersion": "content_m2_launch_v1"
}
```

Structural starter encounter file example (`content/packages/content_m2_launch_v1/encounters/enc_starter_001.json`):

```json
{
  "id": "enc_starter_001",
  "creatureId": "placeholder_starter_creature_v1",
  "moveBudget": 1,
  "starPolicyVersion": "star_policy_v1_absolute",
  "isStarterEncounter": true,
  "starterTutorialScript": null,
  "introFlavorText": "Placeholder intro flavor text.",
  "damageModelVersion": "damage_model_v1",
  "rewardDefinition": {
    "grantsProgressUnlock": 0,
    "grantsJournalProgress": 0,
    "grantsCosmeticCurrency": 0
  },
  "hiddenBonusWordPolicy": null,
  "boardConfig": {
    "rows": 1,
    "cols": 1,
    "seedMode": "generated",
    "fixedSeed": null,
    "allowWandTiles": false,
    "wandSpawnRate": 0,
    "maxConcurrentWands": 0,
    "letterDistributionProfileId": "placeholder_letter_distribution_v1",
    "letterWeightEntries": [],
    "namedLetterPoolId": "placeholder_pool_v1",
    "vowelClassProfileVersion": "placeholder_vowel_class_v1",
    "vowelClassIncludesY": false,
    "boardQualityPolicy": {
      "qualityPolicyVersion": "placeholder_quality_policy_v1",
      "minVowelClassCount": 0
    }
  },
  "balanceMetadata": {
    "authoredFailRateBand": "low",
    "shippabilityStatus": "candidate-shippable",
    "waivers": []
  },
  "contentVersion": "content_m2_launch_v1"
}
```

Normative determinism rules for this minimum package:

- `manifest.json` `content_version` must be exactly `content_m2_launch_v1` and must match the package directory name.
- `manifest.json` `validation_snapshot_version` must be exactly `val_snapshot_m2_launch_v1` and must map to `validation/snapshot.val_snapshot_m2_launch_v1.json` (exact filename match).
- `manifest.json` must enumerate explicit payload references for creatures, encounters, progression, and validation snapshot; runtime must not discover files by directory scan or naming heuristics.
- `progression/` is a canonical required package folder for all M1-M2 bundles; progression payloads must not be omitted or relocated.
- Encounter IDs in manifest references must map 1:1 to encounter files in this package (`enc_starter_001`, `enc_meadow_001`, `enc_meadow_002`, `enc_meadow_003`) and each ID must resolve to exactly one file.
- The starter encounter creature ID used by `encounters/enc_starter_001.json` must resolve to the currently locked canonical starter creature entry (ID and path) for the active content lock.
- `manifest.json` package and version pins (`battle_rules_version`, `board_generator_version`, `validation_snapshot_version`) are validity checks, not hints; if any pin does not match runtime lock values, package load must fail closed.
- Any missing file, duplicate ID target, or unresolved manifest reference makes the package invalid.

Required `manifest.json` fields for every package:

- `package_id` (stable package identifier)
- `content_version` (must match package directory name)
- `validation_snapshot_version`
- `battle_rules_version`
- `board_generator_version`
- `min_supported_app_version`
- `schema_versions` object with:
  - `manifest_schema`
  - `creature_schema`
  - `encounter_schema`
  - `validation_snapshot_schema`
- `asset_pack_version` (or `null` if no external asset pack is required for the package)
- `created_at_utc` (ISO-8601 UTC)
- `created_by`
- `status` (`draft` | `review_ready` | `fairness_reviewed` | `approved` | `bundled` | `published` | `archived` | `corrected_exception`)

Practical rules:

- schema files must live under `content/schemas/` and be versioned in-repo with package changes
- package payload files must be in package-local folders (`creatures/`, `encounters/`, `progression/`, `validation/`) and must not reference out-of-package runtime truth files
- package loading must fail closed if required manifest fields are missing or if any pinned version mismatches runtime expectations

---

## 9. Packaging Rules by Milestone

The content pipeline should change only when the product truly needs it.

### 9.1 Milestones 0–2
Content should be:

- bundled locally
- versioned in the repo
- available offline
- playable without remote fetches

This applies to:

- starter encounter content
- ordinary progression encounters
- validation snapshots
- creature content

### 9.2 Milestone 3
Optional challenge flavor may be introduced.

At this stage, the safest first version is still:

- bundled challenge content
- or locally cached optional content with strong fallbacks

Do not force a remote-content platform too early.

### 9.3 Milestone 4+
Only when justified, content operations may expand to include:

- remote challenge pack delivery
- content hotfix bundles
- limited-time optional content windows
- more formal review/publish flows

### 9.4 Core product rule
Main solo progression must not become unplayable just because remote content is unavailable.

---

## 10. Optional LiveOps Rules

Words 'n Wands! may have LiveOps later, but it should be a restrained form of LiveOps.

### 10.1 What LiveOps means here
For this product, LiveOps may later include:

- optional daily challenges
- optional weekly challenges
- occasional event encounter packs
- seasonal or themed challenge rotations
- challenge reward tuning

### 10.2 What LiveOps does **not** mean here
LiveOps should not become:

- an obligation machine
- the main identity of the game
- a reason to spam the player constantly
- a justification for backend-required solo play
- a schedule the project cannot realistically maintain

### 10.3 Optionality rule
Challenge flavor must remain optional.

Missing a daily or weekly challenge must not make the player feel punished or left behind in the main game.

### 10.4 Reward rule
Optional challenge rewards should stay modest.

Examples of acceptable reward types later:

- small cosmetic currency
- journal progress
- profile flair
- side-collection progress
- capped clue charges or other side-grade recognition (non-star)

Rewards should not become mandatory power gates.

---

## 11. Content Delivery Rules

### 11.1 Local-first delivery rule
The base game must work from bundled local content.

### 11.2 Remote-content rule later
If optional remote content is introduced later, it must obey these rules:

- remote content is additive, not required for ordinary solo play
- remote content must be validated before activation
- remote content should be cached locally once acquired
- active sessions must not be silently reinterpreted by newly fetched content
- the app must tolerate remote unavailability gracefully

### 11.3 Last-known-good rule
If remote content loading fails, the app should prefer:

- last-known-good content
- or a clean unavailable state for the optional content area

It should not invent replacement challenge truth on the fly.

---

## 12. Content Correction and Rollback Rules

Because Words 'n Wands! depends on trust, correction rules must be explicit.

### 12.1 Correction trigger examples
A correction may be justified if content is:

- broken
- unfair
- ambiguous beyond tolerance
- internally inconsistent
- tonally wrong for the product
- technically invalid relative to current runtime contracts

### 12.2 Player-protection rule
If content is flawed, players should not be punished for the product’s mistake.

### 12.3 Correction rule
A correction should be:

- deliberate
- documented
- versioned
- reviewable
- as player-friendly as reasonable

### 12.4 Active-session stability rule
A correction must not silently corrupt or mutate already active local encounter sessions.

### 12.5 Rollback rule
If a content package is bad, rollback should prefer:

- previous approved package
- or cleanly disabling the optional content entry

not silently producing mismatched runtime truth.

---

## 13. Content IDs and Naming Rules

### 13.1 Stable ID rule
Content identifiers must stay stable once introduced.

This includes:

- creature IDs
- encounter IDs
- validation snapshot versions
- optional challenge IDs later

### 13.2 Naming rule
Human-readable names should be:

- descriptive
- boring where needed
- easy to audit

### 13.3 Avoid fragile naming
Do not build the runtime around unstable filenames, ad hoc naming jokes, or content references that only make sense in someone’s head.

---

## 14. Content Tooling Rules

### 14.1 Do not build a giant content CMS early
A giant content management system is out of scope early.

### 14.2 Early tool direction
Early tooling should focus on:

- schema validation
- content linting
- broken-reference checks
- fairness checklist support
- build-time validation

### 14.3 Tooling realism rule
Content tools should be small and boring unless the content volume proves that stronger tooling is necessary.

### 14.4 Spreadsheet rule
Spreadsheets may be used temporarily for planning, but they should not become the canonical runtime truth.

### 14.5 Canonical content validation command set
Use these commands for package validation work:

- repo-wide content checks:
  - `pnpm check`
- package-level content checks:
  - `pnpm --filter <package_name> content:validate`
  - `pnpm --filter <package_name> content:validate:schema`
  - `pnpm --filter <package_name> content:validate:refs`
  - `pnpm --filter <package_name> content:validate:version-pins`

`content:validate` should aggregate schema, referential, and version-pin checks for touched package content.

---

## 15. Starter Content Rules

### 15.1 Starter flow priority
Starter content is special because it teaches the product.

### 15.2 Starter quality rule
Starter content should be:

- especially readable
- especially fair
- strongly aligned with the tutorial goals
- protected from accidental drift

### 15.3 Starter content should not be treated casually
Because the first encounter shapes trust, starter content should receive extra scrutiny.

---

## 16. Challenge Content Rules Later

### 16.1 Challenge content identity
Optional challenge content should feel like side flavor, not homework.

### 16.2 Challenge content types later
Reasonable future challenge content may include:

- one curated encounter of the day
- a small weekly challenge set
- a seasonal event creature
- a limited encounter remix pack

### 16.3 Challenge clarity rule
If challenge content uses special rules, that must be readable and obvious to the player.

### 16.4 No manipulative cadence rule
Do not use challenge schedules to create guilt, spam, or fake urgency beyond what the game’s tone can support.

---

## 17. Content and Asset Coordination Rules

### 17.1 Content should not outrun assets
Do not author giant content surfaces that assume complex art production before the asset workflow can support them.

### 17.2 Asset-reference rule
Content packages should reference exported runtime-ready assets, not Adobe source files.

### 17.3 Graceful-missing-asset rule
If a non-critical asset is missing, the product should fail gracefully where possible.

The runtime should not depend on fragile design-tool output assumptions.

---

## 18. Analytics and Live Content Boundaries

### 18.1 Analytics does not define content truth
Analytics may observe content usage later. It must not define whether a content package is valid.

### 18.2 Content should remain review-driven
Do not let “good metrics” excuse content that is unfair or tonally wrong.

### 18.3 Experiment caution rule
If experiments are added later, they must not create hidden rule differences that make the battle system feel inconsistent or unfair.

---

## 19. Operational Load Rules

This project should not commit to an operations burden it cannot realistically sustain.

### 19.1 Sustainable cadence rule
If optional challenge or event content exists later, the cadence should be something the project can actually maintain.

### 19.2 Better smaller than fake-big
It is better to have:

- one good weekly challenge
- or occasional event packs

than to promise a giant live calendar that becomes stale or low quality.

### 19.3 Solo-owner realism rule
LiveOps should serve the product, not become a second full-time job that breaks the project.

---

## 20. Out of Scope for Early Pipeline Work

The following are out of scope for early pipeline work unless intentionally documented later:

- giant custom CMS infrastructure
- mandatory online content fetches for main progression
- daily/weekly pressure as the main identity of the game
- server-authoritative solo battle truth
- real-time seasonal economy operations
- heavy community-content systems
- live unreviewed generated content publication

---

## 21. Summary Rule

Words 'n Wands! should run its content pipeline in a way that is:

- bundled-first
- typed
- reviewable
- fair
- human-approved
- realistic for a mostly AI-assisted solo project
- friendly to local-first play
- careful about LiveOps rather than obsessed with it

If a future content-pipeline or LiveOps idea makes the game harder to trust, harder to maintain, more mandatory-feeling, or more operationally fragile than the project can realistically support, it should not be treated as an improvement.
