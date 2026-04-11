# Words 'n Wands! Structured Encounter Generation

This document defines how Words 'n Wands! may generate encounters in a **structured, deterministic, reviewable** way without breaking the game’s identity.

Its purpose is to solve a real product problem:

- early access can run out of hand-authored battles too quickly
- the project has limited solo production bandwidth
- the game still needs readable, fair, warm, trust-preserving content

This document is the source of truth for:

- when structured generation is allowed
- where it fits the product philosophy
- what the generator may and may not create
- how generated encounters move from draft to approved content
- what parts of the game must remain curated rather than generated

Use this together with:

- `docs/content-pipeline-and-liveops.md`
- `docs/creature-and-encounter-rules.md`
- `docs/encounter-balance-framework.md`
- `docs/game-rules.md`
- `docs/word-validation-and-element-rules.md`
- `docs/randomness-and-seeding-contract.md`
- `docs/technical-architecture.md`
- `docs/implementation-contracts.md`
- `docs/encounter-generator-implementation.md` (engineering companion implementation doc; this policy doc remains product behavior source of truth)
- `docs/fun-research-guide-team1.md`
- `docs/fun-research-guide-team2.md`

---

## 1. Core position

Structured generation is allowed.

Unbounded or fuzzy generation is not.

That distinction matters.

Words 'n Wands! is built on:

- clarity
- fairness
- determinism
- player trust
- family-friendly warmth
- maintainable simplicity

A generator that creates **bounded drafts from approved parts** can support those values.
A generator that invents battle-critical content however it wants will damage them.

### Practical rule
The generator is a **content tool** first.
It is not the product’s permission slip to stop reviewing content.

### Identity rule
Generated encounters must still feel like Words 'n Wands!, which means:

- short readable sessions
- one clear creature identity per fight
- pressure that feels tactical rather than cruel
- magical warmth rather than dark hostility
- common-word, ordinary-player fairness
- understandable creature behavior, not chaos for its own sake

If a generated encounter does not meet those standards, it is invalid even if the math technically passes.

---

## 2. What problem this is solving

The first problem is not “we need infinite random battles.”

The first problem is:

- early access needs enough battles to stay interesting
- the project cannot rely on hand-authoring every single encounter forever
- the content still needs to be versioned, tested, and reviewable

So the correct solution is:

- generate **structured encounter drafts** from approved templates and formulas
- review those drafts like normal content
- freeze good outputs into concrete content packages
- later, if justified, add a clearly framed optional runtime-generated challenge mode

That preserves quality while increasing content supply.

---

## 3. Two allowed generator modes

Words 'n Wands! uses two possible generator modes.

### 3.1 Mode A — `draft_generate_freeze_v1` (default and preferred)

This is the default mode.

The generator:

- takes a structured request
- builds one or more encounter drafts from approved archetypes and formulas
- runs machine validation and balance checks
- emits concrete review artifacts
- requires human review
- only becomes shippable content after approval

This mode is the preferred solution for:

- early-access content scaling
- campaign expansion with limited bandwidth
- building new encounter packs faster without losing reviewability

### 3.2 Mode B — `runtime_seeded_trial_v1` (deferred, optional)

This is a later optional mode.

The runtime may create a challenge encounter from:

- approved generator version
- approved archetype pool
- approved board profile pool
- pinned validation snapshot
- pinned content/rules version
- deterministic seed

This mode is **not** the default path for the main campaign.

This mode is for later optional side content such as:

- trial ladders
- daily seeded challenge battles
- evergreen optional practice/remix content

### Canonical product rule
Mainline progression should prefer **curated or generated-then-frozen** content.
Optional side content may use runtime seeded generation later if it stays clearly framed and equally reviewable at the system level.

---

## 4. What must stay curated

The following must remain curated or tightly authored and may not be delegated to freeform generation in v1-era product work.

### 4.1 Starter flow
The starter encounter and tutorial path must remain curated.

Reason:
- it teaches trust
- it teaches the game’s language
- it cannot afford drift

### 4.2 Core battle rules
The generator may not invent:

- new cast rules
- new damage rules
- new countdown rules
- new repeat rules
- new validation rules
- new element semantics
- new dead-board recovery behavior

### 4.3 Validation truth
The generator may not invent lexicon truth.

It must use:
- the pinned validation snapshot
- the pinned element-tag overlay
- the existing family-friendly vocabulary rules

### 4.4 Hidden exception behavior
The generator may not create hidden exceptions that live only in content output and not in documented contracts.

If a generated encounter needs a special rule, that rule belongs in the docs first.

### 4.5 Tone
The generator may not create content that breaks the game’s family-friendly magical framing.

---

## 5. What the generator is allowed to create

The generator may assemble an encounter from approved building blocks.

Allowed generated dimensions include:

- encounter tier
- creature archetype selection from approved blueprint pool
- weakness/resistance pairing from approved pair pool
- HP, move budget, and base countdown derived from balance formulas
- spell payload parameters inside approved guardrails
- board profile selection from approved pool
- habitat theme selection from approved pool
- intro flavor text from approved line banks
- creature display names from approved name banks if enabled
- review metadata and validation summaries

### Important limit
The generator does not “discover what is fun” on its own.
It combines approved pieces inside approved boundaries.

---

## 6. What the generator may not create

The generator may not:

- create brand-new creature mechanics outside approved primitives
- create multi-phase standard encounters in v1 ordinary content
- change weakness/resistance mid-fight for ordinary encounters
- create spell intensity above the tier guardrails without explicit exception handling
- bypass the validation snapshot
- generate obscurity-dependent encounters
- generate starter flow content by default
- generate monetization-linked content truth
- silently redefine encounter semantics between runs for the same pinned version
- use live AI to invent gameplay-critical meaning or rules

### No “mystery proc-gen” rule
If a reviewer cannot explain why a generated encounter works, that encounter should not ship.

---

## 7. Canonical generation model

The generator works by combining five bounded inputs.

### 7.1 Blueprint library
A blueprint is an approved creature-encounter archetype such as:

- soot nuisance
- bubble nuisance
- row-shift nuisance
- freeze nuisance
- dull nuisance
- light board-distortion nuisance

Each blueprint defines:

- one primary spell identity
- allowed tier range
- allowed spell primitive families
- allowed weakness/resistance pair pool
- pressure style
- suggested profile offsets relative to the balance framework
- allowed habitat tags
- prohibited combinations

### 7.2 Tier plan
The tier plan defines the requested challenge target such as:

- gentle
- standard
- challenging
- boss
- event

And includes:

- fail-rate band target
- expected casts-to-defeat target
- spell-count target
- allowed intensity window

### 7.3 Board-profile pool
The generator may only choose from approved board profiles.

It may not invent ad hoc hidden board rules.

### 7.4 Flavor banks
Flavor banks are curated text/name banks such as:

- approved creature display-name fragments
- approved intro flavor lines
- approved habitat display names

These must be curated and family-friendly.
The generator may choose from them.
It may not free-write battle-critical copy at runtime.

### 7.5 Version pins and seed
Every generation run must carry:

- generator version
- content version target
- validation snapshot version
- battle rules version target
- board generator version target
- deterministic generation seed

That keeps outputs reproducible and reviewable.

For the current M1–M2 lock, these target pins must use the canonical identifiers from `docs/early-content-lock.md` section 1:

- `battle_rules_version_target = battle_rules_m2_launch_v1`
- `board_generator_version_target = board_generator_m2_launch_v1`

---

## 8. Canonical generation flow

For `draft_generate_freeze_v1`, the generator must follow this exact flow.

1. Validate the generation request.
2. Resolve the requested tier and fail-rate band.
3. Select a legal blueprint from the approved pool.
4. Select a legal habitat/theme from the approved pool.
5. Select a legal weakness/resistance pair from the blueprint’s allowed set.
6. Apply blueprint-specific profile offsets to the tier defaults from the balance framework.
7. Derive HP from target casts-to-defeat using the canonical balance formulas.
8. Derive move budget from the canonical efficiency-slack formula.
9. Derive base countdown from the canonical spell-count target and weakness-stall assumption.
10. Build the spell payload inside tier guardrails.
11. Attach an approved board profile.
12. Attach validation snapshot and version pins.
13. Select approved name/flavor values if enabled.
14. Run schema validation.
15. Run balance guardrail validation.
16. Run thematic coherence checks.
17. Emit a review artifact bundle.
18. Require human review before approval.
19. Freeze approved outputs into concrete content definitions.

### No skip rule
The generator may not skip directly from request to shipping content.

---

## 9. Canonical review flow for generated content

Generated content must move through the same basic content lifecycle states as any other content.

### Required lifecycle

- `draft`
- `review_ready`
- `fairness_reviewed`
- `approved`
- `bundled`
- `published`

### Review bundle requirements
Every generated encounter draft must include all of the following review surfaces:

- generated encounter JSON
- creature JSON if separately emitted
- human-readable summary card
- generation request input
- generator version
- generation seed
- balance report
- validator findings
- why-this-should-feel-fair note

### Review questions
A human reviewer must be able to answer:

- Is the creature identity clear?
- Is the weakness/resistance pairing understandable?
- Does the spell match the creature fantasy?
- Does the encounter fit the intended tier?
- Does it feel like Words 'n Wands! rather than generic proc-gen filler?
- Does it rely on ordinary-player vocabulary rather than trivia abuse?
- Does it preserve warmth and readability?

If the answer is no, reject or revise the draft.

---

## 10. Early-access content strategy

For early access, the generator should be used in this order of preference.

### 10.1 First answer: generate, review, freeze
Use the generator to produce:

- more campaign-like encounter drafts
- extra habitat packs
- optional side-battle packs

Then review and freeze them into normal content packages.

This is the preferred early-access scaling method.

### 10.2 Second answer later: optional generated trials
Only after the generator, balance pipeline, and review culture are stable should the product consider:

- seeded optional trial encounters
- rotating generated challenge ladders
- evergreen replay content outside the mainline campaign

### Why this order is correct
It gives the game more battles fast without making the main progression feel random, unstable, or unowned.

---

## 11. Mainline campaign policy

Mainline progression content may be generator-assisted, but mainline progression should still feel intentionally authored.

That means:

- generator-assisted mainline content should usually be generated offline and frozen before ship
- mainline encounters should still have stable IDs, stable review history, and stable player-facing identity
- the campaign should not feel like infinite anonymous filler nodes

### Mainline memorability rule
A player should still be able to remember encounters as:

- “that soot cub fight”
- “that otter that shifted the row”
- “that bunny that froze tiles”

not just:

- “one of the random battles”

---

## 12. Optional runtime trial policy

`runtime_seeded_trial_v1` is allowed only under these conditions.

### Requirements

- clearly separate from mainline progression
- uses only approved blueprint pools
- uses pinned generator version and content/rules/validation versions
- uses deterministic seed behavior
- produces explicit encounter metadata for logs, restore, and fairness review
- preserves replay parity for the same seed and version pins
- has a visible product framing such as `Trial`, `Practice`, or `Challenge`

### Not allowed

- silently replacing the main campaign with generated content
- presenting runtime-generated trials as if they were hand-authored chapter canon
- letting runtime mode bypass reviewable system constraints

---

## 13. Approved blueprint families for the first generator version

The first generator version should stay narrow.

Approved ordinary-content blueprint families for `structured_generation_v1`:

- `soot_standard_v1`
- `bubble_gentle_v1`
- `freeze_challenging_v1`
- `shift_row_standard_v1`
- `shift_column_standard_v1`
- `dull_standard_v1`

### Why narrow is better
A smaller blueprint pool gives:

- stronger identity control
- easier testing
- easier balance tuning
- easier reviewer intuition
- less risk of content chaos

The first generator version should be boring on purpose.

---

## 14. Theme and flavor rules for generated encounters

Generated encounters still need thematic coherence.

### Required coherence
The generator must maintain sensible combinations such as:

- flame-like soot creature -> Tide weakness, Flame resistance, ash/ember flavor
- water trickster -> Storm weakness, Tide resistance, row/column movement or bubble flavor
- vine/bramble creature -> Flame weakness, Bloom resistance, freeze/tangle or dulling pressure

### Forbidden flavor drift
Do not generate:

- horror framing
- gore framing
- mean-spirited or humiliating copy
- abstract weirdness that makes the creature unreadable
- lore-heavy nonsense just to feel “different”

Generated encounters should feel like natural neighbors inside the same magical world.

---

## 15. Balance and fairness requirements

Every generated encounter must pass all of the following.

### 15.1 Formula compliance
The generator must use the canonical balance framework formulas for:

- expected damage per cast
- HP derivation
- move budget derivation
- base countdown derivation

### 15.2 Guardrail compliance
The generator must reject outputs that violate:

- invalid high-pressure combinations
- spell intensity ceilings
- tile-impact ceilings
- chained-effect ceilings
- tier countdown limits
- tier pacing error bands

### 15.3 Trust compliance
The generator must also reject outputs that may be numerically legal but obviously bad for product trust, such as:

- too many near-identical encounters in one output batch
- repeated blueprint use without enough pacing variation
- flavor/text mismatches with the spell identity
- pairing high blockage with very low move budget in ordinary content
- encounters that feel too dependent on obscure weakness vocabulary

### Human override rule
A reviewer may reject a numerically legal draft for feel, tone, or clarity reasons.
That is correct behavior, not a pipeline failure.

---

## 16. Determinism requirements

Structured generation must be deterministic.

That means:

- same generator version + same request + same seed + same pinned inputs = identical output
- different seeds may vary output only within allowed blueprint constraints
- generation must be replayable for debugging and review

### Required persisted generator metadata
Every generated encounter draft must carry:

- `generator_version`
- `generator_mode`
- `generation_seed`
- `blueprint_id`
- `request_id`
- `balance_profile_version`
- all relevant content/rules/validation pins

This makes generated content auditable.

---

## 17. Testing rules

The generator is not done when it “makes content.”
It is done when it makes content predictably.

Required test categories:

- same-seed determinism tests
- schema validation tests
- balance formula parity tests
- guardrail rejection tests
- blueprint legality tests
- flavor-bank legality tests
- duplicate-batch diversity sanity tests
- frozen-output parity tests

### Golden-output rule
At least a small set of generation requests must have golden expected outputs committed to the repo so generator drift is visible in review.

---

## 18. Not allowed as a justification

The following are not valid excuses for bad generated content:

- “the generator made it that way”
- “the formulas passed”
- “it gives us more content”
- “players can just reroll it”
- “it’s only early access”

Early access is exactly when trust is being earned.

---

## 19. Final rule

The correct use of structured generation in Words 'n Wands! is:

- bounded
- deterministic
- reviewable
- versioned
- human-approved
- identity-preserving

The generator should help the project make **more real battles**, not more random noise.

If a generator choice makes the game less readable, less fair, less warm, or less trustworthy, it should be rejected even if it looks efficient on paper.
