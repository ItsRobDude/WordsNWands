import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const tsconfigPath = new URL('../tsconfig.base.json', import.meta.url);
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

if (!Array.isArray(tsconfig.include) || tsconfig.include.length === 0) {
  throw new Error('tsconfig.base.json must define include globs.');
}

const shouldCheckPackagesJs = tsconfig.include.includes('packages/**/*.js');
if (!shouldCheckPackagesJs) {
  throw new Error("tsconfig.base.json include must contain 'packages/**/*.js'.");
}

const files = execFileSync('bash', ['-lc', "find packages -type f -name '*.js' | sort"], {
  encoding: 'utf-8'
})
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

for (const file of files) {
  execFileSync('node', ['--check', file], { stdio: 'inherit' });
}
