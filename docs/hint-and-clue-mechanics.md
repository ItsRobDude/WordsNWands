# Words 'n Wands! Hint and Clue Mechanics

This document defines canonical player-invoked clue behavior for Words 'n Wands!.

Its purpose is to keep clue assists:

- readable
- fair
- bounded
- non-pay-to-win
- implementation-safe across UI, rules, persistence, and analytics

If clue behavior in prototypes or code disagrees with this document, this document is the source of truth until intentionally updated.

---

## 1. Milestone Availability and Visibility

### 1.1 Earliest milestone for player-invoked clues
Player-invoked clues may first appear in **Milestone 3** as optional challenge-layer support.

### 1.2 Must-remain-hidden milestones
Player-invoked clues must remain fully hidden in **Milestone 0, Milestone 1, and Milestone 2**.

Hidden means:

- no clue button in battle HUD
- no clue inventory/counter in results or Home
- no clue tutorial cue
- no clue reward or purchase offer

### 1.3 Starter-flow lock
Starter flow remains clue-hidden even after Milestone 3 unless a later doc update explicitly allows starter-clue visibility.

### 1.4 Spark Shuffle distinction
Automatic Spark Shuffle dead-board recovery is system safety behavior, not a clue action, and remains available independent of clue rollout.

---

## 2. Canonical Clue Action Set

Only the following clue actions are canonical.

### 2.1 `reveal_starter_letter`
Reveal one valid starting tile for at least one currently legal word.

### 2.2 `highlight_legal_path`
Highlight exactly one full currently legal path for one valid word candidate.

### 2.3 `reroll_local_tiles`
Reroll exactly `X = 4` non-special, non-locked tiles, preserving board dimensions and refill legality.

No other clue action is allowed without additive update to this document and `docs/implementation-contracts.md`.

---

## 3. Per-Action Constraints

All clue actions share these global constraints:

- clue actions are denied if encounter state is not `in_progress`
- clue actions are denied during creature-spell lock windows
- clue actions are denied when no clue charge is available
- clue use must be explicit player intent (no auto-fire)

### 3.1 `reveal_starter_letter`
- **Max uses per encounter:** `2`
- **Cooldown:** `2` successful casts before next use
- **Move/countdown interaction:** consumes **no move**; immediately decrements creature countdown by `1` (minimum `0`)
- **Star interaction:** if used at least once in a run, cap result to `max 2 stars`

### 3.2 `highlight_legal_path`
- **Max uses per encounter:** `1`
- **Cooldown:** none (single-use by encounter cap)
- **Move/countdown interaction:** consumes **no move**; immediately decrements creature countdown by `1` (minimum `0`)
- **Star interaction:** if used, cap result to `max 2 stars`

### 3.3 `reroll_local_tiles`
- **Max uses per encounter:** `1`
- **Cooldown:** none (single-use by encounter cap)
- **Move/countdown interaction:** consumes **1 move** and decrements creature countdown by `1`; if this reaches `0`, normal creature spell trigger rules still apply
- **Star interaction:** if used, cap result to `max 1 star`

### 3.4 Anti-abuse constraints
- Cannot chain two clue uses back-to-back without at least one valid cast in between.
- Clue use cannot bypass terminal encounter commit; denied after win/loss/recoverable_error state commit.
- Clue effects must be derived from current legal-board truth (no stale precomputed hints from earlier board snapshots).

---

## 4. Economy Guardrails

## 4.1 Earning sources
Clue charges may be earned from:

- optional challenge completion rewards
- one-time onboarding gifts (post-starter only)
- daily login streak milestone rewards only if a later soft-streak rollout explicitly enables that earn path

### 4.1.1 First live clue rollout rule
The first live clue rollout in **Milestones 3-5** is earn-only.

Allowed first-live earn sources:

- optional challenge completion rewards
- one-time post-starter grants

Disabled for first live rollout:

- purchased clue bundles
- ad-view clue grants
- streak-only clue dependency

### 4.2 Purchase boundaries
Allowed purchase surface later (Milestone 6+ only):

- capped clue bundles with explicit quantity and expiry/season scope if used

Not allowed:

- unlimited clue subscriptions
- infinite refill purchases
- in-encounter emergency direct-buy prompts

### 4.3 Daily cap rules
- **Global earn cap:** max `3` earned clue charges per UTC day.
- **Global purchase cap:** max `3` purchased clue charges per UTC day.
- **Inventory carry cap:** max stored clue charges `9`.
- Overflow above cap is discarded; it must not convert into power currency.

### 4.4 Strict anti-pay-to-win parity constraints
- Paying players must remain bound by the exact same per-encounter clue action caps and cooldowns as non-paying players.
- Paying players must remain bound by the same star-cap penalties from clue use.
- No purchase path may remove countdown penalties, move costs, or per-encounter clue limits.
- Competitive or comparative modes (if introduced later) must either disable clues or enforce identical clue budgets independent of spend.

---

## 5. Cross-Document Implementation Notes

Implementation contracts are pinned in `docs/implementation-contracts.md` section 8.2.a and section 12.

Screen/flow behavior integration is pinned in `docs/screens-and-session-flow.md` section 14.

Progression/economy integration is pinned in `docs/progression-economy-and-monetization.md` section 8.6.
