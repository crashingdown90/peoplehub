/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const projectRoot = path.resolve(__dirname, '..');

const domains = {
  CL: [
    'src/lib/auth',
    'src/lib/tenant',
    'src/lib/security',
    'src/services',
    'src/app/api',
    'prisma',
  ],
  CX: [
    'src/components',
    'src/app/(auth)',
    'src/app/(dashboard)',
    'src/app/(features)',
    'src/app/admin',
    'src/styles',
  ],
  AG: [
    'src/types',
    'src/utils',
    'src/hooks',
    'src/constants',
  ],
};

const detectCurrentAI = (branch) => {
  if (branch.includes('/cl-') || branch.startsWith('cl-')) return 'CL';
  if (branch.includes('/ag-') || branch.startsWith('ag-')) return 'AG';
  if (branch.includes('/cx-') || branch.startsWith('cx-')) return 'CX';
  return null;
};

const toProjectRelative = (file) => {
  const absPath = path.resolve(repoRoot, file);
  if (!absPath.startsWith(projectRoot)) return null;
  return path.relative(projectRoot, absPath);
};

const getChangedFiles = () => {
  let files = execSync('git diff --name-only --cached', { cwd: repoRoot })
    .toString()
    .split('\n')
    .filter(Boolean);

  if (files.length === 0) {
    files = execSync('git diff --name-only', { cwd: repoRoot })
      .toString()
      .split('\n')
      .filter(Boolean);
  }

  return files;
};

const branch = execSync('git branch --show-current', { cwd: repoRoot })
  .toString()
  .trim();
const currentAI = detectCurrentAI(branch);

const changedFiles = getChangedFiles()
  .map(toProjectRelative)
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log('No changed files inside project; domain validation skipped.');
  process.exit(0);
}

const findOwner = (file) => {
  const match = Object.entries(domains).find(([, paths]) =>
    paths.some((prefix) => file.startsWith(prefix)),
  );
  return match ? match[0] : null;
};

const violations = [];

for (const file of changedFiles) {
  const owner = findOwner(file);

  if (!owner) continue;

  if (!currentAI) {
    violations.push({ file, owner, reason: 'Branch name does not map to an AI (use /cl-, /ag-, /cx-).' });
    continue;
  }

  if (owner !== currentAI) {
    violations.push({ file, owner, reason: `Owned by ${owner}, current AI ${currentAI}` });
  }
}

if (violations.length > 0) {
  console.error('❌ Domain violations detected:\n');
  violations.forEach((v) => {
    console.error(`   ${v.file}`);
    console.error(`   └── ${v.reason}\n`);
  });
  process.exit(1);
}

console.log(`✅ All files within ${currentAI || 'unknown'} branch domain\n`);
console.log('Files checked:');
changedFiles.forEach((f) => console.log(`   ✓ ${f}`));
process.exit(0);
