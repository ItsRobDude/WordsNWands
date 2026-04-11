# Words 'n Wands! First Shippable Content Pack

This document defines the **first player-facing content slice that is complete enough to ship without apology**.

Its job is to answer:

- what content must exist for the first real external-quality build
- what that first slice should feel like
- which encounters, creatures, and chapter surfaces belong in that slice
- what must stay out until it is equally real

This document is intentionally smaller than the full long-term content roadmap.
It does **not** replace broader Milestone 2 planning constants.
It defines the first shippable, trust-building content slice inside the currently locked early-content lineage.

### Normative precedence

- `docs/implementation-contracts.md` and `docs/milestone-locked-constants.md` remain authoritative for runtime schema/version pins.
- This document is authoritative for first external-quality content composition and acceptance framing.
- Any conflicts must be resolved using the standard conflict template in `AGENTS.md`.

Use this together with:

- `docs/early-content-lock.md`
- `docs/game-rules.md`
- `docs/creature-and-encounter-rules.md`
- `docs/progression-economy-and-monetization.md`
- `docs/screens-and-session-flow.md`
- `docs/implementation-contracts.md`
- `docs/word-validation-and-element-rules.md`
- `docs/fun-research-guide-team1.md`
- `docs/fun-research-guide-team2.md`

---

## 1. Purpose of the first shippable pack

The first shippable pack must prove the real identity of Words 'n Wands! at small scale.

It must make players feel all of the following before the game asks anything bigger of them:

- words really do feel like spells
- creatures really do change how the player should think
- the board feels fair and readable
- the game is warm, magical, and family-friendly
- replay for stars feels welcome, not mandatory homework
- the next action is always obvious

The first shippable pack must **not** try to prove every future system.
It must prove that the core loop is worth coming back to.

Research alignment:

- fast first competence matters
- early value clarity matters
- challenge should stay in a healthy skill range
- meta progression should stay adjacent to mastery rather than bloating the loop
- retention scaffolding should not interrupt the thinking moment

That means the first pack should be:

- small
- polished
- readable
- generous early
- strategically honest
- low-friction to understand

Not fake-big.
Not feature-bloated.
Not full of empty tabs or future promises.

---

## 2. Pack identity and emotional arc

The first shippable pack is a **bright meadow-path beginner chapter**.

It should feel like:

- a magical walk through a lively little habitat
- a sequence of mischievous but non-threatening creature duels
- a growing understanding that different creatures ask for different word choices

It should not feel like:

- a dark RPG campaign
- a huge adventure map with thin content
- a grind funnel
- a feature showroom

### Emotional arc

The first pack should teach this arc:

1. **Starter encounter:**
   - “I get it.”
   - “I can do this.”
2. **First real encounter:**
   - “Different creatures reward different thinking.”
3. **Second real encounter:**
   - “The board can change in readable ways, and I can adapt.”
4. **Third real encounter:**
   - “Planning matters now, but this still feels fair.”

The result should be:

- confidence
- curiosity
- trust
- desire to continue

---

## 3. Version pins and content lineage

This first shippable pack lives inside the current locked early-content lineage.

Required pinned identifiers:

- `content_version`: `content_m2_launch_v1`
- `validation_snapshot_version`: `val_snapshot_m2_launch_v1`
- `battle_rules_version`: `battle_rules_m2_launch_v1`
- `board_generator_version`: `board_generator_m2_launch_v1`
- `progression_version`: `progression_m2_chapter_linear_v1`
- `starter_board_profile_id`: `board_profile_starter_onboarding_v1`
- `core_board_profile_id`: `board_profile_core_mainline_v1`

The `starter_board_profile_id` and `core_board_profile_id` entries are editorial/profile references only; shipped runtime encounter payloads must inline `RuntimeBoardConfig`, and runtime must not perform dynamic board profile-ID resolution in M1-M2.

Runtime/manifest rule:

- do **not** invent new `battle_rules_version`, `board_generator_version`, or `reward_constants_version` identifiers in content docs or package manifests
- this pack must inherit the active runtime-supported version pins already recognized by the app/runtime contracts
- canonical lock values must mirror `docs/early-content-lock.md` section 1 exactly

This avoids silent naming drift.

---

## 4. Canonical scope of the first shippable pack

The first shippable pack includes exactly:

- the starter encounter
- one fully realized first chapter
- three real mainline encounters in that chapter
- one clean Home/progression surface pointing at that chapter
- correct result routing and next-step behavior

The first shippable pack does **not** require the broader roadmap to be player-facing yet.

### Included player-facing content

- `enc_starter_001`
- `chapter_1_meadow`
  - `enc_meadow_001`
  - `enc_meadow_002`
  - `enc_meadow_003`

### Explicitly excluded from this pack

Do **not** ship any of the following as player-facing content in this first pack:

- boss encounters
- event encounters
- Chapter 2 or Chapter 3 as visible selectable content
- player-invoked clue surfaces
- daily or weekly challenge surfaces
- journal/codex surfaces that are empty or placeholder-only
- monetization/store surfaces
- hidden-bonus reward flows
- placeholder tabs or “coming soon” clutter
- social/competitive hubs

The correct first ship is a **complete small game slice**, not a partial giant shell.

---

## 5. Canonical progression shape for this pack

This pack uses the existing early progression truth:

- starter encounter is a gate
- first mainline chapter unlocks after starter win
- mainline unlock condition is `win_any_stars`
- replays improve stars but do not relock anything

### Starter gate behavior

- starter win unlocks `enc_meadow_001`
- starter loss unlocks nothing
- player remains in starter flow until the starter is won

### Visible chapter in this pack

- `chapter_id`: `chapter_1_meadow`
- `display_name`: `Sunspell Meadow`
- `habitat_theme_id`: `habitat_sunspell_meadow_v1`
- `sort_index`: `1`

ID convention note:
- use explicit stable machine IDs like `chapter_1_meadow` and keep magical player-facing names in `display_name` (for example, `Sunspell Meadow`)

### Chapter order in this pack

1. `enc_meadow_001`
2. `enc_meadow_002`
3. `enc_meadow_003`

### Next-action surface expectations

After starter win:
- primary CTA: `Begin Chapter 1`

After first clear of `enc_meadow_001`:
- primary CTA: `Next Encounter`

After first clear of `enc_meadow_002`:
- primary CTA: `Next Encounter`

After clear of `enc_meadow_003` in this first pack:
- primary CTA: `Return to Home`

Home rule for this pack:
- after starter completion, Home should point at the first unlocked uncleared Meadow encounter
- do not show a fake Chapter 2 teaser card as the main next action

---

## 6. Canonical encounter roster

| Order | Encounter ID | Creature ID | Display Name | Type | Tier | HP | Move Budget | Base Countdown | Weakness | Resistance | Primary Spell |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| Starter | `enc_starter_001` | `creature_puddle_puff_001` | `Puddle Puff` | `standard` | `gentle` | 56 | 12 | 5 | `light` | `tide` | Bubble 1 tile |
| 1 | `enc_meadow_001` | `creature_cinder_cub_001` | `Cinder Cub` | `standard` | `standard` | 72 | 10 | 5 | `tide` | `flame` | Soot 2 tiles |
| 2 | `enc_meadow_002` | `creature_brookling_otter_001` | `Brookling Otter` | `standard` | `standard` | 76 | 10 | 5 | `storm` | `tide` | Rotate row 2 by 1 |
| 3 | `enc_meadow_003` | `creature_briar_bunny_001` | `Briar Bunny` | `standard` | `challenging` | 80 | 10 | 4 | `flame` | `bloom` | Frozen 3 tiles |

Pack-wide rules:

- all four encounters use `damage_model_v1`
- all four encounters use `star_policy_v1_absolute`
- all four encounters use `phaseRules: []`
- all four encounters use `hiddenBonusWordPolicy: null`
- all four encounters use `rewardDefinition: null`

Reason:
The first pack should prove the battle loop, stars, and progression clarity first.
It should not force journal/currency/bonus-reward UI before those layers are real enough to matter.

---

## 7. Encounter-by-encounter lock

## 7.1 Starter encounter — `enc_starter_001`

### Creature definition lock

- `id`: `creature_puddle_puff_001`
- `displayName`: `Puddle Puff`
- `encounterType`: `standard`
- `difficultyTier`: `gentle`
- `maxHp`: `56`
- `weakness`: `light`
- `resistance`: `tide`
- `baseCountdown`: `5`
- `spellIdentity`: `spell_bubble_bloop_v1`
- `spellPrimitives`:
  - `apply_tile_state`
  - `tile_state: bubble`
  - `target_count: 1`
  - `targeting: random_eligible`

### Encounter definition lock

- `id`: `enc_starter_001`
- `creatureId`: `creature_puddle_puff_001`
- `moveBudget`: `12`
- `isStarterEncounter`: `true`
- `starterTutorialScript`:
  - `guidedFirstCast.normalizedWord = "leaf"`
  - `guidedFirstCast.selectedPositions = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }]`
  - `guidedFirstCast.expectedElement = "bloom"`
  - `starterBoardOpening.openingBoardSource.mode = "authored_seed"`
  - `starterBoardOpening.openingBoardSource.authoredSeed = "starter_opening_script_v1"`
  - `starterBoardOpening.guaranteedGuidedFirstCastPath = guidedFirstCast.selectedPositions`
  - `starterBoardOpening.postFirstSpellWeaknessTeachingTarget.normalizedWord = "sun"`
  - `starterBoardOpening.postFirstSpellWeaknessTeachingTarget.expectedElement = "light"`
  - `starterBoardOpening.postFirstSpellWeaknessTeachingTarget.availabilityRule = "required_immediately_after_first_creature_spell"`
  - `starterBoardOpening.transitionToOrdinaryFlow.trigger = "after_guided_first_cast_and_first_creature_spell"`
  - `starterBoardOpening.transitionToOrdinaryFlow.continueWithStandardEncounterRules = true`
  - `weaknessTeachingWord = "sun"`
  - `mustShowCreatureSpellBeforeWin = true`
- `introFlavorText`: `A little Puddle Puff is splashing magic across the path. Settle it with clever words.`
- `damageModelVersion`: `damage_model_v1`
- `rewardDefinition`: `null`
- `hiddenBonusWordPolicy`: `null`
- `boardConfig`: must inline the canonical starter `RuntimeBoardConfig` payload from section 8.1 (no runtime profile-id resolution)
- `balanceMetadata`:
  - `authoredFailRateBand = low`
  - `waivers = []`
  - `shippabilityStatus = candidate-shippable`

### Starter board-profile rules

The starter board is not a place for clever chaos.
It is a teaching board.

Required behavior:

- use a fixed authored onboarding-safe opening sequence
- `allowWandTiles = false`
- only Bubble pressure may appear in starter content
- do not introduce Frozen, Sooted, or Dull in starter
- opening board must expose the exact `LEAF` path defined above
- the starter must show one creature spell before victory in ordinary tutorial flow
- after the first creature spell, the board must surface at least one clear Light weakness word opportunity centered on `sun`
- starter board vocabulary should strongly favor Tier A common 3–5 letter words
- avoid noisy rare-letter clusters in starter boards

### Starter learning checkpoints

The starter must successfully teach these beats:

1. **Words are spells**
   - first guided cast is readable and succeeds cleanly
2. **Elements matter**
   - the player sees a non-neutral cast immediately
3. **Countdown matters**
   - the player notices creature action timing before winning
4. **Creature spells are readable nuisances, not cruelty**
   - Bubble reorders the board in a visible, low-stress way
5. **Victory feels earned but safe**
   - the player exits wanting another encounter, not relief from confusion

### Starter content tone rule

Puddle Puff should feel:

- cute
- splashy
- clumsy
- playful

Never malicious.
Never scary.
Never framed as a “real enemy.”

---

## 7.2 First mainline encounter — `enc_meadow_001`

### Creature definition lock

- `id`: `creature_cinder_cub_001`
- `displayName`: `Cinder Cub`
- `encounterType`: `standard`
- `difficultyTier`: `standard`
- `maxHp`: `72`
- `weakness`: `tide`
- `resistance`: `flame`
- `baseCountdown`: `5`
- `spellIdentity`: `spell_ash_puff_v1`
- `spellPrimitives`:
  - `apply_tile_state`
  - `tile_state: sooted`
  - `target_count: 2`
  - `targeting: random_eligible`

### Encounter definition lock

- `id`: `enc_meadow_001`
- `creatureId`: `creature_cinder_cub_001`
- `moveBudget`: `10`
- `isStarterEncounter`: `false`
- `starterTutorialScript`: `null`
- `introFlavorText`: `Cinder Cub kicks up warm ash when it gets excited. A cool-headed spell will calm it down.`
- `damageModelVersion`: `damage_model_v1`
- `rewardDefinition`: `null`
- `hiddenBonusWordPolicy`: `null`
- `boardConfig`: must inline the canonical mainline `RuntimeBoardConfig` payload from section 8.2 (no runtime profile-id resolution)
- `balanceMetadata`:
  - `authoredFailRateBand = low`
  - `waivers = []`
  - `shippabilityStatus = candidate-shippable`

### Encounter purpose

This is the player’s first real standard encounter.
It should prove that the mainline game is not just the tutorial again.

It must teach:

- weakness/resistance choices matter in ordinary play
- creature spells can reduce efficiency without feeling cruel
- a 1-star win is still a success

### Feel target

Cinder Cub should feel like a **warm-up mainline duel**, not a wall.
The player should leave thinking:

- “I probably could have done that better next time.”
- not “the game got mean already.”

---

## 7.3 Second mainline encounter — `enc_meadow_002`

### Creature definition lock

- `id`: `creature_brookling_otter_001`
- `displayName`: `Brookling Otter`
- `encounterType`: `standard`
- `difficultyTier`: `standard`
- `maxHp`: `76`
- `weakness`: `storm`
- `resistance`: `tide`
- `baseCountdown`: `5`
- `spellIdentity`: `spell_stream_tug_v1`
- `spellPrimitives`:
  - `shift_row`
  - `row_index: 2`
  - `mode: rotate`
  - `distance: 1`

### Encounter definition lock

- `id`: `enc_meadow_002`
- `creatureId`: `creature_brookling_otter_001`
- `moveBudget`: `10`
- `isStarterEncounter`: `false`
- `starterTutorialScript`: `null`
- `introFlavorText`: `Brookling Otter tugs the middle stream lane sideways. Watch the center row.`
- `damageModelVersion`: `damage_model_v1`
- `rewardDefinition`: `null`
- `hiddenBonusWordPolicy`: `null`
- `boardConfig`: must inline the canonical mainline `RuntimeBoardConfig` payload from section 8.2 (no runtime profile-id resolution)
- `balanceMetadata`:
  - `authoredFailRateBand = low`
  - `waivers = []`
  - `shippabilityStatus = candidate-shippable`

### Encounter purpose

This encounter teaches **board re-reading**.
The player should see that Words 'n Wands! can shift the board in a visible patterned way without becoming chaotic.

This encounter must:

- make the creature’s board effect easy to understand after one cast
- keep the spell identity narrow and memorable
- avoid combining row movement with extra state noise

### Fixed row rule for first ship

For this first shippable pack, Brookling Otter always rotates **row 2** by 1.

Do not add encounter-local variation such as:

- random row choice
- alternating row sequences
- chained row + tile-state effects

The first ship should reward learning recognizable patterns.

---

## 7.4 Third mainline encounter — `enc_meadow_003`

### Creature definition lock

- `id`: `creature_briar_bunny_001`
- `displayName`: `Briar Bunny`
- `encounterType`: `standard`
- `difficultyTier`: `challenging`
- `maxHp`: `80`
- `weakness`: `flame`
- `resistance`: `bloom`
- `baseCountdown`: `4`
- `spellIdentity`: `spell_briar_snare_v1`
- `spellPrimitives`:
  - `apply_tile_state`
  - `tile_state: frozen`
  - `target_count: 3`
  - `targeting: random_eligible`

### Encounter definition lock

- `id`: `enc_meadow_003`
- `creatureId`: `creature_briar_bunny_001`
- `moveBudget`: `10`
- `isStarterEncounter`: `false`
- `starterTutorialScript`: `null`
- `introFlavorText`: `Briar Bunny tangles the trail with snaring magic. Plan around blocked letters.`
- `damageModelVersion`: `damage_model_v1`
- `rewardDefinition`: `null`
- `hiddenBonusWordPolicy`: `null`
- `boardConfig`: must inline the canonical mainline `RuntimeBoardConfig` payload from section 8.2 (no runtime profile-id resolution)
- `balanceMetadata`:
  - `authoredFailRateBand = medium`
  - `waivers = []`
  - `shippabilityStatus = candidate-shippable`

### Encounter purpose

This is the first-pack chapter capstone.
It should prove that the game can create meaningful pressure without crossing into boss-style cruelty.

This encounter must:

- force adaptation around temporarily blocked letters
- reward forward planning
- still remain readable enough for an ordinary player to retry willingly

### Capstone feel rule

Briar Bunny should feel like:

- the first moment where the player has to think ahead more carefully
- a fair chapter closer
- a real mastery check for Chapter 1

It must **not** feel like:

- a boss in disguise
- a punishment wall
- the moment the game turns harsh

---

## 8. Canonical boardConfig payloads for this pack

M1–M2 encounter payloads must carry fully authored inline `RuntimeBoardConfig` objects.
Do not rely on unresolved runtime board profile IDs.

### 8.1 Starter canonical boardConfig (editorial label: `board_profile_starter_onboarding_v1`)

Editorial label note: this label is for human review only and has no runtime loader semantics.

```json
{
  "rows": 6,
  "cols": 6,
  "seedMode": "fixed_seed",
  "fixedSeed": "starter_opening_script_v1",
  "allowWandTiles": false,
  "wandSpawnRate": 0,
  "maxConcurrentWands": 0,
  "letterDistributionProfileId": "letter_distribution_starter_onboarding_v1",
  "letterWeightEntries": [
    { "letter": "A", "weight": 10 },
    { "letter": "B", "weight": 2 },
    { "letter": "C", "weight": 4 },
    { "letter": "D", "weight": 4 },
    { "letter": "E", "weight": 13 },
    { "letter": "F", "weight": 3 },
    { "letter": "G", "weight": 3 },
    { "letter": "H", "weight": 3 },
    { "letter": "I", "weight": 8 },
    { "letter": "J", "weight": 1 },
    { "letter": "K", "weight": 1 },
    { "letter": "L", "weight": 7 },
    { "letter": "M", "weight": 3 },
    { "letter": "N", "weight": 7 },
    { "letter": "O", "weight": 9 },
    { "letter": "P", "weight": 3 },
    { "letter": "Q", "weight": 1 },
    { "letter": "R", "weight": 7 },
    { "letter": "S", "weight": 7 },
    { "letter": "T", "weight": 8 },
    { "letter": "U", "weight": 5 },
    { "letter": "V", "weight": 1 },
    { "letter": "W", "weight": 2 },
    { "letter": "X", "weight": 1 },
    { "letter": "Y", "weight": 2 },
    { "letter": "Z", "weight": 1 }
  ],
  "namedLetterPoolId": "starter_onboarding_readable_pool_v1",
  "vowelClassProfileVersion": "vowel_class_v1",
  "vowelClassIncludesY": false,
  "boardQualityPolicy": {
    "qualityPolicyVersion": "board_quality_starter_v1",
    "minVowelClassCount": 12
  }
}
```

Starter opening behavior is authored through `starterTutorialScript.starterBoardOpening` in the encounter definition, while `boardConfig` remains only the canonical `RuntimeBoardConfig`.


The starter board exists to teach confidence, not to test systemic variety.

### 8.2 Mainline canonical boardConfig (editorial label: `board_profile_core_mainline_v1`)

Editorial label note: this label is for human review only and has no runtime loader semantics.

```json
{
  "rows": 6,
  "cols": 6,
  "seedMode": "generated",
  "fixedSeed": null,
  "allowWandTiles": true,
  "wandSpawnRate": 0.06,
  "maxConcurrentWands": 2,
  "letterDistributionProfileId": "letter_distribution_core_mainline_v1",
  "letterWeightEntries": [
    { "letter": "A", "weight": 9 },
    { "letter": "B", "weight": 2 },
    { "letter": "C", "weight": 4 },
    { "letter": "D", "weight": 4 },
    { "letter": "E", "weight": 12 },
    { "letter": "F", "weight": 2 },
    { "letter": "G", "weight": 3 },
    { "letter": "H", "weight": 3 },
    { "letter": "I", "weight": 8 },
    { "letter": "J", "weight": 1 },
    { "letter": "K", "weight": 1 },
    { "letter": "L", "weight": 5 },
    { "letter": "M", "weight": 3 },
    { "letter": "N", "weight": 6 },
    { "letter": "O", "weight": 8 },
    { "letter": "P", "weight": 3 },
    { "letter": "Q", "weight": 1 },
    { "letter": "R", "weight": 6 },
    { "letter": "S", "weight": 6 },
    { "letter": "T", "weight": 7 },
    { "letter": "U", "weight": 4 },
    { "letter": "V", "weight": 1 },
    { "letter": "W", "weight": 2 },
    { "letter": "X", "weight": 1 },
    { "letter": "Y", "weight": 2 },
    { "letter": "Z", "weight": 1 }
  ],
  "namedLetterPoolId": "core_mainline_default_pool_v1",
  "vowelClassProfileVersion": "vowel_class_v1",
  "vowelClassIncludesY": false,
  "boardQualityPolicy": {
    "qualityPolicyVersion": "board_quality_mainline_v1",
    "minVowelClassCount": 10
  }
}
```

Shared-skill rule: creatures should vary while this board-generation contract stays stable across `enc_meadow_001` through `enc_meadow_003`.

---

## 9. Validation snapshot coverage required for this pack

The first ship does not need a giant showoff lexicon.
It needs a trustworthy one.

The pinned snapshot `val_snapshot_m2_launch_v1` must cover the common, family-safe, player-intuitive vocabulary needed to make this first pack feel smart rather than stingy.

### Mandatory tagged words for first-pack feel

These words are not the whole snapshot.
They are mandatory coverage anchors.

#### Flame
- `burn`
- `ember`
- `flame`
- `smoke`
- `torch`

#### Tide
- `rain`
- `river`
- `wave`
- `tide`
- `mist`

#### Bloom
- `leaf`
- `vine`
- `moss`
- `root`
- `bloom`
- `petal`

#### Storm
- `wind`
- `gust`
- `storm`
- `cloud`
- `bolt`

#### Stone
- `rock`
- `stone`
- `cave`
- `sand`
- `clay`

#### Light
- `sun`
- `glow`
- `beam`
- `star`
- `shine`
- `dawn`

### Mandatory valid Arcane-support words

These should exist as valid non-obscure support vocabulary even when not tagged non-neutral:

- `path`
- `trail`
- `calm`
- `spell`
- `magic`
- `play`
- `small`
- `happy`
- `friend`
- `puzzle`

### Validation tone rule for first ship

The first ship should heavily favor:

- Tier A common words
- short and medium readable words
- nature/magic vocabulary that feels intuitive
- family-safe vocabulary only

It must not lean on:

- obscure flex words
- proper nouns
- abbreviations
- jargon traps
- edgy vocabulary that breaks tone

### Coverage rule for all six non-Arcane elements

Even though this first pack does not ask the player to counter every element equally, the validation snapshot should already prove that the element system is real and broad.

That means:

- all six non-Arcane elements must have meaningful early-ship coverage
- Arcane must remain common and healthy
- the game must not feel like only two or three elements actually exist

---

## 10. System cutline for the first ship

This section is mandatory.
It protects the first pack from feature creep and fake polish.

### 10.1 Hidden bonus words

For this first shippable pack:

- `hiddenBonusWordPolicy = null` on all shipped encounters

Reason:
The first pack should not split attention between the core creature loop and optional hidden bonus discovery.
That system can arrive later when it has real support and real reward surfaces.

### 10.2 Journal and cosmetic currency

For this first shippable pack:

- `rewardDefinition = null` on all shipped encounters
- no journal entry unlock UI is required
- no cosmetic currency UI is required

Reason:
Stars and unlocks are enough to make the first pack feel complete.
Empty or barely-functional reward layers would make the product feel more fake, not more generous.

### 10.3 Phase behavior

For this first shippable pack:

- `phaseRules = []` on all shipped creatures

Reason:
The first pack is about teaching stable creature identities.
Phase changes belong later, when the game has already earned player trust.

### 10.4 Player assist actions

For this first shippable pack:

- no player-invoked clue buttons
- no clue economy surfaces
- only automatic Spark Shuffle dead-board recovery

Reason:
The board must first prove it is fair on its own.
Do not sell or surface rescue systems before the mainline board loop is trustworthy.

### 10.5 Fake forward surfaces

Do not ship:

- empty journal trees
- store tabs
- future chapter shells
- event hubs
- profile stat walls
- decorative live-ops clutter

The first shippable pack should feel intentionally small, not accidentally unfinished.

---

## 11. Minimal asset and presentation support required

The first shippable pack needs enough presentation support to feel like a real product slice.
It does not need maximal asset breadth.

### Required

- one creature portrait/presentation asset for each of:
  - Puddle Puff
  - Cinder Cub
  - Brookling Otter
  - Briar Bunny
- one shared `Sunspell Meadow` chapter treatment
- one distinct spell cue identity per creature
- the exact encounter intro flavor lines defined in this document
- result screens with correct CTA behavior

### Not required for first ship

- unique chapter music per encounter
- voice dialogue
- boss cutscenes
- multi-phase art transformations
- elaborate interstitial cinematics

Better one charming reusable meadow backdrop plus four clear creature identities than a pile of half-finished bespoke presentation.

---

## 12. Ship-readiness acceptance checklist

The first pack is ready to ship only when all of the following are true.

### 12.1 Starter readiness

- starter has been clarity-tested first, not last
- guided `leaf` cast works exactly
- the player sees one readable creature spell before the ordinary win path
- the player gets an early confidence win, not a confusion spike
- no Wands, clue UI, hidden bonus UI, or meta clutter leaks into starter flow

### 12.2 Chapter readiness

- all three Meadow encounters are coherent and distinct
- each encounter is clearable with common-word, honest play
- `enc_meadow_003` feels like a chapter capstone, not a punishment spike
- no encounter depends on hidden special rules outside documented behavior
- Home/progression shows one obvious next action at every point in the pack

### 12.3 Validation readiness

- `val_snapshot_m2_launch_v1` includes the mandatory anchor vocabulary in Section 9
- no speculative element tags are used
- starter/tutorial words and first-chapter weakness-anchor words are stable and tested

### 12.4 Presentation readiness

- creature names, chapter name, and flavor lines are final enough to ship
- result CTA behavior matches progression truth
- no placeholder “future chapter” surfaces appear in normal player flow

### 12.5 Product-feel readiness

A first-time player should be able to truthfully feel all of the following by the end of the pack:

- “Words become spells.”
- “Creatures really do change how I should think.”
- “The board feels fair.”
- “The game is warm and magical, not mean.”
- “I want to see what comes after this.”

If the pack does not yet achieve those five truths, it is not ready, no matter how many extra systems technically exist.

---

## 13. Final rule

The first shippable content pack should prove **fun at small scale**.

It is not trying to prove every future roadmap bullet.
It is trying to prove that Words 'n Wands! already works as a game.

The correct first ship is:

- one friendly starter
- one real chapter
- three memorable creature identities
- clear stars and progression
- no fake complexity

If a proposed addition makes this first pack feel less clear, less warm, less fair, or more bloated, it should stay out until it becomes real enough to deserve inclusion.
