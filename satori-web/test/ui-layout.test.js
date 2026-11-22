import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

const styleCss = fs.readFileSync(path.join(PUBLIC_DIR, "style.css"), "utf8");
const indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");

test("memory drawer carries fixed positioning and hidden-by-default rules", () => {
  const closedBlockMatch = styleCss.match(/#memory-drawer\.drawer\s*\{([^}]*)\}/);
  assert.ok(closedBlockMatch, "Expected #memory-drawer.drawer rule in style.css");
  const closedBlock = closedBlockMatch[1];

  assert.match(closedBlock, /position:\s*fixed;/);
  assert.match(closedBlock, /top:\s*0;/);
  assert.match(closedBlock, /bottom:\s*0;/);
  assert.match(closedBlock, /right:\s*0;/);
  assert.match(closedBlock, /z-index:\s*40;/);
  assert.match(closedBlock, /visibility:\s*hidden;/);
  assert.match(closedBlock, /transform:\s*translateX\(100%\);/);

  const openBlockMatch = styleCss.match(/#app\.memory-open\s+#memory-drawer\.drawer\s*\{([^}]*)\}/);
  assert.ok(openBlockMatch, "Expected #app.memory-open #memory-drawer.drawer rule in style.css");
  const openBlock = openBlockMatch[1];

  assert.match(openBlock, /transform:\s*translateX\(0\);/);
  assert.match(openBlock, /visibility:\s*visible;/);
});

test("memory drawer HTML includes accessibility attributes and host-access privacy notice", () => {
  const drawerMatch = indexHtml.match(/<aside[^>]*id="memory-drawer"[^>]*>([\s\S]*?)<\/aside>/);
  assert.ok(drawerMatch, "Expected #memory-drawer <aside> in index.html");
  const drawerTag = indexHtml.match(/<aside[^>]*id="memory-drawer"[^>]*>/)?.[0] ?? "";

  assert.match(drawerTag, /aria-hidden="true"/);
  assert.match(drawerTag, /\binert\b/);

  const privacyNoteMatch = drawerMatch[1].match(/<p[^>]*id="memory-privacy-note"[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(privacyNoteMatch, "Expected #memory-privacy-note inside #memory-drawer");
  assert.match(privacyNoteMatch[1], /host administrator/i);
});
