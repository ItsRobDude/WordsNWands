# Words 'n Wands! Analytics and Experimentation

This document defines how Words 'n Wands! should measure product behavior, player experience, and controlled experiments.

Its purpose is to keep analytics and experimentation:

- useful
- privacy-conscious
- aligned with player trust
- realistic for a mostly AI-assisted solo project
- tightly connected to real product questions
- subordinate to fairness and readability

This is the product-level source of truth for:

- what analytics is for
- what questions analytics should answer
- event taxonomy direction
- required event fields and privacy boundaries
- experiment guardrails
- milestone-based analytics scope

If future instrumentation plans, dashboards, or experiments disagree with this document, this document should be treated as the analytics and experimentation rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should collect analytics to improve the game, not to justify bad product behavior.

Analytics should help answer questions like:

- Do players understand the first battle?
- Do players get a fast early win?
- Are encounters fair?
- Are certain creatures or rules confusing?
- Is save/resume reliable?
- Do optional challenge layers actually add value later?

Analytics should not become:

- noise for noise’s sake
- a privacy mess
- a hidden gameplay authority
- an excuse to ship manipulative experiments
- a reason to overbuild backend systems before the game is proven fun

### Practical analytics rule
Because this project is being built with heavy AI assistance and limited human bandwidth, analytics must stay focused.

That means Words 'n Wands! should prefer:

1. a small number of high-value events
2. clean event naming
3. clear required fields
4. privacy-safe payloads
5. milestone-based instrumentation growth
6. experiments only when the product can meaningfully learn from them

over giant event catalogs, dashboard vanity metrics, or complicated experimentation frameworks too early.

---

## 2. Scope of This Document

This document owns:

- analytics goals
- product questions analytics should answer
- event taxonomy expectations
- privacy/redaction boundaries
- experiment design guardrails
- milestone-based analytics rollout
- KPI guidance for activation, retention, and battle fairness

This document does **not** own:

- core battle rules
- persistence schema details
- content packaging details
- store UI details
- implementation contract shapes in full

Those belong in other docs, though this document must stay aligned with them.

---

## 3. Analytics Principles

All analytics and experimentation work in Words 'n Wands! should follow these principles.

### 3.1 Product-question-first
No event should exist without a real question behind it.

### 3.2 Privacy-first
Analytics must not capture more data than needed.

### 3.3 Trust-first
Analytics must never quietly redefine battle truth.

### 3.4 Fairness-first
Experiments must not make the game feel inconsistent, unfair, or manipulative.

### 3.5 Milestone realism
Early milestones need enough data to catch onboarding and battle problems, not a giant measurement platform.

### 3.6 Local-first compatibility
The analytics design must respect the game’s local-first architecture.

That means the app should be able to function cleanly even if analytics transport is unavailable.

---

## 4. What Analytics Is For

Analytics in Words 'n Wands! should primarily help answer five categories of questions.

### 4.1 Activation and onboarding
- Do players reach the first battle?
- Do they understand what to do?
- Do they get a satisfying early win?
- Where do they bounce during first launch?

### 4.2 Encounter fairness and clarity
- Are invalid or repeated-word rejections unusually high?
- Are certain encounters over-tuned or under-tuned?
- Are dead-board recoveries too common?
- Are players losing because of difficulty or because the game is unclear?

### 4.3 Retention and return behavior
- Do players come back after the first session?
- Do they continue progression?
- Do optional daily/weekly systems later add value or just clutter?

### 4.4 Reliability and technical health
- Are restore flows working?
- Are crashes or content-load failures hurting the main flow?
- Are certain devices experiencing performance or usability problems?

### 4.5 Monetization and reward health later
- If monetization exists later, does it support the product without hurting trust?
- Are optional rewards useful without becoming manipulative?

---

## 5. What Analytics Is Not For

Analytics is not allowed to become the authority for:

- battle truth
- validation truth
- element tagging truth
- content correctness
- whether a manipulative pattern is acceptable just because it improved conversion

### Important rule
A metric may tell us that something is effective.
It does not automatically tell us that it is good for Words 'n Wands!.

---

## 6. Event Taxonomy Direction

Words 'n Wands! should use a small number of clearly named event families.

This taxonomy must stay aligned with `docs/implementation-contracts.md`.

### 6.1 Canonical event families
Preferred families:

- `session.*`
- `encounter.*`
- `progression.*`
- `settings.*`
- `content.*` later if needed
- `challenge.*` later if daily/weekly systems become real
- `store.*` later if monetization becomes real

### 6.2 Current early canonical events
Early milestones should focus on a compact set such as:

- `session.start`
- `session.resume`
- `session.pause`
- `session.end`
- `session.route_viewed`
- `session.recovered_from_persisted_state`
- `encounter.started`
- `encounter.resumed`
- `encounter.cast_submitted`
- `encounter.cast_rejected`
- `encounter.cast_resolved`
- `encounter.creature_spell_triggered`
- `encounter.dead_board_recovered`
- `encounter.won`
- `encounter.lost`
- `encounter.result_viewed`
- `encounter.hidden_bonus_word_discovered`
- `progression.encounter_unlocked`
- `settings.updated`

### 6.3 Naming rule
Event names should be:

- explicit
- boring
- stable
- easy to group and query

Avoid cute or overly compressed names.

---

## 7. Required Event Fields

The stable TypeScript-facing shapes live in `docs/implementation-contracts.md`.

At the product level, analytics events should usually include enough fields to answer questions without leaking too much detail.

### 7.1 Base required fields
Events should generally include:

- event name
- event version
- event ID
- UTC timestamp
- client build ID
- platform
- environment
- app session ID

### 7.2 Gameplay event context fields
Gameplay events should usually include relevant combinations of:

- encounter ID
- encounter session ID
- encounter type
- difficulty tier
- content version pin
- validation snapshot version pin
- battle rules version pin
- word length when relevant
- element when relevant
- matchup result when relevant
- moves remaining when relevant
- rejection reason when relevant
- reward-granted flag for hidden bonus discovery when relevant

### 7.3 Field-minimization rule
Do not attach every possible field to every event.

Only include what helps answer the question the event exists for.

### 7.3.a Hidden bonus discovery event contract
When hidden bonus word flavor is active, emit `encounter.hidden_bonus_word_discovered` only on first successful discovery per encounter session.

Required fields for this event:

- encounter ID
- encounter session ID
- encounter seed version lineage (`content_version_pin`, `validation_snapshot_version_pin`, `battle_rules_version_pin`, `board_generator_version_pin`, `reward_constants_version_pin`)
- `reward_granted` (`0` or `1`)

This event is discovery telemetry only and must not be used to redefine battle outcome semantics.


---

## 8. Privacy and Redaction Rules

Words 'n Wands! should keep analytics useful while remaining privacy-conscious.

### 8.1 Forbidden data in standard analytics payloads
Do not send by default:

- raw cast text
- full board snapshots
- full validation lexicon dumps
- freeform user text
- direct personal identifiers
- unnecessary device fingerprinting data

### 8.2 Why raw cast text is forbidden
Words in this game are the core intellectual action.

The product does not need raw cast strings in standard analytics to answer the most important product questions.

Use safer abstractions like:

- word length
- valid/invalid/repeated outcome
- element
- matchup result

### 8.3 Why full board snapshots are forbidden by default
Full board snapshots are too heavy and too easy to abuse as a catch-all debugging crutch.

If board investigation is needed, prefer:

- deterministic seeds
- version pins
- targeted debug tooling
- controlled non-production logging

### 8.4 Transport-failure rule
Analytics transport failure must be non-blocking.

Gameplay continues even if analytics submission fails.

---

## 9. Activation Metrics and Early Success Signals

For this project, early analytics should focus hard on activation.

### 9.1 Primary early activation questions
- Did the player reach the first encounter?
- Did they submit a cast?
- Did they achieve a first win?
- How long did it take?
- Where did they leave?

### 9.2 High-value early metrics
Important early metrics include:

- install to first open
- first open to starter encounter start
- starter encounter completion rate
- time to first valid cast
- time to first win
- first-session encounter completion count
- first-session fail rate
- first-session abandonment rate

### 9.3 First-win rule
A fast, understandable early win is one of the most important leading indicators for this product.

Analytics should be able to tell whether that is actually happening.

---

## 10. Retention and Return Metrics

Words 'n Wands! should use retention analytics to learn whether the game earns return play honestly.

### 10.1 Core retention metrics
Track at minimum when the product is mature enough:

- D1 retention
- D7 retention
- D28 or D30 retention
- DAU/MAU if relevant
- sessions per user
- average session length

### 10.2 Progression return metrics
Also track useful product-shape metrics such as:

- encounters started per day
- encounters completed per day
- progression unlock rate
- replay rate for star improvement
- challenge-mode participation later

### 10.3 Optionality rule
If daily/weekly side content is added later, analytics should test whether it increases return without making the product feel like homework.

---

## 11. Encounter Fairness Metrics

A major purpose of analytics is to detect when battles are not landing the way the docs intend.

### 11.1 Important fairness signals
Useful fairness signals include:

- invalid-cast rate per encounter
- repeated-word rejection rate per encounter
- average moves remaining on win
- average creature HP remaining on loss
- dead-board recovery frequency
- encounter retry frequency
- encounter quit/abandon rate
- encounter completion rate by difficulty tier

### 11.2 Interpretation rule
These metrics must be interpreted carefully.

A high fail rate does not automatically mean “make it easier.”
It may mean:

- the rules are unclear
- a creature’s identity is confusing
- the UI is hiding state poorly
- the board generation is not fair enough
- the progression ramp is too abrupt

### 11.3 Fairness-over-ego rule
If analytics shows that players are struggling because of readability or ambiguity, fix the game rather than defending the design abstractly.

---

## 12. Reliability and Restore Metrics

The game’s trust depends heavily on resume behavior.

### 12.1 Reliability questions
Analytics should help answer:

- are players restoring into the correct surface?
- are restore failures happening?
- are encounter sessions being duplicated or lost?
- do some routes cause more churn or confusion?

### 12.2 Useful reliability metrics
Examples:

- restore attempt count
- restore success rate
- restore failure rate
- result double-fire detection count
- content load failure rate
- validation snapshot mismatch rate
- crash-adjacent route correlation later if available

### 12.3 Important rule
Reliability analytics is not optional vanity. It is part of battle trust.

---

## 13. Optional Challenge and LiveOps Metrics Later

If daily/weekly or event content becomes real, analytics should still remain scoped and question-driven.

### 13.1 Useful later challenge questions
- Do players notice the challenge entry?
- Do they choose to play it?
- Do they finish it?
- Does it increase return without overshadowing main progression?
- Do the rewards feel worth it without becoming mandatory?

### 13.2 Useful later metrics
- challenge impression rate
- challenge entry rate
- challenge completion rate
- reward claim rate
- repeat participation rate
- event participation by segment later if segmentation exists

### 13.3 No fake urgency rule
Do not use analytics to justify manipulative LiveOps pressure patterns that violate the product tone.

---

## 14. Monetization Metrics Later

Monetization is later-stage and secondary.

### 14.1 Only measure what exists
Do not build a giant monetization analytics structure before monetization is real.

### 14.2 Safe future monetization questions
When monetization exists later, useful questions include:

- Does ad-free improve retention or satisfaction?
- Do cosmetic offerings make sense to players?
- Do rewarded ads feel optional and non-intrusive?
- Does monetization hurt progression trust or battle fairness?

### 14.3 Forbidden interpretation rule
No monetization metric may be used to justify:

- interrupting the active thinking moment
- pay-to-win systems
- manipulative urgency patterns
- cluttering Home with store-first pressure

---

## 15. Experimentation Principles

Experiments should be rare, targeted, and responsible.

### 15.1 Good experiment standard
A good experiment should:

- answer one real product question
- be easy to describe plainly
- preserve fairness
- preserve readability
- be reversible
- be measurable with a small number of clear metrics

### 15.2 Bad experiment standard
A bad experiment is one that:

- changes too many variables at once
- makes battle rules inconsistent without clear reason
- creates different fairness conditions across players in a trust-breaking way
- exists mainly to optimize manipulation or spending

### 15.3 Minimal viable experimentation rule
For a mostly AI-assisted solo project, experimentation should remain modest.

You do not need a big experimentation platform to learn useful things.

---

## 16. Safe Experiment Categories

The safest experiment areas for this product are:

### 16.1 Onboarding clarity
Examples:

- slightly different first-time wording
- different encounter-intro brevity
- starter cue timing

### 16.2 Difficulty tuning
Examples:

- small move-budget adjustments
- countdown tuning
- creature HP tuning
- gentle balance changes to reduce unfair fail states

### 16.3 Progression clarity
Examples:

- next-step button wording
- progression card placement
- star-result presentation

### 16.4 Optional challenge surfacing later
Examples:

- challenge card placement
- challenge framing language
- challenge reminder timing later if notifications exist

These areas are safer than experiments that change core fairness unpredictably.

---

## 17. Unsafe Experiment Categories

The following experiment classes are strongly discouraged or forbidden.

### 17.1 Battle-truth inconsistency experiments
Do not run experiments where one player gets a meaningfully different fairness model without strong justification and explicit control.

Examples of unsafe ideas:

- one variant has easier validation rules
- one variant has a secret extra move
- one variant gets stronger Wand bonuses without obvious product intent

### 17.2 Manipulative monetization experiments
Forbidden examples:

- pressure-popups during active battle
- aggressive loss-state monetization timing
- guilt-driven streak recovery offers

### 17.3 Hidden trust-breaking experiments
Do not run tests that make the game feel like it changed the rules on some players without explanation.

---

## 18. Experiment Design Rules

### 18.1 One-question rule
Each experiment should be framed as one primary question.

### 18.2 One-primary-metric rule
Each experiment should have one primary success metric and a few guardrail metrics.

### 18.3 Guardrail metrics rule
Every experiment should define guardrail metrics such as:

- encounter fail rate
- restore failure rate
- retention drop
- uninstall or opt-out signals later if relevant
- player trust signals where available

### 18.4 Stop-rule requirement
Experiments should define stop conditions before launch.

Examples:

- if fail rate rises beyond threshold
- if D1 retention drops beyond threshold
- if restore issues spike
- if the product feels obviously worse in manual review

### 18.5 Human judgment rule
If an experiment is technically “positive” but clearly harms the game’s tone or fairness, it should still be rejected.

---

## 19. Milestone-Based Analytics Rollout

Analytics should grow with the product.

### 19.1 Milestone 0
Very light or no runtime analytics is acceptable.

Focus on:

- docs
- contracts
- event taxonomy definition

### 19.2 Milestone 1
Implement only the highest-value core events needed to evaluate:

- first-time flow
- first battle
- encounter completion
- restore reliability

### 19.3 Milestone 2
Expand to support:

- progression analysis
- encounter fairness comparisons
- replay behavior

### 19.4 Milestone 3+
Only then grow into:

- optional challenge metrics
- event participation metrics
- monetization metrics later if needed
- more serious experimentation support if justified

### 19.5 No giant analytics platform early
Do not overbuild analytics before the game’s battle loop is proven.

---

## 20. Dashboard and Reporting Rules

### 20.1 Small dashboard rule
Prefer a small number of useful views over many vanity dashboards.

### 20.2 Core dashboard questions
Useful early views should answer:

- where players drop in first session
- how the starter encounter performs
- how standard encounters perform
- where restore fails
- which encounters look suspiciously hard or unclear

### 20.3 Boring reporting is good
A small boring dashboard that answers real questions is better than a flashy dashboard nobody trusts.

---

## 21. Privacy and Storage Rules

### 21.1 Local-first compatibility
The game must remain usable if analytics transport is unavailable or disabled.

### 21.2 Minimal retention rule
Do not store analytics payloads longer than necessary in ways that create unnecessary privacy risk.

### 21.3 Dev-vs-prod rule
Development diagnostics may be more verbose than production analytics, but the distinction must stay clear.

### 21.4 Debugging rule
If deeper debugging is needed, prefer:

- local debug tools
- deterministic seeds
- version pins
- controlled repro logging

before widening standard analytics payloads.

---

## 22. Out of Scope for Early Analytics Work

The following are out of scope for early analytics work unless intentionally documented later:

- giant warehouse-style analytics architecture
- fine-grained monetization optimization before monetization exists
- heavy segmentation frameworks
- social graph analytics before social systems are real
- manipulative experimentation frameworks
- raw cast text collection as standard practice
- full board snapshot collection as standard practice

---

## 23. Summary Rule

Words 'n Wands! should use analytics and experimentation to:

- improve onboarding clarity
- improve battle fairness
- improve restore reliability
- understand return behavior honestly
- evaluate optional reward layers later
- protect player trust rather than undermine it

The analytics system should stay:

- small
- explicit
- privacy-conscious
- question-driven
- subordinate to product truth

If an analytics or experimentation idea makes the game more manipulative, more invasive, more confusing, or more dependent on metrics than on judgment and fairness, it should not be treated as an improvement.
