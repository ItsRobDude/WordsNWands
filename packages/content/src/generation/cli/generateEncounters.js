#!/usr/bin/env node
import { generateFromRequestFile } from '../generateEncounters.js';

function parseRequestArg(argv) {
  const index = argv.indexOf('--request');
  if (index === -1 || !argv[index + 1]) {
    throw new Error('Missing required --request <file> argument.');
  }
  return argv[index + 1];
}

try {
  const requestPath = parseRequestArg(process.argv.slice(2));
  const writes = generateFromRequestFile(requestPath);
  console.log(`Generated ${writes.length} encounter draft(s):`);
  for (const write of writes) {
    console.log(`- ${write.draft_id}`);
    console.log(`  encounter: ${write.encounterPath}`);
    console.log(`  creature:  ${write.creaturePath}`);
    console.log(`  report:    ${write.reportPath}`);
    console.log(`  review:    ${write.reviewPath}`);
  }
} catch (error) {
  console.error(`Encounter generation failed: ${error.message}`);
  process.exit(1);
}
