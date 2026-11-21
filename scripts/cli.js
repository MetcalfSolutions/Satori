#!/usr/bin/env node
/**
 * Satori Native CLI runner (scripts/cli.js)
 * Enables direct invocation via `npx @metcalfsolutions/satori`.
 *
 * Commands: install, add, print, print-compact, doctor, onboard, info, help, --version.
 * Zero external npm dependencies. Node 18+ stdlib only.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');
let pkgVersion = '6.5.5';
try {
  pkgVersion = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')).version || pkgVersion;
} catch (e) {}

const CRISIS_SOURCES_PATH = path.join(ROOT_DIR, 'references', 'crisis-sources.json');
const HOOKS_PATH = path.join(ROOT_DIR, 'hooks', 'hooks.json');

// Agent harness directories scanned by `satori doctor`.
const HARNESS_DIRS = ['.claude', '.gemini', '.cursor', '.codex', '.opencode', '.agents'];

// Mirrors CLOUD_SYNC_MARKERS in scripts/satori_memory.py (single source of truth for semantics).
const CLOUD_SYNC_MARKERS = ['onedrive', 'iclouddrive', 'mobile documents', 'dropbox', 'google drive', 'box'];

// Allowed onboarding regions. Populated from references/crisis-sources.json when available.
let VALID_REGIONS = ['US', 'CA', 'UK', 'IE', 'AU', 'NZ', 'IN', 'EU', 'GLOBAL'];

function printBanner() {
  console.log(`\x1b[1m\x1b[36mSatori v${pkgVersion}\x1b[0m: Psychologically Grounded Wisdom Companion for the Inner Life`);
  console.log(`Free, open-source, not a therapist. Apache-2.0 License.\n`);
}

function printHelp() {
  printBanner();
  console.log(`\x1b[1mUsage:\x1b[0m`);
  console.log(`  npx @metcalfsolutions/satori [command]\n`);
  console.log(`\x1b[1mCommands:\x1b[0m`);
  console.log(`  install, add     Install Satori into local project agent directories`);
  console.log(`  doctor           Run environment & safety diagnostics`);
  console.log(`                   doctor --json  structured output for CI (non-zero exit on critical issues)`);
  console.log(`  onboard          Locale-aware onboarding with verified crisis helplines`);
  console.log(`                   onboard --region <US|CA|UK|IE|AU|NZ|IN|EU|GLOBAL> [--non-interactive] [--emit-note]`);
  console.log(`  print            Print canonical SKILL.md to stdout`);
  console.log(`  print-compact    Print compact SKILL.md to stdout`);
  console.log(`  info             Display ecosystem installation guide`);
  console.log(`  help, --help     Show this help message`);
  console.log(`  -v, --version    Show version number\n`);
  console.log(`\x1b[1mEnv overrides (CI & testing):\x1b[0m`);
  console.log(`  SATORI_CWD   Base directory for project-level harness detection (default: process.cwd())`);
  console.log(`  SATORI_HOME  Base directory for global vault & harness detection (default: os.homedir())\n`);
  console.log(`\x1b[1mRecommended Agent Skills Ecosystem Command:\x1b[0m`);
  console.log(`  \x1b[32mnpx skills add MetcalfSolutions/Satori\x1b[0m\n`);
}

function runInstall() {
  printBanner();
  const cwd = process.cwd();
  console.log(`Installing Satori skill into current directory: ${cwd}\n`);

  const targetDirs = [
    path.join(cwd, '.agents', 'skills', 'satori'),
    path.join(cwd, '.cursor', 'skills', 'satori'),
    path.join(cwd, '.claude', 'skills', 'satori')
  ];

  const sourceSkill = path.join(ROOT_DIR, 'SKILL.md');
  if (!fs.existsSync(sourceSkill)) {
    console.error(`\x1b[31mError: Canonical SKILL.md not found in package at ${sourceSkill}\x1b[0m`);
    process.exit(1);
  }

  const content = fs.readFileSync(sourceSkill, 'utf8');
  let installedCount = 0;

  for (const dir of targetDirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf8');
      console.log(`  \x1b[32m✓\x1b[0m Installed ${path.relative(cwd, path.join(dir, 'SKILL.md'))}`);
      installedCount++;
    } catch (err) {
      console.warn(`  \x1b[33m⚠\x1b[0m Could not write to ${dir}: ${err.message}`);
    }
  }

  console.log(`\n\x1b[32mSuccessfully installed Satori into ${installedCount} agent directory targets.\x1b[0m`);
  console.log(`\nTip: You can also install globally across all agents with:\n  \x1b[36mnpx skills add -g MetcalfSolutions/Satori\x1b[0m\n`);
}

function printSkill(filePath) {
  const target = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(target)) {
    console.error(`File not found: ${target}`);
    process.exit(1);
  }
  process.stdout.write(fs.readFileSync(target, 'utf8'));
}

/* ------------------------------------------------------------------------ */
/* Milestone A: `satori doctor [--json]` environment & safety diagnostics   */
/* ------------------------------------------------------------------------ */

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text).replace(/\r\n/g, '\n')).digest('hex');
}

function isCloudSyncedPath(targetPath) {
  const normalized = path.resolve(targetPath).toLowerCase();
  return CLOUD_SYNC_MARKERS.some((marker) => normalized.includes(marker));
}

function readCanonicalSkill() {
  const skillPath = path.join(ROOT_DIR, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;
  const text = fs.readFileSync(skillPath, 'utf8');
  return { path: skillPath, text, sha256: sha256Text(text) };
}

function scanHarnesses(base, canonicalSha, scope) {
  const found = [];
  if (!fs.existsSync(base)) return found;
  for (const harness of HARNESS_DIRS) {
    const harnessDir = path.join(base, harness);
    let stat = null;
    try {
      stat = fs.statSync(harnessDir);
    } catch (e) {
      continue;
    }
    if (!stat.isDirectory()) continue;

    const skillPath = path.join(harnessDir, 'skills', 'satori', 'SKILL.md');
    const entry = { scope, name: harness, dir: harnessDir, skillPath };
    if (!fs.existsSync(skillPath)) {
      entry.status = 'not_installed';
      entry.severity = 'info';
      entry.hint = `Satori is not installed for ${harness}. Run 'npx @metcalfsolutions/satori install' (project) or 'npx skills add -g MetcalfSolutions/Satori' (global).`;
    } else {
      const installed = fs.readFileSync(skillPath, 'utf8');
      entry.installedSha256 = sha256Text(installed);
      if (canonicalSha && entry.installedSha256 === canonicalSha) {
        entry.status = 'installed';
        entry.severity = 'ok';
      } else {
        entry.status = 'drift';
        entry.severity = 'warning';
        entry.hint = `Installed ${harness} SKILL.md does not match canonical SKILL.md (SHA-256 ${(entry.installedSha256 || '').slice(0, 12)} != ${(canonicalSha || '').slice(0, 12)}). Reinstall with 'npx @metcalfsolutions/satori install' or 'npx skills add MetcalfSolutions/Satori'.`;
      }
    }
    found.push(entry);
  }
  return found;
}

function checkVault(vaultDir) {
  const finding = {
    path: vaultDir,
    exists: false,
    cloudSync: false,
    status: 'not_initialized',
    severity: 'info',
    detail: 'Memory vault not initialized.'
  };
  if (!fs.existsSync(vaultDir)) {
    finding.hint = 'Initialize it with: python scripts/satori_memory.py init';
    return finding;
  }

  finding.exists = true;
  const problems = [];

  // Cloud-sync hygiene: mirrors scripts/satori_memory.py is_cloud_synced_path().
  finding.cloudSync = isCloudSyncedPath(vaultDir);
  if (finding.cloudSync) {
    problems.push('Vault sits inside a cloud-synced directory. Private reflections must not sync to corporate clouds.');
    finding.hint = 'Move the vault to an unsynced local path or re-run init with: python scripts/satori_memory.py --dir <unsynced-path> init';
  }

  if (process.platform === 'win32') {
    finding.permissionMode = 'windows-acl';
    finding.detail = 'Windows detected: verify user-SID ACL restrictions with icacls (vault should grant access only to the current user).';
    if (problems.length === 0) {
      finding.status = 'ok-windows-note';
      finding.severity = 'info';
      finding.detail = finding.detail;
      finding.hint = 'Satori enforces user-SID ACLs via icacls on init. Verify with: icacls "<vault>"';
    }
  } else {
    const dirMode = fs.statSync(vaultDir).mode & 0o777;
    finding.dirMode = dirMode.toString(8);
    if (dirMode !== 0o700) {
      problems.push(`Vault directory mode is ${dirMode.toString(8)}, expected POSIX 0700.`);
      finding.hint = 'Fix permissions with: chmod 0700 "<vault>" (files: chmod 0600), or re-run: python scripts/satori_memory.py init';
    }
    const badFiles = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else {
          const mode = fs.statSync(p).mode & 0o777;
          if (mode !== 0o600) badFiles.push({ path: p, mode: mode.toString(8) });
        }
      }
    };
    try {
      walk(vaultDir);
    } catch (e) {
      problems.push(`Could not fully scan vault: ${e.message}`);
    }
    finding.filesWithBadPermissions = badFiles;
    if (badFiles.length > 0) {
      problems.push(`${badFiles.length} vault file(s) are not POSIX 0600.`);
      if (!finding.hint) {
        finding.hint = 'Fix permissions with: chmod 0600 <vault>/* (and chmod 0700 <vault>), or re-run: python scripts/satori_memory.py init';
      }
    }
  }

  if (problems.length > 0) {
    finding.status = 'insecure';
    finding.severity = 'critical';
    finding.detail = problems.join(' ');
  } else if (process.platform !== 'win32') {
    finding.status = 'secure';
    finding.severity = 'ok';
    finding.detail = 'Vault permissions comply with POSIX 0700/0600.';
  }
  return finding;
}

function checkPython() {
  const finding = { status: 'unavailable', severity: 'warning', available: false };
  for (const bin of ['python3', 'python']) {
    let res = null;
    try {
      res = spawnSync(bin, ['-c', 'import sys; print(".".join(map(str, sys.version_info[:3])))'], {
        encoding: 'utf8',
        timeout: 10000
      });
    } catch (e) {
      continue;
    }
    if (res && res.status === 0 && res.stdout) {
      const version = res.stdout.trim().split('\n')[0];
      const parts = version.split('.').map((n) => parseInt(n, 10));
      finding.available = true;
      finding.binary = bin;
      finding.version = version;
      if (parts.length >= 2 && (parts[0] > 3 || (parts[0] === 3 && parts[1] >= 9))) {
        finding.status = 'ok';
        finding.severity = 'ok';
        finding.detail = `Python ${version} satisfies the 3.9+ requirement for scripts/satori_memory.py.`;
      } else {
        finding.status = 'outdated';
        finding.severity = 'warning';
        finding.detail = `Python ${version} found but Satori memory requires 3.9+.`;
        finding.hint = 'Install Python 3.9 or newer and ensure it is on PATH.';
      }
      return finding;
    }
  }
  finding.detail = 'No suitable Python interpreter found (tried python3, python).';
  finding.hint = 'Install Python 3.9+ to enable the local memory vault (scripts/satori_memory.py). Web chat surfaces do not require it.';
  return finding;
}

function checkHooks() {
  const finding = { path: HOOKS_PATH };
  if (!fs.existsSync(HOOKS_PATH)) {
    finding.status = 'missing';
    finding.severity = 'critical';
    finding.detail = 'hooks/hooks.json not found in the Satori package.';
    finding.hint = 'Reinstall the Satori package (npm install @metcalfsolutions/satori) to restore hooks/hooks.json.';
    return finding;
  }
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(HOOKS_PATH, 'utf8'));
  } catch (e) {
    finding.status = 'malformed';
    finding.severity = 'critical';
    finding.detail = `hooks/hooks.json is not valid JSON: ${e.message}`;
    finding.hint = 'Restore the canonical hooks/hooks.json from the Satori repository.';
    return finding;
  }
  finding.enabled = Boolean(parsed.enabled);
  finding.description = parsed.description || '';
  if (finding.enabled) {
    finding.status = 'enabled';
    finding.severity = 'ok';
    finding.detail = 'Opt-in SessionStart memory hook is enabled.';
  } else {
    finding.status = 'disabled';
    finding.severity = 'info';
    finding.detail = 'Opt-in SessionStart memory hook is disabled (default: canonical execution stays single-model).';
    finding.hint = "To opt in, set \"enabled\": true in hooks/hooks.json and run scripts/install-hooks.py.";
  }
  return finding;
}

function buildDoctorReport(opts) {
  const cwd = (opts && opts.cwd) || process.env.SATORI_CWD || process.cwd();
  const home = (opts && opts.home) || process.env.SATORI_HOME || os.homedir();

  const findings = [];
  const addFinding = (category, finding) => {
    findings.push(Object.assign({ category }, finding));
    return finding;
  };

  // 1. Package integrity (canonical SKILL.md + crisis sources manifest)
  const canonical = readCanonicalSkill();
  if (!canonical) {
    addFinding('package', {
      status: 'missing',
      severity: 'critical',
      detail: `Canonical SKILL.md not found at ${path.join(ROOT_DIR, 'SKILL.md')}.`,
      hint: 'The Satori package is incomplete. Reinstall it from npm or GitHub.'
    });
  }
  let crisis = null;
  if (!fs.existsSync(CRISIS_SOURCES_PATH)) {
    addFinding('package', {
      status: 'missing',
      severity: 'critical',
      detail: `references/crisis-sources.json not found at ${CRISIS_SOURCES_PATH}.`,
      hint: 'The Satori package is incomplete. Reinstall it from npm or GitHub (crisis safety data is required).'
    });
  } else {
    crisis = JSON.parse(fs.readFileSync(CRISIS_SOURCES_PATH, 'utf8'));
    VALID_REGIONS = crisis.regions.map((r) => r.id);
  }

  // 2. Harness detection (cwd + home)
  const canonicalSha = canonical ? canonical.sha256 : null;
  const harnesses = {
    cwd: scanHarnesses(cwd, canonicalSha, 'cwd'),
    home: scanHarnesses(home, canonicalSha, 'home')
  };
  for (const scope of ['cwd', 'home']) {
    for (const entry of harnesses[scope]) {
      addFinding('harness', {
        status: entry.status,
        severity: entry.severity,
        detail: `${scope} ${entry.name}: ${entry.status.replace('_', ' ')}${entry.status === 'drift' ? ' (SHA-256 mismatch vs canonical SKILL.md)' : ''}.`,
        hint: entry.hint,
        name: entry.name,
        scope
      });
    }
    if (harnesses[scope].length === 0) {
      addFinding('harness', {
        status: 'none_detected',
        severity: 'info',
        detail: `No known agent harness directories (${HARNESS_DIRS.join(', ')}) detected in ${scope} base: ${scope === 'cwd' ? cwd : home}.`,
        hint: null
      });
    }
  }

  // 3. Memory vault & privacy hygiene
  const globalVaultPath = path.join(home, '.satori', 'memory');
  const localVaultPath = path.join(cwd, '.satori', 'memory');
  const memory = {
    globalVault: addFinding('memory', checkVault(globalVaultPath)),
    localVault: fs.existsSync(localVaultPath) ? addFinding('memory', checkVault(localVaultPath)) : null,
    python: addFinding('memory', checkPython())
  };

  // 4. Hook status
  const hooks = addFinding('hooks', checkHooks());

  const critical = findings.filter((f) => f.severity === 'critical').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const infos = findings.filter((f) => f.severity === 'info').length;

  const fixHints = findings.filter((f) => f.hint && (f.severity === 'critical' || f.severity === 'warning')).map((f) => ({
    severity: f.severity,
    category: f.category,
    detail: f.detail,
    hint: f.hint
  }));

  return {
    command: 'doctor',
    satoriVersion: pkgVersion,
    platform: process.platform,
    cwd,
    home,
    canonicalSkillSha256: canonicalSha,
    checks: {
      harnesses,
      memory: {
        globalVault: memory.globalVault,
        localVault: memory.localVault,
        python: memory.python
      },
      hooks
    },
    findings,
    summary: {
      healthy: critical === 0,
      critical,
      warnings,
      infos,
      total: findings.length
    },
    fixHints
  };
}

function severitySymbol(sev) {
  if (sev === 'ok') return '\x1b[32m✓\x1b[0m';
  if (sev === 'warning') return '\x1b[33m⚠\x1b[0m';
  if (sev === 'critical') return '\x1b[31m✗\x1b[0m';
  return '\x1b[36m•\x1b[0m';
}

function printDoctorText(report) {
  console.log(`\x1b[1mSatori v${pkgVersion} environment & safety diagnostics\x1b[0m\n`);
  console.log(`Project base (cwd):  ${report.cwd}`);
  console.log(`User base (home):    ${report.home}\n`);

  console.log(`\x1b[1mAgent harness detection\x1b[0m`);
  const printHarness = (scope) => {
    const list = report.checks.harnesses[scope];
    if (list.length === 0) {
      console.log(`  ${severitySymbol('info')} ${scope}: no known harness directories detected`);
      return;
    }
    for (const h of list) {
      if (h.status === 'installed') console.log(`  ${severitySymbol('ok')} ${scope}/${h.name}: Satori installed (matches canonical SKILL.md)`);
      else if (h.status === 'drift') console.log(`  ${severitySymbol('warning')} ${scope}/${h.name}: installed SKILL.md drifts from canonical`);
      else console.log(`  ${severitySymbol('info')} ${scope}/${h.name}: harness present, Satori not installed`);
    }
  };
  printHarness('cwd');
  printHarness('home');

  console.log(`\n\x1b[1mMemory vault & privacy hygiene\x1b[0m`);
  const printVault = (label, v) => {
    if (!v) return;
    console.log(`  ${severitySymbol(v.severity)} ${label} vault: ${v.path}`);
    console.log(`      ${v.detail}`);
    if (v.hint) console.log(`      Fix: ${v.hint}`);
  };
  printVault('Global', report.checks.memory.globalVault);
  if (report.checks.memory.localVault) printVault('Local ', report.checks.memory.localVault);
  const py = report.checks.memory.python;
  console.log(`  ${severitySymbol(py.severity)} Python: ${py.detail}`);

  console.log(`\n\x1b[1mHook status\x1b[0m`);
  const hooks = report.checks.hooks;
  console.log(`  ${severitySymbol(hooks.severity)} SessionStart hook: ${hooks.status}${hooks.description ? ` (${hooks.description})` : ''}`);

  if (report.fixHints.length > 0) {
    console.log(`\n\x1b[1mActionable fixes\x1b[0m`);
    for (const f of report.fixHints) {
      console.log(`  ${severitySymbol(f.severity)} [${f.category}] ${f.detail}`);
      console.log(`      Fix: ${f.hint}`);
    }
  }

  const s = report.summary;
  console.log(`\n\x1b[1mSummary\x1b[0m`);
  console.log(
    `  ${s.healthy ? severitySymbol('ok') + ' Healthy' : severitySymbol('critical') + ' Critical issues found'}: ${s.critical} critical, ${s.warnings} warnings, ${s.infos} informational (${s.total} checks)`
  );
  if (!s.healthy) {
    console.log(`\n  Resolve the critical items above, then re-run: npx @metcalfsolutions/satori doctor`);
  }
}

function runDoctor(opts) {
  const jsonMode = Boolean(opts && opts.json);
  let report;
  try {
    report = buildDoctorReport(opts);
  } catch (e) {
    if (jsonMode) {
      console.log(JSON.stringify({ command: 'doctor', error: e.message, summary: { healthy: false, critical: 1 } }, null, 2));
    } else {
      console.error(`\x1b[31mError running diagnostics: ${e.message}\x1b[0m`);
    }
    return 1;
  }
  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printDoctorText(report);
  }
  return report.summary.healthy ? 0 : 1;
}

/* ------------------------------------------------------------------------ */
/* Milestone B: locale-aware `satori onboard` + starter SATORI_NOTE         */
/* ------------------------------------------------------------------------ */

function loadCrisisSources() {
  if (!fs.existsSync(CRISIS_SOURCES_PATH)) {
    throw new Error(`references/crisis-sources.json not found at ${CRISIS_SOURCES_PATH}. The Satori package is incomplete; reinstall it.`);
  }
  const data = JSON.parse(fs.readFileSync(CRISIS_SOURCES_PATH, 'utf8'));
  VALID_REGIONS = data.regions.map((r) => r.id);
  return data;
}

/**
 * Build the data-only starter SATORI_NOTE v6.5 continuity block for stateless
 * Web Chat users (SatoriWeb, Claude.ai, ChatGPT). Zero PII, zero prompt-injection
 * tokens, strictly <= 600 chars. Field allowlist matches scripts/satori_memory.py.
 */
function buildStarterNote(dateStr) {
  const created = dateStr || new Date().toISOString().slice(0, 10);
  const lines = [
    'SATORI_NOTE v6.5',
    'theme: Beginning a reflective practice with Satori',
    'stance: balanced',
    'lens: stoic',
    'step: anchor',
    'anchor_question: What small step holds reality today without rushing?',
    'session_count: 1',
    `created: ${created}`
  ];
  const note = lines.join('\n');
  if (note.length > 600) {
    throw new Error(`Generated starter note exceeds 600 characters: ${note.length}`);
  }
  return note;
}

function renderRegion(data, regionId) {
  const region = data.regions.find((r) => String(r.id).toUpperCase() === String(regionId).toUpperCase());
  if (!region) return null;
  const lastVerified = region.lastVerified || region.last_verified || data.lastVerified || data.last_verified || 'unknown';
  const out = [];
  out.push(`\x1b[1m${region.name} (${region.id})\x1b[0m`);
  out.push(`Emergency number: ${region.emergency}`);
  if (region.callLines && region.callLines.length > 0) {
    out.push(`\n\x1b[1mCall lines:\x1b[0m`);
    for (const line of region.callLines) {
      out.push(`  ${line.name}: ${line.number}${line.availability ? ` (${line.availability})` : ''}`);
    }
  }
  if (region.textLines && region.textLines.length > 0) {
    out.push(`\n\x1b[1mText lines:\x1b[0m`);
    for (const line of region.textLines) {
      out.push(`  ${line.name}: ${line.instruction || line.number}`);
    }
  }
  if (region.directories && region.directories.length > 0) {
    out.push(`\n\x1b[1mInternational directories:\x1b[0m`);
    for (const dir of region.directories) {
      out.push(`  ${dir}`);
    }
  }
  if (region.primarySources && region.primarySources.length > 0) {
    out.push(`\nPrimary sources: ${region.primarySources.join(', ')}`);
  }
  out.push(`Verified as of: ${lastVerified}`);
  return out.join('\n');
}

function printOnboardHelpHint() {
  console.error(`Valid regions: ${VALID_REGIONS.join(', ')}`);
}

function promptRegionInteractive(data, callback) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Select your region:');
  data.regions.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} (${r.id})`));
  rl.question('Region number or code (default GLOBAL): ', (answer) => {
    rl.close();
    const trimmed = String(answer || '').trim();
    if (!trimmed) return callback('GLOBAL');
    const asIndex = parseInt(trimmed, 10);
    if (!Number.isNaN(asIndex) && asIndex >= 1 && asIndex <= data.regions.length) {
      return callback(data.regions[asIndex - 1].id);
    }
    return callback(trimmed.toUpperCase());
  });
  rl.on('close', () => {});
}

function runOnboard(opts) {
  const regionArg = opts && opts.region;
  const nonInteractive = Boolean(opts && opts.nonInteractive);
  const emitNote = Boolean(opts && opts.emitNote);

  const data = loadCrisisSources();
  VALID_REGIONS = data.regions.map((r) => r.id);

  const finish = (regionId) => {
    if (!regionId || !VALID_REGIONS.includes(String(regionId).toUpperCase())) {
      console.error(`\x1b[31mUnknown region '${regionId}'.\x1b[0m`);
      printOnboardHelpHint();
      return 1;
    }
    const rendered = renderRegion(data, regionId);
    if (rendered === null) {
      console.error(`\x1b[31mRegion '${regionId}' has no entry in references/crisis-sources.json.\x1b[0m`);
      printOnboardHelpHint();
      return 1;
    }
    printBanner();
    console.log(`\x1b[1mLocale-aware onboarding: verified crisis helplines\x1b[0m\n`);
    console.log(rendered);
    console.log(`\nIf you are in immediate danger, contact the emergency number above now.`);

    if (emitNote) {
      const note = buildStarterNote();
      console.log(`\n\x1b[1mStarter continuity note (for stateless web chat: SatoriWeb, Claude.ai, ChatGPT)\x1b[0m`);
      console.log(`Data-only: zero personal information, zero prompt-injection tokens, <= 600 chars.`);
      console.log(`Save it anywhere private and paste it at the start of a new chat to restore continuity.\n`);
      console.log('```');
      console.log(note);
      console.log('```');
      console.log(`Later, once you have a local vault, you can export richer notes with: python scripts/satori_memory.py export-note`);
    }

    console.log(`\nNext step: install Satori into your agent harness with 'npx skills add MetcalfSolutions/Satori'.`);
    return 0;
  };

  if (regionArg) return finish(String(regionArg).toUpperCase());
  if (nonInteractive) {
    console.error(`No --region passed with --non-interactive; defaulting to GLOBAL.`);
    return finish('GLOBAL');
  }
  if (!process.stdin.isTTY) {
    return finish('GLOBAL');
  }
  promptRegionInteractive(data, (selected) => {
    process.exitCode = finish(selected);
  });
  return null; // async interactive path; exit code set via callback
}

/* ------------------------------------------------------------------------ */
/* Command dispatch                                                         */
/* ------------------------------------------------------------------------ */

function parseFlags(rest) {
  const flags = { json: false, region: null, nonInteractive: false, emitNote: false, unknown: [] };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--json') flags.json = true;
    else if (arg === '--region') {
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        flags.unknown.push('--region requires a value');
      } else {
        flags.region = next;
        i++;
      }
    } else if (arg === '--non-interactive' || arg === '--noninteractive') flags.nonInteractive = true;
    else if (arg === '--emit-note') flags.emitNote = true;
    else flags.unknown.push(arg);
  }
  return flags;
}

function main(argv) {
  const args = Array.isArray(argv) ? argv : [];
  const command = args[0] || 'info';
  const rest = args.slice(1);

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      return 0;
    case 'version':
    case '--version':
    case '-v':
      console.log(pkgVersion);
      return 0;
    case 'print':
    case 'cat':
      printSkill('SKILL.md');
      return 0;
    case 'print-compact':
      printSkill(path.join('compact', 'SKILL.md'));
      return 0;
    case 'install':
    case 'add':
      runInstall();
      return 0;
    case 'doctor': {
      const flags = parseFlags(rest);
      if (flags.unknown.length > 0 || flags.region !== null || flags.nonInteractive || flags.emitNote) {
        console.error(`Unknown option(s) for doctor: ${flags.unknown.join(', ') || '(see help)'}`);
        console.error(`Usage: npx @metcalfsolutions/satori doctor [--json]`);
        return 2;
      }
      return runDoctor({ json: flags.json });
    }
    case 'onboard': {
      const flags = parseFlags(rest);
      if (flags.unknown.length > 0) {
        console.error(`Unknown option(s) for onboard: ${flags.unknown.join(', ')}`);
        console.error(`Usage: npx @metcalfsolutions/satori onboard [--region <${VALID_REGIONS.join('|')}>] [--non-interactive] [--emit-note]`);
        return 2;
      }
      return runOnboard({
        region: flags.region,
        nonInteractive: flags.nonInteractive,
        emitNote: flags.emitNote
      });
    }
    case 'info':
    default:
      printBanner();
      console.log(`\x1b[1mQuickest way to add Satori to your AI coding agent:\x1b[0m`);
      console.log(`  \x1b[32mnpx skills add MetcalfSolutions/Satori\x1b[0m\n`);
      console.log(`Supports Claude Code, Cursor, Windsurf, Codex, Antigravity, OpenCode, Hermes.\n`);
      console.log(`To install directly into this project workspace:`);
      console.log(`  \x1b[36mnpx @metcalfsolutions/satori install\x1b[0m\n`);
      console.log(`To check your environment setup:`);
      console.log(`  \x1b[36mnpx @metcalfsolutions/satori doctor\x1b[0m\n`);
      console.log(`For locale-aware onboarding with verified crisis helplines:`);
      console.log(`  \x1b[36mnpx @metcalfsolutions/satori onboard --region US\x1b[0m\n`);
      console.log(`To learn more, visit: https://github.com/MetcalfSolutions/Satori`);
      return 0;
  }
}

if (require.main === module) {
  const code = main(process.argv.slice(2));
  if (code !== null && code !== undefined) process.exitCode = code;
}

module.exports = {
  buildDoctorReport,
  runDoctor,
  runOnboard,
  buildStarterNote,
  renderRegion,
  loadCrisisSources,
  isCloudSyncedPath,
  sha256Text,
  HARNESS_DIRS,
  CLOUD_SYNC_MARKERS,
  main
};
