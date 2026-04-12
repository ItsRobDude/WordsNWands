import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  REVIEW_FIELD_NAMES,
  classifyWordAgainstQuarantine,
  indexReviewRows,
  loadQuarantineRules,
  loadReviewRows,
  normalizeTokenList,
  stringifyCsv,
  readJson,
  toBooleanString,
} from "./validation-snapshot-review-helpers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultPackageRoot = path.join(
  repoRoot,
  "content/packages/content_m2_launch_v1",
);
const args = parseArgs(process.argv.slice(2));
const packageRoot = path.resolve(
  repoRoot,
  args.package_root ?? defaultPackageRoot,
);
const manifest = readJson(path.join(packageRoot, "manifest.json"));
const validationDir = path.join(packageRoot, "validation");
const inputDir = path.join(validationDir, "work", "input");
const reviewDir = path.join(validationDir, "work", "review");
const importDir = path.join(validationDir, "work", "import");
const reviewSheetPath = path.join(
  reviewDir,
  `tag_review_sheet.${manifest.validation_snapshot_version}.csv`,
);
const blockedPath = path.join(inputDir, "blocked.family_safe_v1.txt");
const quarantinePath = path.join(inputDir, "quarantine.family_safe_v1.json");
const commonWordsCandidatePath = path.join(
  importDir,
  `common_words_candidates.${manifest.validation_snapshot_version}.json`,
);
const commonWordsPath = path.join(
  validationDir,
  `common_words.${manifest.validation_snapshot_version}.json`,
);
const candidatePaths = fs
  .readdirSync(inputDir, { withFileTypes: true })
  .filter(
    (entry) => entry.isFile() && /^candidates\..+\.txt$/i.test(entry.name),
  )
  .map((entry) => path.join(inputDir, entry.name))
  .sort((left, right) => left.localeCompare(right));

if (candidatePaths.length === 0) {
  throw new Error(
    `No candidate input files found under ${path.relative(repoRoot, inputDir)}.`,
  );
}

if (!fs.existsSync(reviewSheetPath)) {
  throw new Error(`Missing review sheet: ${relativePath(reviewSheetPath)}`);
}

const blockedWords = new Set(
  fs.existsSync(blockedPath)
    ? normalizeTokenList(fs.readFileSync(blockedPath, "utf-8"))
    : [],
);
const quarantineRules = loadQuarantineRules(quarantinePath);
const commonWordCandidates = new Set(
  fs.existsSync(commonWordsCandidatePath)
    ? normalizeTokenList(readJson(commonWordsCandidatePath).common_words ?? [])
    : fs.existsSync(commonWordsPath)
      ? normalizeTokenList(readJson(commonWordsPath).common_words ?? [])
    : [],
);
const { headers, rows: existingRows } = loadReviewRows(reviewSheetPath);

if (
  headers.length > 0 &&
  JSON.stringify(headers) !== JSON.stringify(REVIEW_FIELD_NAMES)
) {
  throw new Error(
    `Unexpected review-sheet header order in ${relativePath(reviewSheetPath)}.`,
  );
}

const existingRowsByWord = indexReviewRows(existingRows);
const candidateSourcesByWord = new Map();

for (const candidatePath of candidatePaths) {
  const normalizedWords = normalizeTokenList(fs.readFileSync(candidatePath, "utf-8"));

  for (const word of normalizedWords) {
    if (blockedWords.has(word)) {
      continue;
    }

    const sources = candidateSourcesByWord.get(word) ?? new Set();
    sources.add(relativePath(candidatePath));
    candidateSourcesByWord.set(word, sources);
  }
}

const mergedRows = [];
for (const word of [...candidateSourcesByWord.keys()].sort()) {
  const existingRow = existingRowsByWord.get(word) ?? null;
  const mergedSourceFile = [...candidateSourcesByWord.get(word)].sort().join(";");
  const prefilledRow = createPrefilledRow({
    word,
    source_file: mergedSourceFile,
    common_word_candidates: commonWordCandidates,
    quarantine_rules: quarantineRules,
  });

  mergedRows.push(mergeRows(existingRow, prefilledRow));
}

fs.writeFileSync(reviewSheetPath, stringifyCsv(mergedRows));

const summary = summarizeRows(mergedRows);
console.log(
  JSON.stringify(
    {
      package_root: relativePath(packageRoot),
      review_sheet_path: relativePath(reviewSheetPath),
      candidate_file_count: candidatePaths.length,
      candidate_word_count: mergedRows.length,
      common_word_candidate_count: commonWordCandidates.size,
      quarantine_path: relativePath(quarantinePath),
      summary,
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2).replaceAll("-", "_");
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for argument ${token}`);
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function createPrefilledRow(input) {
  const safety = classifyWordAgainstQuarantine(
    input.word,
    input.quarantine_rules,
  );
  const isCommonWord = input.common_word_candidates.has(input.word);
  const isShortEverydayWord = input.word.length <= 5;

  if (safety.status === "hard_reject") {
    return {
      word_normalized: input.word,
      source_file: input.source_file,
      tier: "C",
      proposed_decision: "reject",
      proposed_element: "arcane",
      frequency_familiarity_evidence_source: buildEvidenceSource(input),
      tone_classification: "blocked",
      element_rationale: "",
      confidence_score: "0.98",
      reviewer_primary: "system_prefill",
      reviewer_secondary: "",
      final_decision: "reject",
      override_required: "false",
      override_rationale: "",
      content_owner_signoff: "",
      decision_timestamp_utc: nowUtc(),
    };
  }

  if (safety.status === "review_required") {
    return {
      word_normalized: input.word,
      source_file: input.source_file,
      tier: "B",
      proposed_decision: "review",
      proposed_element: "arcane",
      frequency_familiarity_evidence_source: buildEvidenceSource(input),
      tone_classification: "review-required",
      element_rationale: "",
      confidence_score: "0.55",
      reviewer_primary: "system_prefill",
      reviewer_secondary: "",
      final_decision: "",
      override_required: "false",
      override_rationale: `quarantine_${safety.match_type}:${safety.matched_rule}`,
      content_owner_signoff: "",
      decision_timestamp_utc: "",
    };
  }

  if (isCommonWord) {
    return {
      word_normalized: input.word,
      source_file: input.source_file,
      tier: "A",
      proposed_decision: "accept",
      proposed_element: "arcane",
      frequency_familiarity_evidence_source: buildEvidenceSource(input),
      tone_classification: "family-safe",
      element_rationale: "",
      confidence_score: "0.94",
      reviewer_primary: "system_prefill",
      reviewer_secondary: "",
      final_decision: "accept",
      override_required: "false",
      override_rationale: "",
      content_owner_signoff: "",
      decision_timestamp_utc: nowUtc(),
    };
  }

  return {
    word_normalized: input.word,
    source_file: input.source_file,
    tier: isShortEverydayWord ? "A" : "B",
    proposed_decision: "accept",
    proposed_element: "arcane",
    frequency_familiarity_evidence_source: buildEvidenceSource(input),
    tone_classification: "family-safe",
    element_rationale: "",
    confidence_score: isShortEverydayWord ? "0.86" : "0.72",
    reviewer_primary: "system_prefill",
    reviewer_secondary: "",
    final_decision: "accept",
    override_required: "false",
    override_rationale: "",
    content_owner_signoff: "",
    decision_timestamp_utc: nowUtc(),
  };
}

function buildEvidenceSource(input) {
  if (input.source_file.includes("frequency_bootstrap")) {
    return `subtlex_frequency_bootstrap:${input.source_file}`;
  }

  return `seed_snapshot:${input.source_file}`;
}

function mergeRows(existingRow, prefilledRow) {
  if (!existingRow) {
    return prefilledRow;
  }

  const mergedRow = {};
  for (const field of REVIEW_FIELD_NAMES) {
    const existingValue = String(existingRow[field] ?? "");
    const prefilledValue = String(prefilledRow[field] ?? "");

    if (field === "source_file") {
      mergedRow[field] = mergeDelimitedValues(existingValue, prefilledValue);
      continue;
    }

    mergedRow[field] =
      existingValue.trim().length > 0 ? existingValue : prefilledValue;
  }

  return mergedRow;
}

function mergeDelimitedValues(left, right) {
  return [...new Set([...splitDelimitedValues(left), ...splitDelimitedValues(right)])]
    .sort()
    .join(";");
}

function splitDelimitedValues(value) {
  return String(value)
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function summarizeRows(rows) {
  return {
    accepts: rows.filter((row) => row.final_decision === "accept").length,
    rejects: rows.filter((row) => row.final_decision === "reject").length,
    pending_review: rows.filter((row) => row.final_decision.length === 0).length,
    tone_family_safe: rows.filter(
      (row) => row.tone_classification === "family-safe",
    ).length,
    tone_blocked: rows.filter((row) => row.tone_classification === "blocked")
      .length,
    tone_review_required: rows.filter(
      (row) => row.tone_classification === "review-required",
    ).length,
    tier_a: rows.filter((row) => row.tier === "A").length,
    tier_b: rows.filter((row) => row.tier === "B").length,
    tier_c: rows.filter((row) => row.tier === "C").length,
  };
}

function nowUtc() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}
