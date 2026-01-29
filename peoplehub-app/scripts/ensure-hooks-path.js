/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

try {
  const repoRoot = execSync('git rev-parse --show-toplevel', {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trim();

  const hooksPath = path.relative(repoRoot, path.join(projectRoot, '.husky'));

  execSync(`git config core.hooksPath "${hooksPath}"`, { cwd: repoRoot });
  console.log(`Husky hooks path set to ${hooksPath}`);
} catch {
  console.log('⚠️  Skipping husky setup (git repo not detected).');
}
