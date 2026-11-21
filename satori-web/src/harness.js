import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Harness, createRegistry } from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { NodeExecutionEnv } from "@earendil-works/pi-durable/env/node";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { builtinModels } from "@earendil-works/pi-ai/providers/all";

import { GEMINI_PROVIDER_ID, registerScriptedStub, registerOpenAICompatible } from "./providers.js";
import { DEFAULTS } from "./config.js";
import { createSkillTools } from "./skill.js";

/**
 * The provider id inside the models store for a `SATOWEB_PROVIDER` value.
 * Gemini's API is pi-ai's built-in "google" provider; everything else maps
 * one-to-one.
 */
function modelsProviderId(provider) {
  return provider === "gemini" ? GEMINI_PROVIDER_ID : provider;
}

/** Reads the opencode-go API key from the owner's pi auth store. Runtime only; never logged or committed. */
function readOpenCodeGoKey() {
  const authPath = path.join(os.homedir(), ".pi/agent/auth.json");
  const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
  const key = auth?.["opencode-go"]?.key;
  if (typeof key !== "string" || key.length === 0) {
    throw new Error("No opencode-go API key found in ~/.pi/agent/auth.json");
  }
  return key;
}

/**
 * Resolves the credential the selected provider needs, before any request
 * can surface a confusing auth failure. The stub needs nothing; every real
 * provider reads its standard environment variable, and `opencode-go`
 * additionally falls back to the host's pi auth store.
 */
function ensureProviderCredential(provider) {
  if (provider === "stub") return;
  if (provider === "opencode-go") {
    if (!process.env.OPENCODE_API_KEY) {
      // OPENCODE_GO_API_KEY is the documented SatoriWeb variable; the shared
      // OPENCODE_API_KEY is what the built-in provider reads.
      const key = process.env.OPENCODE_GO_API_KEY ?? readOpenCodeGoKey();
      if (typeof key === "string" && key.length > 0) process.env.OPENCODE_API_KEY = key;
    }
    return;
  }
  const required = {
    gemini: "GEMINI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  }[provider];
  if (required && !process.env[required]) {
    throw new Error(
      `Provider "${provider}" needs ${required} set in the environment ` +
        "(see satori-web/README.md for the provider setup table).",
    );
  }
}

/**
 * Opens the durable harness backed by SQLite storage.
 *
 * The model provider is chosen by `config.provider` (`opencode-go` by
 * default, with `gemini`, `anthropic`, `openai`, `openrouter`, and the
 * offline `stub` also supported). Every real provider is registered from the
 * built-in pi-ai catalog; the requested provider/model pair is validated at
 * boot so a typo fails loudly before the server accepts a single request.
 * With `OPENAI_BASE_URL` set, `openai` instead registers an
 * OpenAI-compatible custom endpoint (Ollama, LM Studio, gateways).
 *
 * The skill-scoped read tool is installed into the registry so the model can
 * load Satori's reference modules on its own initiative. `config.extensions`
 * installs any further extensions (the per-user vault tools) alongside it.
 *
 * @returns {Promise<{harness: object, storage: object, models: object}>}
 */
export async function createHarness(config) {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  const storage = await openNodeSqliteStorage(config.dbPath);

  const registry = createRegistry();
  registry.install(createSkillTools(config.skillPath));
  for (const extension of config.extensions ?? []) registry.install(extension);

  const models = builtinModels();
  const provider = config.provider;
  const modelId = config.modelId;

  if (provider === "stub") {
    registerScriptedStub(models, config.stubResponses, {
      tokensPerSecond: config.stubTokensPerSecond,
    });
  } else {
    ensureProviderCredential(provider);
    if (provider === "openai" && process.env.OPENAI_BASE_URL) {
      await registerOpenAICompatible(models, {
        baseUrl: process.env.OPENAI_BASE_URL,
        modelId,
      });
    }
  }

  // A missing model id is a deployment error: fail the boot loudly rather
  // than let the first conversation die with an opaque runtime lookup.
  if (provider !== "stub" && !models.getModel(modelsProviderId(provider), modelId)) {
    const known = models
      .getModels(modelsProviderId(provider))
      .slice(0, 5)
      .map((model) => model.id);
    throw new Error(
      `No ${provider} model "${modelId}" in the catalog. ` +
        `Set SATOWEB_MODEL_ID to one of: ${known.join(", ")}, ...`,
    );
  }

  const harness = await Harness.open(
    storage,
    {
      registry,
      models,
      env: () => new NodeExecutionEnv({ cwd: process.cwd() }),
    },
    BACKGROUND_CONTEXT,
  );

  return { harness, storage, models };
}

/** The configured model, as a `{provider, modelId}` pair for `configure()`. */
export function modelSelection(config) {
  return { provider: config.provider, modelId: config.modelId ?? DEFAULTS.modelId };
}
