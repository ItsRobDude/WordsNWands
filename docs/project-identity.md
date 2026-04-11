# Project Identity — Vision & Philosophy

Words 'n Wands! aims to be more than a disposable word game with themed art layered on top of a generic combat loop.

The intended player feeling is:

- magical
- fair
- readable
- satisfying in short sessions
- strategic without becoming stressful
- family-friendly without becoming shallow
- strong enough to become part of a player’s routine

Words 'n Wands! should give players a reason to open the app, solve something clever, feel capable, enjoy the moment-to-moment board flow, and want to come back later.

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
