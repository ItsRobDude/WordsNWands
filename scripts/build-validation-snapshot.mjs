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
  normalizeWordToken,
  readJson,
  splitLines,
  writeJson,
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
const manifestPath = path.join(packageRoot, "manifest.json");
const manifest = readJson(manifestPath);
const snapshotVersion = manifest.validation_snapshot_version;
const validationDir = path.join(packageRoot, "validation");
const inputDir = path.join(validationDir, "work", "input");
const reviewDir = path.join(validationDir, "work", "review");
const importDir = path.join(validationDir, "work", "import");
const normalizedDir = path.join(validationDir, "work", "normalized");
const snapshotPath = path.join(
  validationDir,
  `snapshot.${snapshotVersion}.json`,
);
const commonWordsOutputPath = path.join(
  validationDir,
  `common_words.${snapshotVersion}.json`,
);
const commonWordsCandidatePath = path.join(
  importDir,
  `common_words_candidates.${snapshotVersion}.json`,
);
const normalizedOutputPath = path.join(
  normalizedDir,
  "candidates.normalized.sorted.txt",
);
const blockedPath = path.join(inputDir, "blocked.family_safe_v1.txt");
const reviewSheetPath = path.join(
  reviewDir,
  `tag_review_sheet.${snapshotVersion}.csv`,
);
const quarantinePath = path.join(inputDir, "quarantine.family_safe_v1.json");
const anchorPath = resolveAnchorPath({
  input_dir: inputDir,
  snapshot_version: snapshotVersion,
});
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

assertExists(blockedPath, "blocked-word input");
assertExists(anchorPath, "anchor input");
assertExists(reviewSheetPath, "review sheet");

const { headers, rows: reviewRows } = loadReviewRows(reviewSheetPath);
if (
  headers.length > 0 &&
  JSON.stringify(headers) !== JSON.stringify(REVIEW_FIELD_NAMES)
) {
  throw new Error(
    `Unexpected review-sheet header order in ${relativePath(reviewSheetPath)}.`,
  );
}

const anchors = readJson(anchorPath);
const blockedWords = new Set(normalizeTokenList(readUtf8(blockedPath)));
const quarantineRules = loadQuarantineRules(quarantinePath);
const reviewRowsByWord = indexReviewRows(reviewRows);
const commonWordCandidates = loadCommonWordCandidates({
  candidate_path: commonWordsCandidatePath,
  fallback_path: commonWordsOutputPath,
});

const candidateStats = [];
const normalizedCandidates = new Set();
const blockHitWords = new Set();

for (const candidatePath of candidatePaths) {
  const rawTokens = splitLines(readUtf8(candidatePath));
  const normalizedTokens = normalizeTokenList(rawTokens);
  let acceptedCount = 0;

  for (const token of normalizedTokens) {
    if (blockedWords.has(token)) {
      blockHitWords.add(token);
      continue;
    }

    normalizedCandidates.add(token);
    acceptedCount += 1;
  }

  candidateStats.push({
    file: relativePath(candidatePath),
    raw_count: rawTokens.length,
    normalized_count: normalizedTokens.length,
    accepted_count: acceptedCount,
  });
}

const normalizedAnchors = normalizeAnchors(anchors);
const normalizedCandidateList = Array.from(normalizedCandidates).sort();
const findings = [];
const acceptedCandidateWords = new Set();
const curatedCommonWords = new Set();

for (const word of normalizedCandidateList) {
  const reviewRow = reviewRowsByWord.get(word);
  if (!reviewRow) {
    findings.push(
      `Missing review row for candidate word "${word}" in ${relativePath(reviewSheetPath)}.`,
    );
    continue;
  }

  const evaluation = evaluateReviewRow({
    word,
    row: reviewRow,
    quarantine_rules: quarantineRules,
  });
  findings.push(...evaluation.findings);

  if (evaluation.accepted) {
    acceptedCandidateWords.add(word);
    if (
      commonWordCandidates.has(word) &&
      qualifiesForCuratedCommonSubset(reviewRow)
    ) {
      curatedCommonWords.add(word);
    }
  }
}

validateAnchors({
  normalized_anchors: normalizedAnchors,
  blocked_words: blockedWords,
  quarantine_rules: quarantineRules,
  review_rows_by_word: reviewRowsByWord,
  findings,
});

if (findings.length > 0) {
  throw new Error(formatFindings(findings));
}

const castableWords = Array.from(
  new Set([
    ...acceptedCandidateWords,
    ...Object.keys(normalizedAnchors.element_tags),
    ...normalizedAnchors.arcane_support,
  ]),
).sort();
const snapshot = {
  metadata: {
    snapshot_version: snapshotVersion,
    language: "en",
    word_count: castableWords.length,
    tagged_word_count: Object.keys(normalizedAnchors.element_tags).length,
    generated_at_utc:
      args.generated_at_utc ??
      new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z"),
  },
  castable_words: castableWords,
  element_tags: normalizedAnchors.element_tags,
};
const commonWordsOutput = {
  metadata: {
    snapshot_version: snapshotVersion,
    generated_at_utc: snapshot.metadata.generated_at_utc,
    source: "review_curated_common_subset",
    candidate_source_path: fs.existsSync(commonWordsCandidatePath)
      ? relativePath(commonWordsCandidatePath)
      : relativePath(commonWordsOutputPath),
    word_count: curatedCommonWords.size,
  },
  common_words: Array.from(curatedCommonWords).sort(),
};

if (args.dry_run) {
  writeSummary({
    package_root: packageRoot,
    snapshot_path: snapshotPath,
    common_words_output_path: commonWordsOutputPath,
    normalized_output_path: normalizedOutputPath,
    blocked_path: blockedPath,
    anchor_path: anchorPath,
    review_sheet_path: reviewSheetPath,
    quarantine_path: quarantinePath,
    candidate_stats: candidateStats,
    blocked_word_count: blockedWords.size,
    blocked_hit_count: blockHitWords.size,
    normalized_candidate_count: normalizedCandidateList.length,
    accepted_review_word_count: acceptedCandidateWords.size,
    pending_review_count: normalizedCandidateList.filter((word) => {
      const row = reviewRowsByWord.get(word);
      return row && String(row.final_decision ?? "").trim().length === 0;
    }).length,
    final_word_count: castableWords.length,
    tagged_word_count: snapshot.metadata.tagged_word_count,
    curated_common_word_count: curatedCommonWords.size,
    target_word_count: args.target_word_count ?? 20000,
  });
} else {
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.mkdirSync(path.dirname(commonWordsOutputPath), { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });
  fs.writeFileSync(
    normalizedOutputPath,
    `${normalizedCandidateList.join("\n")}\n`,
  );
  writeJson(snapshotPath, snapshot);
  writeJson(commonWordsOutputPath, commonWordsOutput);
  writeSummary({
    package_root: packageRoot,
    snapshot_path: snapshotPath,
    common_words_output_path: commonWordsOutputPath,
    normalized_output_path: normalizedOutputPath,
    blocked_path: blockedPath,
    anchor_path: anchorPath,
    review_sheet_path: reviewSheetPath,
    quarantine_path: quarantinePath,
    candidate_stats: candidateStats,
    blocked_word_count: blockedWords.size,
    blocked_hit_count: blockHitWords.size,
    normalized_candidate_count: normalizedCandidateList.length,
    accepted_review_word_count: acceptedCandidateWords.size,
    pending_review_count: normalizedCandidateList.filter((word) => {
      const row = reviewRowsByWord.get(word);
      return row && String(row.final_decision ?? "").trim().length === 0;
    }).length,
    final_word_count: castableWords.length,
    tagged_word_count: snapshot.metadata.tagged_word_count,
    curated_common_word_count: curatedCommonWords.size,
    target_word_count: args.target_word_count ?? 20000,
  });
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--dry-run") {
      parsed.dry_run = true;
      continue;
    }

    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2).replaceAll("-", "_");
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for argument ${token}`);
    }

    parsed[key] = key === "target_word_count" ? Number(value) : value;
    index += 1;
  }

  return parsed;
}

function resolveAnchorPath(input) {
  const matches = fs
    .readdirSync(input.input_dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith("anchors.") &&
        entry.name.includes(input.snapshot_version) &&
        entry.name.endsWith(".json"),
    )
    .map((entry) => path.join(input.input_dir, entry.name))
    .sort((left, right) => left.localeCompare(right));

  if (matches.length === 0) {
    throw new Error(
      `No anchor file found for ${input.snapshot_version} under ${input.input_dir}`,
    );
  }

  return matches[0];
}

function normalizeAnchors(anchors) {
  const elementTags = {};
  const arcaneSupport = new Set();

  for (const [bucket, words] of Object.entries(anchors.anchors ?? {})) {
    const normalizedWords = normalizeTokenList(words);

    if (bucket === "arcane_support") {
      for (const word of normalizedWords) {
        arcaneSupport.add(word);
      }
      continue;
    }

    for (const word of normalizedWords) {
      elementTags[word] = bucket;
    }
  }

  return {
    element_tags: Object.fromEntries(
      Object.entries(elementTags).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    arcane_support: Array.from(arcaneSupport).sort(),
  };
}

function evaluateReviewRow(input) {
  const findings = [];
  const normalizedWord = normalizeWordToken(input.row.word_normalized ?? "");
  if (normalizedWord !== input.word) {
    findings.push(
      `Review row key mismatch for "${input.word}": found "${input.row.word_normalized}".`,
    );
  }

  const tier = String(input.row.tier ?? "").trim();
  if (!["A", "B", "C"].includes(tier)) {
    findings.push(`Invalid tier "${tier}" for "${input.word}".`);
  }

  const proposedDecision = String(input.row.proposed_decision ?? "").trim();
  if (!["accept", "reject", "review"].includes(proposedDecision)) {
    findings.push(
      `Invalid proposed_decision "${proposedDecision}" for "${input.word}".`,
    );
  }

  const toneClassification = String(input.row.tone_classification ?? "").trim();
  if (
    !["family-safe", "review-required", "blocked"].includes(toneClassification)
  ) {
    findings.push(
      `Invalid tone_classification "${toneClassification}" for "${input.word}".`,
    );
  }

  const proposedElement = String(input.row.proposed_element ?? "").trim();
  if (
    proposedElement.length > 0 &&
    ![
      "arcane",
      "flame",
      "tide",
      "bloom",
      "storm",
      "stone",
      "light",
    ].includes(proposedElement)
  ) {
    findings.push(
      `Invalid proposed_element "${proposedElement}" for "${input.word}".`,
    );
  }

  const finalDecision = String(input.row.final_decision ?? "").trim();
  if (finalDecision.length > 0 && !["accept", "reject"].includes(finalDecision)) {
    findings.push(
      `Invalid final_decision "${finalDecision}" for "${input.word}".`,
    );
  }

  const overrideRequired =
    String(input.row.override_required ?? "").trim().toLowerCase() === "true";
  const confidence = Number.parseFloat(
    String(input.row.confidence_score ?? "").trim(),
  );
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    findings.push(`Invalid confidence_score for "${input.word}".`);
  }

  if (String(input.row.source_file ?? "").trim().length === 0) {
    findings.push(`Missing source_file for "${input.word}".`);
  }

  if (
    String(input.row.frequency_familiarity_evidence_source ?? "").trim().length === 0
  ) {
    findings.push(
      `Missing frequency_familiarity_evidence_source for "${input.word}".`,
    );
  }

  if (overrideRequired) {
    if (String(input.row.override_rationale ?? "").trim().length === 0) {
      findings.push(`Missing override_rationale for "${input.word}".`);
    }
    if (String(input.row.content_owner_signoff ?? "").trim().length === 0) {
      findings.push(`Missing content_owner_signoff for "${input.word}".`);
    }
  }

  const safety = classifyWordAgainstQuarantine(input.word, input.quarantine_rules);
  if (finalDecision === "accept") {
    if (proposedDecision !== "accept") {
      findings.push(
        `Accepted word "${input.word}" must have proposed_decision=accept.`,
      );
    }

    if (tier === "A" && confidence < 0.8) {
      findings.push(
        `Accepted Tier A word "${input.word}" must have confidence >= 0.80.`,
      );
    }

    if (tier === "B" && confidence < 0.65) {
      findings.push(
        `Accepted Tier B word "${input.word}" must have confidence >= 0.65.`,
      );
    }

    if (tier === "C" && !overrideRequired) {
      findings.push(
        `Accepted Tier C word "${input.word}" requires explicit override_required=true.`,
      );
    }

    if (proposedElement !== "" && proposedElement !== "arcane") {
      if (String(input.row.element_rationale ?? "").trim().length === 0) {
        findings.push(
          `Accepted tagged word "${input.word}" requires element_rationale.`,
        );
      }

      if (tier === "B" && confidence < 0.75) {
        findings.push(
          `Accepted Tier B tagged word "${input.word}" must have confidence >= 0.75.`,
        );
      }
    }

    if (toneClassification === "blocked") {
      findings.push(`Blocked word "${input.word}" cannot be accepted.`);
    }

    if (safety.status === "hard_reject") {
      findings.push(
        `Hard-reject quarantine rule matched accepted word "${input.word}".`,
      );
    }

    if (safety.status === "review_required" && !overrideRequired) {
      findings.push(
        `Review-required quarantine rule matched accepted word "${input.word}" without override.`,
      );
    }

    if (toneClassification === "review-required" && !overrideRequired) {
      findings.push(
        `Accepted word "${input.word}" with tone_classification=review-required requires override.`,
      );
    }
  }

  return {
    findings,
    accepted: finalDecision === "accept",
  };
}

function qualifiesForCuratedCommonSubset(row) {
  const finalDecision = String(row.final_decision ?? "").trim();
  if (finalDecision !== "accept") {
    return false;
  }

  if (String(row.tone_classification ?? "").trim() !== "family-safe") {
    return false;
  }

  if (String(row.override_required ?? "").trim().toLowerCase() === "true") {
    return false;
  }

  const confidence = Number.parseFloat(String(row.confidence_score ?? "").trim());
  const tier = String(row.tier ?? "").trim();
  return tier === "A" || confidence >= 0.8;
}

function validateAnchors(input) {
  const allAnchorWords = [
    ...Object.keys(input.normalized_anchors.element_tags),
    ...input.normalized_anchors.arcane_support,
  ];

  for (const word of allAnchorWords) {
    if (input.blocked_words.has(word)) {
      input.findings.push(`Anchor word "${word}" is blocked by family-safe list.`);
    }

    const safety = classifyWordAgainstQuarantine(word, input.quarantine_rules);
    if (safety.status === "hard_reject") {
      input.findings.push(
        `Anchor word "${word}" matches hard-reject quarantine rules.`,
      );
    }

    const reviewRow = input.review_rows_by_word.get(word);
    if (reviewRow && String(reviewRow.final_decision ?? "").trim() === "reject") {
      input.findings.push(
        `Anchor word "${word}" conflicts with a rejected review-sheet entry.`,
      );
    }
  }
}

function loadCommonWordCandidates(input) {
  const sourcePath = fs.existsSync(input.candidate_path)
    ? input.candidate_path
    : input.fallback_path;
  if (!fs.existsSync(sourcePath)) {
    return new Set();
  }

  const payload = readJson(sourcePath);
  return new Set(normalizeTokenList(payload.common_words ?? []));
}

function assertExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function writeSummary(summary) {
  const targetWordCount = summary.target_word_count;
  const progressPercent = Math.min(
    100,
    Math.round((summary.final_word_count / targetWordCount) * 1000) / 10,
  );

  console.log(
    JSON.stringify(
      {
        package_root: relativePath(summary.package_root),
        snapshot_path: relativePath(summary.snapshot_path),
        common_words_output_path: relativePath(summary.common_words_output_path),
        normalized_output_path: relativePath(summary.normalized_output_path),
        blocked_path: relativePath(summary.blocked_path),
        anchor_path: relativePath(summary.anchor_path),
        review_sheet_path: relativePath(summary.review_sheet_path),
        quarantine_path: relativePath(summary.quarantine_path),
        candidate_stats: summary.candidate_stats,
        blocked_word_count: summary.blocked_word_count,
        blocked_hit_count: summary.blocked_hit_count,
        normalized_candidate_count: summary.normalized_candidate_count,
        accepted_review_word_count: summary.accepted_review_word_count,
        pending_review_count: summary.pending_review_count,
        final_word_count: summary.final_word_count,
        tagged_word_count: summary.tagged_word_count,
        curated_common_word_count: summary.curated_common_word_count,
        target_word_count: targetWordCount,
        target_progress_percent: progressPercent,
      },
      null,
      2,
    ),
  );
}

function formatFindings(findings) {
  const maxFindings = 40;
  const renderedFindings = findings
    .slice(0, maxFindings)
    .map((finding) => `- ${finding}`)
    .join("\n");
  const overflowCount = Math.max(0, findings.length - maxFindings);

  return [
    `Validation snapshot build failed with ${findings.length} issue(s):`,
    renderedFindings,
    overflowCount > 0 ? `- ...and ${overflowCount} more.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}
