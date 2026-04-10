# Words 'n Wands! — Game Identity & Pillars

This document expands on the core product philosophy, boundaries, and design identity for the game. For practical repo onboarding, start with `README.md`.

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
