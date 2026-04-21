import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const rootPkgPath = join(rootDir, 'package.json');
const rootPkg = readJson(rootPkgPath);
const { version } = rootPkg;

if (typeof version !== 'string' || version.length === 0) {
  console.error(
    'sync-package-versions: expected non-empty string "version" in root package.json, got:',
    version,
  );
  process.exit(1);
}

const targets = ['server/package.json', 'client/package.json'];

for (const relative of targets) {
  const path = join(rootDir, relative);
  const pkg = readJson(path);
  pkg.version = version;
  writeJson(path, pkg);
  console.log(`sync-package-versions: ${relative} -> ${version}`);
}
