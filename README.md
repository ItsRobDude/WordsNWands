# Words 'n Wands! — Android-First Magical Word Battle Game

Words 'n Wands! is an Android-first, portrait-first magical word battle game built around **swiping real words from a falling letter board to cast spells against playful creatures**.

For expanded product philosophy, non-negotiable boundaries, and game identity goals, please read [`docs/game-identity-and-pillars.md`](docs/game-identity-and-pillars.md).

---

## Current Readiness Snapshot

- **Docs-first phase status:** Active. The repository is intentionally in a docs-first, pre-vertical-slice planning phase.
- **Runnable workspace/scripts present?:** Not yet. Do not assume runnable app/workspace scripts exist in this repo today.
- **Authoritative validation command contract:** `docs/engineering-standards.md` section **5.1 Operational Validation Commands (Contributor Contract)**.
- **If commands are not yet scaffolded:** Do docs-consistency checks and link validation only, and avoid inventing extra setup.

---

## Start Here in 60 Seconds

If you are contributing to Words 'n Wands!, use this quick path:

1. Read `AGENTS.md` for execution rules, scope discipline, and doc routing.
2. Read `docs/engineering-standards.md` for implementation expectations and validation rules.
3. Read only the focused `docs/*` files for the area you are touching.
4. Follow the milestone/build-order guidance before widening scope.

---

## Project Goal & Core Loop

Words 'n Wands! should become a high-quality mobile word game with a clear identity:
- **Magical creature battles** powered by real words.
- A satisfying **falling-letter board**.
- **Elemental strategy** based on word meaning.
- Short, repeatable sessions that feel good on a phone.

### The Battle Loop
A creature appears in the top half of the screen. A letter board appears in the bottom half.
The player swipes through adjacent letters to form valid words. When a word is cast:
- Those letters burst into magic and disappear.
- The remaining letters slide downward, and new letters fall in.
- The creature takes damage based on word length and elemental meaning.
- The creature counts down and casts disruptive spells on the board.

---

## Current Source-of-Truth Docs

Use this canonical precedence order when documents or code appear to disagree:

1. Focused docs for the touched area (e.g., `docs/game-rules.md`, `docs/technical-architecture.md`).
2. Implementation contracts and engineering standards.
3. `AGENTS.md` execution rules.
4. `README.md` and `docs/game-identity-and-pillars.md`.
5. Code.

Words 'n Wands! should not depend on contributors guessing the rules from scattered code.

---

## Core Non-Negotiables

These rules are strict:
1. **Android-first, Portrait-first**: Built for one-handed play.
2. **Family-friendly**: Magical, warm, no grim/violent undertones.
3. **Board-first**: The puzzle loop is the game, not the meta-systems.
4. **Local-first/Solo**: No heavy online dependencies for core solo battles.
5. **No Runtime AI Semantics**: AI tools are used for building, but the *runtime game logic* must be fully deterministic and explicitly coded.

---

## Current Build Strategy (Summary)

Words 'n Wands! should be built in controlled phases. The **battle loop is the product**. Everything else should support that.

1. **Milestone 0 — Foundation**: Repo, docs, Android app shell, typed architectures.
2. **Milestone 1 — Core Vertical Slice**: One playable encounter, basic word casting, collapse/refill, save/resume.
3. **Milestone 2 — Small Roster + Basic Progression**: Difficulty ramp, stars, stable loop.
4. **Milestone 3+ — Expansion**: Challenges, balancing, operations.

*Postpone until later: Multiplayer, complex RPG stats, heavy monetization, heavy live-ops.*
