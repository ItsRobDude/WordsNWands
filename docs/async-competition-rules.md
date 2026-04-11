# Words 'n Wands! Async Competition Rules

This document defines how Words 'n Wands! should add asynchronous comparison play later without deforming the solo game.

Its purpose is to keep async competition:

- fair
- lightweight
- reproducible
- optional
- readable to ordinary players
- subordinate to the core solo battle loop

This is the product-level source of truth for:

- the first allowed async competition format
- fairness requirements for mirror competition
- ranking rules
- reward boundaries
- clue and economy restrictions in competition
- surface expectations for async comparison play

If future prototypes, code, or content plans disagree with this document, this document should be treated as the async-competition rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! is a solo-first game.

Async competition may later add:

- friendly comparison
- lightweight mastery expression
- extra reasons to return

It should **not** turn the product into:

- a real-time PvP battler
- a social obligation machine
- a chat-heavy multiplayer wrapper
- a pay-driven competition ladder

When async competition decisions conflict, Words 'n Wands! should prefer:

1. fairness
2. reproducibility
3. lightweight comparison
4. solo-first identity
5. low operational burden

---

## 2. Scope of This Document

This document owns:

- the first canonical async competition format
- what conditions must be identical between competitors
- how results are ranked
- what rewards are allowed
- what social/UX complexity is intentionally excluded

This document does **not** own:

- ordinary main progression
- clue runtime behavior outside competition gating
- store/monetization policy in full
- ordinary encounter balancing

Those belong in other focused docs.

---

## 3. Canonical First Format

The first allowed async competition format is:

- `mirror_competition_v1`

No other async competition format should be introduced without additive update to this document and `docs/implementation-contracts.md`.

### What mirror competition means
Both competitors should receive the same authored battle conditions.

That means the comparison should be based on:

- skill
- efficiency
- decision quality

not on invisible content drift.

---

## 4. Mirror Truth Requirements

For `mirror_competition_v1`, every competitor must receive the same:

- base encounter ID
- encounter seed
- content version
- validation snapshot version
- board generator version

### Why this rule exists
If these inputs differ, the comparison stops being a fair mirror and becomes a hidden A/B test or a disguised matchmaking trick.

### No hidden divergence rule
Async competition must not secretly vary:

- lexicon truth
- element truth
- damage model
- board profile behavior
- move budget
- countdown behavior
- creature spell behavior

between competitors in the same mirror competition.

---

## 5. Clue Rule in Competition

The first async competition release should keep competition conditions especially simple.

### First-release clue rule
For `mirror_competition_v1`:

- player-invoked clues are disabled

### Why this rule exists
Although future comparative modes could theoretically enforce identical clue budgets, the safest first release is to disable clues entirely and compare clean solo performance.

### Spark Shuffle distinction
Automatic Spark Shuffle dead-board recovery remains system fairness behavior and is not treated as a clue action.

---

## 6. Canonical Ranking Rules

Competition ranking should stay understandable.

For `mirror_competition_v1`, ranking order is:

1. win beats loss
2. higher star rating
3. more moves remaining
4. fewer successful casts used
5. tie

`completion_time_ms` must not be used as a ranking dimension or tie-break dimension for `mirror_competition_v1`.
It is analytics telemetry only and may be used for difficulty/flow analysis, not competitive ordering.

### Tie rule
If all ranking criteria match, the result is a tie.
Exact ties remain ties for `mirror_competition_v1`; no additional hidden or derived tie-break dimension is allowed.

The game should not invent a hidden tie-breaker beyond the canonical list above unless this document is intentionally updated.

---

## 7. Allowed Rewards

Async competition rewards should remain lightweight.

### Allowed reward directions
Competition may reward:

- badge or ribbon recognition
- profile flair
- small cosmetic currency

### Forbidden reward directions
Competition must not reward:

- mainline encounter unlocks
- permanent combat advantages
- paid-only rank protection
- stat power
- extra moves for ordinary progression

### Reward-tone rule
Competition rewards should feel like optional recognition, not mandatory progression tax.

---

## 8. Surface and UX Boundaries

Async competition should remain visually lightweight.

### Allowed first-release surfaces
Reasonable first-release surfaces include:

- a small optional Home card
- a simple result-comparison card
- a lightweight history entry if needed

### Forbidden first-release surfaces
Do not introduce:

- real-time queue screens
- lobby systems
- chat
- guilds or club coordination
- social-pressure inbox clutter
- large competitive hub shells before the mode proves valuable

### Result-surface rule
Async comparison should appear as an optional result layer, not as a replacement for the player’s ordinary battle result.

---

## 9. Operational Simplicity Rule

Async competition should fit solo-builder reality.

### First-release simplicity direction
Keep first async competition to:

- one mirror format
- one result-comparison model
- one lightweight reward type or small set of reward types

### Avoid overbuilding
Do not build broad PvP infrastructure before the simple mirror format proves worthwhile.

---

## 10. Summary Rule

Words 'n Wands! may add async competition later, but the first release should stay simple:

- one mirror format
- identical inputs for every competitor
- clues disabled
- readable ranking
- lightweight rewards
- no real-time PvP complexity

If an async-competition idea makes the game less fair, less reproducible, more socially noisy, or less like a solo-first magical word battler, it should not be treated as an improvement.
