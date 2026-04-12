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
const validationDir = path.join(packageRoot, "validation");
const inputDir = path.join(validationDir, "work", "input");
const importDir = path.join(validationDir, "work", "import");
const manifest = readJson(path.join(packageRoot, "manifest.json"));
const topRows = Number(args.top_rows ?? 30000);
const commonWordRows = Number(args.common_word_rows ?? 5000);
const minLength = Number(args.min_length ?? 3);
const maxLength = Number(args.max_length ?? 10);
const subtlexUrl =
  args.subtlex_url ??
  "https://raw.githubusercontent.com/words/subtlex-word-frequencies/master/index.json";
const blocklistUrl =
  args.blocklist_url ??
  "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en";
const candidateOutputPath = path.join(
  inputDir,
  `candidates.frequency_bootstrap_subtlex_top${topRows}.txt`,
);
const commonWordsOutputPath = path.join(
  validationDir,
  `common_words.${manifest.validation_snapshot_version}.json`,
);
const commonWordsCandidateOutputPath = path.join(
  importDir,
  `common_words_candidates.${manifest.validation_snapshot_version}.json`,
);
const blockedPath = path.join(inputDir, "blocked.family_safe_v1.txt");
const importMetadataPath = path.join(
  importDir,
  `frequency_bootstrap_subtlex_top${topRows}.sources.json`,
);

fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(importDir, { recursive: true });

const [subtlexRows, blocklistText] = await Promise.all([
  fetchJson(subtlexUrl),
  fetchText(blocklistUrl),
]);

const importedCandidates = collectCandidates({
  rows: subtlexRows,
  top_rows: topRows,
  min_length: minLength,
  max_length: maxLength,
});
const prioritizedCommonWords = collectCandidates({
  rows: subtlexRows,
  top_rows: commonWordRows,
  min_length: minLength,
  max_length: Math.min(6, maxLength),
});
const importedBlockedWords = normalizeTokenList(blocklistText, {
  min_length: minLength,
});
const existingBlockedWords = fs.existsSync(blockedPath)
  ? normalizeTokenList(fs.readFileSync(blockedPath, "utf-8"), {
      min_length: minLength,
    })
  : [];
const mergedBlockedWords = Array.from(
  new Set([...existingBlockedWords, ...importedBlockedWords]),
).sort();
const blockedWordSet = new Set(mergedBlockedWords);
const commonWords = prioritizedCommonWords.filter(
  (word) => !blockedWordSet.has(word),
);

fs.writeFileSync(candidateOutputPath, `${importedCandidates.join("\n")}\n`);
fs.writeFileSync(blockedPath, `${mergedBlockedWords.join("\n")}\n`);
fs.writeFileSync(
  commonWordsCandidateOutputPath,
  `${JSON.stringify(
    {
      metadata: {
        snapshot_version: manifest.validation_snapshot_version,
        generated_at_utc: new Date()
          .toISOString()
          .replace(/\.\d{3}Z$/, ".000Z"),
        source: "subtlex_frequency_bootstrap",
        word_count: commonWords.length,
      },
      common_words: commonWords,
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(
  commonWordsOutputPath,
  `${JSON.stringify(
    {
      metadata: {
        snapshot_version: manifest.validation_snapshot_version,
        generated_at_utc: new Date()
          .toISOString()
          .replace(/\.\d{3}Z$/, ".000Z"),
        source: "subtlex_frequency_bootstrap",
        candidate_source_path: relativePath(commonWordsCandidateOutputPath),
        word_count: commonWords.length,
      },
      common_words: commonWords,
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(
  importMetadataPath,
  `${JSON.stringify(
    {
      generated_at_utc: new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z"),
      source_urls: {
        subtlex: subtlexUrl,
        blocklist: blocklistUrl,
      },
      parameters: {
        top_rows: topRows,
        common_word_rows: commonWordRows,
        min_length: minLength,
        max_length: maxLength,
        lowercase_only: true,
        alpha_only: true,
      },
      imported_candidate_count: importedCandidates.length,
      prioritized_common_word_count: commonWords.length,
      merged_blocked_word_count: mergedBlockedWords.length,
    },
    null,
    2,
  )}\n`,
);

console.log(
  JSON.stringify(
    {
      package_root: relativePath(packageRoot),
      candidate_output_path: relativePath(candidateOutputPath),
      common_words_output_path: relativePath(commonWordsOutputPath),
      common_words_candidate_output_path: relativePath(
        commonWordsCandidateOutputPath,
      ),
      blocked_output_path: relativePath(blockedPath),
      import_metadata_path: relativePath(importMetadataPath),
      imported_candidate_count: importedCandidates.length,
      prioritized_common_word_count: commonWords.length,
      merged_blocked_word_count: mergedBlockedWords.length,
      top_rows: topRows,
      common_word_rows: commonWordRows,
      min_length: minLength,
      max_length: maxLength,
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

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON source ${url}: ${response.status}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch text source ${url}: ${response.status}`);
  }

  return response.text();
}

function collectCandidates(input) {
  const seen = new Set();
  const candidates = [];

  for (const row of input.rows.slice(0, input.top_rows)) {
    const rawWord = String(row.word ?? "");
    if (rawWord !== rawWord.toLowerCase()) {
      continue;
    }

    const word = rawWord.trim();
    if (!/^[a-z]+$/.test(word)) {
      continue;
    }

    if (word.length < input.min_length || word.length > input.max_length) {
      continue;
    }

    if (seen.has(word)) {
      continue;
    }

    seen.add(word);
    candidates.push(word);
  }

  return candidates.sort();
}

function normalizeTokenList(tokens, options = {}) {
  const minLength = options.min_length ?? 3;
  const tokenList = Array.isArray(tokens)
    ? tokens
    : String(tokens)
        .split(/\r?\n/u)
        .map((line) => line.trim());

  return Array.from(
    new Set(
      tokenList
        .map((token) => token.trim().toLowerCase())
        .filter((token) => /^[a-z]+$/.test(token) && token.length >= minLength),
    ),
  ).sort();
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
