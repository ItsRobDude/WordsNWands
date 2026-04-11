# Copy Locks and Voice Guide

This document is the source of truth for player-facing language in Words 'n Wands!.

Use it when writing:
- UI labels and helper text
- onboarding/tutorial text
- battle feedback text
- error and validation messages
- results/progression messaging
- accessibility text that players will read/hear

For gameplay rules, always defer to `docs/game-rules.md` and `docs/word-validation-and-element-rules.md`.
This guide controls tone and wording, not rule semantics.

---

## 1. Voice goals

Words 'n Wands! copy should feel:
- magical
- warm and family-friendly
- clear in short sessions
- encouraging without being childish
- confident without sounding harsh or competitive

### Practical tone rules
- Prefer plain, readable words over fantasy jargon.
- Keep most strings short (phone-first readability).
- Use active voice.
- Tell the player what happened and what they can do next.
- Avoid sarcasm, mockery, or punitive framing.

---

## 2. Core language locks

These terms are product-facing defaults and should stay consistent unless a focused doc explicitly overrides them.

- Player action: **cast** (a word), not “submit” as the primary fantasy term.
- Valid word feedback: **Valid word** / **Not in dictionary**.
- Move economy: **Moves**.
- Opponent health: **Creature HP** (or **HP** where space is constrained).
- Damage source: **Word power** (with element/context qualifiers when needed).
- Session state: **Battle**.
- Outcome framing: **Victory** / **Defeat**.

### Forbidden tone patterns
- Violent, gory, or cruel wording.
- Shame-based failure text (for example, “You failed badly”).
- Hard paywall pressure language during core battle flow.

---

## 3. Message design patterns

### Validation and errors
- Be specific and neutral.
- Prefer: “That word is not in the dictionary.”
- Avoid: “Invalid entry.”

### Recovery prompts
- Offer a next action when possible.
- Prefer: “No valid words found. Shuffle and try again.”

### Success feedback
- Celebrate briefly, then return focus to play.
- Prefer: “Great cast!” over long flavor text during active turns.

### Defeat feedback
- Preserve player trust and momentum.
- Prefer: “Defeat. Try a new approach with element matching.”

---

## 4. Accessibility and localization guardrails

- Avoid idioms that do not localize well.
- Avoid relying on color words alone to explain state.
- Keep punctuation simple and screen-reader friendly.
- Prefer stable terminology; do not rename core concepts between screens.

For broader constraints, defer to `docs/accessibility-localization-and-device-support.md`.

---

## 5. Ownership and change control

Any change to core terms in Section 2 should include:
1. rationale
2. affected surfaces (screens/components)
3. migration notes for existing strings
4. confirmation that no gameplay meaning changed

If copy needs conflict with a gameplay document, apply the conflict template from `AGENTS.md` and resolve explicitly.
