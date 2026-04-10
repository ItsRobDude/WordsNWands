# Words 'n Wands! Creature and Encounter Rules

This document defines how Words 'n Wands! should author, present, and balance:

- creatures
- encounters
- creature weaknesses and resistances
- cast countdown behavior
- creature spells and disruption rules
- encounter difficulty tiers
- boss and event exceptions

Its purpose is to keep creature content:

- fair
- readable
- strategically meaningful
- family-friendly
- maintainable for humans and AI contributors

This is the product-level source of truth for creature and encounter behavior.

If future code, tools, mockups, or content data disagree with this document, this document should be treated as the creature/encounter rulebook until intentionally updated.

---

## 1. Core Philosophy

Creatures in Words 'n Wands! are not just targets.

They are puzzle-shaping opponents.

A good creature should make the player think:

- what element is best here
- how soon will this creature act
- what board state is it trying to force on me
- do I spend a move on a better immediate hit or a safer setup

Creature design should create:

- personality
- readable tactical variation
- gentle tension
- replayable encounter identity

Creature design should **not** create:

- confusion
- hidden unfairness
- chaotic board noise
- arbitrary punishment
- constant “gotcha” moments

When creature-design decisions conflict, Words 'n Wands! should prefer:

1. readability
2. fairness
3. player trust
4. thematic clarity
5. maintainable simplicity

over surprise, spectacle, or raw difficulty for its own sake.

---

## 2. Scope of This Document

This document owns:

- what a creature is
- what information a creature exposes
- how encounters are categorized
- how creature spells should be authored
- how strong or disruptive spells are allowed to be
- how weaknesses/resistances behave
- how bosses and events may differ from ordinary encounters
- encounter difficulty bands and tuning guidance

This document does **not** own:

- core word-validation policy
- board adjacency rules
- move-consumption rules
- damage formula details
- screen-layout details
- persistence/storage contracts
- content pipeline mechanics

Those belong in other docs.

---

## 3. Core Terms

The following terms should be used consistently across Words 'n Wands!.

### Creature
The magical opponent in an encounter.

### Encounter
One full battle against one creature under one authored ruleset.

### Encounter Type
The structural kind of encounter, such as standard, boss, or event.

### Difficulty Tier
An internal authoring tier used to describe how demanding an encounter is.

### Weakness
The element that deals bonus damage to the creature.

### Resistance
The element that deals reduced damage to the creature.

### Cast Countdown
The visible number of successful player casts remaining before the creature performs its spell.

### Base Countdown
The number to which the creature’s cast countdown resets after it casts.

### Creature Spell
The creature’s authored board-affecting action.

### Spell Primitive
A small reusable board effect used to construct creature spells.

### Spell Intensity
The strength and disruption level of a spell relative to the encounter tier.

### Phase Change
A deliberate, documented boss or event behavior change triggered by a clear condition such as an HP threshold.

### Encounter Budget
The combined authored pressure created by HP, move budget, countdown speed, spell intensity, and elemental matchup.

---

## 4. Standard Creature Information

A creature must expose enough information for the player to understand the fight.

### Always-visible creature information
In a Standard Encounter, the player must be able to see:

- creature name
- creature portrait or art
- creature HP as both:
  - a visible HP bar
  - a numeric current / max display
- creature weakness
- creature resistance
- creature cast countdown

### Readability rule
Weakness and resistance must not rely on color alone.

They should be shown using:

- icon
- text label
- and any supporting visual treatment needed for clarity

### Damage feedback rule
When a player casts a successful word, the encounter should clearly show:

- the damage number dealt
- the word’s element
- whether the hit was:
  - weakness
  - neutral
  - resistance
- any visible multiplier or boost effect, such as:
  - weakness multiplier
  - Wand bonus
  - reduced damage from resistance or soot

This is partly a presentation concern, but it is also an encounter-trust rule.  
The player should understand why a hit landed the way it did.

---

## 5. Standard Creature Rules

A Standard Encounter creature follows these rules unless a more specific documented exception applies.

### Standard creature structure
A standard creature has:

- one creature identity
- one visible weakness
- one visible resistance
- one base countdown
- one primary spell identity
- one authored HP value
- one authored encounter tier

### Single-identity rule
A creature should have one clear tactical identity.

Examples:

- soot creature
- freeze creature
- row-shift creature
- bubble creature
- light-distortion creature

Ordinary creatures should not try to do everything at once.

### Weakness/resistance stability rule
Ordinary creatures must **not** change weakness or resistance during a fight.

This is the normal rule because hidden or frequent matchup changes feel unfair and confusing.

### Countdown rule
A creature’s cast countdown must be visible at all times during active play.

### Reset rule
After a creature casts its spell, the countdown resets to that creature’s authored base countdown.

### Board-affecting rule
In the current core game direction, creature spells affect the board.  
They do **not** directly remove player hearts or lives.

---

## 6. Encounter Types

Words 'n Wands! currently supports these encounter-type categories.

### 6.1 Standard Encounter
The normal battle type.

Standard Encounters should:

- teach and reinforce the core loop
- provide the majority of ordinary play
- keep spell behavior mostly nuisance-level
- remain fair, readable, and replayable

### 6.2 Boss Encounter
A special high-pressure encounter.

Boss Encounters may use:

- stronger disruption
- tighter pressure
- higher durability
- clearer phase behavior
- more demanding elemental play

Bosses should feel special, not like the baseline for the whole game.

### 6.3 Event Encounter
A special optional encounter used for curated or temporary content.

Event Encounters may use:

- unusual creature rules
- more experimental spell behavior
- distinct reward structures
- higher pressure than normal content

Event content should be clearly framed as special content and should not quietly redefine the ordinary game.

---

## 7. Internal Difficulty Tiers

These tier names are primarily for internal authoring and balancing for now.

They do not need to be exposed to players exactly as written.

### Tier list
- Gentle
- Standard
- Challenging
- Boss
- Event

### 7.1 Gentle
Gentle encounters are early or especially cozy fights.

They should:

- introduce creatures clearly
- allow recovery from small mistakes
- use light board disruption
- leave the player feeling capable

### 7.2 Standard
Standard encounters are the expected mainline experience.

They should:

- ask for real effort
- reward good word and element choices
- use light-to-moderate nuisance pressure
- remain comfortably fair

### 7.3 Challenging
Challenging encounters are tougher but still ordinary content.

They may:

- use tighter move efficiency
- use faster countdowns
- use stronger nuisance patterns
- ask for more deliberate board planning

They should still remain readable and honest.

### 7.4 Boss
Boss is both an encounter type and a difficulty tier.

Bosses may use:

- higher durability
- stronger or chained spell behavior
- one clear phase escalation
- clearer demand for strategic element use

### 7.5 Event
Event encounters may use bespoke difficulty expectations, but must still remain fair and legible.

---

## 8. Encounter Tuning Philosophy

Words 'n Wands! should tune encounters through a combination of pressures rather than one punishing lever.

### Main tuning levers
Encounter difficulty should come from combinations of:

- creature HP
- move budget
- base countdown
- spell intensity
- board disruption style
- weakness/resistance profile
- word/element demand

### Avoid single-lever brutality
The game should avoid relying on one extreme setting such as:

- absurd HP sponge creatures
- countdowns that fire constantly
- huge board chaos every cast
- hyper-tight move budgets with no recovery room

Those patterns feel cheap faster than they feel smart.

### Cozy challenge rule
Ordinary content should feel:

- generous enough to be welcoming
- demanding enough that smart play matters

The player should have a reason to try, but not feel bullied for being imperfect.

---

## 9. Expected Defeat Pace

Creature HP should not be tuned in isolation.

It should be tuned against how many successful casts a creature usually takes to defeat.

### Target pacing bands
These are internal balancing targets for typical play quality, not promises to the player.

#### Gentle encounters
Should usually take about:

- **5–7** solid casts to defeat

#### Standard encounters
Should usually take about:

- **6–8** solid casts to defeat

#### Challenging encounters
Should usually take about:

- **7–9** solid casts to defeat

#### Boss encounters
Should usually take about:

- **8–11** solid casts to defeat

### Why this rule exists
Raw HP numbers become misleading when damage tuning changes.

Expected defeat pace is the more stable balancing lens.

### Skill expression rule
Better players should be able to improve encounter outcomes through:

- better board reading
- stronger word choices
- better weakness usage
- better countdown management

The game should reward mastery without forcing perfection in ordinary fights.

---

## 10. Countdown Rules

Countdowns are one of the game’s core pressure systems.

### Countdown purpose
The countdown exists to:

- create urgency
- reinforce creature identity
- reward weakness play and good timing
- keep the fight active without using a harsh timer clock

### Standard countdown bands
Current internal guidance:

#### Gentle
- usually **5**

#### Standard
- usually **4–5**

#### Challenging
- usually **4**

#### Boss
- usually **3–4**

These are guidance bands, not absolute universal rules.

### Countdown readability rule
Countdown behavior must be easy to follow.

The player should always be able to answer:

- how soon the creature will act
- whether their last cast affected that timing
- what the consequence of the next countdown expiry probably is

### Weakness-interaction rule
Weakness-related countdown benefits are allowed because they create meaningful strategy.

However, they must stay simple and readable.

The game should avoid a giant web of special countdown exceptions per creature unless intentionally documented later.

---

## 11. Creature Spell Design Rules

Creature spells define encounter identity.

### Spell purpose
A spell should:

- reinforce the creature’s personality
- alter the board in a readable way
- create a meaningful nuisance or challenge
- encourage adaptation

A spell should **not** exist mainly to frustrate or confuse.

### One-primary-spell rule
Ordinary creatures should have one primary spell identity.

That spell may be built from one primitive or a small combination of simple primitives, but it should still feel like one understandable behavior.

### Thematic coherence rule
A creature’s spell, weakness, and resistance should make sense together.

Examples of good coherence:

- flame creature -> soot or heat-themed nuisance
- vine creature -> freeze/tangle-style tile blocking
- stone creature -> row/column shove or heavy board displacement
- bubble creature -> upward movement or floating tiles
- light creature -> dulling or glare-based readability pressure

### Moderate variety rule
Creatures should feel distinct without requiring players to learn a completely new rules language every fight.

---

## 12. Spell Primitive Library

To keep content maintainable, creature spells should be built from a small reusable set of primitives.

### Allowed primitive families

#### 12.1 Apply tile state
Apply one negative tile state to a limited number of eligible tiles.

Examples:

- freeze 2 tiles
- soot 3 tiles
- dull 3 tiles
- bubble 2 tiles

#### 12.2 Shift one row
Move or rotate one row by one step.

#### 12.3 Shift one column
Move or rotate one column by one step.

#### 12.4 Small chained effect
A creature may combine two small effects if the result remains readable.

Example:

- rotate one row, then soot 1 tile

### Not-good primitive direction for ordinary content
Avoid ordinary creatures whose spells:

- scramble the entire board constantly
- apply many different states at once
- create a board the player cannot visually parse
- feel like a random disaster generator

---

## 13. Tile-State Authoring Rules

Tile states should remain few, readable, and meaningful.

### Single-state rule
A tile should normally have at most one negative state at a time.

### State-count guidance
For ordinary content, a single creature cast should usually affect:

- **1–3 tiles** for Gentle
- **2–4 tiles** for Standard
- **3–4 tiles** for Challenging

Bosses or curated event encounters may go beyond that, but only if readability remains strong.

### State-readability rule
Each tile state must be easy to identify and understand during active play.

The player should not need to memorize hidden effects.

### State-clearance rule
Negative states should clear under simple, documented conditions.  
They should not linger in mysterious ways.

---

## 14. Targeting Rules for Creature Spells

When creature spells choose tiles or board sections, the targeting behavior must feel fair.

### Allowed targeting styles
Targeting may be:

- random among eligible targets
- based on a simple visible rule
- based on a consistent authored pattern

### Preferred targeting rule
The player does not need to know the exact random seed, but the targeting should not feel like the creature is secretly cheating based on hidden perfect information.

### Readable-pattern preference
Whenever possible, prefer targeting patterns the player can intuit over time, such as:

- a small number of random eligible tiles
- the leftmost valid row chosen by a simple rule
- the topmost or bottommost eligible tile group
- a visible phase-based rule in a boss fight

### No invisible “anti-player” rule
Avoid hidden logic whose purpose is obviously to ruin the player’s best options every time.

The creature may create pressure.  
It should not feel omniscient.

---

## 15. Spell Intensity Rules

Spell intensity must be appropriate to the encounter tier.

### 15.1 Gentle intensity
Gentle encounters should usually use:

- 1 light nuisance
- small state counts
- little or no chained disruption
- slow enough countdowns for recovery

### 15.2 Standard intensity
Standard encounters may use:

- 1 clear nuisance
- moderate state counts
- occasional row/column shift
- enough pressure that weakness play and smart word choice matter

### 15.3 Challenging intensity
Challenging encounters may use:

- more persistent nuisance pressure
- moderate chained behavior
- faster countdowns
- stronger board-shaping pressure

They still should not feel like chaos.

### 15.4 Boss intensity
Bosses may use:

- stronger state counts
- chained primitives
- one phase escalation
- higher durability
- clearer demand for adaptation

Boss intensity should feel earned and memorable.

### 15.5 Event intensity
Event encounters may exceed ordinary intensity patterns, but only if they are clearly optional or specially framed content.

---

## 16. Forbidden or Restricted Creature Behaviors

The following are restricted because they are likely to break trust or tone.

### Ordinary creatures must not:
- change weakness or resistance mid-fight
- directly remove moves as a hidden punishment
- directly deal player HP damage in the core campaign
- hide their countdown
- trigger giant unreadable board chaos as their normal behavior
- rely on secret anti-player targeting logic
- force obscure rule memorization just to understand the fight

### Bosses and events should still generally avoid:
- multiple unclear phase changes
- rapidly shifting element rules
- untelegraphed matchup changes
- direct “you lose now” mechanics with little counterplay

---

## 17. Boss and Event Exceptions

Bosses and events may break some ordinary constraints, but only under strict conditions.

### Weakness/resistance change exception
A boss or event creature may change weakness or resistance mid-fight only if all of the following are true:

- the behavior fits that creature’s fantasy
- the change is clearly telegraphed
- the change is not random
- the change is not frequent
- the player can understand what happened
- the fight remains fair at its intended skill level

### Current v1 guardrail
For v1, a boss or event encounter should generally change weakness/resistance **at most once** during the fight unless a more specific doc intentionally authorizes more.

### Allowed trigger styles
If a boss/event changes weakness or resistance, the trigger should be something clear such as:

- entering a named second phase
- crossing a visible HP threshold
- completing a specific visible ritual/cast

### Not allowed
Do not let a boss/event silently swap matchups in a way that makes the player feel tricked for using good strategy.

### Phase clarity rule
A phase change should present a clear signal such as:

- obvious animation
- explicit label
- icon update
- text cue
- strong visual shift

It must not be subtle to the point of confusion.

---

## 18. Boss Design Rules

Bosses should feel like standout duels, not ordinary enemies with bigger numbers.

### Boss identity rule
A boss should have:

- a strong fantasy identity
- a clear tactical identity
- higher memorability than ordinary creatures

### Boss escalation rule
A boss may use one clear escalation, such as:

- a stronger version of its usual spell
- one phase shift
- more demanding countdown pressure
- a clearer reliance on elemental counterplay

### Boss fairness rule
Bosses may be harder.  
They must still be readable.

The player should feel:

- “this is a serious fight”
- not “the game changed the rules on me without warning”

---

## 19. Event Design Rules

Events are a place for controlled experimentation.

### Event-purpose rule
Events may be used for:

- curated challenge
- seasonal novelty
- optional mastery tests
- alternate creature mixes
- special reward structures

### Event-boundary rule
Event encounters should not quietly redefine the baseline expectations of the normal game.

### Event-clarity rule
If an event uses special rules or unusual spell intensity, the player should know that this is a special mode or special encounter.

---

## 20. Encounter Fairness Guardrails

Every authored encounter should pass a fairness review.

### Core fairness checklist
Before an encounter is treated as acceptable, it should satisfy:

- the creature has a clear identity
- the weakness/resistance pairing feels understandable
- the countdown is visible and reasonable
- the spell is readable
- the spell is mostly nuisance-level unless the encounter is intentionally boss/event content
- the board remains interpretable after the spell
- the encounter does not feel solved only by obscure words
- the encounter does not become hostile if the player misses one ideal move
- dead-board recovery still protects trust if needed

### Pressure-balance rule
An encounter should not combine too many high-pressure levers at once unless it is intentionally authored as boss/event content.

Examples of dangerous combinations:

- very high HP
- very low move budget
- very fast countdown
- strong chained disruption
- high weakness dependence

Using too many of these at once creates unfairness faster than challenge.

---

## 21. Sample Authoring Archetypes

These are example creature-authoring patterns, not locked content commitments.

### Cinder Cub
- weakness: Tide
- resistance: Flame
- spell identity: soot
- pressure style: soft damage reduction nuisance
- tier fit: Gentle / Standard

### Brookling Otter
- weakness: Storm
- resistance: Tide
- spell identity: row shift
- pressure style: board reordering nuisance
- tier fit: Gentle / Standard

### Briar Bunny
- weakness: Flame
- resistance: Bloom
- spell identity: freeze/tangle
- pressure style: temporarily blocked options
- tier fit: Standard

### Mossback Mole
- weakness: Flame
- resistance: Bloom
- spell identity: row shift plus light state pressure
- pressure style: moderate board disruption
- tier fit: Challenging

### Prism Dragonlet
- encounter type: Boss
- weakness/resistance shift: allowed only as a clear phase change
- spell identity: stronger board distortion
- pressure style: more deliberate adaptation
- tier fit: Boss

These examples show the intended scale of variation: understandable creature personalities, not giant bespoke minigames.

---

## 22. Data Authoring Requirements

Creature and encounter data must be structured, reviewable, and stable.

### A creature definition should include at least:
- stable creature identifier
- display name
- encounter type
- internal difficulty tier
- HP value
- weakness
- resistance
- base countdown
- spell identity
- spell primitives
- any special documented exception flags

### An encounter definition should include at least:
- stable encounter identifier
- referenced creature identifier
- move budget
- any authored board constraints or modifiers
- reward category if relevant
- optional boss/event flags
- optional special-phase flags

### No hidden-rule rule
If a creature or encounter depends on a special rule, that rule must be explicit in authored content or focused docs.  
It should not live only in scattered code behavior.

---

## 23. Out of Scope for v1

The following are out of scope for current creature/encounter rules unless intentionally documented later:

- ordinary creatures with multiple frequent phase shifts
- regular mid-fight weakness/resistance swapping
- large multi-enemy encounters on one board
- deep RPG stat stacks per creature
- complex status-effect trees
- direct move destruction as a routine creature mechanic
- hidden AI-style targeting meant to counter the player perfectly
- event-style chaos as the normal baseline experience

---

## 24. Summary Rule

Words 'n Wands! creatures should be designed as readable puzzle opponents.

They should:

- have one clear identity
- show their HP, weakness, resistance, and countdown clearly
- shape the board in understandable ways
- create mostly nuisance-level pressure in ordinary encounters
- escalate more strongly only in boss or event content
- stay fair, themed, and family-friendly
- support challenge through smart play rather than cruelty

If a creature or encounter idea makes the game less readable, less fair, less warm, or less trustworthy, it should not be treated as an improvement.
