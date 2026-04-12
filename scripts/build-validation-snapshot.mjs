import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const normalizedDir = path.join(validationDir, "work", "normalized");
const snapshotPath = path.join(
  validationDir,
  `snapshot.${snapshotVersion}.json`,
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

const anchors = readJson(anchorPath);
const blockedWords = new Set(normalizeTokenList(readUtf8(blockedPath)));
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
    file: path.relative(repoRoot, candidatePath).replaceAll("\\", "/"),
    raw_count: rawTokens.length,
    normalized_count: normalizedTokens.length,
    accepted_count: acceptedCount,
  });
}

const normalizedAnchors = normalizeAnchors(anchors);
const normalizedCandidateList = Array.from(normalizedCandidates).sort();
const castableWords = Array.from(
  new Set([
    ...normalizedCandidateList,
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

if (args.dry_run) {
  writeSummary({
    package_root: packageRoot,
    snapshot_path: snapshotPath,
    normalized_output_path: normalizedOutputPath,
    blocked_path: blockedPath,
    anchor_path: anchorPath,
    candidate_stats: candidateStats,
    blocked_word_count: blockedWords.size,
    blocked_hit_count: blockHitWords.size,
    normalized_candidate_count: normalizedCandidateList.length,
    final_word_count: castableWords.length,
    tagged_word_count: snapshot.metadata.tagged_word_count,
    target_word_count: args.target_word_count ?? 20000,
  });
} else {
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });
  fs.writeFileSync(
    normalizedOutputPath,
    `${normalizedCandidateList.join("\n")}\n`,
  );
  fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  writeSummary({
    package_root: packageRoot,
    snapshot_path: snapshotPath,
    normalized_output_path: normalizedOutputPath,
    blocked_path: blockedPath,
    anchor_path: anchorPath,
    candidate_stats: candidateStats,
    blocked_word_count: blockedWords.size,
    blocked_hit_count: blockHitWords.size,
    normalized_candidate_count: normalizedCandidateList.length,
    final_word_count: castableWords.length,
    tagged_word_count: snapshot.metadata.tagged_word_count,
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

function normalizeTokenList(tokens) {
  const tokenList = Array.isArray(tokens) ? tokens : splitLines(String(tokens));

  return Array.from(
    new Set(
      tokenList
        .map((token) => token.trim().toLowerCase())
        .filter((token) => /^[a-z]+$/.test(token) && token.length >= 3),
    ),
  ).sort();
}

function splitLines(contents) {
  return contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function readJson(filePath) {
  return JSON.parse(readUtf8(filePath));
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function assertExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
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
        package_root: path
          .relative(repoRoot, summary.package_root)
          .replaceAll("\\", "/"),
        snapshot_path: path
          .relative(repoRoot, summary.snapshot_path)
          .replaceAll("\\", "/"),
        normalized_output_path: path
          .relative(repoRoot, summary.normalized_output_path)
          .replaceAll("\\", "/"),
        blocked_path: path
          .relative(repoRoot, summary.blocked_path)
          .replaceAll("\\", "/"),
        anchor_path: path
          .relative(repoRoot, summary.anchor_path)
          .replaceAll("\\", "/"),
        candidate_stats: summary.candidate_stats,
        blocked_word_count: summary.blocked_word_count,
        blocked_hit_count: summary.blocked_hit_count,
        normalized_candidate_count: summary.normalized_candidate_count,
        final_word_count: summary.final_word_count,
        tagged_word_count: summary.tagged_word_count,
        target_word_count: targetWordCount,
        target_progress_percent: progressPercent,
      },
      null,
      2,
    ),
  );
}
