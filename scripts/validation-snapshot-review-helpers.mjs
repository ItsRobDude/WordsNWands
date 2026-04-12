import fs from "node:fs";

export const REVIEW_FIELD_NAMES = [
  "word_normalized",
  "source_file",
  "tier",
  "proposed_decision",
  "proposed_element",
  "frequency_familiarity_evidence_source",
  "tone_classification",
  "element_rationale",
  "confidence_score",
  "reviewer_primary",
  "reviewer_secondary",
  "final_decision",
  "override_required",
  "override_rationale",
  "content_owner_signoff",
  "decision_timestamp_utc",
];

const ASCII_WORD_PATTERN = /^[a-z]+$/;

export function normalizeWordToken(token, options = {}) {
  const minLength = options.min_length ?? 3;
  const normalized = String(token).trim().toLowerCase();
  if (!ASCII_WORD_PATTERN.test(normalized) || normalized.length < minLength) {
    return null;
  }

  return normalized;
}

export function normalizeTokenList(tokens, options = {}) {
  const tokenList = Array.isArray(tokens) ? tokens : splitLines(String(tokens));

  return Array.from(
    new Set(
      tokenList
        .map((token) => normalizeWordToken(token, options))
        .filter((token) => token !== null),
    ),
  ).sort();
}

export function splitLines(contents) {
  return String(contents)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function parseCsv(contents) {
  const rows = [];
  const recordBuffer = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];
    const nextCharacter = contents[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === ",") {
      recordBuffer.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      recordBuffer.push(cell);
      rows.push(recordBuffer.splice(0));
      cell = "";
      continue;
    }

    cell += character;
  }

  if (cell.length > 0 || recordBuffer.length > 0) {
    recordBuffer.push(cell);
    rows.push(recordBuffer.splice(0));
  }

  if (rows.length === 0) {
    return {
      headers: [],
      records: [],
    };
  }

  const [headers, ...records] = rows;
  return {
    headers,
    records: records
      .filter((record) => record.some((value) => value.trim().length > 0))
      .map((record) =>
        Object.fromEntries(
          headers.map((header, index) => [header, record[index] ?? ""]),
        ),
      ),
  };
}

export function stringifyCsv(rows, headers = REVIEW_FIELD_NAMES) {
  const allRows = [
    headers,
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(String(row[header] ?? ""))),
    ),
  ];

  return `${allRows.map((row) => row.join(",")).join("\n")}\n`;
}

function escapeCsvValue(value) {
  if (/[",\r\n]/u.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function loadReviewRows(filePath) {
  const contents = fs.readFileSync(filePath, "utf-8");
  const parsed = parseCsv(contents);
  return {
    headers: parsed.headers,
    rows: parsed.records,
  };
}

export function indexReviewRows(rows) {
  return new Map(
    rows.map((row) => [String(row.word_normalized ?? "").trim().toLowerCase(), row]),
  );
}

export function loadQuarantineRules(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      metadata: null,
      hard_reject_exact: [],
      hard_reject_prefixes: [],
      review_required_exact: [],
      review_required_prefixes: [],
    };
  }

  const rules = readJson(filePath);
  return {
    metadata: rules.metadata ?? null,
    hard_reject_exact: normalizeTokenList(rules.hard_reject_exact ?? []),
    hard_reject_prefixes: normalizePrefixList(rules.hard_reject_prefixes ?? []),
    review_required_exact: normalizeTokenList(rules.review_required_exact ?? []),
    review_required_prefixes: normalizePrefixList(
      rules.review_required_prefixes ?? [],
    ),
  };
}

export function classifyWordAgainstQuarantine(word, rules) {
  const normalizedWord = normalizeWordToken(word);
  if (!normalizedWord) {
    return {
      status: "invalid",
      match_type: "invalid",
      matched_rule: null,
    };
  }

  if (rules.hard_reject_exact.includes(normalizedWord)) {
    return {
      status: "hard_reject",
      match_type: "exact",
      matched_rule: normalizedWord,
    };
  }

  const hardRejectPrefix = rules.hard_reject_prefixes.find((prefix) =>
    normalizedWord.startsWith(prefix),
  );
  if (hardRejectPrefix) {
    return {
      status: "hard_reject",
      match_type: "prefix",
      matched_rule: hardRejectPrefix,
    };
  }

  if (rules.review_required_exact.includes(normalizedWord)) {
    return {
      status: "review_required",
      match_type: "exact",
      matched_rule: normalizedWord,
    };
  }

  const reviewPrefix = rules.review_required_prefixes.find((prefix) =>
    normalizedWord.startsWith(prefix),
  );
  if (reviewPrefix) {
    return {
      status: "review_required",
      match_type: "prefix",
      matched_rule: reviewPrefix,
    };
  }

  return {
    status: "clear",
    match_type: null,
    matched_rule: null,
  };
}

function normalizePrefixList(prefixes) {
  return Array.from(
    new Set(
      prefixes
        .map((prefix) => String(prefix).trim().toLowerCase())
        .filter((prefix) => ASCII_WORD_PATTERN.test(prefix) && prefix.length >= 3),
    ),
  ).sort();
}

export function toBooleanString(value) {
  return value ? "true" : "false";
}
