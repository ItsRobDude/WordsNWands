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
const validationDir = path.join(packageRoot, "validation");
const inputDir = path.join(validationDir, "work", "input");
const reviewDir = path.join(validationDir, "work", "review");
const snapshotPath = path.join(
  validationDir,
  `snapshot.${manifest.validation_snapshot_version}.json`,
);
const candidateSeedPath = path.join(inputDir, "candidates.core_seed.txt");
const tutorialPath = path.join(inputDir, "candidates.tutorial_and_ch1.txt");
const blockedPath = path.join(inputDir, "blocked.family_safe_v1.txt");
const quarantinePath = path.join(inputDir, "quarantine.family_safe_v1.json");
const reviewSheetPath = path.join(
  reviewDir,
  `tag_review_sheet.${manifest.validation_snapshot_version}.csv`,
);
const snapshot = readJson(snapshotPath);
const coreSeedWords = normalizeWords(snapshot.castable_words ?? []);
const tutorialAndChapterOneWords = normalizeWords([
  "beam",
  "bloom",
  "bolt",
  "burn",
  "calm",
  "cave",
  "clay",
  "cloud",
  "dawn",
  "ember",
  "flame",
  "friend",
  "glow",
  "gust",
  "happy",
  "leaf",
  "magic",
  "mist",
  "moss",
  "path",
  "petal",
  "play",
  "puzzle",
  "rain",
  "river",
  "rock",
  "root",
  "sand",
  "shine",
  "small",
  "smoke",
  "spell",
  "star",
  "stone",
  "storm",
  "sun",
  "tide",
  "torch",
  "trail",
  "vine",
  "wave",
  "wind",
]);
const reviewHeader =
  "word_normalized,source_file,tier,proposed_decision,proposed_element,frequency_familiarity_evidence_source,tone_classification,element_rationale,confidence_score,reviewer_primary,reviewer_secondary,final_decision,override_required,override_rationale,content_owner_signoff,decision_timestamp_utc\n";
const defaultQuarantineRules = {
  metadata: {
    version: "family_safe_quarantine_v1",
    description:
      "Authoring-time exact and prefix rules for words that should never be auto-accepted into the battle lexicon.",
  },
  hard_reject_exact: [],
  hard_reject_prefixes: [],
  review_required_exact: [],
  review_required_prefixes: [],
};

fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

writeIfMissing(candidateSeedPath, `${coreSeedWords.join("\n")}\n`);
writeIfMissing(tutorialPath, `${tutorialAndChapterOneWords.join("\n")}\n`);
writeIfMissing(blockedPath, "");
writeIfMissing(quarantinePath, `${JSON.stringify(defaultQuarantineRules, null, 2)}\n`);
writeIfMissing(reviewSheetPath, reviewHeader);

console.log(
  JSON.stringify(
    {
      package_root: path.relative(repoRoot, packageRoot).replaceAll("\\", "/"),
      snapshot_path: path
        .relative(repoRoot, snapshotPath)
        .replaceAll("\\", "/"),
      created_or_preserved: {
        core_seed: relativePath(candidateSeedPath),
        tutorial_and_ch1: relativePath(tutorialPath),
        blocked_list: relativePath(blockedPath),
        quarantine_rules: relativePath(quarantinePath),
        review_sheet: relativePath(reviewSheetPath),
      },
      current_snapshot_word_count: coreSeedWords.length,
      tutorial_and_ch1_word_count: tutorialAndChapterOneWords.length,
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

function normalizeWords(words) {
  return Array.from(
    new Set(
      words
        .map((word) => String(word).trim().toLowerCase())
        .filter((word) => /^[a-z]+$/.test(word) && word.length >= 3),
    ),
  ).sort();
}

function writeIfMissing(filePath, contents) {
  if (fs.existsSync(filePath)) {
    return;
  }

  fs.writeFileSync(filePath, contents);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}
