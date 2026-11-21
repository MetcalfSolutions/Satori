import fs from "node:fs";
import path from "node:path";

import { defineExtension, defineTool } from "@earendil-works/pi-durable";
import { obj, str } from "@earendil-works/pi-schema";

import { errorResult, textResult } from "./tool-results.js";

/** The skill package's Turn-1 entry point, seeded as conversation instructions. */
export const SKILL_ENTRY_FILE = "SKILL.md";

/** The skill root as the containment boundary: symlinks inside it are followed, the root itself is the fence. */
function skillRootRealpath(skillRoot) {
  const real = fs.realpathSync(skillRoot);
  if (!fs.statSync(real).isDirectory()) {
    throw new Error(`Skill path is not a directory: ${skillRoot}`);
  }
  return real;
}

/**
 * Reads the skill entry file that seeds every new conversation's instructions.
 * Called at boot so a missing or unreadable skill package fails loudly before
 * the server starts accepting requests.
 *
 * @param {string} skillRoot the Satori skill clone directory
 * @returns {string} the contents of SKILL.md
 */
export function loadSkillInstructions(skillRoot) {
  const entryPath = path.join(skillRoot, SKILL_ENTRY_FILE);
  return fs.readFileSync(entryPath, "utf8");
}

/**
 * The model-facing read tool scoped to the skill clone directory. Progressive
 * disclosure stays model-driven: the server never injects reference content
 * and holds no keyword logic of its own — the skill's instructions alone tell
 * the model when to load deeper modules.
 */
export function createSkillTools(skillRoot) {
  const root = skillRootRealpath(skillRoot);
  const readSkillFile = defineTool({
    name: "read_skill_file",
    description:
      "Read a file from the Satori skill package directory (read-only). " +
      "`path` is relative to the skill root: 'SKILL.md', 'SAFETY.md', " +
      "'PRIVACY.md', or a reference module such as " +
      "'references/grief-protocol.md'. Paths outside the skill directory " +
      "are refused.",
    parameters: obj({
      path: str({
        description:
          "File path relative to the skill root, e.g. 'references/grief-protocol.md'.",
      }),
    }),
    replay: "safe",
    async execute(args) {
      const resolved = path.resolve(root, args.path);
      let real;
      try {
        real = fs.realpathSync(resolved);
      } catch {
        return errorResult(`No such file in the skill directory: ${args.path}`);
      }
      const relative = path.relative(root, real);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return errorResult(
          `Refusing to read outside the skill directory: ${args.path}`,
        );
      }
      let text;
      try {
        text = fs.readFileSync(real, "utf8");
      } catch {
        return errorResult(`No such file in the skill directory: ${args.path}`);
      }
      return textResult(text);
    },
  });

  return defineExtension({ name: "satori-skill", tools: [readSkillFile] });
}
