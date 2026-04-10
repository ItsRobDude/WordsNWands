This file is the operating guide for AI contributors working in the Words 'n Wands! repository.

Words 'n Wands! is an Android-first magical word battle game built around swiping real words from a falling letter board to cast spells against playful creatures.

It is being built as a serious product, not as a loose prototype pile.

The game must remain:

- fair
- readable
- family-friendly
- strategically interesting
- satisfying in short sessions
- maintainable for human and AI contributors

This file is intentionally compact.  
Read this first, then read only the additional docs relevant to the task you are working on.

If a referenced doc does not exist yet, that does **not** grant permission to invent major new product behavior in code.  
Use `README.md`, this file, and the most conservative safe assumptions that fit Words 'n Wands!’ current direction.  
Document those assumptions clearly.

---

## Current readiness snapshot

- **Docs-first phase status:** Active. The repository is intentionally in a docs-first, pre-vertical-slice planning phase.
- **Runnable workspace/scripts present?:** Not yet. Do not assume runnable app/workspace scripts exist in this repo today.
- **Authoritative validation command contract:** `docs/engineering-standards.md` section **5.1 Operational Validation Commands (Contributor Contract)**.
- **If commands are not yet scaffolded:** Do docs-consistency checks and link validation only (when those checks are available), and avoid inventing extra setup or replacement command flows.

## 1. Words 'n Wands! in One Minute

Words 'n Wands! is:

- an Android-first, portrait-first magical word battle game
- centered on a **falling 6x6 letter board** and **one-creature encounters**
- built around the idea that **words are spells** and **word meaning matters**
- designed for short, satisfying sessions with low-stress strategic pressure
- family-friendly, bright, and playful rather than dark or grim
- respectful of the player’s thinking time
- intended to feel polished even before any premium expansion exists
- TypeScript-first and conservative in its technical choices
- documentation-first so humans and AI contributors stay aligned

Words 'n Wands! should feel like:

- shaping words into magic
- reading a lively board
- outsmarting a mischievous creature
- setting up clever spell choices
- winning through smart decisions rather than panic

Words 'n Wands! should **not** feel like:

- a noisy casino
- a dark monster-killer with cute art pasted on top
- a generic RPG grind
- a longest-word-only damage race
- a content treadmill hiding weak fundamentals
- a stress-heavy arcade game

---

## 2. Source of Truth and What to Read

### Source-of-truth order
When working in Words 'n Wands!, follow this explicit precedence order:

1. focused docs for the touched area
2. implementation contracts and engineering/process docs
3. `README.md` and this file
4. code

Important rules:

- the code should reflect the docs
- product behavior should not be silently reinvented inside the code
- if code and docs disagree, fix the disagreement deliberately
- do not assume current code is automatically the product truth
- if a focused doc goes deeper than `README.md`, the focused doc wins for that area

### Required conflict template when docs disagree
If two docs or sections conflict, contributors must include this short template in the PR description or final report:

- **Conflicting docs/sections:** `<doc path + section>` vs `<doc path + section>`
- **Chosen interpretation:** `<the interpretation followed in this change>`
- **Why this preserves fairness/trust:** `<short rationale>`
- **Follow-up doc updates needed:** `<specific docs/sections to reconcile>`

### Read only the docs you need
Do **not** read every doc by default.  
Use this routing guide to stay focused and avoid context bloat.

Baseline for all code tasks:

- `README.md`
- this file
- `docs/engineering-standards.md`

Validation execution contract:

- run the command contract defined in `docs/engineering-standards.md` section **"5.1 Operational Validation Commands (Contributor Contract)"** so local checks and CI stay aligned

| If the task involves... | Also read... |
| --- | --- |
| battle rules, move budget, win/loss rules, damage formula, turn flow, collapse/refill order, special tiles | `docs/game-rules.md`, `docs/word-validation-and-element-rules.md` |
| word acceptance, normalization, repeated-word policy, dictionary scope, element tagging, Arcane fallback | `docs/word-validation-and-element-rules.md` |
| creature HP, weaknesses/resistances, countdowns, spells, tile states, encounter balance | `docs/creature-and-encounter-rules.md`, `docs/game-rules.md` |
| screen layout, swipe interaction, onboarding, battle HUD, results, pause/resume, animation order | `docs/screens-and-session-flow.md`; add `docs/audio-visual-style-guide.md` and `docs/accessibility-localization-and-device-support.md` if visuals/motion/sound/haptics are involved |
| battle session save/restore, local persistence, content loading, runtime data ownership, architecture boundaries | `docs/technical-architecture.md`, `docs/implementation-contracts.md` |
| player-facing semantic text, exact UI copy, names, labels, tone rules | `docs/copy-locks-and-voice-guide.md` if it exists; otherwise use `README.md` and the most conservative tone assumptions |
| challenge schedules, daily/weekly structure, content release flow, encounter curation | `docs/content-pipeline-and-liveops.md`, `docs/milestone-implementation-plan.md` |
| hints, rewards, ads, purchases, cosmetics, boosters, retention systems | `docs/progression-economy-and-monetization.md` |
| sound, haptics, visual tone, icon style, typography, spacing, animation behavior | `docs/audio-visual-style-guide.md`, `docs/accessibility-localization-and-device-support.md` |
| analytics, telemetry, experiments, funnel measurement | `docs/analytics-and-experimentation.md` |
| deciding what should be built next | `docs/milestone-implementation-plan.md` |

If a task does not touch one of these areas, do not pull in extra docs.

---

## 3. Current Working Rule

Unless explicitly told otherwise:

- work on the **smallest safe slice** of the current milestone
- do not widen scope because a future feature seems related
- do not build future systems early just because they sound exciting
- do not sneak backend, social, monetization, or live-ops complexity into a small vertical-slice task
- do not let presentation polish outrun battle clarity and correctness

Words 'n Wands! should be built in controlled layers.

The basic order is:

1. product truth
2. battle fairness and board behavior
3. focused playable vertical slice
4. careful creature/content expansion
5. retention layers later
6. monetization and larger expansion only after the core loop is proven

---

## 4. Non-Negotiable Product Invariants

These rules should not drift unless the docs are intentionally updated.

### Core product shape
- The **battle loop** is the heart of Words 'n Wands!.
- The **board** is the main play surface and must remain the focus.
- Words are spells, and **word meaning must matter**.
- Words 'n Wands! is Android-first and portrait-first.
- One-handed usability matters.
- The product must remain understandable to ordinary players within the first minute.
- In the current core direction, the main campaign uses a **move budget**, not player hearts/lives.
- Creature countdown pressure should feel like puzzle tension, not punishment.

### Fairness and trust rules
- Word validation must be deterministic and explainable.
- Element assignment must be deterministic and explainable.
- Board collapse and refill order must be explicit and consistent.
- Creature weaknesses, resistances, and countdown behavior must be visible and understandable.
- Invalid words must not silently mutate the board or consume a move unless the docs intentionally change that rule.
- Repeated-word handling must follow documented rules and must not drift silently.
- Difficulty should come primarily from board reading, vocabulary choice, and encounter behavior, not from obscure validation, hidden rules, or UI friction.
- The player should be able to understand why they won or lost.
- The game must not feel like it cheated.

### Session and UX rules
- Startup should be fast.
- Resume should be fast and reliable.
- Active battle state must autosave after meaningful actions.
- Backgrounding the app must not casually destroy progress.
- Guest play should remain allowed unless product docs intentionally change that rule.
- The player must not be forced through account friction before understanding the game’s value.
- Notifications, social features, and progression systems should invite return, not harass the player.

### Tone and presentation rules
- Words 'n Wands! must remain family-friendly.
- The game must not drift into dark, grim, cruel, or edgy identity.
- Creature interaction should feel magical, playful, and mischievous rather than brutal.
- The game must respect the player’s thinking time.
- Do not interrupt active battle-solving with ads.
- Readability is more important than spectacle.
- Warm, polished restraint is preferred over flashy noise.
- Everything important should remain usable with sound off and haptics off.

### Social and competition rules
- Social comparison should be lightweight and optional.
- Real-time multiplayer is not part of the core product identity.
- Any future competition should not redefine the solo battle loop.
- Async comparison and mirror-challenge patterns fit the product better than coordination-heavy systems.

### Content rules
- Creature, encounter, and lexicon data must be structured and reviewable.
- Unreviewed generated content must not be published as canonical live content.
- Runtime AI should not be used to guess elemental meaning for battle-critical words.
- Content should be checked for clarity, fairness, and family-friendly tone.
- If challenge or live content surfaces later, they must preserve player trust.

### Monetization rules
- Monetization must support the product, not deform it.
- Do not make the game feel pay-to-win.
- Do not use manipulative interruption in the active battle flow.
- Do not sell raw combat power in a way that breaks fairness in the core campaign.
- Ad-free, carefully handled cosmetics, and later challenge/content packs may fit.
- Any monetization layer must remain secondary to fairness, readability, and fun.

---

## 5. Non-Negotiable Technical Invariants

### Stack direction
- mobile client: TypeScript
- mobile app direction: React Native with Expo
- routing direction: Expo Router
- app/session/UI state direction: Zustand
- important local persistence direction: SQLite via Expo SQLite
- shared rule logic: TypeScript packages where useful
- backend/API later where needed: TypeScript
- background/scheduled work later where needed: TypeScript worker

### Architecture rules
- core battle truth should not be duplicated carelessly across UI, backend, and tools
- validation rules and element-tag rules should be centralized where practical
- creature and encounter data should be structured and typed, not hardcoded into random screens
- UI code should render and orchestrate interaction; it should not become the hidden source of gameplay truth
- the app should not depend on a backend for every moment of core solo play unless docs intentionally require it
- local persistence and reliable resume are first-class responsibilities, not late polish

### Product/tech boundary rules
- do not hardcode creature logic into presentation components
- do not bury damage, countdown, or spell semantics inside animation-only code
- do not let cloud or social features silently redefine local solo battle behavior
- do not create content formats that only one fragile screen knows how to read
- do not use runtime AI calls as battle-truth infrastructure

### Dependency rules
- prefer fewer dependencies
- do not add a package unless it clearly saves real work or improves reliability
- avoid flashy or heavy libraries for small problems
- Words 'n Wands! does not need engine-like complexity for ordinary UI and puzzle behavior

### Data and config rules
- keep configuration and secrets out of source files
- keep creature, encounter, and content identifiers stable once introduced
- use boring, obvious file and folder names
- avoid schema or content-format churn without good reason

---

## 6. Repo Shape

Expected top-level structure:

- `apps/mobile`
- `apps/api`
- `apps/worker`
- `apps/content-tools`
- `packages/game-rules`
- `packages/validation`
- `packages/content`
- `packages/ui`
- `packages/audio`
- `packages/analytics`
- `packages/utils`
- `docs/`
- `assets/art`
- `assets/audio`
- `assets/fonts`
- `assets/marketing`

Keep names boring and obvious.

If some of these folders do not exist yet:

- do not create speculative sprawl
- create only the smallest structure the current milestone actually needs

---

## 7. Working Rules for Agents

### Scope discipline
- work on the smallest safe slice of the requested task
- do not jump ahead to later milestones unless explicitly told
- do not sneak in account, social, backend, economy, or content-tooling complexity when the task does not need it
- do not expose unfinished modes or fake feature buttons as if they work
- do not widen a gameplay task into a branding task or a branding task into a backend task
- do not turn a simple creature or board task into a generic system-building exercise

### Coding style
- slower but cleaner
- boring is good
- clear is better than clever
- consistency beats personal style
- prefer small focused files
- avoid giant god-files and tangled helpers
- avoid magic behavior hidden behind clever abstractions

### Naming
Use descriptive names like:

- `battleSessionState`
- `wordValidationResult`
- `elementTagLookup`
- `boardCollapseResult`
- `creatureDefinition`
- `creatureSpellResolution`
- `encounterResultScreen`
- `resumeBattleService`

Avoid:

- cute names
- vague names
- clever shorthand
- unexplained acronyms
- naming that only makes sense after reading the implementation

### Comments
Comment:

- why something exists
- why a rule matters
- why a non-obvious implementation choice was made
- why a workaround is necessary
- why a fairness or board-readability constraint is important

Do not comment obvious code line by line.

### UI and interaction discipline
- prefer readability and obvious interaction over novelty
- avoid tiny tap targets and clutter-heavy layouts
- do not add modal spam
- keep the battle screen focused
- keep the board easy to read
- when in doubt, make the repeated encounter flow faster and clearer

### Audio/visual discipline
- if a task touches visuals or sound, follow the style guide
- do not generate or implement wildly inconsistent styles across surfaces
- in-app readability matters more than decorative detail
- a polished quiet interaction is better than a loud flashy one
- keep the tone magical, warm, and family-friendly

### Analytics discipline
- instrument intentionally
- do not spray events everywhere “just in case”
- analytics should help answer product questions, not create noise
- be privacy-conscious and avoid needless payload bloat
- do not let analytics logic become entangled with core battle truth

### Content/data discipline
- keep creature, encounter, and lexicon content separate from UI rendering concerns
- prefer typed content structures
- do not scatter board-state rules across many unrelated files
- do not encode element-tag assumptions in multiple places
- if content behavior is unclear, push toward a more explicit schema rather than more special cases

---

## 8. Package Manager and Commands

Use **pnpm only**.

Do not mix:

- npm workspace commands
- yarn
- bun
- extra monorepo tools unless explicitly approved

Before assuming a command exists, check the repo scripts.  
If you introduce a new important command, document it.

---

## 9. Milestone Discipline

Before implementing anything beyond trivial tooling, check:

- `docs/milestone-implementation-plan.md`

Rules:

- do not build challenge cadence or live-ops complexity before the core battle loop is trustworthy
- do not build backend or cloud dependency before the local playable core is solid
- do not build social systems before solo play is genuinely fun
- do not let monetization design outrun proof that the game is actually enjoyable
- do not let extra creature/content breadth outrun rules clarity
- do not let art polish outrun board readability and usability
- do not introduce broad power-up families, equipment systems, or economy loops early

If unsure whether something belongs in the current phase, choose the more conservative implementation.

---

## 10. Content and Battle Discipline

Words 'n Wands! depends heavily on trust, so treat battle behavior and content as high-risk product truth.

### Rules
- encounter definitions should have stable identifiers
- move limits, cast timers, and damage rules must be explicit and testable
- validation rules and element-tag rules must remain centralized and documented
- board collapse, refill, and spell timing rules must not drift silently
- creature spell primitives should remain readable and composable
- share outputs must not leak future challenge seeds or unrevealed content if those systems are added later
- if generation tools are used for lexicon or creature assistance, their outputs must still be reviewed before canonical use

### Practical principle
A word game can become untrustworthy much faster than it becomes impressive.  
Protect trust first.

---

## 11. Before You Edit

Before making changes:

1. summarize the task in a few bullets
2. list the files and docs you actually need
3. state any assumptions you are making
4. keep the planned change as small as possible
5. if the task is large, choose a smaller first pass instead of a giant hero implementation

If a referenced doc does not exist yet:

- do not invent a giant replacement framework
- use `README.md` + this file + the smallest conservative assumption set
- note the gap clearly in your final report

---

## 12. Before You Finish

Before finishing:

1. run the relevant checks for the code you touched
2. test the specific flow you changed
   - for no-code/docs-only edits, run docs consistency checks only when available
3. fix obvious issues instead of leaving them behind
4. verify docs and scripts still match reality
5. make sure you did not accidentally introduce unrelated complexity
6. make sure the result still matches Words 'n Wands!’ product direction
7. if you changed battle behavior, validation behavior, creature behavior, session state, or monetization behavior, call that out explicitly

Check execution source of truth:

- use `docs/engineering-standards.md` section **"5.1 Operational Validation Commands (Contributor Contract)"** for exact commands, milestone gates, package-vs-repo usage, and CI parity expectations

Your final report should include:

- what changed
- assumptions made
- commands run
- anything intentionally deferred
- remaining risks or cleanup items

---

## 13. Forbidden Moves

Do not:

- invent undocumented battle rules
- hide validation truth inside UI-only code
- hide collapse/refill order inside animation helpers as implicit game logic
- silently change element-tag meaning or weakness/resistance semantics
- use runtime AI to decide battle-critical word meaning
- hardcode creature behavior into presentation components
- introduce ads or monetization interruptions during active solving
- make the player pay to preserve basic fairness or dignity
- publish unreviewed generated content as canonical live content
- add heavy dependencies without clear justification
- duplicate battle truth across app, packages, and backend casually
- expose unfinished modes as if they work
- add auth or online requirements to core solo play without explicit product direction
- add spoiler leaks to share cards, notifications, or future competitive surfaces
- optimize for flashy presentation at the expense of readability
- let analytics, ads, or experiments quietly redefine game semantics
- create a bloated progression layer that buries the board
- reintroduce player-hearts/lives into the core campaign without an intentional doc update
- add multiple special-tile families, gear systems, or consumable combat systems early
- treat current code accidents as permission to drift from the documented product

---

## 14. If You Are Unsure

If Words 'n Wands! docs do not fully answer something:

- choose the most conservative, maintainable option
- protect fairness and readability first
- preserve reliable save/resume behavior
- keep the implementation small
- document the assumption clearly
- do not improvise a large new pattern

When in doubt, Words 'n Wands! prefers:

- clarity
- fairness
- determinism
- readability
- maintainability
- player trust
- family-friendly tone

over novelty, speed, scope creep, or cleverness.
