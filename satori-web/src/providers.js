import {
  createProvider,
  envApiKeyAuth,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
  fauxThinking,
  fauxToolCall,
} from "@earendil-works/pi-ai";

/**
 * The chat providers SatoriWeb serves conversations through. Every real
 * provider is registered from the built-in pi-ai catalog (`builtinModels()`
 * in harness.js); this module only declares their surface, adds the offline
 * test stub, and (for `openai` with `OPENAI_BASE_URL`) the OpenAI-compatible
 * custom-endpoint provider.
 */
export const SUPPORTED_PROVIDERS = /** @type {const} */ ([
  "opencode-go",
  "gemini",
  "anthropic",
  "openai",
  "openrouter",
  "stub",
]);

/**
 * The API-key environment variable each provider reads. `opencode-go` is the
 * documented exception: SatoriWeb accepts `OPENCODE_GO_API_KEY` first and
 * falls back to the shared `OPENCODE_API_KEY` the built-in provider reads
 * (and finally to the host's pi auth store, resolved in harness.js).
 */
export const PROVIDER_ENV_KEYS = /** @type {const} */ ({
  "opencode-go": "OPENCODE_GO_API_KEY (or OPENCODE_API_KEY)",
  gemini: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY (optional OPENAI_BASE_URL for compatible endpoints)",
  openrouter: "OPENROUTER_API_KEY",
  stub: "(none: deterministic offline test provider)",
});

/** The provider id `SATOWEB_PROVIDER` uses for the Gemini API (pi-ai's "google"). */
export const GEMINI_PROVIDER_ID = "google";

/** The sole chat model SatoriWeb's stub provider serves. */
export const STUB_MODEL_ID = "minimax-m3";

/**
 * Registers a scripted stub model provider through the same registration path
 * (`models.setProvider`) as every real provider, so automated tests exercise
 * the full conversation pipeline deterministically without live model calls.
 *
 * @param {import("@earendil-works/pi-ai").MutableModels} models
 * @param {Array} responses Scripted assistant turns, returned one per
 *   model call, in order. A plain string or {thinking, text} step ends the
 *   turn; a step with `toolCalls` ends in `toolUse` so the harness executes
 *   the calls and consults the model again; a function step decides its reply
 *   from the request context (transcript incl. tool results).
 * @param {{tokensPerSecond?: number}} [options] Optional pacing: with
 *   `tokensPerSecond`, the stub streams its scripted text at that token rate
 *   so partial-answer commits arrive spread over time, as a real streaming
 *   provider would.
 * @returns the scripted provider handle (for tests to inspect or extend).
 */
export function registerScriptedStub(models, responses = [], options = {}) {
  const stub = fauxProvider({
    provider: "stub",
    api: "stub",
    models: [
      { id: STUB_MODEL_ID, name: "MiniMax M3 (scripted stub)", reasoning: true },
    ],
    tokensPerSecond: options.tokensPerSecond,
  });
  stub.setResponses(responses.map(toFauxMessage));
  models.setProvider(stub.provider);
  return stub;
}

/**
 * Registers an OpenAI-compatible provider for local or proxied endpoints
 * (`OPENAI_BASE_URL` set): Ollama, LM Studio, vLLM, gateways, and anything
 * else that speaks the OpenAI chat-completions API. It replaces the built-in
 * `openai` provider by id, so `SATOWEB_PROVIDER=openai` keeps working with
 * the model id from `SATOWEB_MODEL_ID`.
 *
 * @param {import("@earendil-works/pi-ai").MutableModels} models
 * @param {{baseUrl: string, modelId: string}} config
 */
export async function registerOpenAICompatible(models, { baseUrl, modelId }) {
  const { openAICompletionsApi } = await import(
    "@earendil-works/pi-ai/api/openai-completions.lazy.js"
  );
  const provider = createProvider({
    id: "openai",
    name: "OpenAI-compatible endpoint",
    baseUrl: String(baseUrl).replace(/\/+$/, ""),
    auth: { apiKey: envApiKeyAuth("OpenAI API key", ["OPENAI_API_KEY"]) },
    models: [
      {
        id: modelId,
        name: modelId,
        api: "openai-completions",
        reasoning: true,
      },
    ],
    api: { "openai-completions": openAICompletionsApi() },
  });
  models.setProvider(provider);
  return provider;
}

function toFauxMessage(step) {
  // A scripted factory sees the request context (transcript with the system
  // prompt) and decides the reply, so tests can observe what the model was
  // actually given without leaving the HTTP seam.
  if (typeof step === "function") return step;
  if (typeof step === "string") {
    return fauxAssistantMessage(step);
  }
  const blocks = [];
  if (step.thinking) blocks.push(fauxThinking(step.thinking));
  if (step.text) blocks.push(fauxText(step.text));
  for (const call of step.toolCalls ?? []) {
    blocks.push(fauxToolCall(call.name, call.arguments));
  }
  return fauxAssistantMessage(blocks, {
    stopReason: step.toolCalls?.length > 0 ? "toolUse" : "stop",
  });
}
