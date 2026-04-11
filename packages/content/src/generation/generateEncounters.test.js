import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateFromRequestFile } from './generateEncounters.js';

const requestPath = 'content/generation/requests/example.request.json';

function loadReport(reportPath) {
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

test('encounter generation is deterministic for identical request and seed', () => {
  const first = generateFromRequestFile(requestPath);
  const second = generateFromRequestFile(requestPath);

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);

  const firstReport = loadReport(first[0].reportPath);
  const secondReport = loadReport(second[0].reportPath);
  assert.deepEqual(firstReport, secondReport);
});
