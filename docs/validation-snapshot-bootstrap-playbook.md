# Validation Snapshot Bootstrap Playbook (`val_snapshot_m2_launch_v1`)

This playbook turns the policy in `docs/word-validation-and-element-rules.md` Section 18 into an executable contributor workflow for building the first locked snapshot:

- `validation_snapshot_version`: `val_snapshot_m2_launch_v1`
- `content_version`: `content_m2_launch_v1`

Cross-links:
- policy source: `docs/word-validation-and-element-rules.md` Section 18
- content operations linkage: `docs/content-pipeline-and-liveops.md` Section 7.4
- lockfile pin source: `docs/early-content-lock.md` Sections 1 and 2.3

---

## 1. Exact input artifacts (required)

All inputs below are required before review begins.

### 1.1 Candidate-word source files

Store candidate inputs under package-local working folders before snapshot assembly:

```txt
content/packages/content_m2_launch_v1/validation/work/input/
  candidates.core_seed.txt
  candidates.tutorial_and_ch1.txt
  candidates.delta_patch_*.txt
```

File format requirements:
- UTF-8 text
- one raw candidate token per line
- no header row
- no inline comments
- empty lines allowed (ignored during normalization)

Allowed use:
- `candidates.core_seed.txt`: baseline lexicon pull used for first bootstrap pass
- `candidates.tutorial_and_ch1.txt`: guaranteed expected vocabulary from starter/tutorial/chapter-1 authored content
- `candidates.delta_patch_*.txt`: corrective/additive submissions for later patches

### 1.2 Blocked-list source

Use a single explicit blocked source file:

```txt
content/packages/content_m2_launch_v1/validation/work/input/blocked.family_safe_v1.txt
```

File format requirements:
- UTF-8 text
- one normalized blocked word per line (lowercase `a-z` only)
- no duplicates
- no comments

This file is the pre-review exclusion baseline for profanity/slur/explicit terms and any other known family-safety rejects.

### 1.3 Tag review sheet format

Create a single review sheet for candidate decisions:

```txt
content/packages/content_m2_launch_v1/validation/work/review/tag_review_sheet.val_snapshot_m2_launch_v1.csv
```

CSV header (exact columns, in order):

```csv
word_normalized,source_file,tier,proposed_decision,proposed_element,frequency_familiarity_evidence_source,tone_classification,element_rationale,confidence_score,reviewer_primary,reviewer_secondary,final_decision,override_required,override_rationale,content_owner_signoff,decision_timestamp_utc
```

Field notes:
- `tone_classification` must be one of `family-safe`, `review-required`, `blocked`.
- `confidence_score` must be a numeric string in `[0.00, 1.00]`.
- `proposed_element` and `final_decision` are `arcane` by default unless a non-Arcane tag is approved.
- `override_required` is `true|false` and must be `true` for Tier C acceptances or any threshold exception.

---

## 2. Deterministic normalization and ordering rules (before review)

Run this pipeline in order; do not skip steps.

1. Concatenate all candidate source files in lexicographic filename order.
2. Trim whitespace around each token.
3. Lowercase each token.
4. Drop empty lines.
5. Keep only tokens matching `^[a-z]+$`.
6. Drop tokens with length `< 3`.
7. Deduplicate by exact normalized token.
8. Remove any token present in `blocked.family_safe_v1.txt`.
9. Stable-sort final candidate list ascending by `word_normalized`.
10. Write result to:

```txt
content/packages/content_m2_launch_v1/validation/work/normalized/candidates.normalized.sorted.txt
```

Determinism rules:
- same inputs must produce byte-identical output
- no locale-sensitive case transforms
- no frequency-based reordering before human review

---

## 3. Reviewer pass sequence mapped to Section 18 required fields

Use three explicit passes in the order below.

### Pass A — Familiarity and tone pre-screen

Populate these Section 18.1 required fields first:
- `frequency_familiarity_evidence_source`
- `tone_classification`

Decision guardrails:
- if tone is clearly unsafe, set `tone_classification=blocked` and `final_decision=reject`
- if familiarity unclear but tone appears safe, use `review-required`

### Pass B — Tiering, decision, and confidence

Populate:
- `tier` (A/B/C from Section 16)
- `proposed_decision`
- `confidence_score`

Apply thresholds from Section 18.2:
- Tier A accept only at `>= 0.80`
- Tier B accept only at `>= 0.65`
- Tier B non-Arcane tag candidate requires `>= 0.75`
- Tier C defaults to reject unless override

### Pass C — Element rationale + adjudication

Populate:
- `proposed_element`
- `element_rationale` (required for non-Arcane)
- `reviewer_secondary`
- `final_decision`
- `override_required`, `override_rationale`, `content_owner_signoff` when needed

Dispute handling (Section 18.3):
- disagreement default: `valid + arcane` if family-safe and reasonably familiar
- unclear familiarity/tone: keep invalid for this cut
- escalate to content owner; target resolution within 2 business days

Completion rule:
- a row is review-complete only when all Section 18.1 required fields are non-empty and `final_decision` is set

---

## 4. Batch QA gate checklist (Section 18.4) with explicit pass/fail criteria

Run after reviewer passes and before snapshot JSON publication.

### 4.1 Acceptance-rate delta check

- **Measure:**
  - `acceptance_rate = accepted_count / reviewed_count`
  - compare against prior approved snapshot (or baseline target for first release)
- **Pass criteria:**
  - first release (`val_snapshot_m2_launch_v1`): acceptance rate in `0.60-0.90`
  - corrective patch: absolute delta vs prior snapshot `<= 0.05` unless intentional override note exists
- **Fail criteria:**
  - out-of-range first-release acceptance rate
  - corrective patch delta `> 0.05` without owner-approved rationale

### 4.2 Element-distribution drift check

- **Measure:** per-element share among non-Arcane accepted words
- **Pass criteria:**
  - first release: every non-Arcane element present has share `>= 0.05` and `<= 0.35`
  - corrective patch: per-element absolute share drift `<= 0.10` vs prior snapshot unless intentional design note exists
- **Fail criteria:**
  - single-element over-concentration beyond threshold
  - unexplained drift beyond threshold

### 4.3 Profanity/blocklist regression check

- **Measure:** intersection between accepted words and blocked list
- **Pass criteria:**
  - exact intersection size = `0`
- **Fail criteria:**
  - any blocked token appears in accepted output

### 4.4 Gate decision rule

Release may proceed only when all three checks pass, or when each failing check has an explicit content-owner approval note and corrective intent recorded in change notes.

---

## 5. Output artifact schema examples (`snapshot.<validation_snapshot_version>.json`)

Target output path:

```txt
content/packages/content_m2_launch_v1/validation/snapshot.val_snapshot_m2_launch_v1.json
```

Example shape (illustrative, aligned to canonical package layout and Section 18 process outputs):

```json
{
  "validation_snapshot_version": "val_snapshot_m2_launch_v1",
  "content_version": "content_m2_launch_v1",
  "created_at_utc": "2026-04-11T00:00:00Z",
  "created_by": "content-owner",
  "source": {
    "candidate_files": [
      "validation/work/input/candidates.core_seed.txt",
      "validation/work/input/candidates.tutorial_and_ch1.txt"
    ],
    "blocked_list_file": "validation/work/input/blocked.family_safe_v1.txt",
    "review_sheet_file": "validation/work/review/tag_review_sheet.val_snapshot_m2_launch_v1.csv"
  },
  "castable_words": ["bloom", "glow", "ocean", "stone"],
  "element_tags": {
    "bloom": "bloom",
    "glow": "light",
    "ocean": "tide",
    "stone": "stone"
  },
  "qa_summary": {
    "reviewed_count": 4,
    "accepted_count": 4,
    "acceptance_rate": 1.0,
    "blocked_intersection_count": 0,
    "drift_reference_snapshot": null
  },
  "change_notes": [
    "Initial M2 launch snapshot for starter + chapter-1 vocabulary."
  ]
}
```

Output constraints:
- `castable_words` must be lowercase, deduplicated, sorted ascending
- `element_tags` keys must be subset of `castable_words`
- words missing from `element_tags` are implicitly Arcane
- `validation_snapshot_version` must match `manifest.json` pin

---

## 6. Versioning and change-note template (first release + corrective patches)

### 6.1 First release template (`val_snapshot_m2_launch_v1`)

Use this release-note block in package change notes:

```md
## Validation Snapshot Release
- validation_snapshot_version: val_snapshot_m2_launch_v1
- release_type: initial
- baseline_reference: none
- candidate_sources:
  - validation/work/input/candidates.core_seed.txt
  - validation/work/input/candidates.tutorial_and_ch1.txt
- blocked_source: validation/work/input/blocked.family_safe_v1.txt
- reviewer_passes_completed: A,B,C
- qa_gate_results:
  - acceptance_rate_delta_check: pass
  - element_distribution_drift_check: pass
  - profanity_blocklist_regression_check: pass
- overrides: none
- content_owner_signoff: <name>
- timestamp_utc: <ISO-8601 UTC>
```

### 6.2 Corrective patch template (`val_snapshot_m2_launch_v1_pN`)

Use monotonic patch suffixes for corrections (`_p1`, `_p2`, ...):

```md
## Validation Snapshot Corrective Patch
- validation_snapshot_version: val_snapshot_m2_launch_v1_p1
- release_type: corrective_patch
- prior_snapshot_version: val_snapshot_m2_launch_v1
- incident_severity: <high|medium|low>
- affected_words:
  - <word>: <reason>
- correction_strategy:
  - <tag_to_arcane | valid_to_invalid | add_missing_valid>
- qa_gate_results:
  - acceptance_rate_delta_check: <pass|fail_with_override>
  - element_distribution_drift_check: <pass|fail_with_override>
  - profanity_blocklist_regression_check: <pass|fail_with_override>
- override_approvals:
  - <owner + rationale, if any>
- rollback_required: <yes|no>
- content_owner_signoff: <name>
- timestamp_utc: <ISO-8601 UTC>
```

Patch rules:
- keep scope minimal to the identified incident
- avoid unrelated lexicon churn in corrective patches
- preserve no-silent-drift policy using explicit version increments
