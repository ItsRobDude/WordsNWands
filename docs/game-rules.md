# Words 'n Wands! Game Rules

This document defines the plain-English gameplay rules for Words 'n Wands!.

Its purpose is to describe how Words 'n Wands! should behave for players before technical implementation details, UI mechanics, storage details, content-pipeline behavior, or backend behavior are discussed elsewhere.

This is the product-level source of truth for gameplay behavior.

If future code, mockups, prototypes, or implementation shortcuts disagree with this document, this document should be treated as the gameplay rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should be a magical word battle game built around:

- clarity
- fairness
- short but meaningful sessions
- strategic choice without harsh stress
- a warm family-friendly tone
- satisfying board interaction
- light progression that supports the battle loop rather than burying it

Words 'n Wands! should make the player feel like they are:

- turning words into spells
- reading a board and spotting opportunities
- outsmarting a mischievous magical creature
- choosing between bigger words and smarter words
- making progress through skill rather than panic

Words 'n Wands! should not feel like:

- a noisy level grinder
- a pay-to-win battle game
- a dark fantasy combat RPG with cute art pasted on top
- a clone whose only real rule is "longer word = more damage"
- a stressful timer-heavy arcade game
- a bloated progression machine that buries the board under systems

When rule decisions conflict, Words 'n Wands! should prefer:

1. fairness
2. readability
3. determinism
4. player trust
5. maintainable simplicity
6. family-friendly warmth

over novelty, spectacle, or monetization pressure.

---

## 2. Core Gameplay Terms

The following terms should be used consistently across Words 'n Wands!.

### Encounter
One complete battle against one creature.

### Battle Board
The grid of letters the player uses to form words during an encounter.

### Cast
A successful word submission that resolves as a spell.

### Move
One consumed successful player turn.

### Move Budget
The total number of successful casts allowed in an encounter before the player loses.

### Valid Word
A word that meets the current word-validation rules and can be cast successfully.

### Invalid Word
A word attempt that is rejected before cast resolution because it does not meet the current rules.

### Repeated Word
A word that was already cast earlier in the same encounter and is therefore rejected under repeat rules.

### Element
The magic type assigned to a valid word based on the game’s element-tag rules.

### Arcane
The neutral fallback type used when a valid word has no assigned non-neutral element.

### Creature
The magical opponent in an encounter.

### Weakness
The element that deals bonus damage to the current creature.

### Resistance
The element that deals reduced damage to the current creature.

### Cast Countdown
The visible number of successful player casts remaining before the creature performs its board spell.

### Creature Spell
The creature’s board-affecting action that occurs when its cast countdown reaches zero.

### Board State
The current playable state of the battle board, including letters, special markers, tile states, and any creature effects.

### Tile State
A temporary modifier placed on a tile, such as Frozen, Sooted, or Dull.

### Wand Tile
A letter tile with a small magical bonus marker that boosts the word using it.

### Boss Encounter
A special encounter with higher pressure, more durable creatures, or stronger board disruption than normal encounters.

### Event Encounter
A special encounter type used for limited, curated, or optional challenge content outside the ordinary encounter flow.

### Star Rating
The post-encounter performance rating based on how efficiently the player won.

---

## 3. Core Product Shape

Words 'n Wands! is currently built around the following core gameplay shape.

### Core encounter shape
An ordinary encounter consists of:

- one creature
- one battle board
- one move budget
- one visible weakness
- one visible resistance
- one visible cast countdown
- one readable battle goal: defeat the creature before moves run out

### Primary fantasy
The player uses real words as spells.

Those words do not only produce raw damage.  
Their meaning can determine how effective they are against the creature.

The intended core question is:

- Do I cast the biggest word?
- Or do I cast the smartest word for this creature and this board?

### Pressure style
Words 'n Wands! currently prefers:

- move pressure
- board pressure
- creature countdown pressure

over:

- health loss
- direct punishment
- panic-heavy reaction pressure

This is intentional.

The game should feel challenging in a puzzle sense, not threatening in a combat-stress sense.

---

## 4. Standard Encounter Rules

The **Standard Encounter** is the core ruleset for Words 'n Wands!.

Future encounter types may add variations later, but they should not silently redefine the Standard Encounter.

### Standard Encounter format
A Standard Encounter should have:

- one creature
- one **6x6** battle board
- one fixed move budget
- one visible creature HP value or HP bar
- one visible weakness
- one visible resistance
- one visible cast countdown
- one signature creature spell
- deterministic board and damage behavior

### Current standard board size
For the Standard Encounter:

- the board is **6 columns x 6 rows**
- total tiles: **36**

### Current standard move-budget direction
For the Standard Encounter:

- the player has a fixed number of successful moves
- only successful valid casts consume moves
- invalid words do not consume moves
- repeated words do not consume moves

### Standard encounter objective
The player wins by reducing the creature’s HP to zero before the move budget is exhausted.

The player loses when:

- the move budget reaches zero
- and the creature still has HP remaining

### No direct creature damage to player in core campaign
In the current core campaign direction:

- creature spells affect the board
- creature spells do **not** directly remove player hearts or lives
- the main consequence of creature pressure is reduced efficiency, harder board states, and increased risk of running out of moves

This rule is a deliberate tone and stress-level choice.

---

## 5. Board Rules

The battle board is one of the most important trust systems in Words 'n Wands!.

It must be readable, fair, and lively.

### Board composition
Each tile on the board contains:

- one letter
- zero or one special marker
- zero or one negative tile state

### Adjacency rules
A valid word path is formed by swiping through adjacent letters.

Adjacency includes:

- horizontal
- vertical
- diagonal

### Tile reuse rule
A tile may not be used more than once in the same word.

### Minimum word length
A valid cast must contain at least **3 letters**.

### Submission rule
A word is cast only when the player completes the swipe and the game validates the word.

### Board resolution rule
When a word is successfully cast:

1. the selected letters are consumed
2. the selected tiles disappear
3. tiles above fall downward into empty spaces
4. new letters enter from the top
5. the board returns to a full 6x6 state

This resolution order must remain consistent.

### Board readability rule
The player should always be able to understand:

- which letters were consumed
- where tiles fell
- where new tiles came from
- which tile states still exist
- whether a Wand tile is present

The board must not mutate in confusing ways that feel hidden or dishonest.

---

## 6. Word Submission Rules

### Standard word requirements
A word is valid only if it:

- uses a legal adjacent path
- is at least 3 letters long
- satisfies the documented validation policy
- has not already been cast earlier in the same encounter
- is not blocked by an explicitly documented tile-state rule

### Invalid word behavior
If a word is invalid:

- the game rejects it immediately
- the board does not change
- the creature takes no damage
- the player does not lose a move
- the creature countdown does not change
- the player receives a readable rejection signal

### Repeated word behavior
If a word was already cast earlier in the same encounter:

- it is rejected
- the board does not change
- the player does not lose a move
- the creature countdown does not change
- the player receives a clear repeated-word signal

### Editing and experimentation rule
The player should be free to explore the board visually without being punished for every failed attempt.

Words 'n Wands! should not discourage experimentation through harsh invalid-word penalties.

---

## 7. Turn Flow Rules

Every successful player turn follows this exact order.

### Standard cast resolution order
1. The player swipes a candidate word.
2. The game validates the word.
3. The game determines the word’s element.
4. The game checks whether the word includes a Wand tile.
5. The letters are consumed and disappear.
6. The board collapses downward.
7. New letters refill from the top.
8. Damage is calculated.
9. Damage is applied to the creature.
10. If the creature reaches zero HP, the encounter ends immediately in victory.
11. If the creature is still alive, its cast countdown is evaluated.
12. If the countdown reaches zero, the creature casts its spell and the countdown resets.
13. Control returns to the player.

This order must remain consistent.

### Victory-interrupt rule
If the creature is defeated by the player’s word:

- the encounter ends immediately
- the creature does not cast afterward
- the player should receive a satisfying victory moment

This supports fairness and a strong payoff.

---

## 8. Move Budget Rules

### Core move rule
Each successful valid cast consumes exactly **1 move**.

### Invalid word rule
Invalid words consume **0 moves**.

### Repeated word rule
Repeated words consume **0 moves**.

### Failed-board-state recovery rule
Automatic board recovery actions must follow the explicit Spark Shuffle pressure rule in this document.

### Current tuning direction
Normal encounters should feel:

- generous
- cozy
- readable

while still giving the player a reason to make smart choices.

Words 'n Wands! should not tune ordinary encounters so tightly that most players feel starved or constantly on the edge of failure.

At the same time, the game should not be so loose that elemental choice, board planning, and creature countdowns stop mattering.

### Encounter difficulty bands
Ordinary encounter pressure should come from combinations of:

- creature HP
- move budget
- countdown speed
- spell nuisance level
- board complexity
- weakness/resistance matchup

The game should prefer tuning across those combined levers rather than relying on one extremely punishing lever.

---

## 9. Damage Rules

Damage must be understandable and consistent.

### Base damage rule
Longer words deal more base damage.

Current v1 formula:

- `baseDamage = 8 + 3 × (wordLength - 3) + max(0, wordLength - 5)`

Reference values:

- 3 letters: `8`
- 4 letters: `11`
- 5 letters: `14`
- 6 letters: `18`
- 7 letters: `22`
- 8 letters: `26`
- 9 letters: `30`

### Strategic balance rule
The damage system should support real tension between:

- a long neutral word
- and a shorter weakness word

If long neutral words always dominate, the element system loses meaning.  
If weakness words always dominate regardless of size, word-building depth shrinks too much.

The right balance is that both lines of play should matter often.

### Element multiplier rule
The word’s element modifies its damage based on the creature’s current matchup.

Current standard direction:

- weakness hit: `1.5x`
- neutral hit: `1.0x`
- resistance hit: `0.7x`
- Arcane hit: `1.0x` unless a mode explicitly changes that rule

### Wand bonus rule
If a valid cast includes a Wand tile:

- the final damage receives a `1.25x` bonus
- the Wand tile is consumed like a normal tile
- the Wand tile should feel helpful, not mandatory

### Soot penalty rule
If a valid cast includes one or more Sooted tiles, apply one total soot penalty:

- `sootMultiplier = 0.75`
- multiple Sooted tiles in one cast do not stack extra penalties

### Final damage formula rule
For successful valid casts:

- `finalDamage = round(baseDamage × matchupMultiplier × wandMultiplier × sootMultiplier)`
- if no Wand tile is used, `wandMultiplier = 1.0`
- if no Sooted tile is used, `sootMultiplier = 1.0`
- rounding function is **round-half-up to nearest integer** for non-negative values (equivalent to `Math.round` behavior for gameplay damage)
- tie-break behavior: exact `.5` values round **up** to the next integer
- explicit tie example: if `baseDamage = 14`, `matchupMultiplier = 1.5`, `wandMultiplier = 1.0`, and `sootMultiplier = 0.75`, then raw damage is `15.75`; if multipliers produce `15.5`, `finalDamage` must resolve to `16`
- any successful valid cast that reaches damage resolution must deal at least `1` final damage

Implementation consistency note:

- all gameplay runtimes and automated tests must call the same rounding utility for `finalDamage`
- canonical shared helper for implementers: `packages/game-rules/src/damage/roundFinalDamage.ts` exporting `roundFinalDamage(rawDamage: number): number`

Wand bonuses should support exciting tactical moments without turning the board into a power-up circus.

### Readability rule
The player should be able to understand:

- the word they cast
- its element
- whether it hit a weakness or resistance
- whether a Wand tile boosted it
- roughly why the damage landed as it did

Damage should not feel arbitrary.

---

## 10. Element Rules

The current standard element set is:

- Flame
- Tide
- Bloom
- Storm
- Stone
- Light
- Arcane

### Element assignment rule
A valid word may be assigned one non-neutral element based on the documented tag rules.

If the word does not have a non-neutral element assignment, it is treated as **Arcane**.

### Single-element rule
For v1:

- a word may have at most one assigned non-neutral element
- multi-element behavior is out of scope unless explicitly documented later

### Arcane rule
Arcane is the neutral fallback.

Arcane words:

- are still fully valid
- still deal damage
- do not count as "elementless failure"
- provide a stable fallback when the player cannot find a desirable weakness word

### Element readability rule
The element system must feel like a clever layer, not a guessing game.

The player should be able to learn and trust it over time.

---

## 11. Creature Rules

Creatures are not passive targets.

They are puzzle-shaping opponents.

### Standard creature information
A Standard Encounter creature should expose:

- its visual identity
- current HP
- weakness
- resistance
- cast countdown
- some readable sense of its spell identity

### Creature spell purpose
Creature spells exist to:

- create board variation
- create tactical pressure
- make creature identities feel distinct
- reward thoughtful play

Creature spells should **not** exist to create cheap losses.

### Countdown rule
The creature has a visible countdown showing how many successful player casts remain before it acts.

### Countdown tick rule
The countdown is evaluated after each successful player cast unless a more specific documented rule modifies it.

### Weakness-interaction direction
In the current direction, successful weakness play uses this exact stall rule:

- if a successful valid cast hits creature weakness, countdown does **not** decrement on that cast
- the countdown does not reset or gain extra time from stall alone
- if countdown is already `1`, it remains `1` for that cast
- on the next non-stalled successful cast, normal decrement behavior resumes

### Spell reset rule
After the creature casts its spell:

- the countdown resets to that creature’s base value

### Creature intensity rule
Creature spell intensity should vary by encounter type.

#### Standard encounters
Most creature spells should be:

- nuisances
- readable disruptions
- manageable with good play

#### Boss encounters
Bosses may use:

- stronger disruption
- tighter countdown pressure
- more complex sequencing
- more resilient creature stats

Boss encounters should feel special, not like the new baseline for the whole game.

#### Event encounters
Event encounters may use curated, unusual, or more intense spell behavior, provided those encounters are clearly positioned as special content and do not redefine the ordinary game experience.

---

## 12. Tile States and Board Effects

Tile states should remain few, readable, and meaningful.

### Standard tile-state rule
A tile may have at most one negative state at a time unless a future mode explicitly changes that rule.

### Current standard negative state family
The current design direction supports negative board effects such as:

#### Frozen
- the tile cannot be selected in the player’s next successful cast
- Frozen does not clear on invalid or repeated submissions
- after the next successful cast resolves, surviving Frozen tiles thaw automatically
- duration: 1 successful player turn

#### Sooted
- the tile is still usable
- if one or more Sooted tiles are used in a cast, apply one total `0.75x` final-damage multiplier
- multiple Sooted tiles in one cast do not stack penalties
- consumed Sooted tiles clear immediately
- surviving Sooted tiles tick down after each successful cast resolution
- duration: 2 successful player turns

#### Dull
- the tile is still usable
- if a cast uses one or more Dull tiles and the word's element is non-Arcane, treat matchup as Arcane/neutral for that cast
- base damage and Wand bonus do not change
- consumed Dull tiles clear immediately
- surviving Dull tiles tick down after each successful cast resolution
- duration: 2 successful player turns

#### Bubble
- the tile is still usable
- after the next successful cast refill step, each surviving Bubble tile rises to the top of its column
- other tiles in that column shift downward
- Bubble then clears
- duration: 1 successful player turn

### Row/column movement effects
Creatures may also use effects like:

- shifting a row
- rotating a row
- shifting a column
- rotating a column

These effects should remain readable and animated clearly enough that the player can follow what happened.

Current standard movement direction:

- shift/rotate effects move by exactly 1 position with wraparound
- tile states and Wand markers move with the tile
- creature row/column movement resolves before player control returns

### Board-noise rule
The game should avoid stacking so many simultaneous board effects that the player stops feeling in control.

If the board becomes unreadable, the game has failed its clarity goal.

---

## 13. Board Fairness and Safety Rules

Board fairness is one of the most important systems in the game.

Randomness should feel lively, not cruel.

### Fairness goal
Words 'n Wands! should feel:

- unpredictable enough to stay exciting
- fair enough that players trust the board
- generous enough that common play usually leads to possible progress
- structured enough that dead boards are treated as failures of the system, not failures of the player

### Generation philosophy
The board should not be generated as pure chaos.

Board generation and refill should be guided by a structure that favors:

- common playable letter combinations
- readable board variety
- plausible 3+ letter opportunities
- interesting future choices after collapses

The board should not feel obviously scripted, but it also should not feel like a hostile random mess.

### Start-of-encounter fairness rule
A new encounter should begin with a board that contains valid playable words.

The player should not open a battle into an unusable board.

Current v1 target:

- starting board should contain at least `8` valid castable words of length 3+

### Refill fairness rule
Standard refill behavior should strongly prefer producing continuing playability.

The game should reduce the chance of no-move states as much as practical.

Current v1 target:

- post-refill boards should usually provide at least `4` valid castable words of length 3+
- if post-refill yields fewer than `1` valid castable word, dead-board recovery triggers immediately

### Dead-board rule
A **dead board** is a board state with no valid playable words under the current rules.

If a dead board occurs, the game must recover it.

### Dead-board recovery rule
If the game detects no valid playable words:

- the board triggers an automatic recovery action
- the player should not be blamed for the system’s failure to supply a playable board

### Standard recovery direction
The default recovery action is a **Spark Shuffle**:

- the board reshuffles into a new playable state
- the game clearly communicates that the board was refreshed
- the recovery should feel like assistance, not punishment

### Spark Shuffle pressure rule (v1 global standard)
For **v1**, Spark Shuffle pressure behavior is a **global rule**, not configurable per encounter type:

- Spark Shuffle consumes **0 moves**
- Spark Shuffle changes creature countdown by **0** (no decrement, no reset)
- this rule applies to standard, boss, and event encounters in v1
- there is no per-encounter override for this behavior in v1 content contracts

Concrete example:

- before Spark Shuffle: `current_countdown = 2`, `moves_remaining = 9`
- after Spark Shuffle: `current_countdown = 2`, `moves_remaining = 9`

### Recovery pressure rule
Board recovery may still preserve some encounter tension, but it should not feel like a hidden slap to the player for something outside their control.

### Rare-failure principle
A dead board should be rare.

If it becomes common, the generation/refill system is not balanced correctly.

---

## 14. Wand Tile Rules

Words 'n Wands! currently supports one simple positive special tile type in the core game.

### Wand tile rule
A Wand tile is still a normal letter tile.

It differs only in that:

- it carries a magical bonus marker
- a word using it gets a modest final-damage bonus

### Wand design purpose
The Wand tile exists to:

- create occasional exciting tactical moments
- support the magical identity of the game
- add a little extra board reading value without cluttering the system

### Simplicity rule
The core game should not introduce many different power-up tile families early.

The Wand tile is intended as a focused enhancement, not the start of a collectible tile zoo.

### Spawn/readability rule
Wand tiles should appear predictably enough to feel fair and rare enough to remain interesting.

The player should be able to spot them quickly.

---

## 15. Win, Loss, and Rating Rules

### Win rule
The player wins an encounter when the creature’s HP reaches zero before the move budget is exhausted.

### Loss rule
The player loses an encounter when:

- the move budget reaches zero
- and the creature still has HP remaining

### Clear-end-state rule
The result screen should clearly communicate:

- win or loss
- remaining moves, if relevant
- star rating, if relevant
- any notable reward or progress gained

The player should not be confused about how the battle ended.

### Current star-rating direction
The encounter may award stars based on efficiency.

Current standard direction:

- 3 stars: win with `4+` moves remaining
- 2 stars: win with `2-3` moves remaining
- 1 star: win with `0-1` moves remaining
- 0 stars: loss

This gives players a gentle reason to replay without making failure feel cruel.

### No humiliation rule
Failure should feel like:

- "I can do better next time"
- not "the game just punished me"

The tone of result handling matters.

---

## 16. Onboarding and First-Time Player Rules

The first-time player experience should create confidence quickly.

### First battle rule
The first battle should aim to produce a fast, understandable early win.

### Tutorial battle constraints
The first battle should:

- use a friendly creature
- use gentle countdown pressure
- use readable letters and common words
- demonstrate the board collapse/refill loop clearly
- make at least one elemental interaction understandable
- avoid overwhelming the player with too many tile states or spell effects

### Teaching philosophy
Words 'n Wands! should teach by letting the player act.

Long tutorial text should be minimized.

### Confidence rule
The player’s first encounter should make them feel:

- smart
- safe to experiment
- curious about the next creature

not confused or punished.

---

## 17. Progression Rules

Progression should support the encounter loop rather than compete with it.

### Current progression direction
Words 'n Wands! currently favors a simple progression structure such as:

- encounter list
- chapter list
- simple world path
- lightweight area progression

over:

- heavy story campaign systems
- noisy adventure map clutter
- lore walls
- a fake epic campaign the game is not actually built to support

### Minimalist progression rule
If a map exists, it should be:

- readable
- lightweight
- low-friction
- not more interesting than the actual battles

### Progression reward rule
Progression should give the player reasons to continue, such as:

- new creatures
- new habitats or themes
- star goals
- codex/journal unlocks
- small cosmetic or collection rewards

The board battle remains the core value.

---

## 18. Daily and Weekly Flavor Rules

Daily and weekly systems are currently treated as **side flavors**, not the heart of the product.

### Optionality rule
Daily and weekly content should feel welcome, not mandatory.

The player should not feel that the whole game collapses into calendar homework.

### Reward rule
If daily or weekly challenge content exists, it may offer small rewards such as:

- bonus stars
- creature journal progress
- small cosmetic currency
- profile flair
- optional side-collection progress

These systems should support return play without becoming the only meaningful progression.

### Identity rule
Daily and weekly modes should not replace the core identity of Words 'n Wands!, which is still:

- magical word casting
- falling board strategy
- creature encounters

### Pressure rule
Missing a daily or weekly challenge should not make the ordinary player feel punished or left behind.

---

## 19. Boss and Event Rules

### Boss purpose
Bosses exist to create standout moments.

They should feel:

- more dramatic
- more memorable
- more demanding

than ordinary encounters.

### Boss pressure rule
Bosses may legitimately use:

- tighter move budgets
- stronger board disruption
- more resilient HP tuning
- more demanding element usage
- multi-step or more intense countdown pressure

Bosses should still obey the game’s fairness and readability principles.

### Event purpose
Events exist to offer:

- novelty
- curated challenge
- special rewards
- temporary mode twists

Event encounters should be clearly framed as special content.

They should not silently redefine the baseline expectations of the normal game.

---

## 20. Family-Friendly Tone Rules

Words 'n Wands! depends on a bright, magical tone.

### Creature framing rule
Creatures should be framed as:

- wild
- mischievous
- magical
- unruly
- playful
- occasionally dramatic

not as gore targets or horror monsters

### Battle framing rule
The player is not "murdering" creatures.

The magical framing should lean toward:

- calming
- dispelling
- restoring order
- breaking mischief magic
- winning a magical duel

### Presentation rule
The rules, effects, and tone should remain appropriate for a broad audience including:

- kids
- teens
- adults
- casual word-game players
- players who want warmth rather than darkness

---

## 21. Correction and Exception Rules

Because Words 'n Wands! depends on trust, broken or unfair gameplay behavior must be handled deliberately.

### Board or validation correction rule
If a creature, encounter, word-tag rule, or board-generation behavior is found to be broken or unfair:

- a correction may be made only as an intentional exception
- the correction should be documented internally
- the product should favor player trust over rigid purity

### Player-protection rule
Words 'n Wands! should not punish players for the product’s own mistake.

If a system flaw created clearly unfair outcomes:

- player-facing recovery should be considered
- earned progress should not be casually removed
- the game should avoid pretending the issue never existed if that would violate trust

---

## 22. Out of Scope for the Current Standard Rules

The following are not part of the current Standard Encounter unless later documented:

- real-time multiplayer
- chat-heavy social systems
- equipment or loot systems
- many different power-up tile families
- multiple currencies in the core battle loop
- runtime AI assigning battle-critical word elements
- dark story campaigns
- harsh stamina systems
- pay-to-win combat power
- heavy narrative scenes between ordinary encounters
- mandatory daily-play pressure
- hidden hard-mode rules inside normal encounters

These may be explored later only if they do not damage the core identity of Words 'n Wands!.

---

## 23. Summary Rule

Words 'n Wands! should default to:

- one fair magical creature encounter at a time
- one readable falling board
- one move budget
- real words as spells
- word meaning that matters
- creature spells that create variety without cruelty
- dead-board recovery that protects trust
- gentle but meaningful challenge
- family-friendly magical framing
- progression that supports the board instead of burying it
- optional daily/weekly side flavor rather than mandatory homework

If a future feature makes Words 'n Wands! less fair, less readable, less warm, less trustworthy, or less focused, that feature should not be treated as an improvement.
