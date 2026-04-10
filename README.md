# WordsNWands

# Words 'n Wands! — Android-First Magical Word Battle Game

Words 'n Wands! is an Android-first, portrait-first magical word battle game built around **swiping real words from a falling letter board to cast spells against playful creatures**.

The goal is **not** to ship another disposable word game with cute art pasted onto a generic combat loop.

The goal is to build a word game that feels:

- magical
- fair
- readable
- satisfying in short sessions
- strategic without becoming stressful
- family-friendly without becoming shallow
- strong enough to become part of a player’s routine

Words 'n Wands! should give players a reason to open the app, solve something clever, feel capable, enjoy the moment-to-moment board flow, and want to come back later.

This README is the current top-level source of truth for Words 'n Wands! product direction.

Focused documents under `docs/` exist to refine this overview with more exact gameplay, screen, balance, and engineering rules.  
When a more specific document goes deeper than this README, the more specific document should win.

---

## Start here in 60 seconds

If you are contributing to Words 'n Wands!, use this quick path:

1. Read `AGENTS.md` for execution rules, scope discipline, and doc routing.
2. Read `docs/engineering-standards.md` for implementation expectations and validation rules.
3. Read only the focused `docs/*` files for the area you are touching.
4. Follow the milestone/build-order guidance before widening scope.

Current repo phase note:  
_Last reviewed: 2026-04-10_

Words 'n Wands! is currently in a **docs-first, pre-vertical-slice planning phase**.

The immediate priority is to:

- lock the product truth
- lock the gameplay rules
- lock the screen and session behavior
- lock the build order
- keep the future codebase aligned for human and AI contributors

The repo is not yet at the stage where breadth matters more than clarity.  
The next value comes from disciplined implementation, not feature sprawl.

---

## Project Goal

Words 'n Wands! should become a **high-quality mobile word game** with a clear identity:

- magical creature battles powered by real words
- a satisfying falling-letter board
- meaningful elemental strategy based on word meaning
- playful creature abilities that change the board
- short, repeatable sessions that feel good on a phone
- a warm, family-friendly tone
- a build shape that is practical to implement and maintain

The project starts **Android first**, with the game, codebase, content model, and rules designed carefully enough that expansion later is possible without rewriting the foundation.

The correct strategy is:

1. define the game clearly
2. define the battle rules and failure states
3. define screen behavior and session flow
4. define the data contracts and architecture
5. build one focused vertical slice
6. prove the game is actually fun
7. expand carefully

Words 'n Wands! should prefer **clarity, fairness, readability, and maintainability** over novelty for novelty’s sake.

---

## Words 'n Wands! in One Minute

Words 'n Wands! is a **portrait-mode magical word battle game**.

A creature appears in the top half of the screen.  
A letter board appears in the bottom half.

The player swipes through adjacent letters to form valid words. When a word is cast:

- those letters burst into magic
- they disappear from the board
- the remaining letters slide downward
- new letters fall in from above
- the creature takes damage

Longer words hit harder.

Some words also carry **elemental meaning**:

- `burn` can deal Flame damage
- `ocean` can deal Tide damage
- `vine` can deal Bloom damage
- `storm` can deal Storm damage
- `stone` can deal Stone damage
- `glow` can deal Light damage

Each creature has visible **weaknesses**, **resistances**, and a **cast countdown**.

If the player lets that countdown expire, the creature casts a playful board spell that changes the puzzle state. The creature does not “hurt” the player directly in the current core direction; instead, the player must defeat the creature before running out of moves.

The battle loop should make the player think:

- Do I cast the longest word?
- Do I cast the right element?
- Do I stall the creature’s spell?
- Do I use this word now, or set up a better board?

Words 'n Wands! should feel like:

- making words into magic
- solving a lively puzzle
- outsmarting a mischievous creature
- enjoying a satisfying cascade
- winning through smart choices instead of panic

It should **not** feel like:

- a noisy casino
- a grim monster-slayer
- a generic RPG grind
- a clone that depends only on raw word length
- a stressful arcade timer game
- a feature pile hiding a weak core loop

---

## Current Product Shape

Words 'n Wands! is built around a small set of tightly related layers.

### 1. Creature Encounters
This is the heart of the product.

In the current MVP rules direction:

- the game is portrait-only
- each battle uses one creature
- the board is a **6x6 letter grid**
- players form words by swiping through adjacent letters
- adjacency includes horizontal, vertical, and diagonal
- tiles cannot be reused within one word
- words must be at least **3 letters**
- used letters disappear and the board refills
- battles are controlled by a **fixed move budget**, not player hearts/lives
- the creature has a visible cast countdown and visible weakness/resistance information

### 2. Word Magic System
Words are not just score.

Words 'n Wands! should be built around the idea that **word meaning matters**.

Current direction:

- longer words deal more base damage
- some words carry elemental meaning
- creatures react differently to different elements
- a weakness hit should feel meaningfully better than a neutral hit
- a resistant hit should still work, but less effectively
- words with no assigned element still function as valid neutral magic

The current element set is:

- Flame
- Tide
- Bloom
- Storm
- Stone
- Light
- Arcane (neutral fallback)

### 3. Creature Mischief System
Creatures are not passive targets.

Each creature should have a simple, readable board identity:

- a visible cast countdown
- one weakness
- one resistance
- one signature board spell or mischief effect

Creature spells should create interesting decisions, not chaos for its own sake.

Examples of the intended style:

- freezing a few tiles temporarily
- adding soot that weakens damage
- shifting a row or column
- bubbling a tile upward
- dulling a tile so it loses element value

The creature system should deepen the puzzle without turning the board into unreadable noise.

### 4. Light Progression and Replayability
Progression should support the battle loop, not bury it.

Likely progression layers later may include:

- creature unlocks
- new habitats/chapters/worlds
- star ratings
- creature journals or codex entries
- curated daily or weekly challenges
- gentle cosmetic rewards

The current product direction does **not** support turning the game into a loot treadmill.

### 5. Daily / Weekly Challenge Layer Later
A daily or weekly ritual may become an important retention layer later.

However, the core identity of Words 'n Wands! is **the battle loop itself**, not an artificial calendar wrapper.

That means:

- one strong encounter matters more than a weak daily system
- challenge cadence should support the game, not define it too early
- daily/weekly systems should be added only after the core battle loop is genuinely fun

### 6. Async Competitive Mode Later
An asynchronous competitive mode may fit later, but it is not the current product identity.

The most promising future direction is **asynchronous mirror competition**, where players face equivalent seeded boards and compare outcomes fairly.

Real-time multiplayer is not a core requirement and should not shape early architecture at the expense of the solo battle loop.

---

## Current MVP Rules Direction

The current MVP battle direction is intentionally tight.

### Core battle structure
- one creature per encounter
- one board
- one move budget
- one clearly readable objective: defeat the creature before moves run out

### Current rule direction
- valid words consume 1 move
- invalid words do not consume a move
- repeated words are rejected within the same battle
- the creature’s cast countdown ticks down on successful turns
- weakness hits can stall or disrupt the creature’s countdown
- when the countdown reaches 0, the creature casts its board spell and the timer resets
- the battle ends when the creature is defeated or the player runs out of moves

### Failure-state direction
Words 'n Wands! currently prefers:

- **move pressure**
- **board pressure**
- **decision pressure**

over:

- health loss
- harsh punishment
- panic-heavy stress

This is a deliberate tone choice.

Words 'n Wands! should feel tense in a puzzle sense, not mean in a combat sense.

### Tone direction
Creatures should feel like:

- magical
- playful
- mischievous
- charming
- expressive

The player is not “slaughtering monsters.”

The fantasy is closer to:

- calming wild magic
- breaking mischief spells
- restoring order
- outsmarting a magical creature in a friendly fantasy world

That emotional framing matters.

---

## Design Pillars

### 1. Magical clarity
The player should understand what they are doing quickly.

The first battle should communicate the core fantasy fast:

- words are spells
- creatures react to those spells
- the board changes after every cast
- the player is making meaningful choices

### 2. Word meaning matters
Words 'n Wands! should not be “longest word wins” and little else.

The key hook is that vocabulary meaning changes battle value.

The strategic question should often be:

- longest word
- or best word for this creature and this board state

That distinction is central to the game’s identity.

### 3. Low-stress strategy
Words 'n Wands! should be strategic without becoming punishing.

The game should avoid:

- harsh fail loops
- noisy interruption
- clutter-heavy UI
- overbuilt RPG stat soup
- pressure that turns a cozy magical game into a chore

The challenge should come from smart decisions, not from the game bullying the player.

### 4. Family-friendly warmth
The presentation should be welcoming to kids, teens, and adults.

That means:

- bright, readable visuals
- expressive creatures
- magical rather than violent framing
- friendly animation language
- sound and haptics that feel satisfying, not aggressive

Words 'n Wands! should be able to feel whimsical without feeling babyish.

### 5. Board-first depth
The board is the real game.

Everything should reinforce the feeling that:

- the player is reading the board
- planning the next cast
- shaping future letters
- adapting to creature mischief
- getting a little better every battle

The board should remain the primary focus, not be buried under meta systems.

### 6. Maintainable depth
Words 'n Wands! should be designed so more creatures, more content, and more modes can be added later without breaking the core.

That requires:

- explicit rules
- centralized gameplay truth
- typed data structures
- restrained scope
- boring engineering choices where possible

---

## What Words 'n Wands! Is Not

Words 'n Wands! should not become:

- a generic word-search game
- a dark fantasy game with softer art pasted on top
- a raw damage-race where only word length matters
- a loot-and-gear treadmill
- a noisy live-service gimmick machine
- a real-time multiplayer-first product
- a battle-pass game disguised as a word game
- a chaos-heavy board effect simulator
- a runtime AI guessing machine for word meanings
- a content treadmill that depends on quantity more than quality

It is fine for Words 'n Wands! to grow later.

It is not fine for Words 'n Wands! to lose its identity early.

---

## Why This Game Should Feel Distinct

Words 'n Wands! exists in a broad family of word-battle and word-board games, so comparisons are inevitable.

The correct goal is not “be totally unlike anything ever made.”  
The correct goal is to have a **clear enough identity that the experience feels meaningfully its own**.

That identity comes from the combination of:

- a falling board instead of a static solve state
- elemental meaning-based damage
- creature-specific mischief spells
- readable countdown tension
- family-friendly magical presentation
- short, satisfying battle sessions
- puzzle pressure rather than harsh combat punishment

If Words 'n Wands! protects those strengths, it should feel like its own product rather than a thin reskin of someone else’s combat loop.

---

## Current Source-of-Truth Docs

Use this canonical precedence order when documents or code appear to disagree:

1. focused docs for the touched area
2. implementation contracts and engineering standards
3. AGENTS execution rules
4. code

Canonical ownership:

- `README.md` is for product direction and high-level onboarding
- `AGENTS.md` is for contributor execution behavior, validation expectations, and reporting rules
- focused `docs/*` files own domain-level details for their area
- `docs/implementation-contracts.md` owns stable TypeScript-facing contracts
- `docs/milestone-implementation-plan.md` owns build order and phased scope

Current focused-doc direction for this repo:

- `docs/game-rules.md`
- `docs/word-validation-and-element-rules.md`
- `docs/creature-and-encounter-rules.md`
- `docs/screens-and-session-flow.md`
- `docs/technical-architecture.md`
- `docs/engineering-standards.md`
- `docs/implementation-contracts.md`
- `docs/milestone-implementation-plan.md`

Words 'n Wands! should not depend on contributors guessing the rules from scattered code.

---

## Current Build Strategy

Words 'n Wands! should be built in controlled phases.

The practical order is:

1. repo and docs foundation
2. one fully playable offline encounter vertical slice
3. a small creature roster and basic progression
4. challenge cadence and content expansion
5. content pipeline and balancing tools
6. async competition later if the core supports it
7. monetization and expansion only after the game is genuinely fun

The **battle loop is the product**.  
Everything else should support that.

### Milestone shape direction

#### Milestone 0 — Foundation
- repo structure
- doc structure
- pnpm-only command expectations
- Android-first app shell
- battle architecture direction
- typed data structure direction
- boring implementation standards

#### Milestone 1 — Core Vertical Slice
- one playable creature encounter
- one battle screen
- one result screen
- valid word casting
- board collapse and refill
- damage calculation
- creature countdown and one board spell
- basic save/resume
- restrained first-pass feedback

#### Milestone 2 — Small Roster + Basic Progression
- several creatures
- difficulty ramp
- star ratings
- creature variety
- a stable feeling of “one more battle”

#### Milestone 3 — Challenge Structure
- daily/weekly challenge evaluation
- curated encounter sets
- stronger return reasons
- content pacing that still protects the core loop

#### Milestone 4 — Content Operations and Balance Hardening
- balancing tools
- content schema hardening
- validation tools
- clearer encounter data pipelines

#### Milestone 5 — Async Competition Later
- only if the solo battle loop is already strong
- only if fairness and clarity can be preserved
- async mirror-style direction preferred over real-time dependency

#### Milestone 6 — Monetization and Content Expansion
- only if it supports the emotional contract
- only if it does not deform the game into pressure or clutter

---

## What to Postpone Until Later

The following should be delayed until the core encounter loop is strong:

- live real-time multiplayer
- chat-heavy social systems
- gear and equipment systems
- multiple power-up types
- sprawling status-effect webs
- multiple currencies
- battle pass layers
- heavy story scenes between ordinary encounters
- cloud dependency for core solo play
- broad platform expansion
- user-generated canonical live content
- monetization that interrupts active play
- anything that makes the first battle harder to understand

Words 'n Wands! should first become:

1. understandable
2. fun
3. fair
4. readable
5. satisfying
6. broader later

That order matters.

---

## Current Product Boundaries

Some boundaries should remain stable unless the docs are intentionally updated.

### Product-shape boundaries
- Words 'n Wands! is Android-first
- Words 'n Wands! is portrait-first
- one-handed usability matters
- the player should understand the repeated loop quickly
- the board should remain the primary play surface
- creatures should add personality and strategy, not noise

### Fairness and trust boundaries
- word validation must be consistent
- element assignment must be consistent
- creature rules must be visible and explainable
- damage should feel understandable
- board state changes should be readable
- the player should be able to understand why they won or lost
- the game must not feel like it cheated

### Tone boundaries
- the game should remain family-friendly
- the game should avoid dark or grim identity drift
- creature interaction should feel magical, not cruel
- challenge should not require the game to become mean

### Complexity boundaries
- no loot treadmill
- no deep RPG stat soup
- no fake difficulty through obscure validation
- no live-service clutter before the core loop is proven
- no AI-runtime magic that makes rules feel inconsistent

### Monetization boundaries
- no interruption during active solving
- no pay-to-win battle outcomes
- no deforming the puzzle loop to force spending
- no making the player pay for fairness, dignity, or clarity

---

## Immediate Planning Priority

Before deep implementation continues, Words 'n Wands! should prioritize:

1. keeping the gameplay docs aligned when a rule changes
2. implementing according to the milestone plan rather than inventing side systems early
3. protecting fairness in word validation, elemental logic, and board behavior
4. proving that one offline battle is genuinely fun on a real Android phone
5. continuing to add new docs only when they reduce guessing instead of fragmenting the source of truth

The repo should move from “strong concept” to “clear buildable product.”

The next value comes from disciplined implementation, not from widening the idea faster than the rules can support it.

---

## Success Criteria

Words 'n Wands! should be considered successful only if it becomes genuinely pleasant to play and worth returning to.

Important success criteria:

- the first battle is understandable within the first minute
- the player gets a satisfying early win
- word validation feels fair
- elemental logic feels readable and trustworthy
- the creature countdown adds tension without harshness
- board collapse and refill feel satisfying
- the player regularly faces meaningful choices between long words and smart words
- creature abilities create variety without clutter
- the game feels magical, warm, and family-friendly
- save/resume behavior feels solid
- the product can grow without losing its identity

A version of Words 'n Wands! that is technically functional but confusing, unfair, noisy, stressful, or forgettable should not be treated as good enough.

---

## Summary

Words 'n Wands! should be built as an **Android-first magical word battle game** centered on:

- swiping real words from a falling letter board
- turning those words into spells
- making word meaning matter through elemental strategy
- battling expressive creatures with readable board abilities
- short, satisfying encounter sessions
- a warm family-friendly tone
- careful long-term maintainability

The right strategy is:

- lock product truth first
- protect fairness and clarity
- keep gameplay rules explicit
- build one focused vertical slice
- prove the battle loop is fun
- grow carefully from there

If Words 'n Wands! follows that path, it has a real chance to become a distinctive, joyful word game instead of just another familiar mechanic with a better name.
