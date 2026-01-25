/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const projectRoot = path.resolve(__dirname, '..');
const locksFile = path.join(projectRoot, '.ai-config', 'locks.json');

if (!fs.existsSync(locksFile)) {
  console.log('No locks file found, skipping lock check.');
  process.exit(0);
}

const locks = JSON.parse(fs.readFileSync(locksFile, 'utf8'));

const stagedFiles = execSync('git diff --cached --name-only', { cwd: repoRoot })
  .toString()
  .split('\n')
  .filter(Boolean);

const toProjectRelative = (file) => {
  const absPath = path.resolve(repoRoot, file);
  if (!absPath.startsWith(projectRoot)) return null;
  return path.relative(projectRoot, absPath);
};

const stagedInProject = stagedFiles
  .map(toProjectRelative)
  .filter(Boolean);

if (stagedInProject.length === 0) {
  console.log('No staged files within project; skipping lock check.');
  process.exit(0);
}

const branch = execSync('git branch --show-current', { cwd: repoRoot })
  .toString()
  .trim();

let currentAI = null;
if (branch.includes('/cl-') || branch.startsWith('cl-')) currentAI = 'CL';
else if (branch.includes('/ag-') || branch.startsWith('ag-')) currentAI = 'AG';
else if (branch.includes('/cx-') || branch.startsWith('cx-')) currentAI = 'CX';

const violations = [];

for (const file of stagedInProject) {
  const lock = locks.locks?.find((entry) => entry.file === file);
  if (lock && lock.lockedBy !== currentAI) {
    violations.push(`${file} is locked by ${lock.lockedBy || 'unknown AI'}`);
  }
}

if (violations.length > 0) {
  console.error('❌ Lock violations detected:');
  violations.forEach((v) => console.error(`   - ${v}`));
  if (!currentAI) {
    console.error('⚠️  Branch name does not identify an AI (expected /cl-, /ag-, /cx-).');
  }
  process.exit(1);
}

console.log('✅ No lock violations within project');
process.exit(0);
