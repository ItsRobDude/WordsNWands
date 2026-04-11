# Words 'n Wands! Milestone Locked Constants

This document pins milestone-scoped constants so implementation does not drift during active development.

Use this file as the numeric and scope lock source of truth for Milestone 1 (M1) and Milestone 2 (M2).

If a constant in this file changes, update `docs/implementation-contracts.md` version pins in the same change.

---

## 1. Locking intent and usage

These constants exist to:

- prevent speculative tuning churn during milestone implementation
- keep app/runtime behavior aligned with documented milestone targets
- make reviews deterministic when multiple contributors touch battle/progression code

Rules:

- treat all constants below as locked unless explicitly revised by doc update
- do not introduce milestone-specific constants ad hoc in code without adding them here first
- if implementation and this file diverge, fix the implementation or update this file intentionally (never silently)

---

## 2. M1 required constants

### 2.1 Starter encounter baseline (required)

- starter move budget: `12`
- starter creature HP: `56`
- starter creature base countdown: `5`

These values match the Milestone 1 starter tuning lock in `docs/creature-and-encounter-rules.md`.

### 2.2 Allowed tile-state families in M1

M1 allows only the current standard negative tile-state family:

- `frozen`
- `sooted`
- `dull`
- `bubble`

No additional tile-state families are in scope for M1.

---

## 3. M2 progression constants

### 3.1 Mainline chapter and encounter shape (locked for M2)

- chapter count: `3`
- encounters per chapter: `3`
- total M2 mainline encounters (excluding starter): `9`

### 3.2 Default move-budget bands by tier (M2 defaults)

These are default authored move budgets used for initial M2 progression content. Encounter-specific overrides still require explicit justification.

- `gentle`: `12-13`
- `standard`: `10-11`
- `challenging`: `9-10`
- `boss`: `11-12`

`event` does not have a default M2 campaign move-budget band because event content is out of milestone scope.

### 3.3 Reward and journal constants (locked)

Use these values as the only canonical reward constants for authored content, runtime writes, and player-facing reward messaging.

#### 3.3.a Encounter first-clear rewards

- first-clear cosmetic currency grant: `20`
- first-clear journal progress increment (if enabled by encounter reward definition): `+1`

#### 3.3.b Star-improvement rewards

- 1-star -> 2-star improvement cosmetic currency grant: `5`
- 2-star -> 3-star improvement cosmetic currency grant: `10`
- total lifetime star-improvement cosmetic currency cap per encounter: `15`
- star-improvement journal progress increment: `0` (none)

#### 3.3.c Challenge reward amounts and caps

- daily challenge completion cosmetic currency grant: `12`
- weekly challenge completion cosmetic currency grant: `40`
- daily challenge cosmetic currency cap (UTC day): `24` (max 2 claimed daily challenge rewards)
- weekly challenge cosmetic currency cap (UTC week): `80` (max 2 claimed weekly challenge rewards)
- challenge journal progress increment per successful claim: `+1`
- challenge journal progress cap (UTC week): `3`

#### 3.3.d Journal progression constants

- encounter first-clear journal increment: `+1`
- challenge claim journal increment: `+1`
- journal progress points required per creature entry unlock: `3`
- max journal progress points granted per creature from encounter rewards: `3`

#### 3.3.e Clue economy lock values (M3+)

- daily earned clue charge cap (UTC day): `3`
- daily purchased clue charge cap (UTC day): `3`
- max stored clue inventory: `9`
- per-encounter clue action usage/cooldown/star-cap lock references:
  - `reveal_starter_letter`: max uses `2`, cooldown `2` successful casts, star cap `2`
  - `highlight_legal_path`: max uses `1`, cooldown `0` (single-use), star cap `2`
  - `reroll_local_tiles`: max uses `1`, cooldown `0` (single-use), star cap `1`

If any clue-economy numbers change, update this section first, then update every mirrored reference in other docs/contracts in the same change.

---

## 4. Explicit not-in-milestone lists

### 4.1 Not in M1

- adding new tile-state families beyond `frozen`, `sooted`, `dull`, `bubble`
- introducing chapter progression or chapter UI as primary flow
- adding boss/event tuning tracks
- adding dynamic per-player difficulty adaptation
- adding monetization-linked move-budget changes

### 4.2 Not in M2

- changing M2 chapter count from `3` without explicit milestone-plan update
- adding branching chapter topology (M2 remains `chapter_linear_v1`)
- adding event progression lanes as mainline requirements
- exposing move-purchase/revive systems that alter locked move-budget expectations
- introducing additional difficulty tiers beyond `gentle`, `standard`, `challenging`, `boss`, `event`

---

## 5. Change-control rule (required)

Any constant change in this file requires all of the following in the same change:

1. update this document with the revised constant values and rationale
2. update milestone references when needed (for example in `docs/milestone-implementation-plan.md`)
3. update version pin fields in `docs/implementation-contracts.md` so restore/debug metadata reflects the new contract surface

No constant change is complete until all three are done.
