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

### 3.5 Canonical candidate selection order (`reveal_starter_letter`, `highlight_legal_path`)

To lock deterministic clue behavior across runtime, persistence, analytics, and QA, both clue actions use the exact same candidate-selection pipeline.

#### 3.5.1 Candidate enumeration order
- Enumerate candidate words by scanning board start positions in **row-major** order (`row` ascending, then `col` ascending).
- For each start position, enumerate legal adjacency paths using deterministic neighbor iteration order:
  1. up-left `(-1, -1)`
  2. up `(-1, 0)`
  3. up-right `(-1, +1)`
  4. left `(0, -1)`
  5. right `(0, +1)`
  6. down-left `(+1, -1)`
  7. down `(+1, 0)`
  8. down-right `(+1, +1)`
- Paths cannot reuse tiles, must satisfy minimum length (`>= 3`), and must produce a normalized dictionary-valid word for the active validation snapshot.

#### 3.5.2 Filtering precedence (tile-state then repeated-word)
For each enumerated candidate path, apply filters in this strict order:
1. **Tile-state selection eligibility filter:** reject paths containing any currently unselectable tile state (v1: Frozen).
2. **Lexicon validity filter:** reject paths whose normalized word is not castable in the active snapshot.
3. **Repeated-word filter:** reject paths whose normalized word exists in encounter `repeated_words`.

Filter ordering is mandatory and must not be reordered by optimization shortcuts.

#### 3.5.3 Priority sort (for remaining candidates)
Sort surviving candidates by this comparator chain:
1. **Word length:** descending (longer first).
2. **Normalized lexical order:** ascending (`a`..`z`).
3. **Board-position order:** path tuple order ascending by first differing `(row, col)` pair.

After sorting, the first candidate (`index 0`) is canonical.

#### 3.5.4 Action-specific chosen output
- `reveal_starter_letter`: reveal the first tile (`path[0]`) of canonical candidate `index 0`.
- `highlight_legal_path`: highlight the full path of canonical candidate `index 0`.

#### 3.5.5 RNG usage and stream label
- `reveal_starter_letter` and `highlight_legal_path` consume **zero RNG draws**.
- No RNG stream label is used for candidate selection in v1.
- Implementations must not advance any encounter RNG stream state while resolving these two clue actions.

#### 3.5.6 Worked example (QA lock)

Board (`.` means irrelevant filler for this example):

| r\c | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | S | T | O | N | E | . |
| 1 | G | L | O | W | . | . |
| 2 | . | . | . | . | . | . |
| 3 | . | . | . | . | . | . |
| 4 | . | . | . | . | . | . |
| 5 | . | . | . | . | . | . |

Assumptions for this locked example:
- Legal words in active snapshot include `stone` and `glow`.
- `repeated_words = []`.
- No tile has a blocking state (no Frozen tiles).

Valid candidate set after filtering:
- `STONE`, path `[(0,0),(0,1),(0,2),(0,3),(0,4)]`, length `5`
- `GLOW`, path `[(1,0),(1,1),(1,2),(1,3)]`, length `4`

Sorted winner is `STONE` (longer word).

Canonical action outputs:
- `reveal_starter_letter` reveals tile `(0,0)` letter `S`.
- `highlight_legal_path` highlights `[(0,0),(0,1),(0,2),(0,3),(0,4)]`.

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
