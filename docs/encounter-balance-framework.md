# Words 'n Wands! Encounter Balance Framework

This document defines how encounter authors derive numeric difficulty values from explicit balance targets.

It is the source of truth for:

- expected-cast profile assumptions by tier
- HP derivation from target casts-to-defeat
- move-budget and base-countdown derivation from target fail-rate targets
- invalid high-pressure combinations
- playtest graduation gates for encounter shippability

This framework should be used together with:

- `docs/game-rules.md` (current damage and countdown mechanics)
- `docs/creature-and-encounter-rules.md` (encounter behavior constraints and fairness rules)

---

## Severity model for balance rules

Every balance rule in this document must declare one of the following severities:

- `error`: block ship until fixed or waived by approved exception policy
- `warn`: may ship only with an authored waiver
- `info`: advisory only; does not block ship

Tooling must emit rule-level findings using this severity model so encounter status is machine-derivable (Section 8).

---

## 1. Inputs and constants

### 1.1 Damage constants (canonical source + version pin)
Encounter balance calculations must use the canonical damage contract:

- `docs/implementation-contracts.md` → **Section 5.2.1, “Damage Model v1 (canonical)”**

Required model version for this framework:

- `damage_model_version = damage_model_v1`

Damage Model v1 fingerprint string (must match canonical and gameplay docs exactly):

- `DMV1|base=8+3*(L-3)+max(0,L-5)|matchup=1.5,1.0,0.7,1.0|wand=1.25|soot=0.75|round=half_up|min=1`

Authoring/validation tools must fail balance computation if:

- `damage_model_version` is missing, or
- `damage_model_version !== 'damage_model_v1'`

### 1.2 Countdown behavior assumption
Use the current countdown stall rule while projecting spell cadence:

- weakness casts stall countdown decrement for that cast
- all other successful casts decrement countdown by `1`

Expected decrement per successful cast:

`expectedCountdownDeltaPerCast = 1 - weaknessHitRate`

Expected successful casts between creature spells:

`castsPerSpellCycle = baseCountdown / expectedCountdownDeltaPerCast`

---

## 2. Standard expected-cast profile assumptions by tier

Authors should start with these baseline profile assumptions before creature-specific adjustments.

| Tier | Avg word length | Weakness hit rate | Wand incidence | Soot exposure |
| :--- | :---: | :---: | :---: | :---: |
| Gentle | 4.0 | 0.28 | 0.18 | 0.12 |
| Standard | 4.3 | 0.34 | 0.20 | 0.15 |
| Challenging | 4.6 | 0.38 | 0.22 | 0.19 |
| Boss | 4.8 | 0.42 | 0.24 | 0.22 |
| Event (default) | 4.6 | 0.36 | 0.22 | 0.20 |

### 2.1 How to treat profile assumptions
- These are default planning assumptions for first-pass authoring, not immutable player promises.
- If an encounter intentionally differs (for example, anti-Wand creature or heavy-soot identity), document the overridden assumptions in encounter data review notes.
- Tooling should record both the tier default profile and the authored profile override for auditability.

---

## 3. HP derivation from target casts-to-defeat

### 3.1 Compute expected damage per successful cast
For each tier/profile, compute expected multipliers:

- `expectedMatchupMultiplier = weaknessHitRate * 1.5 + (1 - weaknessHitRate) * 1.0`
- `expectedWandMultiplier = 1 + (wandIncidence * 0.25)`
- `expectedSootMultiplier = 1 - (sootExposure * 0.25)`
- `expectedBaseDamage = 8 + 3 * (avgWordLength - 3) + max(0, avgWordLength - 5)`

Then:

`expectedDamagePerCast = expectedBaseDamage * expectedMatchupMultiplier * expectedWandMultiplier * expectedSootMultiplier`

### 3.2 Convert target casts-to-defeat into HP
Given `targetCastsToDefeat` from tier pacing guidance:

`rawHp = targetCastsToDefeat * expectedDamagePerCast`

Then quantize for authoring readability:

- Standard encounters: round to nearest multiple of `2`
- Boss/Event encounters: round to nearest multiple of `4`

Final authored HP:

`authoredHp = max(1, quantized(rawHp))`

#### 3.3 Suggested target casts-to-defeat defaults
Use the midpoints of current pacing bands unless explicitly overridden:

- Gentle: `6`
- Standard: `7`
- Challenging: `8`
- Boss: `9.5`
- Event (default): `8`

---

## 4. Move budget and base countdown from fail-rate band

### 4.1 Fail-rate bands (authoring targets)
- Low pressure: target fail rate `8-15%`
- Medium pressure: target fail rate `16-28%`
- High pressure: target fail rate `29-40%`

Standard progression encounters should usually stay in Low or Medium.
High pressure is generally for boss/event or explicitly marked challenge nodes.

#### 4.1.a Concrete thresholds and severity

| Rule ID | Condition | In-band requirement | Out-of-band result |
| :--- | :--- | :--- | :--- |
| `BF-FAIL-001` | Standard encounter fail-rate band selection | band must be `Low` or `Medium` | `warn` if `High` and waiver present; `error` if `High` without waiver |
| `BF-FAIL-002` | Non-standard encounter fail-rate band selection | Boss/Event may use `Low`, `Medium`, or `High` | `info` when `High` is used (for audit visibility) |

### 4.2 Derive move budget
Let:

- `targetCastsToDefeat` from Section 3
- `efficiencySlack` by fail-rate band:
  - Low: `+55%`
  - Medium: `+35%`
  - High: `+20%`

Compute:

`rawMoveBudget = targetCastsToDefeat * (1 + efficiencySlack)`

Authoring move budget:

`moveBudget = ceil(rawMoveBudget)`

### 4.3 Derive base countdown
Choose target spells-triggered-on-path-to-victory (`targetSpellCountOnWin`) by fail-rate band:

- Low: `1-2`
- Medium: `2-3`
- High: `3-4`

Concrete midpoint defaults remain:

- Low: `1.5`
- Medium: `2.5`
- High: `3.5`

| Rule ID | Condition | In-band requirement | Out-of-band result |
| :--- | :--- | :--- | :--- |
| `BF-SPELL-001` | Authored `targetSpellCountOnWin` for Low | `1.0-2.0` inclusive | `warn` |
| `BF-SPELL-002` | Authored `targetSpellCountOnWin` for Medium | `2.0-3.0` inclusive | `warn` |
| `BF-SPELL-003` | Authored `targetSpellCountOnWin` for High | `3.0-4.0` inclusive | `warn` |

Use midpoint for first pass (`1.5`, `2.5`, `3.5` respectively).

Compute expected casts per spell:

`targetCastsPerSpell = targetCastsToDefeat / targetSpellCountOnWin`

Then solve for base countdown with weakness stall in play:

`rawBaseCountdown = targetCastsPerSpell * (1 - weaknessHitRate)`

Clamp to tier guardrails from `docs/creature-and-encounter-rules.md`, then round to nearest integer.

---

## 5. Invalid high-pressure combination guardrails

Any encounter matching one of these rows must be rejected or explicitly escalated as boss/event exception content.

| Combo ID | HP pressure | Move pressure | Countdown pressure | Disruption pressure | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| G1 | HP at or above tier `p90` | Move budget at or below tier `p25` | Base countdown at or below tier minimum | Any moderate+ disruption | Invalid |
| G2 | HP at or above tier `p80` | Move budget at or below tier `p35` | Base countdown `<= 3` | Chained disruption enabled | Invalid |
| G3 | HP at or above tier median | Move budget at or below tier `p25` | Base countdown at tier minimum | High soot/freeze persistence | Invalid |
| G4 | HP at or above tier `p90` | Any | Base countdown `<= 3` | High disruption and weakness dependence `>= 0.45` | Invalid |
| G5 | Any | Move budget at or below tier `p20` | Any | Any moderate+ disruption | Invalid for non-boss/event |

All `G*` guardrails are `error` severity:

- Rule IDs `BF-GUARD-G1` through `BF-GUARD-G5` emit `error`.
- For Boss/Event content, explicit documented exception may downgrade to `warn` only with approved waiver metadata.

### 5.1 Operational definition of disruption pressure
Classify encounter disruption pressure as:

- Low: light nuisance, no chaining, low tile count impact
- Moderate: recurring nuisance and/or occasional single-step shift
- High: frequent chained effects, persistent blockers, or repeat heavy board shaping

Tooling should require the disruption class to be authored explicitly per encounter.

---

## 6. Required playtest metrics and shippability thresholds

An encounter can graduate to **shippable** only if all required metrics pass for the intended skill cohort.

### 6.1 Required metrics to capture
Per encounter and per cohort, capture at minimum:

- sample size (`n`) and session source (`internal`, `external`, `synthetic`)
- win rate
- fail rate
- median moves remaining on win
- p25 / median / p75 successful casts-to-defeat
- mean creature spells triggered in winning runs
- weakness hit rate observed
- Wand incidence observed
- soot-exposed cast rate observed
- quit/restart rate before encounter end
- “felt unfair” report rate (playtest survey checkbox)

### 6.2 Acceptance thresholds
Unless explicitly documented as boss/event challenge content, shippable requires:

- `n >= 200` valid runs across target cohort mix
- fail rate within authored fail-rate band ± `5` percentage points
- median casts-to-defeat within ± `1.0` cast of target
- median moves remaining on win `>= 1`
- observed weakness hit rate within ± `0.08` of authored assumption
- observed Wand incidence within ± `0.06` of authored assumption
- observed soot exposure within ± `0.06` of authored assumption
- “felt unfair” rate `< 12%`
- no guardrail violation from Section 5

### 6.2.a Concrete thresholds and severity

| Rule ID | Metric | Pass threshold | Out-of-band result |
| :--- | :--- | :--- | :--- |
| `BF-METRIC-001` | valid run sample size (`n`) | `>= 200` | `error` |
| `BF-METRIC-002` | fail rate | within authored band ± `5` percentage points | `warn` (waiver required) |
| `BF-METRIC-003` | median casts-to-defeat | within target ± `1.0` cast | `warn` (waiver required) |
| `BF-METRIC-004` | median moves remaining on win | `>= 1` | `error` |
| `BF-METRIC-005` | observed weakness hit rate delta | `<= 0.08` absolute delta | `warn` (waiver required) |
| `BF-METRIC-006` | observed Wand incidence delta | `<= 0.06` absolute delta | `warn` (waiver required) |
| `BF-METRIC-007` | observed soot exposure delta | `<= 0.06` absolute delta | `warn` (waiver required) |
| `BF-METRIC-008` | felt unfair rate | `< 12%` | `error` |
| `BF-METRIC-009` | guardrail status | no Section 5 violation | `error` |

If any threshold fails, encounter status remains **tune-required**.

### 6.3 Graduation labels
- `prototype`: authored but not metrics-complete
- `tune-required`: metrics captured but one or more thresholds failed
- `candidate-shippable`: thresholds pass in one full playtest cycle
- `shippable`: thresholds pass in two consecutive cycles after latest gameplay-affecting change

### 6.4 Machine-derivable status mapping

Tooling must derive status from severity outcomes, not manual label selection:

- `prototype`: required metrics set is incomplete (`BF-METRIC-001` cannot be evaluated yet, or required metric fields missing).
- `tune-required`: one or more `error` findings, or one or more `warn` findings without valid waiver.
- `candidate-shippable`: current cycle has zero `error`; all `warn` findings have valid waivers; and this is the first passing cycle after latest gameplay-affecting change.
- `shippable`: same as `candidate-shippable`, plus two consecutive passing cycles after latest gameplay-affecting change.

---

## 7. Tooling and validation contract

Implementation/testing tools that validate authored encounters should execute this sequence:

1. validate required encounter authoring metadata, including `damage_model_version`
2. load tier profile defaults from Section 2
3. apply documented per-encounter profile overrides (if any)
4. derive expected damage, HP recommendation, move budget recommendation, and countdown recommendation using canonical `damage_model_v1` constants
5. run invalid-combination guardrails from Section 5
6. compare observed playtest metrics against Section 6 thresholds
7. emit machine-readable status: `prototype`, `tune-required`, `candidate-shippable`, or `shippable`

Tool output should include explicit reasons when an encounter fails, not only a pass/fail boolean.

### 7.1 Required finding payload fields

For each failed or flagged rule, tooling output must include:

- `rule_id`
- `severity` (`error` | `warn` | `info`)
- `measured_value`
- `threshold`
- `remediation_hint`
Minimum failure reasons include:

- missing/invalid `damage_model_version`
- divergence from canonical Damage Model v1 fingerprint/constants
>>>>>>> main

---

## 8. Scope and update policy

- This framework governs numeric balance derivation and quality gates only.
- Creature behavior semantics and fairness principles remain in `docs/creature-and-encounter-rules.md`.
- If gameplay damage/countdown rules change, update Section 1 first, then re-baseline all tier assumptions.
