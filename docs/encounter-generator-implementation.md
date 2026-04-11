# Words 'n Wands! Encounter Generator Implementation

This document defines how the structured encounter generator should be implemented.

It is the engineering companion to:

- `docs/structured-encounter-generation.md`

Its purpose is to make the generator:

- boring to build
- deterministic to test
- easy to review
- hard to misuse
- aligned with the current TypeScript-first architecture

This document is the source of truth for:

- where the generator should live
- what files it should read and write
- the request/output contracts
- the exact generation pipeline steps
- validator and simulation responsibilities
- test and CLI expectations

## Normative precedence

Product-policy authority for what generation is or is not allowed lives in:

- `docs/structured-encounter-generation.md`
- `docs/encounter-balance-framework.md`

This document defines implementation mechanics (file layout, contracts, pipeline, validation/test tooling, CLI behavior, and failure handling) that must enforce those policy documents.

---

Use this together with:

- `docs/technical-architecture.md`
- `docs/content-pipeline-and-liveops.md`
- `docs/implementation-contracts.md`
- `docs/encounter-balance-framework.md`
- `docs/randomness-and-seeding-contract.md`
- `docs/creature-and-encounter-rules.md`
- `docs/word-validation-and-element-rules.md`

---

## 1. Core implementation rule

The generator should be implemented as a **small TypeScript content tool**, not a giant CMS and not a runtime AI system.

### Practical rule
For the first implementation:

- prefer a CLI tool
- prefer typed JSON inputs and outputs
- prefer deterministic transforms
- prefer explicit validation errors over silent fallback behavior

The generator should feel like:

- build tooling
- content tooling
- review tooling

Not like:

- backend infrastructure
- dynamic live-authoring platform
- black-box procedural magic

---

## 2. Repo placement

### 2.1 Initial implementation placement

The first implementation should live in the existing content/package world rather than creating a giant separate app immediately.

Recommended initial placement:

- generator source: `packages/content/src/generation/`
- CLI entrypoint: `packages/content/src/generation/cli/generateEncounters.ts`
- validation/report helpers: `packages/content/src/generation/review/`
- root wrapper script if needed: `scripts/generate-encounters.ts`

### 2.2 Promotion rule later

If the generator grows into a larger internal tool with multiple commands and review surfaces, it may later be promoted into:

- `apps/content-tools`

That promotion should happen only when the tool’s size justifies it.

### 2.3 Do not do this first

Do not start by building:

- a browser CMS
- a database-backed authoring service
- remote generation infrastructure
- a content-editing dashboard

The right first version is a deterministic CLI.

---

## 3. File layout and owned artifacts

The generator should use explicit repo-owned inputs and outputs.

### 3.1 Recommended directory shape

```txt
content/
  generation/
    blueprints/
      *.blueprint.json
    pools/
      habitats.json
      name-banks.json
      flavor-lines.json
      weakness-resistance-pairs.json
    requests/
      *.request.json
    generated/
      drafts/
        *.encounter.json
        *.review.md
        *.report.json
      approved/
        *.encounter.json
        *.creature.json
```

### 3.2 Input artifact ownership

The generator may read only from approved, versioned sources such as:

- blueprint files
- tier defaults from the balance framework implementation
- approved name banks
- approved flavor banks
- approved weakness/resistance pair pools
- approved board profile IDs
- pinned validation snapshot metadata

### 3.3 Output artifact ownership

The generator must write:

- concrete encounter draft JSON
- optional concrete creature JSON when separate identity output is required
- machine-readable review report JSON
- human-readable summary markdown

### 3.4 Freeze destination rule

Once approved, generated outputs should be copied or promoted into the same normal content package structure used by hand-authored content.

That means generated content becomes ordinary content after approval.

---

## 4. Generator request contract

The generator must start from an explicit request file.

### 4.1 Canonical TypeScript-facing request shape

```ts
export type EncounterGenerationMode =
  | 'draft_generate_freeze_v1'
  | 'runtime_seeded_trial_v1';

export type GeneratorTargetTier =
  | 'gentle'
  | 'standard'
  | 'challenging'
  | 'boss'
  | 'event';

export interface EncounterGenerationRequest {
  request_id: string;
  generator_version: 'structured_generation_v1';
  generator_mode: EncounterGenerationMode;
  generation_seed: string; // 32 lowercase hex chars
  content_version_target: string;
  validation_snapshot_version_target: string;
  battle_rules_version_target: string;
  board_generator_version_target: string;
  encounter_count: number;
  habitat_pool_ids: string[];
  blueprint_ids: string[];
  target_tier: GeneratorTargetTier;
  target_fail_rate_band: 'low' | 'medium' | 'high';
  board_profile_ids: string[];
  allow_name_generation_from_bank: boolean;
  allow_flavor_generation_from_bank: boolean;
  output_scope: 'draft_only' | 'draft_and_freeze_candidate';
}
```

### 4.2 Request rules

- `encounter_count` must be a positive integer and should remain small in one run (`1-12` recommended).
- `generation_seed` must be deterministic and explicit.
- `blueprint_ids`, `habitat_pool_ids`, and `board_profile_ids` must all be non-empty.
- `generator_mode = 'runtime_seeded_trial_v1'` is allowed in the contract but should remain product-gated until intentionally enabled.
- `output_scope = 'draft_and_freeze_candidate'` still requires human review before promotion into approved content.
- For the active M1–M2 content lock, request pins must match `docs/early-content-lock.md` section 1 exactly:
  - `battle_rules_version_target = 'battle_rules_m2_launch_v1'`
  - `board_generator_version_target = 'board_generator_m2_launch_v1'`

---

## 5. Blueprint contract

A blueprint is the central generator input.

### 5.1 Canonical TypeScript-facing blueprint shape

```ts
export interface EncounterArchetypeBlueprint {
  blueprint_id: string;
  display_label: string;
  allowed_tiers: GeneratorTargetTier[];
  encounter_type: 'standard' | 'boss' | 'event';
  pressure_style:
    | 'soft_nuisance'
    | 'board_reorder'
    | 'temporary_blockage'
    | 'element_disruption'
    | 'boss_escalation';
  spell_identity: string;
  allowed_spell_payloads: SpellPayloadTemplateRef[];
  allowed_matchup_pair_pool_ids: string[];
  allowed_habitat_tags: string[];
  profile_overrides: BlueprintBalanceProfileOverride;
  prohibited_combination_flags: string[];
}

export interface SpellPayloadTemplateRef {
  template_id: string;
  primitive_kind:
    | 'apply_tile_state'
    | 'shift_row'
    | 'shift_column'
    | 'chained';
}

export interface BlueprintBalanceProfileOverride {
  weakness_hit_rate_delta: number;
  wand_incidence_delta: number;
  soot_exposure_delta: number;
  target_casts_to_defeat_delta: number;
  target_spell_count_on_win_delta: number;
}
```

### 5.2 Blueprint rules

- every blueprint must define one clear spell identity
- every blueprint must stay inside approved primitive families
- override deltas must be bounded and intentionally reviewed
- blueprint files are product truth inputs and must be human-reviewed like any other content-support artifact

---

## 6. Generated output contract

### 6.1 Canonical generated draft shape

```ts
export interface GeneratedEncounterDraftArtifact {
  draft_id: string;
  request_id: string;
  generator_version: 'structured_generation_v1';
  generator_mode: EncounterGenerationMode;
  generation_seed: string;
  blueprint_id: string;
  target_tier: GeneratorTargetTier;
  content_version_target: string;
  validation_snapshot_version_target: string;
  battle_rules_version_target: string;
  board_generator_version_target: string;
  encounter_definition: RuntimeEncounterDefinition;
  creature_definition: RuntimeCreatureDefinition | null;
  review_summary: GeneratedEncounterReviewSummary;
  balance_report: GeneratedEncounterBalanceReport;
}
```

### 6.2 Review summary shape

```ts
export interface GeneratedEncounterReviewSummary {
  habitat_theme_id: string;
  habitat_display_name: string;
  creature_display_name: string;
  weakness: string;
  resistance: string;
  move_budget: number;
  base_countdown: number;
  max_hp: number;
  spell_identity: string;
  why_it_should_feel_fair: string;
  why_it_matches_wordsnwands: string;
}
```

### 6.3 Balance report shape

```ts
export interface GeneratedEncounterBalanceReport {
  expected_profile: {
    avg_word_length: number;
    weakness_hit_rate: number;
    wand_incidence: number;
    soot_exposure: number;
  };
  derived_values: {
    expected_damage_per_cast: number;
    target_casts_to_defeat: number;
    target_spell_count_on_win: number;
    derived_hp: number;
    derived_move_budget: number;
    derived_base_countdown: number;
  };
  validator_findings: RuntimeValidationFinding[];
  guardrail_status: 'pass' | 'warn' | 'error';
}
```

### 6.4 Output rules

- generated draft artifacts must be self-describing enough for review without reopening multiple code modules
- every draft must embed the exact generator seed and version metadata used to produce it
- the encounter output must already conform to the runtime content contracts before human review begins

---

## 7. ID strategy

The generator needs deterministic draft IDs and stable final IDs.

### 7.1 Draft IDs

Draft IDs should be deterministic and boring.

Recommended format:

- `draft_<habitat>_<blueprint>_<tier>_<seed8>`

Example:

- `draft_meadow_soot_standard_a1b2c3d4`

### 7.2 Final encounter IDs

Final encounter IDs should not stay vague draft IDs forever.

When a draft is approved for shipping, the content owner should assign a stable final ID using normal content conventions such as:

- `enc_meadow_014`
- `enc_trial_grove_003`

### 7.3 Why not keep raw draft IDs forever

Because draft lineage and shipped player-facing identity are different concerns.

The draft metadata should remain attached in review history, but the final content ID should look like ordinary content.

---

## 8. Canonical generation algorithm

The generator must follow this exact pipeline.

### Step 1 — Validate request

- parse request JSON
- validate schema
- validate seed format
- validate all referenced pools and blueprint IDs exist

### Step 2 — Create deterministic local RNG

The generator tooling must use its own deterministic seed handling for content generation.

Rules:

- same request + same seed = same outputs
- tooling RNG must not rely on JS runtime default randomness
- generation RNG implementation should use the same approved algorithm family philosophy as the runtime contracts where practical

### Step 3 — Select blueprint and habitat

For each encounter slot:

- select one legal blueprint from the request pool
- select one legal habitat/theme from the request pool
- reject blueprint-habitat mismatches based on allowed habitat tags

### Step 4 — Select matchup pair

- resolve one weakness/resistance pair from the blueprint’s approved pair pool
- reject identical weakness/resistance values
- reject pairings that violate the blueprint fantasy

### Step 5 — Resolve profile assumptions

- load tier defaults from the balance framework implementation
- apply blueprint deltas
- clamp to legal bounds

### Step 6 — Derive numeric values

Use the canonical formulas from the balance framework:

- expected damage per cast
- target casts to defeat
- HP derivation
- move budget derivation
- base countdown derivation

The generator must not use alternate “close enough” formulas.

### Step 7 — Build spell payload

- choose one approved spell template from the blueprint
- fill in parameters within tier guardrails
- validate state count / chain count / countdown pressure / pacing pressure

### Step 8 — Attach board profile and content pins

- choose one board profile ID from the approved pool
- attach the requested version pins
- attach damage model version

### Step 9 — Select approved name and flavor

If enabled:

- choose creature name from approved bank
- choose intro flavor from approved line bank

If not enabled:

- emit placeholder review-safe labels that still preserve clarity

### Step 10 — Emit runtime-shaped draft

- build `RuntimeCreatureDefinition`
- build `RuntimeEncounterDefinition`
- attach generator metadata

### Step 11 — Validate output

Run, in order:

- schema validation
- referential validation
- version-pin validation
- runtime content validation
- balance guardrail validation

### Step 12 — Emit review bundle

Write:

- draft encounter JSON
- optional creature JSON
- machine-readable report JSON
- review markdown summary

---

## 9. Flavor generation implementation notes

Normative limits for generated names/flavor and allowed sources are defined in:

- `docs/structured-encounter-generation.md`:
  - Section 5, **What the generator is allowed to create**
  - Section 6, **What the generator may not create**
  - Section 4.5, **Tone**

This section defines only implementation mechanics for satisfying those rules.

### 9.1 Source wiring

Creature names and intro flavor lines must come from curated banks.

The generator may:

- choose
- combine approved fragments if specifically allowed
- fill stable placeholders

### 9.2 First implementation recommendation

Keep first implementation simpler:

- choose from approved full creature names
- choose from approved full intro lines

Do not start with fragment-combination text generation unless you truly need it.

---

## 10. Validator responsibilities

The generator is not responsible only for creating outputs.
It is also responsible for rejecting bad ones before review.

### Required validator passes

- request schema pass
- blueprint legality pass
- flavor-bank legality pass
- runtime contract pass
- balance framework pass
- creature-rule guardrail pass
- duplicate-batch sanity pass

### Duplicate-batch sanity rule

A single generation batch should not emit too many near-clones.

At minimum, the generator should warn when:

- the same blueprint repeats too heavily in one batch
- the same weakness/resistance pairing repeats too heavily in one batch
- the same spell identity repeats too heavily in one batch

Warnings may still be reviewable; obvious repetition should not silently pass as “variety.”

---

## 11. Review artifact format

Every draft should produce one markdown summary for human review.

### Required markdown sections

- Draft ID
- Request ID
- Generator version
- Blueprint used
- Habitat used
- Creature name
- Weakness / resistance
- HP / move budget / countdown
- Spell summary
- Board profile ID
- Expected pacing summary
- Guardrail findings summary
- Why this should feel fair
- Why this matches Words 'n Wands!

### Why this matters

Review should not require mentally reconstructing the encounter from raw JSON only.

---

## 12. CLI commands

The first implementation should expose a small command set.

### Recommended commands

```txt
pnpm content:generate:encounters --request content/generation/requests/<file>.request.json
pnpm content:generate:encounters:batch --dir content/generation/requests/
pnpm content:review:encounters --request content/generation/requests/<file>.request.json
pnpm content:validate
pnpm content:validate:generated --dir content/generation/generated/drafts/
```

### Command behavior

- `content:generate:encounters` writes concrete draft outputs
- `content:review:encounters` writes markdown summaries and machine-readable reports
- `content:validate:generated` reruns validators across generated drafts without regenerating them

### No hidden write rule

CLI commands must write outputs to explicit paths and log what they wrote.

---

## 13. Promotion flow into shipped content

Generated content becomes real content only after explicit promotion.

### Promotion steps

1. generate draft
2. validate draft
3. human review
4. fix or reject if needed
5. assign final stable content ID
6. copy/promote into canonical package layout under `content/packages/<content_version>/`
7. run normal content validation again
8. bundle/publish like any other content

### Important rule

The shipped runtime should not care whether the encounter started life as generated or hand-authored.
Once approved, it is just content.

Normative promotion/review policy is defined in `docs/structured-encounter-generation.md`, Section 3 (**Two allowed generator modes**).

---

## 14. Runtime seeded-trial implementation rules (deferred)

If `runtime_seeded_trial_v1` is implemented later, it must still use the same generator core.

Product gating and intended usage for this mode are defined in `docs/structured-encounter-generation.md`, Section 3.2 (**Mode B — `runtime_seeded_trial_v1`**). Numeric tuning/guardrail policy remains in `docs/encounter-balance-framework.md`.

### Required architecture

- runtime trial generation should call the same shared generation library used by the offline tool
- do not fork logic between “tool version” and “runtime version” of the generator
- runtime trial output must still be a concrete encounter artifact in memory, not a loose bag of half-resolved intentions

### Required trial metadata

A runtime trial encounter must expose:

- trial seed
- generator version
- blueprint used
- version pins
- generated trial ID

This is required for fairness review, restore behavior, and debugging.

---

## 15. Testing requirements

### 15.1 Unit tests

The generator must have unit tests for:

- request parsing
- seed determinism
- blueprint selection legality
- balance math parity
- guardrail rejection
- name/flavor selection legality

### 15.2 Golden tests

Commit a small golden suite of request files and expected outputs.

Required golden coverage:

- one gentle soot/bubble style request
- one standard row-shift request
- one challenging freeze request
- one rejection case for illegal high-pressure combination

### 15.3 Property-like sanity tests

At minimum, run repeated generated batches and assert:

- no illegal weakness/resistance duplicates inside one encounter
- no out-of-tier countdown values
- no out-of-tier state/chain payloads
- no missing version metadata

### 15.4 Promotion tests

At least one test should verify that a generated-and-approved encounter can be promoted into the normal content package layout and still passes the same validation tooling as authored content.

---

## 16. Failure handling

The generator must fail loudly and specifically.

### Allowed failure behavior

- reject request with clear error
- reject blueprint mismatch with clear error
- reject illegal output with clear error
- emit report with warnings/errors

### Forbidden failure behavior

- silently changing requested tier
- silently swapping to a different validation snapshot
- silently dropping version pins
- silently weakening guardrails to “make something generate”
- silently inventing fallback text from nowhere

If the generator cannot make a legal encounter from the request, it should say so plainly.

---

## 17. Final implementation rule

The first encounter generator should be easy to read in one sitting.

That means:

- one shared library
- one boring CLI
- typed request files
- typed output files
- explicit validators
- deterministic seeds
- normal content promotion after approval

If the implementation becomes clever, magical, or hard to review, it is moving away from the correct design.
