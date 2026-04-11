# Words 'n Wands! Progression, Economy, and Monetization

This document defines how Words 'n Wands! should reward player progress, structure its economy, and approach monetization.

Its purpose is to keep progression and monetization:

- fair
- readable
- motivating
- family-friendly
- supportive of the core battle loop
- realistic for a mostly AI-assisted solo project

This is the product-level source of truth for:

- progression layers
- reward structure
- economy boundaries
- optional daily/weekly reward logic
- acceptable monetization directions
- forbidden monetization patterns

If future code, content plans, or store ideas disagree with this document, this document should be treated as the progression/economy/monetization rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should reward progress in a way that makes players feel:

- smart
- capable
- steadily advancing
- invited back
- never manipulated

Progression should reinforce the battle loop, not compete with it.

Monetization should support the product, not deform it.

The game should not become:

- a loot treadmill
- a currency maze
- a pressure machine
- an ad trap
- a pay-to-win battler
- a retention gimmick machine hiding weak fundamentals

### Practical rule
The most important thing to preserve is the emotional contract:

- the battle loop is fun
- the rules are fair
- the player’s thinking time is respected
- optional reward layers add delight rather than obligation

### Research-aligned direction
Successful mobile word games tend to work best when they combine:

- a low-friction first win
- challenge that stays in a healthy skill range
- lightweight meta progression adjacent to mastery
- optional daily/weekly reasons to return
- monetization that does not break the fairness/relaxation contract

Words 'n Wands! should follow that direction.

---

## 2. Scope of This Document

This document owns:

- progression structure
- reward categories
- currency direction
- optional daily/weekly reward logic
- ad and IAP boundaries
- what monetization types are acceptable or forbidden

This document does **not** own:

- battle rules
- content packaging and review flows
- implementation contracts for runtime state
- analytics instrumentation details
- store UI layout details

Those belong in other docs.

---

## 3. Progression Principles

All progression in Words 'n Wands! should satisfy these principles.

### 3.1 Progress should feel earned
The player should feel that rewards and unlocks come from:

- wins
- smart play
- repeated engagement
- improving performance

not from paying to bypass the actual game.

### 3.2 Progress should remain readable
The player should be able to understand:

- what they earned
- why they earned it
- what it unlocks
- what to do next

### 3.3 Progress should stay adjacent to mastery
The strongest forms of progression for this game are those that sit beside skill rather than replacing it.

Examples:

- star ratings
- new encounter unlocks
- creature journal progress
- small cosmetic rewards
- chapter or habitat progression

### 3.4 Progress should not become homework
Optional daily/weekly content may support return play, but progression should not require constant calendar obedience.

### 3.5 Economy should stay small
Words 'n Wands! should avoid large stacks of overlapping systems, currencies, and shops unless the product clearly earns them later.

---

## 4. Core Progression Layers

Words 'n Wands! should use a small number of progression layers.

### 4.1 Main progression
The core progression layer is the player’s movement through the encounter set.

Examples of acceptable main progression structures:

- a simple encounter list
- chapter groupings
- a lightweight world path
- habitat-based progression

The main progression should answer:

- what encounter is next
- what the player already cleared
- what is unlocked now

### 4.2 Performance progression
Performance progression should come from things like:

- star ratings
- best result tracking
- improved completion efficiency
- optional replay for stronger results

This is a strong fit for the game because it rewards learning without adding clutter.

### 4.3 Collection / journal progression
A secondary progression layer may come from:

- creature journal entries
- codex unlocks
- cosmetic stamps or badges
- habitat completion markers

This kind of progression fits the game well because it supports attachment without overpowering the board loop.

### 4.4 Optional challenge progression
Daily and weekly side content may later provide a smaller progression layer through:

- challenge completions
- challenge rewards
- optional streak-like return markers
- profile flair or side collection progress

This layer must remain secondary.

---

## 5. Reward Categories

The reward system should stay clear and modest.

### 5.1 Encounter completion rewards
A normal encounter completion may reward:

- progression unlocks
- first-clear recognition
- star rating
- optional journal progress
- optional soft currency later

### 5.2 First-clear rewards
First clear is an especially useful reward trigger.

It should be recognized clearly because it gives the player a sense of forward movement.

Concrete first-clear reward amounts are locked in `docs/milestone-locked-constants.md` section 3.3.a.

### 5.3 Star-improvement rewards
Improving a previous result may also produce a small reward or recognition moment.

This encourages replay without making replay feel mandatory.

Concrete star-improvement reward amounts and per-encounter caps are locked in `docs/milestone-locked-constants.md` section 3.3.b.

### 5.4 Journal rewards
Creature or collection progress should feel like a nice side payoff, not a second job.

### 5.5 Challenge rewards later
Optional challenge rewards may later grant:

- modest cosmetic currency
- profile flair
- creature journal progress
- side-collection progress
- limited optional recognition items

Challenge rewards should not become mandatory gates to ordinary progression power.

---

## 6. Star Rating Rules

Star ratings are one of the best early progression tools for this game.

### 6.1 Purpose of stars
Stars exist to:

- show performance quality
- give replay value
- provide lightweight mastery goals
- create a stronger sense of completion

### 6.2 Current direction
The current intended meaning is:

- 3 stars = strong efficiency
- 2 stars = solid completion
- 1 star = narrow completion
- 0 stars = loss

### 6.3 Best-star rule
Progression should normally care about the player’s **best** star result for an encounter, not punish them for weaker later replays.

### 6.4 No-shame rule
A 1-star win should still feel like a win.

Stars should encourage mastery without turning ordinary success into disappointment.

---

## 7. Currency Direction

Words 'n Wands! should stay conservative with currencies.

### 7.1 Early-stage rule
For early milestones, the game does **not** need a full currency economy.

Core progression can work perfectly well through:

- encounter unlocks
- stars
- journal progress
- simple completion rewards

### 7.2 Currency complexity rule
Do not introduce multiple currencies early.

### 7.3 Preferred later direction
If a currency is introduced later, the safest direction is:

- **one soft currency** used primarily for cosmetic or side-grade reward surfaces

Examples of acceptable uses later:

- cosmetic unlocks
- profile flair
- journal-themed collectibles
- optional visual customizations

### 7.4 Premium-currency caution
A separate premium currency is not part of the preferred early direction.

If monetization is added later, direct purchases are usually safer and clearer than a premium-currency maze.

### 7.5 No power currency rule
The game should not create a currency whose main job is buying wins, extra moves, or overpowering the core campaign.

---

## 8. Core Economy Boundaries

### 8.1 Battle fairness rule
The core campaign battle loop must remain fair whether or not the player spends money.

### 8.2 No paid extra-move rule
The game should not sell extra moves for ordinary encounter wins in the core campaign.

### 8.3 No paid combat-stat rule
The game should not sell:

- stronger elemental multipliers
- better base damage
- easier countdown rules
- direct stat boosts against creatures
- special premium-only power tiles in core play

### 8.4 No energy/stamina gate rule
The game should not gate ordinary play behind energy or stamina timers in the core product direction.

### 8.5 No gacha rule
The game should not depend on loot boxes, gacha-style randomness, or blind-purchase creature progression.

### 8.6 Player assist monetization boundary (M1-M2 lock)
No player-invoked hints/clues in M1–M2; only automatic Spark Shuffle dead-board recovery.

Economy and fairness implications:

- M1-M2 must not sell, bundle, or reward consumable hints/clues because player-invoked hint/clue actions do not exist in those milestones.
- Spark Shuffle is automatic board-recovery safety behavior and must not be sold, metered, or tied to ad views.
- If hint/clue assists are introduced after M2, they must remain non-pay-to-win: no purchase path may provide unlimited in-encounter pressure bypass versus non-paying players.
- Any future hint economy must define strict usage limits, pressure tradeoffs, and parity safeguards before monetization surfaces go live.

### 8.7 Canonical clue economy guardrails (M3+)
If clues are enabled in Milestone 3 or later, use `docs/hint-and-clue-mechanics.md` as canonical clue-economy truth.

Required guardrails:

- Only canonical clue actions are allowed: `reveal_starter_letter`, `highlight_legal_path`, `reroll_local_tiles`.
- Earned clue charges are capped at `3` per UTC day.
- Purchased clue charges are capped at `3` per UTC day.
- Total stored clue inventory is capped at `9`.
- Per-encounter usage caps and star-impact penalties apply equally to earned and purchased clue charges.
- Purchase paths must not remove countdown penalties, move costs, cooldowns, or per-encounter clue limits.
- Starter flow remains clue-hidden unless explicitly unlocked by later milestone docs.

---

## 9. Main Progression Reward Rules

### 9.1 Unlock rules
Clearing encounters should unlock future content in a way that feels understandable.

### 9.2 Lightweight structure rule
The progression system should stay legible enough that a player can quickly answer:

- what did I just unlock?
- what can I play next?
- what am I working toward?

### 9.3 No fake sprawl rule
Do not inflate the progression structure with giant maps, dozens of sub-currencies, or pseudo-RPG layers if the actual reward meaning is weak.

### 9.4 Habitat / chapter direction
If areas, habitats, or chapters exist later, they should function as readable grouping structures rather than lore-heavy campaign bloat.

---

### 9.5 Canonical Milestone 2 unlock algorithm

Milestone 2 uses one canonical mainline progression model:

- `chapter_linear_v1`

This means:

- the starter encounter is a special onboarding gate and is not part of the normal chapter list
- the mainline campaign is composed of ordered chapters
- each chapter contains an ordered list of mainline encounters
- chapters and encounter order together define one canonical next encounter

### 9.6 Mainline unlock condition

The mainline unlock condition for Milestone 2 is:

- `win_any_stars`

A win with `1`, `2`, or `3` stars unlocks the next mainline encounter.
A loss with `0` stars does not unlock the next mainline encounter.

Stars are mastery rewards, not progression gates.

### 9.7 One-next-encounter rule

A mainline encounter win unlocks exactly one next mainline encounter:

- the next encounter in the same chapter, or
- the first encounter of the next chapter if the current encounter is chapter-final

Milestone 2 does not use branching unlocks for ordinary mainline progression.

### 9.8 Replay and relock rule

Replay exists to improve mastery and star results.

Replay may:

- improve best-star records
- update completion timestamps
- increase win/loss counters

Replay must not:

- relock already unlocked encounters
- create branch unlock ambiguity
- make weaker later performance remove earlier progress

Unlock state is monotonic for a profile:
- `locked -> unlocked` is allowed
- `unlocked -> locked` is not allowed in ordinary progression flow

### 9.9 Loss behavior rule

Losing an already unlocked encounter does not relock it and does not relock any future encounters that were already unlocked.

A loss on an uncleared encounter simply leaves its immediate successor locked.

### 9.10 Starter encounter gate rule

The starter encounter is an onboarding gate, not a normal mainline chapter node.

Starter behavior:

- starter win unlocks the first mainline encounter
- starter loss unlocks nothing
- the player remains in starter flow until the starter encounter is won
- after the starter encounter is won, Home and progression surfaces should treat the first mainline encounter as the next meaningful action

### 9.11 Chapter completion rule

A chapter is considered completed when every encounter in that chapter has been won at least once.

Chapter completion is for presentation and progress summary.
Chapter completion does not require all encounters to reach 3 stars.

### 9.12 Deterministic examples

**Example 1: starter loss**

Progression definition:
- starter: `enc_starter_001`
- chapter 1: `enc_meadow_001`, `enc_meadow_002`, `enc_meadow_003`

Initial state:
- `has_completed_starter_encounter = 0`
- `starter_result_outcome = 'unplayed'`
- `enc_starter_001.is_unlocked = 1`
- all mainline encounters `is_unlocked = 0`

Player loses starter.

Result:
- `has_completed_starter_encounter = 0`
- `starter_result_outcome = 'lost'`
- `enc_starter_001.loss_count += 1`
- `enc_meadow_001.is_unlocked` remains `0`

Next app entry returns to starter flow.

**Example 2: starter win**

Starting from Example 1 state, player wins starter with 1 star.

Result:
- `has_completed_starter_encounter = 1`
- `starter_result_outcome = 'won'`
- `enc_starter_001.best_star_rating = 1`
- `enc_meadow_001.is_unlocked = 1`
- `enc_meadow_001.first_unlocked_at_utc` is set
- `enc_meadow_002.is_unlocked = 0`

Home now points to `enc_meadow_001`.

**Example 3: mainline loss does not relock**

Player wins `enc_meadow_001` with 2 stars.

Result:
- `enc_meadow_001.best_star_rating = 2`
- `enc_meadow_002.is_unlocked = 1`

Then player loses `enc_meadow_002`.

Result:
- `enc_meadow_002.loss_count += 1`
- `enc_meadow_002.is_unlocked` stays `1`
- `enc_meadow_003.is_unlocked` stays `0`

Home points to retry `enc_meadow_002`.

**Example 4: replay improves stars only**

Player later wins `enc_meadow_002` with 1 star.

Result:
- `enc_meadow_002.best_star_rating = 1`
- `enc_meadow_003.is_unlocked = 1`

Later they replay `enc_meadow_002` and win with 3 stars.

Result:
- `enc_meadow_002.best_star_rating = 3`
- `enc_meadow_003.is_unlocked` stays `1`
- no other unlock changes occur

**Example 5: chapter boundary**

`enc_meadow_003` is the final encounter of chapter 1.
Chapter 2 starts with `enc_brook_001`.

Player wins `enc_meadow_003` with 2 stars.

Result:
- `enc_meadow_003.best_star_rating = 2`
- `enc_brook_001.is_unlocked = 1`

That is the only new unlock from that win.

---

## 10. Journal and Collection Progression Rules

A creature journal or codex is a good fit for this product if it stays light.

### 10.1 Journal purpose
The journal exists to:

- create attachment to creatures
- reward continued play
- provide a collection layer without breaking battle fairness

### 10.2 Journal reward direction
Journal progress may later unlock:

- art cards
- short flavor snippets
- creature badges
- habitat completion marks
- profile customization items

Journal increment sizes and unlock thresholds are locked in `docs/milestone-locked-constants.md` section 3.3.d.

### 10.3 Journal restraint rule
The journal should not become a second giant game system with its own tangled economy.

---

## 11. Daily and Weekly Flavor Reward Rules

Daily and weekly systems are optional side flavor, not the product center.

### 11.1 Optionality rule
Players should never feel forced to engage with daily/weekly systems just to keep up with normal progression.

### 11.2 Reward size rule
Daily/weekly challenge rewards should be:

- modest
- nice-to-have
- side-grade in emotional value
- not required for core power

Concrete daily/weekly challenge reward amounts and cadence caps are locked in `docs/milestone-locked-constants.md` section 3.3.c.

### 11.3 Acceptable reward examples later
- small cosmetic currency
- profile flair
- journal progress
- seasonal badge marks
- side challenge completion recognition

### 11.4 Avoid hard progression gates
Do not place the main campaign behind daily/weekly participation.

### 11.5 Missed-content rule
Missing optional challenge content should not make the player feel punished or left behind.

---

## 12. Streak Rules Later

If streak-like mechanics are added later, they must be handled carefully.

### 12.1 Soft streak principle
A streak may encourage return play, but must not turn the game into an obligation machine.

### 12.2 No shame rule
Do not build streak systems that create strong guilt, humiliation, or panic for missing a day.

### 12.3 Optionality rule
Streaks should remain secondary to the actual joy of playing.

### 12.4 Safe streak direction
If streaks exist later, safer approaches include:

- cosmetic recognition
- soft challenge tracking
- no direct core-power dependency
- forgiveness mechanics if needed

### 12.5 Early-stage rule
Streaks are not required for the early product.

---

## 13. Monetization Philosophy

Monetization must fit the emotional contract of the game.

Words 'n Wands! should feel like:

- a fair magical puzzle battler
- a cozy but smart mobile game
- a trustworthy product

Monetization that damages that feeling should be rejected.

### 13.1 Respect-the-thinking-moment rule
The game must respect the player’s thinking time.

Monetization must not interrupt active battle-solving.

### 13.2 Family-friendly rule
Monetization should remain appropriate to a broad audience and should not lean on aggressive casino-like pressure patterns.

### 13.3 Clarity rule
If the game sells something, the player should understand what it is and why it exists.

---

## 14. Acceptable Monetization Directions

These are the safest monetization directions for Words 'n Wands! later.

### 14.1 Ad-free purchase
A one-time ad-free purchase is a strong fit because it supports the product without deforming the core loop.

### 14.2 Cosmetic purchases
Reasonable later cosmetic directions may include:

- theme packs
- board skins
- frame variants
- profile flair
- optional visual customization bundles

These are safer than monetizing power.

### 14.3 Content packs later
Reasonable later premium content directions may include:

- curated optional challenge packs
- special encounter packs
- themed cosmetic + content bundles

These should not lock ordinary core fairness behind payment.

### 14.4 Supporter bundles later
A simple supporter-style bundle may fit later if it remains honest and low-pressure.

### 14.5 Rewarded ads later
Rewarded ads may fit later only if they remain:

- optional
- clearly labeled
- outside the active thinking moment
- tied to side rewards rather than core battle fairness

---

## 15. Ad Rules

If ads ever exist, they must be handled conservatively.

### 15.1 No ads during active battle
Do not show forced ads:

- during active board play
- during cast resolution
- during creature action resolution
- during pause/resume flow

### 15.2 Closure-only rule
If ads are used, they are safest:

- after a clear moment of closure
- after an encounter result
- or as optional rewarded choices

### 15.3 Rewarded ad boundaries
Rewarded ads should not grant:

- core combat power
- extra paid wins
- core campaign fairness bypasses

Safer rewarded-ad uses later include:

- small cosmetic currency
- optional side challenge bonuses
- collection/journal side rewards

### 15.4 Ad frequency rule
Ad frequency must not become exhausting or trust-breaking.

### 15.5 Family-friendly ad rule
If ads exist later, they must not undercut the game’s family-friendly tone.

---

## 16. Forbidden Monetization Patterns

The following patterns are not compatible with Words 'n Wands!’ intended identity.

### 16.1 Pay-to-win
Forbidden:

- paying for stronger battle stats
- paying for easier creature matchups
- paying for extra moves in ordinary progression
- paying for premium-only spell power in the main campaign

### 16.2 Thinking-moment interruption
Forbidden:

- interstitial ads during active battle
- monetization popups mid-swipe
- loss-state harassment that appears before the player can breathe

### 16.3 Pressure-loop monetization
Forbidden:

- manipulative countdown offers
- harsh fear-of-missing-out pressure for ordinary content
- streak panic monetization
- guilt-based recovery monetization

### 16.4 Currency maze design
Forbidden early and strongly discouraged later:

- multiple premium currencies
- confusing bundle hierarchies
- unclear exchange values
- pseudo-casino monetization layers

### 16.5 Gacha / loot-box direction
Forbidden:

- blind creature pulls
- blind spell pulls
- random-power monetization
- monetized rarity pressure as a core loop

---

## 17. Milestone-Based Monetization Rules

Monetization should arrive late, not early.

### 17.1 Milestones 0–5
For Milestones 0–5, the game does **not** need player-facing monetization surfaces.

This includes:

- no store-first Home
- no shop tab clutter
- no fake premium currency
- no monetization-driven economy complexity

### 17.2 Milestone 6+
Only after the game is genuinely fun and stable should monetization become real.

At that point, the product may evaluate:

- ad-free purchase
- cosmetic packs
- optional side-content packs

### 17.3 No premature store rule
Do not expose a store before the product has earned the right to have one.

---

## 18. Reward Pacing Rules

A good session should produce one of a few satisfying outcomes.

### 18.1 Core session satisfactions
An encounter session should usually provide at least one of:

- a clear win
- a near miss that invites retry
- a small meta reward such as stars, unlock progress, or journal movement

### 18.2 Reward inflation rule
Do not overinflate reward quantity so much that rewards lose meaning.

### 18.3 Clarity rule
After a battle, the player should quickly understand:

- what happened
- what they earned
- what changed
- what they can do next

---

## 19. Economy and Content Coordination Rules

Economy systems must stay aligned with the content pipeline and content reality.

### 19.1 Reward-definition rule
Reward definitions must be typed and reviewable.

### 19.2 Content realism rule
Do not design a reward economy that assumes a huge content cadence the project cannot sustain.

### 19.3 Journal/cosmetic support rule
Soft-currency uses should be tied to content the project can actually create and maintain.

---

## 20. Analytics and Experiment Boundaries

### 20.1 Metrics do not overrule trust
Good metrics do not justify bad monetization.

### 20.2 Experiment caution rule
If monetization or progression experiments are ever run later, they must not create hidden unfairness or make the battle system feel inconsistent.

### 20.3 Respect-the-player rule
A monetization experiment that harms trust is a bad experiment even if it briefly improves conversion.

---

## 21. Out of Scope for Early Progression/Economy Work

The following are out of scope for early progression/economy work unless intentionally documented later:

- multiple currencies
- energy/stamina gates
- gacha systems
- paid core-battle advantages
- battle pass systems
- heavy seasonal reward ladders
- store-first navigation
- aggressive streak systems
- monetization in the active battle loop

---

## 22. Summary Rule

Words 'n Wands! should structure progression and monetization so that:

- the battle loop stays central
- stars and progression feel meaningful
- collection/journal layers stay light
- optional daily/weekly flavor remains optional
- economy complexity stays small
- monetization supports the product instead of deforming it
- the player never feels that paying is the real way to win

If a progression, economy, or monetization idea makes the game less fair, less warm, more confusing, more mandatory-feeling, or more manipulative, it should not be treated as an improvement.
