#!/usr/bin/env node
/**
 * Satori Native CLI runner (scripts/cli.js)
 * Enables direct invocation via `npx @metcalfsolutions/satori`.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');
let pkgVersion = '6.5.2';
try {
  pkgVersion = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')).version || pkgVersion;
} catch (e) {}

const args = process.argv.slice(2);
const command = args[0] || 'info';

function printBanner() {
  console.log(`\x1b[1m\x1b[36mSatori v${pkgVersion}\x1b[0m — Psychologically Grounded Wisdom Companion for the Inner Life`);
  console.log(`Free, open-source, not a therapist. Apache-2.0 License.\n`);
}

function printHelp() {
  printBanner();
  console.log(`\x1b[1mUsage:\x1b[0m`);
  console.log(`  npx @metcalfsolutions/satori [command]\n`);
  console.log(`\x1b[1mCommands:\x1b[0m`);
  console.log(`  install, add     Install Satori into local project agent directories`);
  console.log(`  print            Print canonical SKILL.md to stdout`);
  console.log(`  print-compact    Print compact SKILL.md to stdout`);
  console.log(`  info             Display ecosystem installation guide`);
  console.log(`  help, --help     Show this help message`);
  console.log(`  -v, --version    Show version number\n`);
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

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  case 'version':
  case '--version':
  case '-v':
    console.log(pkgVersion);
    break;
  case 'print':
  case 'cat':
    printSkill('SKILL.md');
    break;
  case 'print-compact':
    printSkill(path.join('compact', 'SKILL.md'));
    break;
  case 'install':
  case 'add':
    runInstall();
    break;
  case 'info':
  default:
    printBanner();
    console.log(`\x1b[1mQuickest way to add Satori to your AI coding agent:\x1b[0m`);
    console.log(`  \x1b[32mnpx skills add MetcalfSolutions/Satori\x1b[0m\n`);
    console.log(`Supports Claude Code, Cursor, Windsurf, Codex, Antigravity, OpenCode, Hermes.\n`);
    console.log(`To install directly into this project workspace:`);
    console.log(`  \x1b[36mnpx @metcalfsolutions/satori install\x1b[0m\n`);
    console.log(`To learn more, visit: https://github.com/MetcalfSolutions/Satori`);
    break;
}
