'use strict';
/**
 * Offline deterministic unit tests for scripts/cli.js (Issue #32 Milestones A & B).
 * Run with: node --test tests/cli.test.js
 * Uses only Node stdlib (node:test, node:assert, child_process, fs, os, path).
 */

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLI_PATH = path.join(ROOT_DIR, 'scripts', 'cli.js');
const CANONICAL_SKILL = fs.readFileSync(path.join(ROOT_DIR, 'SKILL.md'), 'utf8');

const IS_WINDOWS = process.platform === 'win32';

function runCli(args, extraEnv) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, extraEnv || {})
  });
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix || 'satori-cli-test-'));
}

function makeTempEnv() {
  const home = makeTempDir('satori-home-');
  const cwd = makeTempDir('satori-cwd-');
  return { home, cwd, env: { SATORI_HOME: home, SATORI_CWD: cwd } };
}

function cleanup(...dirs) {
  for (const dir of dirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      // best effort on all platforms
    }
  }
}

test('doctor --json reports a healthy clean environment and exits 0', () => {
  const t = makeTempEnv();
  try {
    // Simulate one harness with a correctly installed (canonical-matching) skill.
    const skillDir = path.join(t.cwd, '.claude', 'skills', 'satori');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), CANONICAL_SKILL);

    const res = runCli(['doctor', '--json'], t.env);
    assert.strictEqual(res.status, 0, `stdout: ${res.stdout}\nstderr: ${res.stderr}`);
    const report = JSON.parse(res.stdout);
    assert.strictEqual(report.command, 'doctor');
    assert.strictEqual(report.summary.healthy, true);
    assert.strictEqual(report.summary.critical, 0);

    const claude = report.checks.harnesses.cwd.find((h) => h.name === '.claude');
    assert.ok(claude, 'expected .claude harness detection in cwd');
    assert.strictEqual(claude.status, 'installed');

    // Global vault absent in a fresh temp home => informational, not critical.
    assert.strictEqual(report.checks.memory.globalVault.exists, false);
    assert.strictEqual(report.checks.memory.globalVault.severity, 'info');

    // Hook file ships disabled by default.
    assert.strictEqual(report.checks.hooks.status, 'disabled');
    assert.strictEqual(report.checks.hooks.enabled, false);
  } finally {
    cleanup(t.home, t.cwd);
  }
});

test('doctor --json flags installed skill drift as a warning (still exits 0)', () => {
  const t = makeTempEnv();
  try {
    const skillDir = path.join(t.cwd, '.agents', 'skills', 'satori');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), CANONICAL_SKILL + '\n<!-- drifted -->\n');

    const res = runCli(['doctor', '--json'], t.env);
    assert.strictEqual(res.status, 0, `warnings must not fail the run. stdout: ${res.stdout}`);
    const report = JSON.parse(res.stdout);
    const agents = report.checks.harnesses.cwd.find((h) => h.name === '.agents');
    assert.strictEqual(agents.status, 'drift');
    assert.strictEqual(agents.severity, 'warning');
    assert.ok(report.summary.warnings >= 1);
    assert.ok(report.fixHints.some((f) => f.category === 'harness' && /Reinstall/.test(f.hint)));
  } finally {
    cleanup(t.home, t.cwd);
  }
});

test('doctor --json detects harness present but Satori not installed', () => {
  const t = makeTempEnv();
  try {
    fs.mkdirSync(path.join(t.cwd, '.gemini'), { recursive: true });

    const res = runCli(['doctor', '--json'], t.env);
    assert.strictEqual(res.status, 0);
    const report = JSON.parse(res.stdout);
    const gemini = report.checks.harnesses.cwd.find((h) => h.name === '.gemini');
    assert.ok(gemini, 'expected .gemini detection');
    assert.strictEqual(gemini.status, 'not_installed');
    assert.strictEqual(gemini.severity, 'info');
  } finally {
    cleanup(t.home, t.cwd);
  }
});

(IS_WINDOWS ? test.skip : test)('doctor --json flags insecure vault permissions as critical and exits non-zero', () => {
  const t = makeTempEnv();
  try {
    const vault = path.join(t.home, '.satori', 'memory');
    fs.mkdirSync(vault, { recursive: true });
    fs.chmodSync(vault, 0o755); // insecure: must be POSIX 0700

    const res = runCli(['doctor', '--json'], t.env);
    assert.notStrictEqual(res.status, 0, 'insecure vault permissions must exit non-zero');
    const report = JSON.parse(res.stdout);
    assert.strictEqual(report.summary.healthy, false);
    assert.ok(report.summary.critical >= 1);
    const gv = report.checks.memory.globalVault;
    assert.strictEqual(gv.exists, true);
    assert.strictEqual(gv.status, 'insecure');
    assert.strictEqual(gv.severity, 'critical');
    assert.ok(/0700/.test(gv.hint), 'fix hint must name the required permission');
  } finally {
    cleanup(t.home, t.cwd);
  }
});

test('doctor --json flags a cloud-synced vault location as critical', () => {
  const home = makeTempDir('satori-cloud-');
  const cwd = makeTempDir('satori-cwd-');
  try {
    const dropboxHome = path.join(home, 'Dropbox');
    const vault = path.join(dropboxHome, '.satori', 'memory');
    fs.mkdirSync(vault, { recursive: true });
    if (!IS_WINDOWS) fs.chmodSync(vault, 0o700);

    const res = runCli(['doctor', '--json'], { SATORI_HOME: dropboxHome, SATORI_CWD: cwd });
    assert.notStrictEqual(res.status, 0, 'cloud-synced vault must exit non-zero');
    const report = JSON.parse(res.stdout);
    assert.strictEqual(report.summary.healthy, false);
    const gv = report.checks.memory.globalVault;
    assert.strictEqual(gv.cloudSync, true);
    assert.strictEqual(gv.severity, 'critical');
    assert.ok(/cloud-synced/i.test(gv.detail));
    assert.ok(/unsynced/i.test(gv.hint), 'fix hint must recommend an unsynced path');
  } finally {
    cleanup(home, cwd);
  }
});

test('doctor --json flags non-0600 vault files as critical', () => {
  const t = makeTempEnv();
  try {
    const vault = path.join(t.home, '.satori', 'memory');
    fs.mkdirSync(vault, { recursive: true });
    if (!IS_WINDOWS) fs.chmodSync(vault, 0o700);
    const sessionsDir = path.join(vault, 'sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });
    if (!IS_WINDOWS) fs.chmodSync(sessionsDir, 0o700);
    fs.writeFileSync(path.join(vault, 'profile.md'), 'stale', { mode: 0o644 }); // insecure file mode

    const res = runCli(['doctor', '--json'], t.env);
    assert.notStrictEqual(res.status, 0);
    const report = JSON.parse(res.stdout);
    const gv = report.checks.memory.globalVault;
    assert.strictEqual(gv.severity, 'critical');
    assert.ok(Array.isArray(gv.filesWithBadPermissions) && gv.filesWithBadPermissions.length >= 1);
    assert.ok(/0600/.test(gv.hint));
  } finally {
    cleanup(t.home, t.cwd);
  }
});

test('onboard --non-interactive --region US --emit-note prints verified US helplines and a starter SATORI_NOTE', () => {
  const res = runCli(['onboard', '--non-interactive', '--region', 'US', '--emit-note']);
  assert.strictEqual(res.status, 0, `stderr: ${res.stderr}`);
  assert.ok(res.stdout.includes('988'), 'must include the verified 988 lifeline');
  assert.ok(res.stdout.includes('741741'), 'must include the verified Crisis Text Line shortcode');
  assert.ok(res.stdout.includes('911'), 'must include the US emergency number');
  assert.ok(res.stdout.includes('SATORI_NOTE v6.5'), 'must emit the starter continuity note header');

  // Extract the fenced note block and validate it as data-only.
  const fenceStart = res.stdout.indexOf('```');
  const fenceEnd = res.stdout.indexOf('```', fenceStart + 3);
  assert.ok(fenceStart !== -1 && fenceEnd !== -1, 'note must be emitted inside a fenced block');
  const note = res.stdout.slice(fenceStart + 3, fenceEnd).trim();
  assert.ok(note.length > 0 && note.length <= 600, `note must be <= 600 chars, got ${note.length}`);
  const noteLines = note.split('\n');
  assert.strictEqual(noteLines[0], 'SATORI_NOTE v6.5');
  for (const line of noteLines.slice(1)) {
    assert.ok(/^(theme|stance|lens|step|anchor_question|session_count|created): /.test(line), `data-only field expected: ${line}`);
  }
  assert.ok(note.includes('stance: balanced'));
  assert.ok(/^created: \d{4}-\d{2}-\d{2}$/m.test(note));
  // Zero PII and zero prompt-injection tokens.
  assert.ok(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(note), 'note must contain no email addresses');
  assert.ok(!/(ignore (all )?(previous|above|prior)|disregard (all )?(previous|prior)|system\s*:|you are now|sudo mode|<\|)/i.test(note), 'note must contain no prompt-injection tokens');
});

test('onboard rejects an invalid region with a non-zero exit and lists valid regions', () => {
  const res = runCli(['onboard', '--non-interactive', '--region', 'XX']);
  assert.notStrictEqual(res.status, 0);
  assert.ok(/Unknown region 'XX'/i.test(res.stderr));
  for (const region of ['US', 'CA', 'UK', 'IE', 'AU', 'NZ', 'IN', 'EU', 'GLOBAL']) {
    assert.ok(res.stderr.includes(region), `stderr must list valid region ${region}`);
  }
});

test('onboard --non-interactive without --region defaults to GLOBAL directories', () => {
  const res = runCli(['onboard', '--non-interactive']);
  assert.strictEqual(res.status, 0, `stderr: ${res.stderr}`);
  assert.ok(res.stdout.includes('findahelpline.com'), 'GLOBAL fallback must surface the international directory');
  assert.ok(/GLOBAL/i.test(res.stdout));
});

test('onboard accepts lowercase region codes', () => {
  const res = runCli(['onboard', '--non-interactive', '--region', 'uk']);
  assert.strictEqual(res.status, 0, `stderr: ${res.stderr}`);
  assert.ok(res.stdout.includes('116 123'), 'UK region must include Samaritans');
  assert.ok(res.stdout.includes('999'));
});

test('buildStarterNote unit contract: allowlist fields only and <= 600 chars', () => {
  const cli = require(path.join(ROOT_DIR, 'scripts', 'cli.js'));
  const note = cli.buildStarterNote('2026-11-21');
  assert.strictEqual(note.split('\n')[0], 'SATORI_NOTE v6.5');
  assert.ok(note.includes('created: 2026-11-21'));
  assert.ok(note.length <= 600);
  const allowlist = new Set(['theme', 'stance', 'lens', 'step', 'anchor_question', 'session_count', 'created']);
  for (const line of note.split('\n').slice(1)) {
    assert.ok(allowlist.has(line.split(':')[0]), `unexpected field in note: ${line}`);
  }
});

test('isCloudSyncedPath mirrors satori_memory.py cloud-sync markers', () => {
  const cli = require(path.join(ROOT_DIR, 'scripts', 'cli.js'));
  assert.strictEqual(cli.isCloudSyncedPath('/home/user/OneDrive/.satori/memory'), true);
  assert.strictEqual(cli.isCloudSyncedPath('/home/user/Library/Mobile Documents/.satori/memory'), true);
  assert.strictEqual(cli.isCloudSyncedPath('/home/user/Dropbox/x/.satori/memory'), true);
  assert.strictEqual(cli.isCloudSyncedPath('/home/user/plain/projects/.satori/memory'), false);
});

test('doctor rejects unknown flags with a usage hint and non-zero exit', () => {
  const res = runCli(['doctor', '--nonsense']);
  assert.notStrictEqual(res.status, 0);
  assert.ok(/Usage: npx @metcalfsolutions\/satori doctor/.test(res.stderr));
});
