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
If README conflicts with focused docs, focused docs win.

---

## Current readiness snapshot

- **Docs-first phase status:** Active. The repository is intentionally in a docs-first, pre-vertical-slice planning phase.
- **Runnable workspace/scripts present?:** Not yet. Do not assume runnable app/workspace scripts exist in this repo today.
- **Authoritative validation command contract:** `docs/engineering-standards.md` section **5.1 Operational Validation Commands (Contributor Contract)**.
- **If commands are not yet scaffolded:** Do docs-consistency checks and link validation only (when those checks are available), and avoid inventing extra setup or replacement command flows.

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
Creature encounters are the core loop; canonical encounter structure, board rules, move-budget rules, and win/loss conditions live in `docs/game-rules.md` (§3, §4, §5, §8, §11, §15). ([Direct link](docs/game-rules.md#3-core-product-shape))

### 2. Word Magic System
Word casting, normalization, element tagging, Arcane fallback, and damage interplay are defined in `docs/word-validation-and-element-rules.md` (§5, §11, §12, §15) plus `docs/game-rules.md` (§9, §10). ([Direct link](docs/word-validation-and-element-rules.md#11-element-assignment-philosophy))

### 3. Creature Mischief System
Creature countdowns, weakness/resistance behavior, and spell/tile-state constraints are canonical in `docs/creature-and-encounter-rules.md` (§5, §10, §11, §13, §20) and `docs/game-rules.md` (§11, §12). ([Direct link](docs/creature-and-encounter-rules.md#5-standard-creature-rules))

### 4. Light Progression and Replayability
Progression, stars, challenge rewards, and anti-treadmill economy boundaries are canonical in `docs/progression-economy-and-monetization.md` (§3, §4, §6, §8, §11, §16). ([Direct link](docs/progression-economy-and-monetization.md#3-progression-principles))

### 5. Daily / Weekly Challenge Layer Later
Daily/weekly challenge scope, optionality, and placement timing are owned by `docs/progression-economy-and-monetization.md` (§11) and `docs/content-pipeline-and-liveops.md` (challenge scheduling/operations). ([Direct link](docs/progression-economy-and-monetization.md#11-daily-and-weekly-flavor-reward-rules))

### 6. Async Competitive Mode Later
Async competition scope and guardrails are canonical in `docs/async-competition-rules.md`, and milestone timing lives in `docs/milestone-implementation-plan.md` (§11). ([Direct link](docs/milestone-implementation-plan.md#11-milestone-5--async-competition-later))

---

## Current MVP Rules Direction

The current MVP battle direction is intentionally tight.

### Core battle structure
MVP encounter structure (single-creature board battle with move-budget objective) is canonical in `docs/game-rules.md` (§4, §8, §15). ([Direct link](docs/game-rules.md#4-standard-encounter-rules))

### Current rule direction
Turn resolution, valid/invalid/repeat handling, countdown timing, spell reset, and battle-end rules are canonical in `docs/game-rules.md` (§6, §7, §8, §11, §15) and `docs/screens-and-session-flow.md` (§11–§13). ([Direct link](docs/game-rules.md#7-turn-flow-rules))

### Failure-state direction
Failure pressure style (move/board/decision pressure over health-loss punishment) is canonical in `docs/game-rules.md` (§3, §4, §15, §20). ([Direct link](docs/game-rules.md#3-core-product-shape))

### Tone direction
Creature/player emotional framing and family-friendly battle tone are canonical in `docs/game-rules.md` (§20) and `docs/audio-visual-style-guide.md` (presentation tone). ([Direct link](docs/game-rules.md#20-family-friendly-tone-rules))

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

- Gameplay
  - `docs/game-rules.md`
  - `docs/word-validation-and-element-rules.md`
  - `docs/creature-and-encounter-rules.md`
  - `docs/hint-and-clue-mechanics.md`
  - `docs/challenge-and-boss-layer.md`
  - `docs/async-competition-rules.md`
  - `docs/progression-economy-and-monetization.md`
  - `docs/content-pipeline-and-liveops.md`
- UX
  - `docs/screens-and-session-flow.md`
  - `docs/audio-visual-style-guide.md`
  - `docs/accessibility-localization-and-device-support.md`
- Architecture
  - `docs/technical-architecture.md`
  - `docs/implementation-contracts.md`
- Operations
  - `docs/engineering-standards.md`
  - `docs/analytics-and-experimentation.md`
  - `docs/milestone-implementation-plan.md`

Words 'n Wands! should not depend on contributors guessing the rules from scattered code.

---

## Current Build Strategy

Milestone sequencing and exact phase scope are canonical in `docs/milestone-implementation-plan.md` (§6–§13), while architecture-by-phase rules are canonical in `docs/technical-architecture.md` (§6, §24). ([Direct link](docs/milestone-implementation-plan.md#6-milestone-0--project-foundation))

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
Platform/surface boundaries and board-first interaction constraints are canonical in `docs/game-rules.md` (§3), `docs/screens-and-session-flow.md` (§9), and `docs/technical-architecture.md` (§2, §20). ([Direct link](docs/screens-and-session-flow.md#9-battle-screen-layout-rules))

### Fairness and trust boundaries
Fairness, validation consistency, readable combat outcomes, and anti-cheating trust constraints are canonical in `docs/word-validation-and-element-rules.md` (§4, §17), `docs/game-rules.md` (§13, §15), and `docs/creature-and-encounter-rules.md` (§20). ([Direct link](docs/game-rules.md#13-board-fairness-and-safety-rules))

### Tone boundaries
Family-friendly and non-cruel tone boundaries are canonical in `docs/game-rules.md` (§20), `docs/word-validation-and-element-rules.md` (§9), and `docs/audio-visual-style-guide.md`. ([Direct link](docs/game-rules.md#20-family-friendly-tone-rules))

### Complexity boundaries
Complexity limits (no treadmill/stat-soup/obscure validation/early live-service drift/runtime AI for battle semantics) are canonical in `docs/game-rules.md` (§22), `docs/word-validation-and-element-rules.md` (§1, §21), and `docs/technical-architecture.md` (§11.4, §25). ([Direct link](docs/technical-architecture.md#25-what-this-architecture-deliberately-avoids-early))

### Monetization boundaries
Monetization guardrails (no active-battle interruption, no pay-to-win, no fairness-for-sale mechanics) are canonical in `docs/progression-economy-and-monetization.md` (§8, §15, §16, §17). ([Direct link](docs/progression-economy-and-monetization.md#8-core-economy-boundaries))

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
