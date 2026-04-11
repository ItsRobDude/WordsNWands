import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const vitestConfigPath = new URL('../vitest.config.ts', import.meta.url);
const vitestConfig = fs.readFileSync(vitestConfigPath, 'utf-8');

if (!vitestConfig.includes('include')) {
  throw new Error('vitest.config.ts must define test.include to remain the canonical root test config.');
}

const testFiles = execFileSync('bash', ['-lc', "find packages -type f -name '*.test.js' | sort"], {
  encoding: 'utf-8'
})
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

if (testFiles.length === 0) {
  console.log('No *.test.js files found under packages/.');
  process.exit(0);
}

execFileSync('node', ['--test', ...testFiles], { stdio: 'inherit' });
