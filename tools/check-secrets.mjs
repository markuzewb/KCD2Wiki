#!/usr/bin/env node
/** Fail fast if tracked files contain obvious secrets or non-project archives. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
let files;
try {
  files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
} catch {
  console.error('check-secrets: run inside a Git checkout');
  process.exit(2);
}

const problems = [];
const archiveExt = /\.(tgz|tar\.gz|zip|rar|7z)$/i;
const secretName = /(^|\/)\.env(\..+)?$/i;
const privateKey = /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/;
const envAssignment = /\b(WIKI_ADMIN_PASSWORD|WIKI_SESSION_SECRET)\s*=\s*(.+)$/;
const placeholder = /(CHANGE_THIS|YOUR_|ВАШ|СГЕНЕРИРУЙТЕ|<[^>]+>|\$\(|\$\{|process\.env|example\.com)/i;
const literalSecret = /\b(WIKI_ADMIN_PASSWORD|WIKI_SESSION_SECRET)\s*[:=]\s*['"]?([A-Za-z0-9_\-./+=]{12,})['"]?/;

for (const file of files) {
  if (secretName.test(file) && file !== '.env.example' && !file.endsWith('/.env.example')) {
    problems.push(`${file}: environment file must not be tracked`);
  }
  if (archiveExt.test(file)) {
    problems.push(`${file}: archive must not be tracked in the project repository`);
  }
  const full = path.join(root, file);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
  const stat = fs.statSync(full);
  if (stat.size > 2_000_000) continue; // catalogs/vendor are checked by review/build, not this lightweight scan
  const text = fs.readFileSync(full, 'utf8');
  if (privateKey.test(text)) problems.push(`${file}: private key material detected`);
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    const assign = trimmed.match(envAssignment);
    if (assign && !placeholder.test(assign[2]) && !/^\s*$/.test(assign[2])) {
      problems.push(`${file}:${index + 1}: possible literal ${assign[1]} value`);
    }
    const literal = trimmed.match(literalSecret);
    if (literal && !placeholder.test(trimmed) && !/process\.env/.test(trimmed)) {
      problems.push(`${file}:${index + 1}: possible hardcoded ${literal[1]}`);
    }
  }
}

if (problems.length) {
  console.error('Secret check failed:');
  for (const problem of problems) console.error(' - ' + problem);
  process.exit(1);
}
console.log(`Secret check passed: ${files.length} tracked files scanned.`);
