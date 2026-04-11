# Words 'n Wands! Accessibility, Localization, and Device Support

This document defines the accessibility, localization, and device-support expectations for Words 'n Wands!.

Its purpose is to keep the game:

- readable
- playable without unnecessary strain
- understandable on ordinary Android phones
- friendly to a broad audience
- maintainable for a mostly AI-assisted solo project

This is the product-level source of truth for:

- accessibility expectations
- localization boundaries
- device support priorities
- one-handed usability constraints
- readability and reduced-motion expectations
- early-stage responsive behavior rules

If future code, screens, or art direction disagree with this document, this document should be treated as the accessibility/localization/device-support rulebook until intentionally updated.

---

## 1. Core Philosophy

Accessibility in Words 'n Wands! is not an optional polish layer.

It is part of gameplay clarity.

A player should be able to:

- understand the battle state quickly
- read the board comfortably
- tell what changed after a cast
- play with sound off
- play with haptics off
- recover from interruption without confusion
- use the game one-handed on an ordinary phone

Words 'n Wands! should not depend on:

- tiny text
- color-only meaning
- hard-to-see tile differences
- audio-only information
- excessive motion
- UI clutter
- device-specific tricks that break on common Android hardware

When accessibility or device-support decisions conflict, Words 'n Wands! should prefer:

1. readability
2. battle clarity
3. low-friction interaction
4. one-handed practicality
5. stable behavior on ordinary phones
6. family-friendly approachability

over visual flash, novelty, or decorative excess.

---

## 2. Scope of This Document

This document owns:

- visual readability expectations
- input and one-handed usability expectations
- non-color-only information rules
- sound-off and haptics-off usability rules
- reduced-motion expectations
- English-only v1 localization boundaries
- future localization preparation rules
- Android phone support priorities
- early tablet/foldable handling rules

This document does **not** own:

- battle mechanics
- damage math
- word-validation policy
- creature tuning
- asset style direction in full detail
- persistence architecture
- analytics behavior

Those belong in other docs.

---

## 3. Accessibility Baseline Rules

Words 'n Wands! should be fully understandable during ordinary play with:

- sound off
- haptics off
- no reliance on color alone
- no reliance on hidden tutorial memory

### Core accessibility baseline
At minimum, the player must always be able to understand:

- remaining moves
- creature HP
- creature weakness
- creature resistance
- cast countdown
- tile states
- Wand tile presence
- whether a cast was valid, invalid, repeated, weak, neutral, or resisted
- whether the encounter was won or lost

without requiring:

- audio cues
- haptic cues
- color-only meaning
- long reading during active play

### Practical rule
If a player can only understand a battle state because they heard a sound or noticed a color shift, the design is incomplete.

---

## 4. Visual Readability Rules

### 4.1 Board readability rule
The 6x6 board is the most important interactive surface.

It must remain:

- large enough to read comfortably
- visually stable
- uncluttered
- easy to parse during movement and refill

The board must not be crowded out by HUD or decorative art.

### 4.2 Typography rule
Text should prioritize clarity over style.

Early UI should use:

- a simple, highly readable sans-serif UI font
- stable text weights
- conservative font size changes
- very limited decorative typography

Do not require stylized fantasy fonts for core readability.

### 4.3 Contrast rule
Core interactive information must be readable against its background.

This includes:

- letters on tiles
- HUD labels
- move count
- HP text
- damage numbers
- weakness/resistance labels
- result text
- button labels

If decorative art reduces readability, the art should lose.

### 4.4 Text-on-art rule
Avoid placing important UI text directly over busy creature art or textured fantasy backgrounds unless there is a strong contrast layer behind it.

### 4.5 Decorative-restraint rule
The interface should feel polished and magical, but should not become a glow-heavy fantasy blur.

---

## 5. No Color-Only Meaning Rules

Words 'n Wands! must not rely on color alone to communicate important information.

### 5.1 Weakness and resistance
Weakness and resistance must use:

- icon
- text label
- stable placement

Color may support them, but must not be the only signal.

### 5.2 Tile states
Each tile state must be distinguishable without requiring color interpretation alone.

This includes at least:

- Frozen
- Sooted
- Dull
- Bubble
- Wand tile marker

These should use combinations of:

- icon badge
- overlay shape
- pattern
- outline treatment
- stable animation cue where appropriate

### 5.3 Cast result feedback
Valid, invalid, repeated, weakness, resistance, and neutral outcomes should not depend on color alone.

The player should also receive:

- text
- iconography
- clear placement
- readable motion cues

### 5.4 Result states
Win and loss states should not rely on green-versus-red treatment alone.

---

## 6. Interaction and One-Handed Usability Rules

Words 'n Wands! is portrait-first and should assume ordinary one-handed phone play matters.

### 6.1 One-handed principle
The most repeated actions should be reachable and usable comfortably with one hand on a normal phone.

### 6.2 Touch target rule
Touch targets should be generous.

For Words 'n Wands!, early product targets should generally aim for roughly **48dp-equivalent** minimum touch areas wherever practical for buttons and other tap controls.

The board itself is a swipe surface, not a grid of tiny independent tap-only buttons.

### 6.3 Swipe-path clarity rule
The player should be able to tell:

- which tile the trace started on
- which tiles are currently included
- the current word order
- whether a path is still being accepted

### 6.4 Trace-forgiveness rule
Normal board interaction should tolerate slight finger drift so long as the intended path is still clear and legal.

The game should not feel fussy or brittle.

### 6.5 Edge-placement rule
Avoid putting the most critical repeated controls in hard-to-reach top-corner positions unless that surface is used infrequently.

### 6.6 Pause/settings rule
Pause or settings access may live near the top because it is not a repeated primary action, but it still must remain readable and usable.

### 6.7 Assistive-input parity for board lock windows
Assistive input pathways (for example accessibility services that emit touch-equivalent gestures) must follow the same board lock behavior as direct touch input.

During valid-cast resolution and creature-spell resolution lock windows:

- board input is ignored/discarded
- no queued or deferred auto-submit behavior is allowed for gestures captured during the lock
- interactivity resumes only when control returns at the documented control-return step

Cross-reference contracts:

- `docs/implementation-contracts.md` section 5.1.1 (resolution-lock input discard rule)
- `docs/screens-and-session-flow.md` sections 12–13 (control-return interaction timing)

---

## 7. Motion and Reduced-Motion Rules

Motion should support understanding, not compete with it.

### 7.1 Core motion rule
Animation should clarify:

- cast confirmation
- tile removal
- board collapse
- refill
- damage application
- creature action
- result transition

If motion makes those things harder to track, it is not helping.

### 7.2 Reduced-motion support rule
The game should support a reduced-motion-friendly presentation path.

Reduced-motion behavior should generally:

- shorten transition durations
- reduce decorative particles
- reduce screen shake
- reduce dramatic zoom or bounce
- preserve the resolution order and clarity of state changes

### 7.3 Essential-motion rule
Essential motion that explains gameplay state may stay, but should become more restrained.

### 7.4 Decorative-motion rule
Decorative motion is the first thing to cut down when readability or performance suffers.

### 7.5 No surprise-flash rule
Avoid sudden large flashes, aggressive shaking, or chaotic screen-wide effects in ordinary encounters.

That is bad for both accessibility and tone.

---

## 8. Audio and Haptics Accessibility Rules

### 8.1 Sound-off usability rule
The game must remain fully playable and understandable with sound off.

Important gameplay information must not be delivered through audio alone.

### 8.2 Haptics-off usability rule
The game must remain fully playable and understandable with haptics off.

Haptics should reinforce interaction, not define it.

### 8.3 Feedback redundancy rule
Where feedback matters, use multiple channels when practical:

- visual
- text
- icon
- optional sound
- optional haptics

### 8.4 Voice and spoken-audio rule
If the game later adds spoken tutorial lines, narration, or voiced flavor content:

- captions/subtitles must be available
- spoken content must not be required to understand battle-critical behavior

### 8.5 Audio-controls rule
At minimum, the game should eventually support:

- sound effects on/off or slider
- music on/off or slider
- haptics on/off

These belong in lightweight settings, not a complicated options labyrinth.

---

## 9. Readability of Battle-Critical Information

### 9.1 Always-visible battle information
During active battle, the player should always be able to see:

- moves remaining
- creature HP bar
- creature HP numeric value
- weakness
- resistance
- cast countdown

### 9.2 Stable placement rule
Battle-critical information should remain in stable locations.

The player should not have to hunt for it.

### 9.3 Damage-feedback readability
Damage numbers and multiplier feedback should be readable, brief, and not visually overwhelming.

### 9.4 Current-trace readability
The currently traced word should remain legible while swiping.

### 9.5 Board-state readability
After each cast or creature spell, the player should be able to understand the new board state quickly.

This is an accessibility issue, not just polish.

---

## 10. English-Only v1 Localization Rules

Words 'n Wands! is currently English-only in v1.

### 10.1 Current supported language
For v1, the supported UI and validation language is:

- English

### 10.2 No implied multi-language support
The app should not imply language support it does not actually provide.

### 10.3 Word-system rule
Because the validation system is English-only in v1, future UI localization must not quietly imply that battle word input is localized too unless the validation/content stack actually supports that language.

### 10.4 Clear-language-boundary rule
UI language support and battle lexicon support are related but separate systems.

The product should not fake one with the other.

---

## 11. Future Localization Preparation Rules

Even though v1 is English-only, the codebase should avoid making future localization harder than necessary.

### 11.1 Externalized string rule
Player-facing UI strings should be stored in a centralizable/localizable way rather than hardcoded all over screens.

### 11.2 No critical text baked into art
Do not bake important UI text into image assets if avoidable.

This is especially important because the project should remain maintainable with limited art-pipeline skill.

### 11.3 Short-label preference
Use concise, clear labels where possible.

Shorter UI text is easier to localize later and easier to fit on smaller devices now.

### 11.4 Avoid fragile wordplay in core UI
Do not make battle-critical UI depend on language-specific puns or jokes that will be painful to localize later.

Flavor text can be a little more playful. Core interface text should stay plain.

### 11.5 Icon support rule
Where appropriate, pair text with icons so future localization pressure is reduced.

---

## 12. Device Support Priorities

Words 'n Wands! is Android-first.

The game should optimize for ordinary Android phones first.

### 12.1 Primary supported device class
The primary target device class is:

- standard Android phones
- portrait orientation
- touch-first play
- one-handed-friendly use

### 12.2 Portrait-first rule
The game should assume portrait is the intended orientation.

Landscape support is not required for v1 unless intentionally documented later.

### 12.3 Ordinary-phone-first rule
Early UI decisions should be tested against normal phone screens first, not ultra-large tablets or desktop-sized layouts.

### 12.4 Lower-end realism rule
The game should remain sane on non-flagship Android hardware.

That means:

- readable UI
- stable frame pacing where possible
- no dependence on heavy visual effects to communicate battle truth

---

## 13. Early Tablet and Foldable Rules

### 13.1 Non-priority rule
Dedicated tablet and foldable optimization is not a core early priority.

### 13.2 Must-not-break rule
Even if not optimized, the app should not become unusable or absurdly stretched on larger devices.

### 13.3 Safe large-screen rule
On larger screens, early layouts may:

- center content
- constrain max content width
- preserve portrait-style composition
- avoid stretching the board into an awkward oversized empty layout

### 13.4 No custom large-screen system early
Do not build a full tablet-specific UI system before the normal phone experience is strong.

---

## 14. Performance and Clarity Rules

Accessibility and performance are related.

If the game drops clarity under load, the experience becomes harder to use.

### 14.1 Performance-priority rule
When performance tradeoffs are necessary, preserve:

- board readability
- cast resolution clarity
- input responsiveness
- stable restore behavior

before preserving decorative visual flair.

### 14.2 Decorative-degradation rule
If a device struggles, the game should degrade:

- particles
- layered glows
- extra decorative animation
- non-essential motion

before degrading core gameplay readability.

### 14.3 Input-responsiveness rule
Swipe interaction must remain responsive on ordinary Android hardware.

If fancy effects make input feel laggy, the effects are wrong.

---

## 15. Family-Friendly Presentation Accessibility Rules

Because the game is intentionally broad-audience and family-friendly, accessibility also includes emotional readability.

### 15.1 Calm-feedback rule
Error states, invalid-word states, and losses should be communicated clearly without aggressive or shaming language.

### 15.2 Friendly-framing rule
The game should avoid UI that feels:

- hostile
- humiliating
- threatening
- harshly punitive

### 15.3 Creature-tone rule
Creature visuals and names should remain expressive and readable without drifting into horror or grotesque design that clashes with the product’s family-friendly identity.

---

## 16. Manual Accessibility Checks

Before a milestone is treated as trustworthy, the following manual checks should be run where relevant.

### 16.1 Core readability checks
- Can the board be read comfortably on a normal phone?
- Can the player identify moves, HP, weakness, resistance, and countdown quickly?
- Are tile states understandable without color alone?
- Is damage feedback readable without being noisy?

### 16.2 Sound/haptics checks
- Is the game fully understandable with sound off?
- Is the game fully understandable with haptics off?

### 16.3 Motion checks
- Is the resolution order still readable with reduced motion enabled or simulated reduced-motion behavior?
- Do any effects feel flashy enough to interfere with play?

### 16.4 One-handed checks
- Can a normal player reach the repeated battle loop comfortably with one hand?
- Are common actions placed sensibly?

### 16.5 Interrupt/resume checks
- After backgrounding and restoring, is the battle state still understandable at a glance?
- Does restore preserve clarity, not just raw data?

### 16.6 Large-text sanity checks
- Does modest text scaling still preserve the main battle flow?
- Do labels clip or overlap in obvious ways?

---

## 17. Out of Scope for Early Accessibility/Localization Support

The following are out of scope for early support unless later documented:

- full multilingual validation/word-input support
- bespoke tablet-only interfaces
- complex screen-reader-first redesigns for the board interaction model
- heavy spoken narrative systems
- localization for dozens of languages before the core English game is proven
- accessibility settings pages bloated with rarely used controls

These may be explored later, but should not distract from building a clear, fair core game first.

---

## 18. Summary Rule

Words 'n Wands! should be accessible and device-safe by default through:

- readable UI
- generous touch behavior
- one-handed practicality
- sound-off and haptics-off usability
- non-color-only information
- restrained motion
- English-only clarity in v1
- future localization preparation without premature complexity
- Android-phone-first support
- graceful behavior on larger or lower-end devices

If a future UI or art decision makes the game harder to read, harder to understand, harder to play one-handed, or more dependent on sound, color, or motion, it should not be treated as an improvement.
