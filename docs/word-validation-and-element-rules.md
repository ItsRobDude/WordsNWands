# Words 'n Wands! Word Validation and Element Rules

This document defines how Words 'n Wands! decides:

- whether a player-submitted word is valid
- whether that word is allowed in battle
- whether that word receives a non-neutral element tag
- how ambiguity is resolved
- how family-friendly vocabulary boundaries are enforced

Its purpose is to protect player trust.

Words 'n Wands! is unusually sensitive to fairness in this area.  
If word acceptance feels inconsistent, obscure, or arbitrary, the player will stop trusting the game very quickly.

This document is the product-level source of truth for:

- castable vocabulary
- normalization rules
- lexicon boundaries
- element-tagging behavior
- ambiguity handling

If future code, tools, or content decisions disagree with this document, this document should be treated as the rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should validate words in a way that feels:

- fair
- readable
- generous within reason
- family-friendly
- strategically meaningful
- consistent across sessions and devices

Words 'n Wands! should **not** use a giant permissive dictionary just because a term technically exists somewhere.

The game should prefer:

1. ordinary-player familiarity
2. consistency
3. family-friendly appropriateness
4. maintainable curation
5. strategic readability

over maximal dictionary size, trivia flexing, or obscure “gotcha” vocabulary.

### Practical trust rule
It is better for a real but questionable word to be:

- rejected clearly
- or accepted as neutral Arcane

than for the game to feel random, dishonest, or needlessly obscure.

### No runtime guessing rule
Words 'n Wands! must not rely on live AI or runtime semantic guessing to decide whether a word is valid or what element it means.

Battle-critical validation and tagging must come from pinned, reviewable data.

---

## 2. Scope of This Document

This document owns:

- what counts as a valid castable word
- how a word is normalized before lookup
- what categories of words are allowed or disallowed
- what categories of words may receive element tags
- how ambiguous words are handled
- how Arcane fallback works

This document does **not** own:

- board adjacency rules
- move consumption
- damage formula
- creature weaknesses/resistances
- encounter pacing
- board generation behavior
- screen behavior

Those belong in other docs.

---

## 3. Language Scope

### Current v1 language scope
Words 'n Wands! currently supports:

- **English only**
- standard letter-based word input using the 26 basic Latin letters `A-Z`

### Regional language direction
For v1, the validation model should lean toward:

- modern common English
- North American spelling by default
- internationally familiar common vocabulary where reasonable

The game should not try to solve full international spelling parity in v1 unless it is intentionally scoped and documented later.

### Localization rule
Future localization may add new language packs, but those must be treated as explicit content and validation expansions rather than implied support.

---

## 4. Lexicon Source of Truth

### Single validation authority rule
Words 'n Wands! must use one authoritative, pinned validation dataset for battle word acceptance.

That dataset is the source of truth for:

- whether a normalized word is castable
- whether it has a non-neutral element tag
- whether it is intentionally blocked for tone, obscurity, or other reasons

### Reviewable data rule
The validation dataset must be:

- versioned
- typed
- reviewable
- stable once shipped in a release or content package

### v1 dataset shape rule
For v1, validation truth should ship as two bundled, versioned datasets:

1. `castable_words` list (all valid castable words)
2. `element_tags` overlay (only words with non-Arcane element tags)

All castable words that do not appear in `element_tags` resolve to Arcane.

### v1 curation-size targets
Current target ranges for content planning:

- castable lexicon: `12,000-18,000` words
- tagged non-Arcane overlay: `1,500-2,500` words

These are authoring targets, not a runtime permission to auto-tag by inference.

### No split-brain rule
The following systems must use the same pinned validation truth:

- player word submission
- dead-board detection
- board-safety checks
- refill/playability heuristics
- content QA tools
- encounter balancing tools

A word should not be considered playable by board logic but rejected by player-cast logic, or vice versa.

### Runtime lookup rule
Milestone 1 runtime validation should use pre-hydrated in-memory lookups from bundled snapshots for hot-path cast resolution.

SQLite is appropriate for persistence (settings, session snapshots, progression, history), but should not be queried per cast for ordinary lexicon/element lookups.

### Safer-default rule
When there is uncertainty during content preparation, the safer default is:

- valid + Arcane
- or temporarily invalid until reviewed

not speculative element tagging.

---

## 5. Word Normalization Rules

The game must normalize input consistently before validation.

### Standard normalization
Before lookup, a player word should be normalized by:

1. collecting letters from the chosen board path in order
2. converting to a standard internal case format
3. comparing against the pinned validation dataset

### Letter-only rule
For v1, valid castable words must consist only of letters available on the board.

This means the battle lexicon should not require:

- spaces
- apostrophes
- hyphens
- punctuation
- accented letters outside the standard v1 letter set
- numerals
- symbols

### Case-insensitivity rule
Validation must be case-insensitive.

`BURN`, `Burn`, and `burn` should resolve identically.

### Board-truth rule
A word can only be cast if it can actually be formed from the current board path under the current board rules.

Lexicon validity alone is not enough.

---

## 6. Standard Castable Word Rules

A word is castable only if all of the following are true:

- it satisfies the current board-path rules
- it is at least 3 letters long
- it exists in the pinned validation dataset as castable
- it is not blocked by a content or family-friendly restriction
- it is not already rejected by a more specific encounter rule
- it has not already been cast earlier in the same encounter under the repeat rule

### Minimum-length rule
For v1, castable words must contain at least **3 letters**.

### Familiarity rule
A castable word should pass the ordinary-player test.

That means an ordinary English-speaking player should have a reasonable chance of recognizing the word from:

- everyday life
- school vocabulary
- common media
- common hobbies
- common fantasy language expectations

The game should not depend on niche dictionary archaeology.

### Play-feel rule
Acceptance should feel broad enough that players can explore the board creatively, but curated enough that the accepted vocabulary still feels fair and human.

---

## 7. Disallowed Word Categories

The following categories should be disallowed by default in the core battle lexicon unless intentionally documented otherwise later.

### Proper nouns
Disallow:

- personal names
- place names
- brand names
- mythological names used only as names
- franchise names
- character names

Example direction:

- `ALICE` -> not castable by default
- `TOKYO` -> not castable by default

### Acronyms and abbreviations
Disallow:

- initialisms
- shorthand abbreviations
- slang abbreviations
- texting abbreviations
- all-caps special forms treated as separate lexical items

Example direction:

- `LOL`
- `NASA`
- `TV`
- `INFO`

These should not be accepted as ordinary castable words unless the product intentionally changes direction later.

### Obscure archaic or trivia-only words
Disallow words whose main value comes from “technically in a dictionary” status rather than ordinary familiarity.

The game should not reward bizarre lexicon abuse.

### Profanity and explicit sexual language
Disallow:

- profanity
- slurs
- explicit sexual terms
- hateful or degrading terms
- vulgar anatomy terms used primarily for shock value

This is a hard tone-protection rule for the core game.

### Standalone affixes and fragments
Disallow:

- prefixes treated as words
- suffixes treated as words
- root fragments that ordinary players would not reasonably expect to be castable standalone

### Hyper-technical specialist jargon
Disallow words that require niche expertise unless they are also broadly familiar to ordinary players.

### Rare alternate spellings
Disallow ultra-rare or intentionally awkward alternate spellings when a common standard form exists and the rare form would mostly feel like a trick.

---

## 8. Allowed Word Categories

The following categories are generally allowed, provided they meet familiarity and family-friendly standards.

### Common nouns
Examples:

- `rock`
- `ocean`
- `cloud`
- `flower`

### Common verbs
Examples:

- `burn`
- `glow`
- `grow`
- `shine`

### Common adjectives where appropriate
Examples:

- `bright`
- `stormy` if included and properly curated
- `sunny` if included and properly curated

### Common plural and inflected forms
Plural and inflected forms may be allowed when they are:

- common
- readable
- useful in play
- intentionally included in the validation dataset

Examples that may be allowed if curated:

- `waves`
- `roots`
- `glowed`
- `shines`

### Fantasy-friendly but readable vocabulary
Words 'n Wands! may allow some slightly elevated magical or nature vocabulary if it still feels familiar and fair.

Examples:

- `ember`
- `moss`
- `gale`
- `petal`

The game may feel a little magical.  
It should not become a niche spelling contest.

---

## 9. Family-Friendly Tone Rules for Vocabulary

Because Words 'n Wands! is intentionally family-friendly, the validation system must help protect tone.

### Tone-protection rule
Even if a word is technically real, it should not be castable if it would make the game feel:

- crude
- mean-spirited
- explicit
- hateful
- tonally out of place

### Mild spooky or dramatic vocabulary
Words that are mildly spooky, dramatic, or fantasy-flavored may still be allowed if they remain broadly appropriate for the product tone.

Examples that may be acceptable depending on curation:

- `ghost`
- `storm`
- `shadow`

Acceptance should still follow ordinary-player familiarity rules.

### Hard line categories
Words that are mainly:

- explicit
- hateful
- obscene
- degrading

must not be accepted in the core product.

---

## 10. Repeat and Encounter-Local Rules

### Encounter-local repeat rule
A word already cast earlier in the same encounter is rejected for that encounter, even if it remains a valid castable word globally.

This repeat rule belongs to encounter logic, but this document recognizes that global validity and encounter-local reusability are separate concepts.

### Global lexicon rule
Encounter-local rejection does **not** remove the word from the global castable lexicon.

A repeated word is:

- globally valid
- locally blocked for that encounter

---

## 11. Element Assignment Philosophy

Element assignment exists to make word meaning strategically interesting.

It must remain readable and trustworthy.

### Core element rule
A valid castable word may receive:

- one non-neutral element
- or no non-neutral element, in which case it becomes **Arcane**

### Single-element rule
For v1:

- each word may have at most one non-neutral element
- multi-element behavior is out of scope

### Literal-first rule
Element tagging should strongly prefer **literal, concrete meaning** over metaphorical, emotional, poetic, or symbolic associations.

Examples:

- `burn` -> Flame
- `river` -> Tide
- `vine` -> Bloom
- `storm` -> Storm
- `rock` -> Stone
- `shine` -> Light

Counterexample direction:

- `hope` should **not** be tagged Light just because it feels bright
- `heart` should **not** be tagged Bloom just because it suggests life
- `rage` should **not** be tagged Flame just because it feels hot emotionally

Literal meaning protects trust.

### Player-intuition rule
When deciding whether to assign a tag, the main question should be:

> Would an ordinary player intuitively expect this word to carry this element?

If the answer is weak or mixed, prefer Arcane.

### Safer-default tagging rule
It is better for a valid word to be:

- accepted as Arcane

than to be:

- mis-tagged with a confusing or debatable element

---

## 12. Standard Element Set

The current standard element set is:

- Flame
- Tide
- Bloom
- Storm
- Stone
- Light
- Arcane

### Element role definitions

#### Flame
Used for words whose primary ordinary meaning is strongly tied to:

- fire
- burning
- heat
- embers
- ash
- lava or magma-like heat
- combustion-like imagery

Example direction:

- `burn`
- `ember`
- `blaze`
- `torch`
- `flame`
- `smoke`
- `lava`

#### Tide
Used for words whose primary ordinary meaning is strongly tied to:

- water
- rain
- rivers
- oceans
- waves
- mist
- streams
- water in ordinary natural forms

Example direction:

- `ocean`
- `river`
- `wave`
- `rain`
- `tide`
- `stream`
- `mist`

Because there is no separate Frost element in v1, some clearly water-derived frozen forms may also belong here if intentionally curated.

#### Bloom
Used for words whose primary ordinary meaning is strongly tied to:

- plants
- flowers
- roots
- leaves
- vines
- moss
- gardens
- natural growth

Example direction:

- `vine`
- `bloom`
- `leaf`
- `root`
- `moss`
- `petal`
- `fern`

#### Storm
Used for words whose primary ordinary meaning is strongly tied to:

- wind
- weather
- thunder
- lightning
- clouds
- gales
- sky-force phenomena

Example direction:

- `storm`
- `gust`
- `wind`
- `cloud`
- `thunder`
- `gale`
- `bolt`

#### Stone
Used for words whose primary ordinary meaning is strongly tied to:

- rock
- earth
- caves
- mountains
- pebbles
- sand
- clay
- grounded mineral matter

Example direction:

- `rock`
- `stone`
- `cave`
- `sand`
- `clay`
- `pebble`
- `mountain`

#### Light
Used for words whose primary ordinary meaning is strongly tied to:

- shining
- glowing
- beams
- stars
- sunlight
- radiance
- brightness

Example direction:

- `sun`
- `glow`
- `beam`
- `star`
- `shine`
- `dawn`
- `radiant` if ever included later

#### Arcane
Arcane is the neutral fallback.

Arcane is used when a valid word:

- has no non-neutral tag
- is too ambiguous for confident non-neutral tagging
- is intentionally left neutral for clarity or balance

Arcane is not a failure state.

Arcane words are an important part of the game’s strategic flexibility.

---

## 13. Ambiguity Handling Rules

Ambiguity must be handled conservatively.

### Core ambiguity rule
If a word could reasonably belong to multiple elements and there is no clearly dominant player-intuitive choice, prefer **Arcane**.

### Primary-meaning rule
If one meaning is strongly dominant in ordinary usage, the word may receive that single tag.

### Literal-dominance examples

#### Acceptable single-tag direction
- `storm` -> Storm
- `flower` -> Bloom
- `rock` -> Stone
- `river` -> Tide
- `ember` -> Flame
- `sun` -> Light

#### Better as Arcane unless clearly curated
- `spring`
- `crystal`
- `spark`
- `shade`
- `current`
- `flare`
- `frost` if Tide semantics are not locked carefully
- `branch` if there is uncertainty about player intuition and balance

These are not universal permanent decisions here; they are examples of the conservative rule.

### No hidden inference rule
The runtime must not derive a tag from morphology or embedding-style semantic similarity.

Example:

- if `burn` is tagged Flame, that does **not** automatically mean every related form is Flame
- if `glow` is tagged Light, that does **not** automatically tag every nearby synonym

Each valid word’s non-neutral tag must come from curated reviewable data.

---

## 14. Inflection and Word-Family Rules

### No automatic family inheritance
A tag on one word does not automatically apply to all of its inflections or relatives.

Examples:

- `burn` tagged Flame does not automatically make `burned` Flame
- `glow` tagged Light does not automatically make `glowing` Light
- `root` tagged Bloom does not automatically make `rooted` Bloom

Those forms may still be:

- valid and tagged
- valid and Arcane
- invalid

depending on curation.

### Why this rule exists
Automatic inheritance feels convenient for development but can create confusing edge cases for players.

Words 'n Wands! should prefer explicit curation over clever hidden inference.

### Safe expansion rule
As the lexicon grows, new word-family members may be reviewed and tagged deliberately.

Additive curation is good.  
Silent implicit inference is not.

---

## 15. Arcane Fallback Rules

Arcane is essential for fairness.

### Arcane fallback rule
A valid word becomes Arcane if:

- it is allowed in the castable lexicon
- and it has no non-neutral tag

### Product purpose of Arcane
Arcane exists so that:

- the validation system can stay generous
- the element system can stay trustworthy
- the player can still cast useful words even when no strong element word is available
- ambiguous words do not need to be forced into questionable tags

### No-shame rule
Arcane words should not feel like “bad words.”

They are a normal part of play.

The game should often create interesting decisions between:

- a longer Arcane word
- and a shorter weakness word

That is healthy strategy.

---

## 16. Lexicon Fairness Tiers

To keep the product fair over time, castable words should be reviewed through a simple internal fairness lens.

### Tier A — Strong fit
Words that are:

- common
- readable
- family-friendly
- intuitive
- useful in play

These should make up most of the core battle lexicon.

### Tier B — Acceptable fit
Words that are:

- still real and fair
- a little less common
- still readable to many ordinary players
- not likely to feel like trivia traps

These may appear in the lexicon, but should not dominate the experience.

### Tier C — Poor fit
Words that are:

- obscure
- archaic
- hyper-specialized
- tonally awkward
- family-unfriendly
- “technically valid but annoying”

These should generally be rejected.

### Core lexicon composition rule
The core lexicon should be biased toward Tier A, with some Tier B, and minimal or no Tier C.

---

## 17. Data Review and Change Rules

Because validation and element tagging are core trust systems, changes must be deliberate.

### Stable review rule
When a validation dataset version is shipped, it should remain stable for that version.

### Change categories
Future changes may include:

- adding valid words
- removing clearly problematic words
- changing a word from invalid to valid
- changing a valid word from Arcane to a non-neutral element
- changing a non-neutral tag back to Arcane if it was confusing or unfair

### Safer-change priority
When a validation or tagging issue is discovered, the most player-trust-preserving fix should be preferred.

### No silent drift rule
Validation and element-tag changes should not happen silently in a way that makes the same word behave differently without a deliberate versioned update.

---

## 18. Operational Curation Protocol

This section defines the required review protocol for candidate-word decisions before they enter a validation snapshot.

### 18.1 Mandatory review fields per candidate word
Each candidate word record must include all of the following fields before approval:

- **frequency/familiarity evidence source**
  - reference to the source used to justify ordinary-player familiarity
  - enough detail for another reviewer to reproduce the judgment
- **tone classification**
  - one of: `family-safe`, `review-required`, `blocked`
- **element rationale (if tagged)**
  - required when assigning a non-Arcane element
  - must explain literal meaning and why the tag is player-intuitive
- **confidence score**
  - numeric score from `0.00` to `1.00`
  - reflects reviewer confidence in both acceptance and tagging choice

Candidate records missing any required field are not eligible for `approved` status.

### 18.2 Acceptance thresholds for Tier A/B/C decisions
Use lexicon fairness tiers from Section 16 with the following decision thresholds:

- **Tier A (Strong fit)**  
  - default decision: `accept`
  - minimum confidence: `>= 0.80`
  - if tagged non-Arcane, element rationale is mandatory
- **Tier B (Acceptable fit)**  
  - default decision: `accept` (often Arcane unless tag clarity is strong)
  - minimum confidence: `>= 0.65`
  - non-Arcane tag requires confidence `>= 0.75`
- **Tier C (Poor fit)**  
  - default decision: `reject`
  - acceptance requires explicit override

#### Override approvals
Any override of the defaults above (especially Tier C acceptance or low-confidence acceptance) must be approved by the **content owner** and recorded with a short rationale in the snapshot change notes.

### 18.3 Dispute policy for reviewer disagreement
When reviewers disagree on validity or tag:

- **default action**
  - if the word appears family-safe and reasonably familiar: `valid + Arcane`
  - if familiarity or tone safety is unclear: hold as `invalid` until resolved
- **escalation owner**
  - content owner (final decision authority)
- **decision SLA**
  - finalize within **2 business days** of escalation for ordinary snapshot work
  - for release-blocking disputes, finalize before snapshot cut; unresolved words remain out of the release

### 18.4 Batch-change QA checks before snapshot release
Before publishing a new validation snapshot, run and review all of the following:

- **acceptance-rate delta check**
  - compare accepted-word rate versus prior approved snapshot
  - flag large unexpected swings for manual review
- **element-distribution drift check**
  - compare per-element tag distribution versus prior snapshot
  - investigate large shifts that lack intentional design rationale
- **profanity/blocklist regression check**
  - verify blocked categories remain blocked
  - verify no newly accepted words violate family-friendly restrictions

Any flagged issue must be either:

- fixed before release, or
- explicitly documented as intentional and approved by the content owner

### 18.5 Post-release rollback policy for mistaken acceptance/tag changes
If a released snapshot contains mistaken validity or element decisions:

1. classify incident severity (`high`, `medium`, `low`) based on trust impact
2. create a corrective snapshot patch with minimal scope
3. prefer the least disruptive trust-preserving fix:
   - revert mistaken element tag to Arcane, or
   - revert mistaken acceptance to invalid when tone/safety requires it
4. document affected words and rationale in release notes
5. preserve active-session stability by applying corrections only through versioned snapshot updates (no silent runtime reinterpretation)

For severe family-friendly regressions, rollback should be treated as expedited and prioritized over non-critical content work.

---

## 19. Board-Generation Interaction Rules

This document does not own board generation, but it does impose fairness requirements on it.

### Shared-truth rule
Any system that evaluates whether the board has playable words must use the same validation snapshot as the player-facing cast validator.

### Dead-board trust rule
If the board generator or refill logic creates a board with no castable words:

- that is a system problem, not a player failure
- recovery must preserve trust

### Playability rule
When board-generation systems intentionally bias for likely playability, they should do so using the real castable lexicon rather than heuristic guesses that drift away from actual validation truth.

---

## 20. Out of Scope for v1

The following are out of scope for the current validation and element system unless later documented:

- runtime AI semantic classification
- user-submitted custom dictionary additions
- multi-element words
- language mixing inside one lexicon
- wildcard or blank tiles that alter spelling
- phrase casting with spaces or punctuation
- proper-noun-heavy challenge modes as part of the core game
- intentionally obscure “expert dictionary” modes in the default progression

---

## 21. Summary Rule

Words 'n Wands! should validate words in a way that feels:

- fair
- human
- family-friendly
- strategically meaningful
- consistent
- generous without becoming sloppy

The core policy is:

- accept ordinary readable words
- reject obscure or tonally wrong nonsense
- use one pinned validation truth
- prefer literal meaning over poetic guesswork
- assign at most one non-neutral element
- use Arcane whenever certainty is weak
- never let runtime AI invent battle truth

If a future validation or tagging idea makes the game less trustworthy, less readable, or more annoying, it should not be treated as an improvement.
