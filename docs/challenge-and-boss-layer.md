# Words 'n Wands! Challenge and Boss Layer

This document defines how Words 'n Wands! should add optional challenge flavor and more standout boss/event content after Milestone 2.

Its purpose is to keep post-M2 expansion:

- optional
- readable
- fair
- family-friendly
- sustainable for a mostly AI-assisted solo project
- aligned with the main battle loop rather than competing with it

This is the product-level source of truth for:

- challenge content types
- challenge cadence boundaries
- challenge modifier boundaries
- challenge reward boundaries
- first boss rollout constraints after Milestone 2
- challenge/boss packaging and fallback rules

If future prototypes, code, or content plans disagree with this document, this document should be treated as the challenge/boss rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should add side flavor carefully.

Optional challenge content exists to:

- give returning players a little extra spice
- create lightweight reasons to come back
- let special encounters feel memorable
- support variety without turning the game into a homework calendar

Optional challenge content should **not** become:

- the new main identity of the game
- a guilt machine
- a backend-heavy obligation treadmill
- a second rules language that players must learn separately from the core game

When challenge or boss-layer decisions conflict, Words 'n Wands! should prefer:

1. main progression clarity
2. battle fairness
3. optionality
4. readability
5. sustainable cadence

---

## 2. Scope of This Document

This document owns:

- what kinds of optional challenge content may exist after Milestone 2
- what the first challenge cadence should be
- what challenge modifiers are allowed
- what challenge rewards are allowed
- what first-boss support should and should not do
- how challenge content should bundle and fail safely

This document does **not** own:

- clue runtime behavior details
- ordinary mainline unlock rules
- base damage math
- validation snapshot policy
- async competition rules
- store and monetization policy in full

Those belong in other focused docs.

---

## 3. Canonical Post-M2 Challenge Types

Only the following challenge content types are canonical for the first post-M2 expansion shape.

### 3.1 `weekly_curated`
A curated optional challenge pack meant to be the first real repeatable side-flavor cadence.

### 3.2 `daily_spotlight`
A light daily spotlight that points at content already present inside the active weekly pack.

### 3.3 `event_pack`
A specially framed optional pack used for standout content, seasonal flavor, or curated boss/event moments.

No other challenge content type should be introduced without additive update to this document and `docs/implementation-contracts.md`.

---

## 4. First Challenge Cadence Lock

The first real optional challenge cadence after Milestone 2 should be **weekly-first**.

That means:

- one weekly curated pack is the primary side-flavor unit
- a daily spotlight may exist only as a lightweight surfaced highlight of that current weekly pack
- the product should not begin with a separately authored daily content treadmill

### Why this rule exists
Words 'n Wands! should not commit itself to an operations burden that outruns the project’s real bandwidth.

It is better to maintain:

- one good weekly challenge pack

than to promise:

- a big daily calendar that becomes stale, rushed, or fake

### Daily spotlight rule
A `daily_spotlight` must not introduce independent hidden challenge truth.

It may only:

- feature one challenge already present in the current weekly pack
- rotate its presentation emphasis or framing
- add a small spotlight label or entry treatment

It must not:

- create a separate authored reward ladder
- create a separate challenge-only rule set
- pressure the player with shame for missing a day

---

## 5. Allowed Challenge Modifiers

Challenge content may remix already-understood encounters, but the modifier language should stay tight.

### Allowed challenge modifiers
The first post-M2 challenge layer may use only these modifier families:

- `move_budget_delta`
- `base_countdown_delta`
- `board_profile_override`
- `starting_tile_state_pattern`

### `move_budget_delta`
A small authored delta to the base encounter move budget.

Allowed values for first rollout:

- `-1`
- `+1`

### `base_countdown_delta`
A small authored delta to base creature countdown.

Allowed values for first rollout:

- `-1`
- `+1`

### `board_profile_override`
Swap the encounter onto another already-approved board profile.

### `starting_tile_state_pattern`
Apply a small explicit opening pattern of existing tile states.

Allowed first-rollout tile states:

- `sooted`
- `bubble`

### Modifier-count rule
A challenge definition should use:

- at most **2** modifiers total

This limit exists to keep challenge content understandable.

---

## 6. Forbidden Challenge Truth Changes

Challenge content may remix pressure and presentation. It must not silently redefine core battle truth.

Challenge content must not change:

- validation snapshot truth
- lexicon acceptance
- element-tag truth
- damage model version
- repeat-word rules
- clue rules
- mainline progression unlock rules
- Spark Shuffle fairness rules

### Why this rule exists
Players should feel that optional challenge content is a special encounter remix, not a second hidden rules engine.

---

## 7. Reward Boundaries for Challenge Content

Challenge rewards should remain side-grade and optional.

### Allowed challenge rewards
Challenge content may grant:

- profile flair
- journal progress
- small cosmetic currency
- capped clue charges

### Forbidden challenge rewards
Challenge content must not grant:

- mainline encounter unlocks
- permanent combat-stat power
- extra moves in ordinary progression
- better elemental multipliers
- premium-only board power advantages
- anything that makes non-participation feel like falling behind in the main game

### Reward-size rule
Rewards should feel:

- nice
- motivating
- optional

They should not feel like mandatory homework payment.

---

## 8. First Boss Rollout Lock

The first boss support released after Milestone 2 should feel special without becoming unreadable.

The first shipped boss support must obey all of the following:

- use only existing spell primitive families
- use at most **2** phases total
- use at most **1** weakness/resistance shift
- use only clear phase triggers already supported by existing contracts
- keep countdown, weakness, resistance, and phase state visibly telegraphed at all times

### Phase-trigger rule
The first shipped boss support may use only these trigger families:

- `hp_threshold`
- `countdown_cycle`

### Forbidden first-boss directions
The first boss rollout must not introduce:

- a new primitive family
- more than one matchup shift
- nested or hidden phase logic
- bespoke rule text the player must memorize outside normal HUD communication
- a full boss-only subgame language

### Boss readability rule
A boss may be harder and more memorable.
It must still feel like Words 'n Wands!, not like the game secretly changed genres.

---

## 9. Event Pack Rules

Event packs are the place for controlled novelty, not for redefining the ordinary baseline game.

### Event pack purpose
An event pack may be used for:

- a standout boss
- a themed encounter remix set
- a seasonal visual or creature identity moment
- a higher-pressure optional mastery set

### Event pack boundary
An event pack should be clearly framed as special content.

It must not quietly overwrite the expectations of ordinary mainline play.

### Event rule-banner requirement
If an event encounter uses challenge-style modifiers or unusually framed pressure, that should be stated clearly in encounter intro or challenge-card copy.

### Boss/event star-policy declaration requirement
Authored boss and event content must declare `star_policy_version` explicitly.

Rules:

- boss/event content is invalid if `star_policy_version` is missing
- allowed values are the versioned policies defined in `docs/implementation-contracts.md`
- runtime must use authored `star_policy_version` directly rather than assuming standard absolute thresholds

---

## 10. Packaging and Fallback Rules

### Bundled-first rule for first rollout
The first post-M2 challenge rollout should be:

- bundled-first
- reviewable in repo-owned content
- playable without requiring live fetches

### Remote-content caution rule
Remote optional challenge bundles may be added later, but should not be the first required path.

### Fallback rule
If the current optional challenge bundle is unavailable or fails validation:

- hide the challenge entry cleanly, or
- fall back to the last-known-good optional bundle

Do **not**:

- show a broken placeholder shell
- silently invent replacement challenge truth
- leave a dead card on Home that implies missing content

---

## 11. Home and Result Surface Expectations

This document does not own full screen-flow behavior, but post-M2 challenge content should still obey these product-shape expectations.

### Home placement rule
Optional challenge entry should sit:

- below the main Continue Adventure action
- below Resume Encounter when resume is present
- above settings/profile only if there is enough room and no clutter risk

### Result-screen rule
Challenge results should emphasize:

- optional completion
- side reward clarity
- replay if desired
- a clean return to Home

They should not impersonate mainline unlock flow.

---

## 12. Summary Rule

Words 'n Wands! should expand after Milestone 2 by adding optional challenge spice and memorable boss/event content without losing the product’s identity.

The first post-M2 growth shape should be:

- weekly-first
- challenge-light
- modifier-bounded
- reward-lightweight
- boss-readable
- bundled-first
- optional at all times

If a challenge or boss-layer idea makes the game feel more like homework, more chaotic, more backend-dependent, or less fair, it should not be treated as an improvement.
